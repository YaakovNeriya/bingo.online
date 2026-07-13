#!/bin/bash
# restore.sh - A simple script to restore a database backup

if [ -z "$1" ]; then
    echo "Usage: ./restore.sh path/to/backup_file.sql.gz"
    echo "Example: ./restore.sh backup_2026-06-29.sql.gz"
    exit 1
fi

BACKUP_FILE=$1

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: File $BACKUP_FILE not found!"
    exit 1
fi

echo "Extracting and restoring $BACKUP_FILE to the database..."

# Load environment variables
if [ -f .env ]; then
    source .env
else
    echo "Warning: .env file not found. Make sure DB_USER and DB_PASSWORD are set."
fi

# The container name for the database is usually fabric_db
# We pipe the gunzip output directly into mysql inside the container
gunzip -c "$BACKUP_FILE" | docker exec -i fabric_db mysql -u"${DB_USER:-root}" -p"${DB_PASSWORD}" "${DB_NAME:-fabric_db}"

if [ $? -eq 0 ]; then
    echo "Restore completed successfully! ✅"
else
    echo "Restore failed! ❌"
fi
