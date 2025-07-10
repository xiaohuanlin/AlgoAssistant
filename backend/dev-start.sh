#!/bin/bash

# AlgoAssistant Backend Development Startup Script

echo "🚀 Starting AlgoAssistant Backend in Development Mode..."

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

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Build and start services
echo "🔨 Building and starting services..."
docker-compose up --build -d postgres redis

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Start backend with volume mount for development
echo "🔧 Starting backend with live code reload..."
docker-compose up --build backend

echo "🎉 Development environment is ready!"
echo ""
echo "Useful commands:"
echo "  docker-compose logs -f backend    # View backend logs"
echo "  docker-compose down               # Stop all services"
echo "  docker-compose restart backend    # Restart backend only"
echo "  docker-compose exec backend bash  # Access backend container" 