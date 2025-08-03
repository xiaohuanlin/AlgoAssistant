#!/bin/bash
# Deployment script for 1GB memory servers

set -e

echo "AlgoAssistant 1GB Server Deployment Script"
echo "=========================================="

# Check system memory
total_mem=$(free -m | awk 'NR==2{printf "%.0f", $2}')
echo "Detected system memory: ${total_mem}MB"

if [ "$total_mem" -lt 800 ]; then
    echo "Warning: System memory is less than 800MB, recommend adding swap"
fi

# Setup swap
echo ""
echo "Step 1: Setting up swap file..."
./setup-swap.sh

# Clean Docker cache
echo ""
echo "Step 2: Cleaning Docker cache to free up space..."
docker system prune -f || echo "Docker cleanup complete"

# Check environment variables
echo ""
echo "Step 3: Checking environment configuration..."
if [ ! -f "../backend/.env.mini" ] || [ ! -f "../frontend/.env.mini" ]; then
    echo "Error: Mini environment files not found"
    echo "Please ensure backend/.env.mini and frontend/.env.mini exist"
    echo "Edit these files to configure your Google OAuth and other settings"
    exit 1
fi

echo "Environment files found. Please ensure you have configured:"
echo "  - Google OAuth credentials in backend/.env.mini"
echo "  - Any other required API keys"

# Build and deploy
echo ""
echo "Step 4: Starting build and deployment..."
echo "This may take 10-15 minutes, please be patient..."

cd ..

# Step-by-step build to reduce memory pressure
echo "Building backend..."
docker-compose -f docker-compose.mini.yml build backend

echo "Building celery..."
docker-compose -f docker-compose.mini.yml build celery

echo "Building celery-beat..."
docker-compose -f docker-compose.mini.yml build celery-beat

echo "Building frontend (most memory-intensive step)..."
docker-compose -f docker-compose.mini.yml build frontend

echo ""
echo "Step 5: Starting services..."
docker-compose -f docker-compose.mini.yml up -d

echo ""
echo "Step 6: Waiting for services to start..."
sleep 10

echo ""
echo "Step 7: Checking service status..."
docker-compose -f docker-compose.mini.yml ps

echo ""
echo "Step 8: Showing resource usage..."
docker stats --no-stream

echo ""
echo "Deployment complete!"
echo ""
echo "Access URLs:"
echo "   Frontend: http://localhost"
echo "   Backend API: http://localhost:8000"
echo "   API Documentation: http://localhost:8000/docs"
echo ""
echo "Monitoring commands:"
echo "   View logs: docker-compose -f docker-compose.mini.yml logs -f"
echo "   Check status: docker-compose -f docker-compose.mini.yml ps"
echo "   Check resources: docker stats"
echo ""
echo "Stop services: docker-compose -f docker-compose.mini.yml down"
echo ""
echo "Tip: If you no longer need swap, run 'sudo swapoff /swapfile' to disable it"