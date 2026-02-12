# CodeSync - Production Deployment Guide

## 🔐 Security Checklist

Before deploying to production, complete these security steps:

### 1. Environment Variables (CRITICAL)
- [ ] **Frontend (Vercel)**: Set `VITE_API_URL` to your backend URL (e.g., `https://api.myapp.com`)
    - *Warning: If unset, it defaults to localhost, breaking login in production.*
- [ ] **Backend (Render)**: Set `FRONTEND_URL` to your frontend URL (e.g., `https://myapp.vercel.app`)
    - *Warning: If mismatch, CORS errors will block requests.*
- [ ] Generate secure JWT secret: `openssl rand -base64 64`
- [ ] Update `JWT_SECRET` in `.env`
- [ ] Set strong `REDIS_PASSWORD`
- [ ] Configure Google OAuth credentials
- [ ] Never commit `.env` files

### 2. Database Security
- [ ] Use Supabase connection pooling for production
- [ ] Enable SSL/TLS for database connections
- [ ] Set up database backups
- [ ] Configure row-level security policies

### 3. Application Security
- [ ]] Enable CORS only for your domain
- [ ] Implement rate limiting
- [ ] Add helmet.js for security headers
- [ ] Enable HTTPS/SSL certificates
- [ ] Configure CSP headers properly

### 4. Docker Security
- [ ] Run containers as non-root users (✅ already configured)
- [ ] Use specific image versions, not `latest`
- [ ] Scan images for vulnerabilities: `docker scan`
- [ ] Limit container resources (CPU/memory)
- [ ] Keep Docker and images updated

## 🚀 Deployment Steps

### Local Development
```bash
# Install dependencies
cd server && npm install
cd ../client && npm install

# Run in dev mode
npm run dev (in both directories)
```

### Docker Production Build
```bash
# Build and start all services
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Health Checks
- Frontend: http://localhost/health
- Backend: http://localhost:3001/health
- Redis: `docker exec codesync-redis redis-cli ping`

### Environment Setup
1. Copy `.env.example` to `.env` in server directory
2. Update all values with production credentials
3. Never share or commit `.env` files

## 📋 Production Checklist

- [ ] SSL/TLS certificates configured
- [ ] Domain pointed to server
- [ ] Firewall rules configured
- [ ] Monitoring set up (metrics, alerts)
- [ ] Backup strategy in place
- [ ] Log aggregation configured
- [ ] Error tracking (Sentry/similar)
- [ ] CDN for static assets
- [ ] Rate limiting enabled
- [ ] DDoS protection enabled

## 🔧 Maintenance

### Update Dependencies
```bash
npm audit
npm update
```

### Database Migrations
```bash
cd server
npx prisma migrate deploy
```

### Scaling
- Use Docker Swarm or Kubernetes for orchestration
- Add load balancer for multiple backend instances
- Use Redis for session sharing across instances
- Configure horizontal pod autoscaling

## 📊 Monitoring

Monitor these metrics:
- Request rate and response times
- Error rates
- Database connection pool
- Memory and CPU usage
- WebSocket connections
- Room expiration cleanup

## 🆘 Troubleshooting

### Database Connection Issues
```bash
# Test database connection
docker exec codesync-backend npx prisma db push
```

### Container Issues
```bash
# View container logs
docker logs codesync-backend
docker logs codesync-frontend

# Restart specific service
docker-compose restart backend
```

## Security Best Practices Implemented

✅ Multi-stage Docker builds (smaller images)
✅ Non-root users in containers
✅ Security headers (X-Frame-Options, CSP, etc.)
✅ HTTPS-only cookies for sessions
✅ Environment variable validation
✅ Health checks for all services
✅ Proper CORS configuration
✅ SQL injection protection (Prisma ORM)
✅ XSS protection headers
✅ Rate limiting ready
✅ Password hashing (bcrypt)
✅ JWT with secure secrets
✅ Input validation
✅ Error message sanitization
