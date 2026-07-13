from backup_to_drive import get_drive_service
print("Starting Google Drive authentication...")
service = get_drive_service()
print("Authentication successful! token.json is ready.")
