#!/bin/bash

# ===========================================
# PD-OS Database Restore Script
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

# Check if backup file is provided
if [ -z "$1" ]; then
    echo "Usage: ./scripts/restore.sh <backup_file>"
    echo ""
    echo "Available backups:"
    ls -la "$DOCKER_DIR/backups/" 2>/dev/null || echo "  No backups found"
    exit 1
fi

BACKUP_FILE="$1"

# Check if file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "ERROR: Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "============================================"
echo "  PD-OS Database Restore"
echo "============================================"
echo ""
echo "WARNING: This will replace all current data!"
echo "Backup file: $BACKUP_FILE"
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Restore cancelled."
    exit 0
fi

# Check if database container is running
if ! docker compose ps | grep -q "pdos-database.*running"; then
    echo "ERROR: Database container is not running."
    echo "Please start PD-OS first with ./scripts/start.sh"
    exit 1
fi

echo ""
echo "Restoring database..."

# Check if file is gzipped
if [[ "$BACKUP_FILE" == *.gz ]]; then
    gunzip -c "$BACKUP_FILE" | docker compose exec -T db psql -U "$DB_USER" "$DB_NAME"
else
    docker compose exec -T db psql -U "$DB_USER" "$DB_NAME" < "$BACKUP_FILE"
fi

echo ""
echo "✓ Database restored successfully!"
echo ""
