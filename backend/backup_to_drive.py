import os
import subprocess
import datetime
import time
from dotenv import load_dotenv
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from googleapiclient.errors import HttpError

# Load environment variables
load_dotenv()

# If modifying these scopes, delete the file token.json.
SCOPES = ['https://www.googleapis.com/auth/drive.file']

FOLDER_NAME = "backup"
# Check local directory first (for docker), then parent directory (for local dev)
# Always use the root directory tokens to avoid empty root-owned files in backend/
CREDENTIALS_FILE = 'credentials.json' if os.path.exists('credentials.json') and os.path.getsize('credentials.json') > 0 else '../credentials.json'
TOKEN_FILE = 'token.json' if os.path.exists('token.json') and os.path.getsize('token.json') > 0 else '../token.json'
RETENTION_DAYS = 30

def get_drive_service():
    """Shows basic usage of the Drive v3 API."""
    creds = None
    if os.path.exists(TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
    
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not os.path.exists(CREDENTIALS_FILE):
                raise FileNotFoundError(f"Missing {CREDENTIALS_FILE}!")
            flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_FILE, SCOPES)
            creds = flow.run_local_server(port=0)
        
        with open(TOKEN_FILE, 'w') as token:
            token.write(creds.to_json())

    return build('drive', 'v3', credentials=creds)

def get_or_create_folder(service, folder_name):
    """Finds a folder by name, or creates it if it doesn't exist."""
    query = f"mimeType='application/vnd.google-apps.folder' and name='{folder_name}' and trashed=false"
    results = service.files().list(q=query, spaces='drive', fields='files(id, name)').execute()
    items = results.get('files', [])
    
    if not items:
        # Create folder
        folder_metadata = {
            'name': folder_name,
            'mimeType': 'application/vnd.google-apps.folder'
        }
        folder = service.files().create(body=folder_metadata, fields='id').execute()
        return folder.get('id')
    return items[0].get('id')

def delete_old_backups(service, folder_id):
    """Deletes backups older than RETENTION_DAYS."""
    cutoff_date = (datetime.datetime.utcnow() - datetime.timedelta(days=RETENTION_DAYS)).isoformat() + "Z"
    query = f"'{folder_id}' in parents and modifiedTime < '{cutoff_date}' and trashed=false"
    
    try:
        results = service.files().list(q=query, spaces='drive', fields='files(id, name)').execute()
        items = results.get('files', [])
        
        for item in items:
            print(f"Deleting old backup: {item['name']}")
            service.files().delete(fileId=item['id']).execute()
            
    except HttpError as error:
        print(f"An error occurred during cleanup: {error}")

