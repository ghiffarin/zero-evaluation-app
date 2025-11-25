#!/bin/bash

# ===========================================
# PD-OS Docker Logs Script
# ===========================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCKER_DIR="$(dirname "$SCRIPT_DIR")"

cd "$DOCKER_DIR"

# Default to all services if no argument provided
SERVICE=${1:-""}

if [ -z "$SERVICE" ]; then
    echo "Showing logs for all services..."
    echo "Press Ctrl+C to exit"
    echo ""
    docker compose logs -f
else
    echo "Showing logs for $SERVICE..."
    echo "Press Ctrl+C to exit"
    echo ""
    docker compose logs -f "$SERVICE"
fi
