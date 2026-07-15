import os
import sys
import glob
import subprocess
from dotenv import load_dotenv

def get_db_credentials():
    load_dotenv()
    db_host = os.getenv("DB_HOST", "127.0.0.1")
    if db_host == "localhost":
        db_host = "127.0.0.1"
    db_port = os.getenv("DB_PORT", "3306")
    db_user = os.getenv("DB_USER", "root")
    db_pass = os.getenv("DB_PASSWORD", "password")
    db_name = os.getenv("DB_NAME", "fabric_db")
    return db_host, db_port, db_user, db_pass, db_name

def list_backups():
    if not os.path.exists("backups"):
        print("No 'backups' directory found.")
        return []
        
    # Get all timestamp folders in backups/
    folders = [f for f in glob.glob("backups/*") if os.path.isdir(f)]
    folders.sort(key=os.path.getmtime, reverse=True)
    return folders

def restore_database(sql_gz_file):
    print(f"\n[1/2] Restoring Database from {sql_gz_file}...")
    db_host, db_port, db_user, db_pass, db_name = get_db_credentials()
    
    temp_sql = "dump_restore_temp.sql"
    try:
        # Gunzip to a temporary file
        with open(temp_sql, "w") as f_out:
            subprocess.run(["gunzip", "-c", sql_gz_file], stdout=f_out, check=True)
            
        # Restore to MySQL
        mysql_cmd = [
            "mysql",
            f"-h{db_host}",
            f"-P{db_port}",
            f"-u{db_user}",
            f"-p{db_pass}",
            db_name
        ]
        
        with open(temp_sql, "r") as f_in:
            subprocess.run(mysql_cmd, stdin=f_in, check=True)
            
        print("✅ Database restored successfully.")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to restore database: {e}")
        return False
    finally:
        if os.path.exists(temp_sql):
            os.remove(temp_sql)

def restore_images(tar_gz_file):
    print(f"\n[2/2] Restoring Images from {tar_gz_file}...")
    try:
        # Extract images using tar with force-local and overwrite
        subprocess.run(["tar", "--force-local", "-xzf", tar_gz_file, "--overwrite"], check=True)
        print("✅ Images restored successfully.")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to restore images: {e}")
        return False

def main():
    print("=" * 50)
    print(" BINGO FABRICS - DISASTER RECOVERY RESTORE TOOL")
    print("=" * 50)
    
    folders = list_backups()
    if not folders:
        print("No backups available to restore.")
        sys.exit(1)
        
    print("\nAvailable Backups (Newest to Oldest):")
    for i, folder in enumerate(folders):
        print(f"[{i+1}] {os.path.basename(folder)}")
        
    print("\n[0] Cancel")
    
    try:
        choice = int(input("\nEnter the number of the backup to restore: "))
    except ValueError:
        print("Invalid input. Cancelling.")
        sys.exit(1)
        
    if choice == 0:
        print("Cancelled.")
        sys.exit(0)
        
    if choice < 1 or choice > len(folders):
        print("Invalid choice. Cancelling.")
        sys.exit(1)
        
    selected_folder = folders[choice - 1]
    folder_name = os.path.basename(selected_folder)
    
    sql_files = glob.glob(os.path.join(selected_folder, "backup_*.sql.gz"))
    tar_files = glob.glob(os.path.join(selected_folder, "backup_images_*.tar.gz"))
    
    if not sql_files:
        print(f"❌ No SQL backup found in {selected_folder}")
        sys.exit(1)
        
    sql_file = sql_files[0]
    tar_file = tar_files[0] if tar_files else None
    
    print("\n" + "!" * 50)
    print("WARNING: DANGEROUS OPERATION")
    print("!" * 50)
    print(f"You are about to OVERWRITE the live database with backup: {folder_name}")
    print("All data created AFTER this backup will be PERMANENTLY LOST.")
    print("Make sure the application is in maintenance mode!")
    
    confirm = input("\nType 'YES' to confirm and proceed with restoration: ")
    if confirm != "YES":
        print("Aborted.")
        sys.exit(0)
        
    print("\nStarting restoration process...")
    db_success = restore_database(sql_file)
    
    if db_success and tar_file:
        restore_images(tar_file)
        
    print("\nRestoration process finished.")

if __name__ == "__main__":
    main()
