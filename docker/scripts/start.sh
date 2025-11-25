#!/bin/bash

# ===========================================
# PD-OS Docker Start Script
# ===========================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCKER_DIR="$(dirname "$SCRIPT_DIR")"

cd "$DOCKER_DIR"

echo "============================================"
echo "  Starting PD-OS"
echo "============================================"
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "ERROR: .env file not found!"
    echo "Please run ./scripts/setup.sh first"
    exit 1
fi

# Load environment variables for display
source .env

echo "Configuration:"
echo "  Frontend: http://localhost:${FRONTEND_PORT:-3000}"
echo "  Backend:  http://localhost:${BACKEND_PORT:-3001}"
echo "  Database: localhost:${DB_PORT:-5432}"
echo ""

# Build and start containers
echo "Building and starting containers..."
docker compose up -d --build

echo ""
echo "============================================"
echo "  PD-OS is starting!"
echo "============================================"
echo ""
echo "Please wait a moment for services to initialize..."
echo ""
echo "Access the application at:"
echo "  http://localhost:${FRONTEND_PORT:-3000}"
echo ""
echo "View logs with:"
echo "  docker compose logs -f"
echo ""
echo "Stop with:"
echo "  ./scripts/stop.sh"
echo ""
