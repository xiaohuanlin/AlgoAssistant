# Deployment Scripts for Low-Memory Servers

This directory contains scripts to deploy AlgoAssistant on 1GB memory servers.

## Scripts

### setup-swap.sh
Creates a 1GB swap file to provide additional memory during Docker builds.

**Usage:**
```bash
cd scripts
./setup-swap.sh
```

**Features:**
- Checks for existing swap files
- Validates disk space availability
- Creates and enables 1GB swap file
- Provides cleanup instructions

### deploy-1gb.sh
Complete deployment script for 1GB memory servers.

**Usage:**
```bash
cd scripts
./deploy-1gb.sh
```

**Features:**
- Memory detection and validation
- Automatic swap setup
- Docker cache cleanup
- Step-by-step build process
- Service deployment and monitoring
- Resource usage reporting

## Prerequisites

1. Ensure you have Docker and Docker Compose installed
2. Configure mini environment files:
   - `backend/.env.mini` - Backend configuration (already provided)
   - `frontend/.env.mini` - Frontend configuration (already provided)
3. Edit these files with your actual configuration:
   - Google OAuth credentials in `backend/.env.mini`
   - Any other required API keys

## Memory Optimizations

The scripts include several optimizations for low-memory environments:
- Node.js memory limit reduced to 512MB
- Step-by-step Docker builds
- Automatic cache cleanup
- Optimized Docker Compose resource limits
- Uses `.env.mini` files with production-optimized settings
- SQLite database instead of PostgreSQL to reduce memory usage

## Post-Deployment

After deployment, you can:
- Access frontend at http://localhost
- Access API at http://localhost:8000
- View API docs at http://localhost:8000/docs
- Monitor with `docker stats`
- Disable swap with `sudo swapoff /swapfile`