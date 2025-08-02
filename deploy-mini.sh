#!/bin/bash
# AlgoAssistant Lightweight Deployment Script - For 1GB Memory Servers

set -e

echo "🚀 Starting AlgoAssistant lightweight deployment..."
echo "Target configuration: 1 CPU, 1GB Memory server"
echo ""

# Check system resources
echo "📊 Checking system resources..."
TOTAL_MEMORY=$(free -m | awk 'NR==2{printf "%.0f", $2}')
echo "Available memory: ${TOTAL_MEMORY}MB"

if [ $TOTAL_MEMORY -lt 900 ]; then
    echo "⚠️  Warning: Available memory less than 1GB, may affect performance"
    read -p "Continue deployment? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check Docker
echo "🐳 Checking Docker environment..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not installed, please install Docker first"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose not installed, please install Docker Compose first"
    exit 1
fi

# Stop existing services
echo "🛑 Stopping existing services..."
docker-compose -f docker-compose.mini.yml down --remove-orphans || true

# Clean up old images and containers (free up space)
echo "🧹 Cleaning up Docker resources..."
docker system prune -f
docker volume prune -f

# Build images
echo "🔨 Building lightweight images..."
docker-compose -f docker-compose.mini.yml build --no-cache

# Start services (database will be auto-initialized on first run)
echo "▶️  Starting services..."
docker-compose -f docker-compose.mini.yml up -d

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 30

# Health check
echo "🏥 Service health check..."
MAX_ATTEMPTS=30
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if curl -s http://localhost/health > /dev/null; then
        echo "✅ Frontend service started"
        break
    fi
    ATTEMPT=$((ATTEMPT + 1))
    echo "Attempt $ATTEMPT/$MAX_ATTEMPTS - Waiting for frontend service..."
    sleep 2
done

ATTEMPT=0
while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if curl -s http://localhost/api/health > /dev/null; then
        echo "✅ Backend service started"
        break
    fi
    ATTEMPT=$((ATTEMPT + 1))
    echo "Attempt $ATTEMPT/$MAX_ATTEMPTS - Waiting for backend service..."
    sleep 2
done

# Display deployment results
echo ""
echo "🎉 Deployment completed!"
echo ""
echo "📱 Service access URLs:"
echo "  - Frontend App: http://localhost"
echo "  - Backend API: http://localhost/api"
echo "  - Health Check: http://localhost/health"
echo ""
echo "📊 Resource usage:"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"
echo ""
echo "🔧 Management commands:"
echo "  - View logs: docker-compose -f docker-compose.mini.yml logs -f"
echo "  - Stop services: docker-compose -f docker-compose.mini.yml down"
echo "  - Restart services: docker-compose -f docker-compose.mini.yml restart"
echo ""
echo "⚠️  Important notes:"
echo "  - This version uses SQLite database, suitable for small scale usage"
echo "  - Recommend regular backup of data directory"
echo "  - Monitor memory usage to avoid exceeding limits"
