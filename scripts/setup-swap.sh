#!/bin/bash
# Setup swap file for 1GB memory servers to assist Docker builds

set -e

echo "Setting up swap file for low-memory server..."

# Check if swap already exists
if swapon --show | grep -q "/swapfile"; then
    echo "Warning: Swap file already exists, skipping creation"
    swapon --show
    exit 0
fi

# Check disk space
available_space=$(df / | awk 'NR==2 {print $4}')
required_space=$((1024 * 1024))  # 1GB in KB

if [ "$available_space" -lt "$required_space" ]; then
    echo "Error: Insufficient disk space, need at least 1GB free space"
    exit 1
fi

echo "Creating 1GB swap file..."
sudo fallocate -l 1G /swapfile

echo "Setting swap file permissions..."
sudo chmod 600 /swapfile

echo "Formatting swap file..."
sudo mkswap /swapfile

echo "Enabling swap..."
sudo swapon /swapfile

echo "Swap setup complete!"
echo "Current memory status:"
free -h
echo ""
echo "Swap file status:"
swapon --show

echo ""
echo "Usage tips:"
echo "   - After build completes, run 'sudo swapoff /swapfile' to disable swap"
echo "   - To permanently enable swap, add this line to /etc/fstab:"
echo "     /swapfile none swap sw 0 0"