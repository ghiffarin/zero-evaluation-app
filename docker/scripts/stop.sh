#!/bin/bash

# ===========================================
# PD-OS Docker Stop Script
# ===========================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCKER_DIR="$(dirname "$SCRIPT_DIR")"

cd "$DOCKER_DIR"

echo "Stopping PD-OS containers..."
docker compose down

echo ""
echo "✓ PD-OS has been stopped"
echo ""
echo "Note: Database data is preserved in the Docker volume."
echo "To completely remove all data, run:"
echo "  docker compose down -v"
echo ""
