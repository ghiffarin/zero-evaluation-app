#!/bin/bash

# ===========================================
# PD-OS Docker Setup Script
# ===========================================
# This script sets up the Docker environment for PD-OS

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCKER_DIR="$(dirname "$SCRIPT_DIR")"

echo "============================================"
echo "  PD-OS Docker Setup"
echo "============================================"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker is not installed."
    echo "Please install Docker from https://www.docker.com/get-started"
    exit 1
fi

# Check if Docker Compose is available
if ! docker compose version &> /dev/null; then
    echo "ERROR: Docker Compose is not available."
    echo "Please ensure Docker Compose is installed."
    exit 1
fi

echo "✓ Docker is installed"
echo ""

# Navigate to docker directory
cd "$DOCKER_DIR"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "Creating .env file from template..."
    cp .env.example .env

    # Generate a secure JWT secret
    JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')

    # Update JWT_SECRET in .env file
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" .env
    else
        # Linux
        sed -i "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" .env
    fi

    echo "✓ Created .env file with secure JWT secret"
    echo ""
    echo "IMPORTANT: Review and modify .env file if needed:"
    echo "  - DB_PASSWORD: Change to a secure password"
    echo "  - Other settings as needed"
    echo ""
else
    echo "✓ .env file already exists"
fi

echo ""
echo "Setup complete! You can now run:"
echo ""
echo "  cd docker"
echo "  ./scripts/start.sh"
echo ""
echo "Or manually with:"
echo ""
echo "  docker compose up -d"
echo ""
