#!/bin/bash

# ===========================================
# PD-OS Database Backup Script
# ===========================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCKER_DIR="$(dirname "$SCRIPT_DIR")"

cd "$DOCKER_DIR"

# Load environment variables
if [ -f ".env" ]; then
    source .env
fi

DB_USER=${DB_USER:-pdos_user}
DB_NAME=${DB_NAME:-pdos_db}

# Create backups directory if it doesn't exist
BACKUP_DIR="$DOCKER_DIR/backups"
mkdir -p "$BACKUP_DIR"

# Generate timestamp for filename
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/pdos_backup_${TIMESTAMP}.sql"

echo "============================================"
echo "  PD-OS Database Backup"
echo "============================================"
echo ""

# Check if database container is running
if ! docker compose ps | grep -q "pdos-database.*running"; then
    echo "ERROR: Database container is not running."
    echo "Please start PD-OS first with ./scripts/start.sh"
    exit 1
fi

echo "Creating backup..."
docker compose exec -T db pg_dump -U "$DB_USER" "$DB_NAME" > "$BACKUP_FILE"

# Compress the backup
gzip "$BACKUP_FILE"

echo ""
echo "✓ Backup created successfully!"
echo "  Location: ${BACKUP_FILE}.gz"
echo ""
echo "To restore this backup, use:"
echo "  ./scripts/restore.sh ${BACKUP_FILE}.gz"
echo ""
