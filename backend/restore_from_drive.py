import os
import io
import subprocess
import shutil
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from googleapiclient.http import MediaIoBaseDownload
from dotenv import load_dotenv

SCOPES = ['https://www.googleapis.com/auth/drive.file']
FOLDER_NAME = "backup"

def main():
    print("==================================================")
    print(" BINGO FABRICS - DRIVE RESTORE TOOL")
    print("==================================================")

    # Load environment variables
    load_dotenv()
    db_user = os.getenv("DB_USER", "fabric_user")
    db_pass = os.getenv("DB_PASSWORD", "bingo_secure_db_2026_xYz9!")
    db_name = os.getenv("DB_NAME", "fabric_store")

    # Authenticate
    token_path = 'token.json' if os.path.exists('token.json') and os.path.getsize('token.json') > 0 else '../token.json'
    if not os.path.exists(token_path):
        print(f"Error: Could not find {token_path}")
        return

    creds = Credentials.from_authorized_user_file(token_path, SCOPES)
    service = build('drive', 'v3', credentials=creds)

    print("Connecting to Google Drive...")

    # Find main folder
    results = service.files().list(
        q=f"mimeType='application/vnd.google-apps.folder' and name='{FOLDER_NAME}' and trashed=false",
        spaces='drive',
        fields="files(id, name)"
    ).execute()
    
    items = results.get('files', [])
    if not items:
        print(f"Main folder '{FOLDER_NAME}' not found in Drive.")
        return
    parent_folder_id = items[0]['id']

    # Find all timestamp subfolders
    results = service.files().list(
        q=f"'{parent_folder_id}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false",
        spaces='drive',
        fields="files(id, name, createdTime)",
        orderBy="createdTime desc"
    ).execute()
    
    folders = results.get('files', [])
    if not folders:
        print("No backup folders found in Drive.")
        return
        
    latest_folder = folders[0]
    print(f"Found latest backup folder in Drive: {latest_folder['name']}")
    
    confirm = input("Do you want to restore this backup to the local database? (type YES to confirm): ")
    if confirm.strip() != "YES":
        print("Restore cancelled.")
        return

    # List files in the latest folder
    results = service.files().list(
        q=f"'{latest_folder['id']}' in parents and trashed=false",
        spaces='drive',
        fields="files(id, name)"
    ).execute()
    
    files = results.get('files', [])
    if not files:
        print("No files found in the latest folder.")
        return
        
    temp_dir = 'temp_drive_restore'
    os.makedirs(temp_dir, exist_ok=True)
    
    sql_file = None
    tar_file = None

    try:
        # Download files
        for f in files:
            if f['name'].endswith('.sql.gz'):
                sql_file = os.path.join(temp_dir, f['name'])
            elif f['name'].endswith('.tar.gz'):
                tar_file = os.path.join(temp_dir, f['name'])
                
            print(f"Downloading {f['name']} from Drive...")
            request = service.files().get_media(fileId=f['id'])
            local_path = os.path.join(temp_dir, f['name'])
            fh = io.FileIO(local_path, 'wb')
            downloader = MediaIoBaseDownload(fh, request)
            done = False
            while done is False:
                status, done = downloader.next_chunk()
            print(f"Downloaded {f['name']} successfully.")

        # Execute Restore SQL
        if sql_file:
            print(f"\nRestoring Database from {os.path.basename(sql_file)}...")
            cmd = f"gzip -d -c {sql_file} | docker exec -i fabric_db mysql -u {db_user} -p'{db_pass}' {db_name}"
            result = subprocess.run(cmd, shell=True, capture_output=True)
            if result.returncode == 0:
                print("Database restored successfully.")
            else:
                print(f"Error restoring database: {result.stderr.decode()}")
        
        # Execute Restore Images
        if tar_file:
            print(f"\nRestoring Images from {os.path.basename(tar_file)}...")
            copy_cmd = f"docker cp ./{tar_file} fabric_backend:/tmp/backup.tar.gz"
            subprocess.run(copy_cmd, shell=True, check=True)
            
            extract_cmd = "docker exec fabric_backend tar -xzf /tmp/backup.tar.gz -C /app/uploads --strip-components=2"
            result = subprocess.run(extract_cmd, shell=True, capture_output=True)
            
            if result.returncode == 0:
                print("Images restored successfully.")
            else:
                print(f"Error restoring images: {result.stderr.decode()}")

    except Exception as e:
        print(f"An error occurred during restore: {e}")

    finally:
        # Cleanup
        print("\nCleaning up downloaded files...")
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)
        # Cleanup the temp tarball in container if we put it there
        subprocess.run("docker exec fabric_backend rm -f /tmp/backup.tar.gz", shell=True, capture_output=True)
        print("Cleanup complete. Restore finished.")

if __name__ == '__main__':
    main()
