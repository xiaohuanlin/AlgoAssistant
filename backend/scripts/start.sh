#!/bin/bash

# AlgoAssistant Backend Startup Script

echo "🚀 Starting AlgoAssistant Backend..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed. Please install it first."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please update .env file with your API keys before starting services."
fi

# Build and start services
echo "🔨 Building and starting services..."
docker-compose up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service health
echo "🔍 Checking service health..."
if curl -f http://localhost:8000/ > /dev/null 2>&1; then
    echo "✅ Backend is running at http://localhost:8000"
    echo "📚 API documentation at http://localhost:8000/docs"
    echo "🔧 Adminer (database) at http://localhost:8080"
else
    echo "❌ Backend failed to start. Check logs with: docker-compose logs backend"
fi

echo "🎉 Setup complete!"
echo ""
echo "Useful commands:"
echo "  docker-compose logs -f backend    # View backend logs"
echo "  docker-compose down               # Stop all services"
echo "  docker-compose restart backend    # Restart backend only" 