def dump_database(timestamp):
    """Dumps the database to a file and compresses it."""
    db_host = os.getenv("DB_HOST", "127.0.0.1")
    if db_host == "localhost":
        db_host = "127.0.0.1"
    db_port = os.getenv("DB_PORT", "3306")
    db_user = os.getenv("DB_USER", "root")
    db_pass = os.getenv("DB_PASSWORD", "password")
    db_name = os.getenv("DB_NAME", "fabric_db")
    
    backup_file = f"backup_{timestamp}.sql.gz"
    
    dump_cmd = [
        "mysqldump",
        f"-h{db_host}",
        f"-P{db_port}",
        f"-u{db_user}",
        f"-p{db_pass}",
        "--skip-ssl",
        "--opt",
        "--single-transaction",
        db_name
    ]
    
    print(f"Starting database dump to {backup_file}...")
    try:
        with open(backup_file, "wb") as f:
            p1 = subprocess.Popen(dump_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            p2 = subprocess.Popen(["gzip", "-c"], stdin=p1.stdout, stdout=f)
            p1.stdout.close()
            p2.communicate()
            p1.wait()
            
            if p1.returncode != 0:
                error_msg = p1.stderr.read().decode()
                print(f"mysqldump failed with code {p1.returncode}: {error_msg}")
                return None
                
        # Verification 1: Check gzip integrity
        if os.path.exists(backup_file):
            print("Verifying gzip integrity...")
            verify_cmd = subprocess.run(["gzip", "-t", backup_file], capture_output=True)
            if verify_cmd.returncode != 0:
                print("Backup corrupted! gzip integrity test failed.")
                return None
                
            # Verification 2: Check for "Dump completed" at the end of the SQL file
            print("Verifying SQL completion...")
            zcat_cmd = subprocess.Popen(["zcat", backup_file], stdout=subprocess.PIPE)
            tail_cmd = subprocess.run(["tail", "-n", "10"], stdin=zcat_cmd.stdout, capture_output=True, text=True)
            zcat_cmd.stdout.close()
            
            if "Dump completed" not in tail_cmd.stdout:
                print("Backup corrupted! Missing 'Dump completed' signature.")
                return None
                
            print(f"Backup created and verified: {backup_file} ({os.path.getsize(backup_file)} bytes)")
            return backup_file
        else:
            print("Backup file was not created!")
            return None
            
    except Exception as e:
        print(f"Exception during database dump: {e}")
        return None

def dump_images(timestamp):
    """Archives the uploads directory to a tar.gz file."""
    uploads_dir = "uploads"
    if not os.path.exists(uploads_dir):
        print("No uploads directory found. Skipping image backup.")
        return None
        
    backup_file = f"backup_images_{timestamp}.tar.gz"
    print(f"Starting image backup to {backup_file}...")
    
    try:
        tar_cmd = subprocess.run(["tar", "--force-local", "-czf", backup_file, uploads_dir], capture_output=True)
        if tar_cmd.returncode != 0:
            print(f"tar failed with code {tar_cmd.returncode}: {tar_cmd.stderr.decode('utf-8')}")
            return None
            
        print(f"Image backup created: {backup_file} ({os.path.getsize(backup_file)} bytes)")
        return backup_file
    except Exception as e:
        print(f"Exception during image backup: {e}")
        return None

def upload_file_to_drive(service, folder_id, file_path, mimetype):
    """Helper to upload a single file to Drive."""
    try:
        file_metadata = {
            'name': file_path,
            'parents': [folder_id]
        }
        media = MediaFileUpload(file_path, mimetype=mimetype, resumable=True)
        print(f"Uploading {file_path} to Google Drive...")
        file = service.files().create(body=file_metadata, media_body=media, fields='id').execute()
        print(f"File ID: {file.get('id')} uploaded successfully.")
        return True
    except Exception as e:
        print(f"Failed to upload {file_path} to Google Drive: {e}")
        return False

def create_subfolder(service, parent_folder_id, subfolder_name):
    """Creates a subfolder inside a parent folder and returns its ID."""
    folder_metadata = {
        'name': subfolder_name,
        'mimeType': 'application/vnd.google-apps.folder',
        'parents': [parent_folder_id]
    }
    folder = service.files().create(body=folder_metadata, fields='id').execute()
    return folder.get('id')

def main():
    timestamp = datetime.datetime.now().strftime("%-d-%-m-%y_%H:%M")
    backup_file = dump_database(timestamp)
    if not backup_file:
        print("Aborting database upload due to failed dump.")
        db_upload_success = False
    else:
        images_backup_file = None
        try:
            service = get_drive_service()
            parent_folder_id = get_or_create_folder(service, FOLDER_NAME)
            
            # Create timestamp subfolder inside parent folder
            subfolder_id = create_subfolder(service, parent_folder_id, timestamp)
            
            db_upload_success = upload_file_to_drive(service, subfolder_id, backup_file, 'application/gzip')
            
            images_backup_file = dump_images(timestamp)
            if images_backup_file:
                upload_file_to_drive(service, subfolder_id, images_backup_file, 'application/gzip')
                
            # Cleanup old backups in Google Drive
            delete_old_backups(service, parent_folder_id)
            
        except Exception as e:
            print(f"Failed during Google Drive operations: {e}")
        finally:
            import shutil
            import glob
            timestamp_dir = os.path.join("backups", timestamp)
            os.makedirs(timestamp_dir, exist_ok=True)
            
            # Move DB backup
            if os.path.exists(backup_file):
                local_path = os.path.join(timestamp_dir, backup_file)
                shutil.move(backup_file, local_path)
                print(f"Local DB backup saved as {local_path}.")
                
            # Move Images backup
            if images_backup_file and os.path.exists(images_backup_file):
                local_img_path = os.path.join(timestamp_dir, images_backup_file)
                shutil.move(images_backup_file, local_img_path)
                print(f"Local Images backup saved as {local_img_path}.")
                
            # Keep only the 3 most recent backup folders
            try:
                # Find all subdirectories in 'backups' that look like timestamp folders
                all_items = glob.glob(os.path.join("backups", "*"))
                backup_folders = [d for d in all_items if os.path.isdir(d)]
                
                # Sort by modification time, newest first
                backup_folders.sort(key=os.path.getmtime, reverse=True)
                
                # Remove any folders older than the 3 most recent
                for old_folder in backup_folders[3:]:
                    shutil.rmtree(old_folder)
                    print(f"Deleted old local backup folder: {old_folder}")
            except Exception as e:
                print(f"Failed to cleanup old local backups: {e}")

if __name__ == '__main__':
    main()
