#!/bin/bash

# ===========================================
# PD-OS Docker Reset Script
# ===========================================
# WARNING: This will delete all data!

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCKER_DIR="$(dirname "$SCRIPT_DIR")"

cd "$DOCKER_DIR"

echo "============================================"
echo "  PD-OS Reset"
echo "============================================"
echo ""
echo "WARNING: This will delete ALL data including:"
echo "  - All database records"
echo "  - All user accounts"
echo "  - All tracking history"
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Reset cancelled."
    exit 0
fi

echo ""
echo "Stopping and removing containers..."
docker compose down -v

echo ""
echo "Removing built images..."
docker compose down --rmi local 2>/dev/null || true

echo ""
echo "✓ Reset complete!"
echo ""
echo "To start fresh, run:"
echo "  ./scripts/start.sh"
echo ""
