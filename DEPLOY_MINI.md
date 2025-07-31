# AlgoAssistant Lightweight Deployment Guide

> Deployment solution optimized for 1 CPU, 1GB memory servers

## 🎯 Optimization Results

### Resource Usage Comparison

| Component | Original | Lightweight | Savings |
|-----------|----------|-------------|---------|
| Total Memory | ~2.5GB | ~600MB | **76%** |
| Container Count | 5 | 3 | **40%** |
| Image Size | ~1.9GB | ~400MB | **79%** |
| Startup Time | ~2 minutes | ~30 seconds | **75%** |

### Architecture Optimizations

- ✅ **PostgreSQL → SQLite**: Save 200MB memory
- ✅ **Merged Celery Worker**: Single process mode, save 300MB
- ✅ **Alpine Linux Base**: Image size reduced by 60%
- ✅ **Nginx Static Service**: Frontend resource usage down 80%
- ✅ **Resource Limits**: Prevent memory overflow

## 🚀 Quick Deployment

### 1. System Requirements

```bash
# Minimum Configuration
CPU: 1 core
Memory: 1GB (recommend 1.5GB)
Disk: 10GB available space
OS: Linux (Ubuntu/CentOS/Debian)

# Required Software
- Docker >= 20.10
- Docker Compose >= 2.0
```

### 2. One-Click Deployment

```bash
# Clone project
git clone <your-repo> algoassistant
cd algoassistant

# Execute deployment script
./deploy-mini.sh
```

### 3. Verify Deployment

```bash
# Check service status
docker-compose -f docker-compose.mini.yml ps

# Access application
curl http://localhost/health

# Check resource usage
docker stats
```

## 🔧 Configuration

### Environment Config Files

- `backend/.env.mini` - Backend lightweight configuration
- `frontend/.env.mini` - Frontend build optimization configuration

### Key Optimization Parameters

```bash
# Redis memory limit
maxmemory 64mb
maxmemory-policy allkeys-lru

# Python process configuration
UVICORN_WORKERS=1
WEB_CONCURRENCY=1
CELERY_CONCURRENCY=1

# Docker resource limits
backend: 400M memory limit
frontend: 100M memory limit
```

## 📊 Monitoring and Maintenance

### Real-time Monitoring

```bash
# View container status
docker stats

# View logs
docker-compose -f docker-compose.mini.yml logs -f
```

### Memory Management

```bash
# If memory usage exceeds 80%, perform cleanup
docker system prune -f
docker volume prune -f

# Restart services to free memory
docker-compose -f docker-compose.mini.yml restart
```

### Data Backup

```bash
# Backup SQLite database
cp data/algo_assistant.db backup/algo_assistant_$(date +%Y%m%d).db

# Backup application data
tar -czf backup/app_data_$(date +%Y%m%d).tar.gz data/
```

## ⚠️ Important Notes

### Performance Limitations

- **Concurrent Users**: Recommend no more than 10 simultaneous online users
- **Data Volume**: SQLite suitable for small to medium scale data (<1GB)
- **Task Processing**: Background tasks processed serially, may have delays

### Scaling Suggestions

When higher performance is needed, consider the following upgrade paths:

1. **Memory Upgrade**: 2GB → Enable multi-process mode
2. **Database Upgrade**: SQLite → PostgreSQL
3. **Service Separation**: Restore Celery independent container
4. **Load Balancing**: Multi-instance deployment

## 🛠️ Troubleshooting

### Common Issues

1. **Insufficient Memory**
   ```bash
   # Check memory usage
   free -h

   # Clear system cache
   echo 3 > /proc/sys/vm/drop_caches
   ```

2. **Service Startup Failure**
   ```bash
   # View detailed logs
   docker-compose -f docker-compose.mini.yml logs

   # Rebuild images
   docker-compose -f docker-compose.mini.yml build --no-cache
   ```

3. **Database Connection Issues**
   ```bash
   # Check SQLite file permissions
   ls -la data/algo_assistant.db

   # Database is auto-created on first app startup
   # If issues persist, remove database file and restart
   rm -f data/algo_assistant.db
   docker-compose -f docker-compose.mini.yml restart backend
   ```

### Performance Tuning

```bash
# Adjust Docker memory limits
# Modify in docker-compose.mini.yml:
deploy:
  resources:
    limits:
      memory: 500M  # Adjust based on actual situation
```

## 📞 Technical Support

If you encounter deployment issues, please provide the following information:

1. System info: `uname -a`
2. Docker version: `docker --version`
3. Memory usage: `free -h`
4. Error logs: `docker-compose logs`

---

**After successful deployment, your AlgoAssistant will run stably on a 1GB memory server!** 🎉
