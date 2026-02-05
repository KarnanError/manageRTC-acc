# ManageRTC Deployment Guide

**Platform:** ManageRTC HRMS
**Target Server:** Hostinger VPS (31.97.229.42)
**Deployment Method:** GitHub Actions (Automated CI/CD)
**Date:** February 5, 2026

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Architecture Overview](#2-architecture-overview)
3. [Server Setup (Already Completed)](#3-server-setup-already-completed)
4. [GitHub Repository Setup](#4-github-repository-setup)
5. [GitHub Secrets Configuration](#5-github-secrets-configuration)
6. [Cloudflare Configuration](#6-cloudflare-configuration)
7. [Local Development Setup](#7-local-development-setup)
8. [Deployment Workflow](#8-deployment-workflow)
9. [Zero-Downtime Deployment Strategy](#9-zero-downtime-deployment-strategy)
10. [Backup & Rollback](#10-backup--rollback)
11. [Monitoring & Logging](#11-monitoring--logging)
12. [Troubleshooting](#12-troubleshooting)
13. [Security Best Practices](#13-security-best-practices)

---

## 1. Prerequisites

### Required Access

- [ ] GitHub repository access (admin)
- [ ] Hostinger VPS SSH access
- [ ] Cloudflare account access
- [ ] MongoDB Atlas access (for database URI)
- [ ] Clerk Dashboard access (for authentication keys)

### Software Requirements

| Component | Version | Purpose |
|-----------|---------|---------|
| Node.js | 20.x or 22.x | Runtime |
| npm | 10.x | Package manager |
| Git | Latest | Version control |
| PM2 | Latest | Process manager |
| nginx | Latest | Reverse proxy |

### Domain & DNS

| Domain | Purpose |
|--------|---------|
| dev.manage-rtc.com | Frontend (React SPA) |
| apidev.manage-rtc.com | Backend API |

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLOUDFLARE                               │
│  ┌──────────────────┐    ┌──────────────────┐                   │
│  │ dev.manage-rtc.com │    │apidev.manage-rtc.com│                │
│  │    (Proxied)      │    │    (Proxied)      │                 │
│  └────────┬─────────┘    └────────┬─────────┘                  │
└───────────┼───────────────────────┼─────────────────────────────┘
            │                       │
            ▼                       ▼
┌───────────────────────────────────────────────────────────────────┐
│                    HOSTINGER VPS (31.97.229.42)                   │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                         NGINX                                │ │
│  │  ┌─────────────────┐    ┌─────────────────────────────────┐ │ │
│  │  │   :443 (SSL)    │    │          :443 (SSL)             │ │ │
│  │  │  Static Files   │    │     Reverse Proxy → :5000       │ │ │
│  │  │  /var/www/dev.. │    │     + WebSocket Support         │ │ │
│  │  └─────────────────┘    └─────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                    │                              │
│                                    ▼                              │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    PM2 (deploy user)                        │ │
│  │  ┌─────────────────────────────────────────────────────────┐│ │
│  │  │  manage-rtc-api-dev (Node.js :5000)                     ││ │
│  │  │  /var/www/apidev.manage-rtc.com/backend/server.js       ││ │
│  │  └─────────────────────────────────────────────────────────┘│ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                    │                              │
└────────────────────────────────────┼──────────────────────────────┘
                                     │
                                     ▼
                    ┌────────────────────────────────┐
                    │      MongoDB Atlas (Cloud)     │
                    └────────────────────────────────┘
```

---

## 3. Server Setup (Already Completed)

The following has already been configured on the server:

### Users & Permissions
- [x] `deploy` user created (uid=1001)
- [x] deploy user added to sudo group
- [x] SSH keys configured for GitHub Actions

### Web Server
- [x] nginx installed and running
- [x] SSL certificates configured (Cloudflare + Let's Encrypt)
- [x] Virtual hosts configured for both domains

### Process Manager
- [x] PM2 installed and running as deploy user
- [x] PM2 startup script configured (pm2-deploy.service)
- [x] PM2 monitoring module installed

### Deployment Directories
- [x] `/var/www/dev.manage-rtc.com/frontend/` - Frontend build
- [x] `/var/www/apidev.manage-rtc.com/backend/` - Backend code
- [x] `/home/deploy/releases/` - Release staging
- [x] `/home/deploy/frontend_release/` - Frontend staging

---

## 4. GitHub Repository Setup

### Repository Structure

```
manageRTC-dev/
├── .github/
│   └── workflows/
│       ├── deploy-frontend.yml    # Frontend deployment
│       ├── deploy-backend.yml     # Backend deployment
│       └── ci-cd.yml              # CI pipeline
├── backend/                       # Node.js API
│   ├── server.js
│   ├── package.json
│   ├── .env.example
│   └── ...
├── react/                         # React frontend
│   ├── src/
│   ├── package.json
│   ├── .env.production
│   └── ...
└── docs/
    ├── SERVER_ANALYSIS_REPORT.md
    └── DEPLOYMENT_GUIDE.md
```

### Branch Strategy

| Branch | Purpose | Auto-Deploy |
|--------|---------|-------------|
| `main` | Production | Yes (to dev.manage-rtc.com) |
| `develop` | Development | No |
| `feature/*` | Feature branches | No |

---

## 5. GitHub Secrets Configuration

Navigate to: **Repository → Settings → Secrets and variables → Actions**

### SSH Connection Secrets

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `VPS_HOST` | `31.97.229.42` | Server IP address |
| `VPS_USER` | `deploy` | SSH username |
| `VPS_SSH_KEY` | `<private-key>` | SSH private key (see below) |

### Generating SSH Key for GitHub Actions

If you need to regenerate the SSH key:

```bash
# On your local machine
ssh-keygen -t ed25519 -C "github-actions-managertc" -f ~/.ssh/github_actions_managertc

# Copy private key content (this goes to VPS_SSH_KEY secret)
cat ~/.ssh/github_actions_managertc

# Copy public key to server
ssh root@31.97.229.42 "echo '$(cat ~/.ssh/github_actions_managertc.pub)' >> /home/deploy/.ssh/authorized_keys"
```

### Frontend Environment Secrets

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `CLERK_PUBLISHABLE_KEY_PUBLIC` | `pk_test_...` | Clerk public key |

### Backend Environment Secrets

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `ENV_PORT` | `5000` | API port |
| `ENV_MONGO_URI` | `mongodb+srv://...` | MongoDB connection string |
| `ENV_CLERK_SECRET_KEY` | `sk_test_...` | Clerk secret key |
| `ENV_CLERK_JWT_KEY` | `<jwt-key>` | Clerk JWT verification key |
| `ENV_CLERK_PUBLISHABLE_KEY` | `pk_test_...` | Clerk publishable key |
| `ENV_JWT` | `<random-string>` | JWT signing secret |
| `ENV_SOCKETS_ENABLED` | `true` | Enable WebSockets |
| `ENV_ZONE_ID` | `<cloudflare-zone>` | Cloudflare zone ID |
| `ENV_CLOUDFLARE_API_KEY` | `<api-key>` | Cloudflare API key |
| `ENV_DOMAIN` | `manage-rtc.com` | Base domain |
| `ENV_VPS_IP` | `31.97.229.42` | Server IP |

---

## 6. Cloudflare Configuration

### DNS Records

| Type | Name | Content | Proxy Status |
|------|------|---------|--------------|
| A | dev | 31.97.229.42 | Proxied (orange) |
| A | apidev | 31.97.229.42 | Proxied (orange) |

### SSL/TLS Settings

| Setting | Value |
|---------|-------|
| SSL/TLS Mode | Full (strict) |
| Always Use HTTPS | On |
| Automatic HTTPS Rewrites | On |

### Origin Certificates

1. Go to **SSL/TLS → Origin Server**
2. Create certificate for `*.manage-rtc.com, manage-rtc.com`
3. Download and install on server at `/etc/ssl/cloudflare/`

### Firewall Rules (Optional)

Consider adding rules to:
- Block countries you don't serve
- Rate limit API requests
- Challenge suspicious traffic

---

## 7. Local Development Setup

### Clone Repository

```bash
git clone https://github.com/Sudhakarnan/manageRTC-dev.git
cd manageRTC-dev
```

### Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your local values
npm install
npm run dev
```

### Frontend Setup

```bash
cd react
cp .env.example .env
# Edit .env with your local values
npm install
npm start
```

---

## 8. Deployment Workflow

### Automatic Deployment (Recommended)

Deployment triggers automatically when pushing to `main`:

```bash
# Make changes locally
git add .
git commit -m "feat: add new feature"
git push origin main
```

The workflow will:
1. **Frontend changes** (`react/**`) → Triggers `deploy-frontend.yml`
2. **Backend changes** (`backend/**`) → Triggers `deploy-backend.yml`
3. Both can run in parallel if changes affect both

### Manual Deployment

Go to **Actions → Select Workflow → Run workflow**

Or use GitHub CLI:

```bash
# Deploy frontend manually
gh workflow run deploy-frontend.yml

# Deploy backend manually
gh workflow run deploy-backend.yml
```

### Deployment Process Flow

#### Frontend Deployment

```
[Push to main] → [Build React App] → [SCP to VPS] → [Activate] → [Reload nginx]
                         │
                         ├── npm ci
                         ├── npm run build
                         └── Upload build/
```

#### Backend Deployment

```
[Push to main] → [Pack Code] → [Upload] → [Extract] → [Install Deps] → [PM2 Reload]
                      │                                      │
                      ├── tar -czf (exclude node_modules)    ├── npm ci --omit=dev
                      └── Upload .tar.gz                     └── pm2 reload
```

---

## 9. Zero-Downtime Deployment Strategy

### Current Implementation

The deployment achieves near-zero-downtime through:

1. **PM2 Reload**: Uses `pm2 reload` instead of `pm2 restart`
   - Spawns new process
   - Routes traffic to new process
   - Gracefully shuts down old process

2. **nginx Reload**: Uses `systemctl reload nginx`
   - No dropped connections
   - Config validated before reload

### Enhanced Zero-Downtime (Recommended)

The updated workflows include:

1. **Pre-deployment backup**
2. **Health check after deployment**
3. **Automatic rollback on failure**

---

## 10. Backup & Rollback

### Automatic Backups

The deployment workflow automatically:
- Creates timestamped backup before deployment
- Stores backups in `/home/deploy/backups/`
- Keeps last 5 backups

### Manual Backup

```bash
# SSH to server as deploy user
ssh deploy@31.97.229.42

# Backup backend
tar -czf ~/backups/backend-$(date +%Y%m%d-%H%M%S).tar.gz \
  -C /var/www/apidev.manage-rtc.com/backend .

# Backup frontend
tar -czf ~/backups/frontend-$(date +%Y%m%d-%H%M%S).tar.gz \
  -C /var/www/dev.manage-rtc.com/frontend .
```

### Manual Rollback

```bash
# List available backups
ls -la ~/backups/

# Rollback backend to specific backup
cd /var/www/apidev.manage-rtc.com
rm -rf backend.old
mv backend backend.old
mkdir backend
tar -xzf ~/backups/backend-YYYYMMDD-HHMMSS.tar.gz -C backend
cd backend && npm ci --omit=dev
pm2 reload manage-rtc-api-dev

# Rollback frontend
cd /var/www/dev.manage-rtc.com
rm -rf frontend.old
mv frontend frontend.old
mkdir frontend
tar -xzf ~/backups/frontend-YYYYMMDD-HHMMSS.tar.gz -C frontend
sudo systemctl reload nginx
```

---

## 11. Monitoring & Logging

### PM2 Monitoring

```bash
# SSH to server
ssh deploy@31.97.229.42

# View all processes
pm2 list

# Monitor in real-time
pm2 monit

# View logs
pm2 logs manage-rtc-api-dev
pm2 logs manage-rtc-api-dev --lines 100

# View specific log files
tail -f ~/.pm2/logs/manage-rtc-api-dev-out.log
tail -f ~/.pm2/logs/manage-rtc-api-dev-error.log
```

### nginx Logs

```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log
```

### System Monitoring

```bash
# Resource usage
htop

# Disk usage
df -h

# Memory usage
free -h
```

### Live Logs Dashboard

Access: http://31.97.229.42:7682 (ttyd service)

---

## 12. Troubleshooting

### Deployment Failures

#### SSH Connection Failed
```
Error: ssh: connect to host 31.97.229.42 port 22: Connection refused
```
**Solutions:**
1. Check if server is running
2. Verify SSH service: `systemctl status ssh`
3. Check firewall rules

#### PM2 Process Not Starting
```
Error: pm2 describe manage-rtc-api-dev > /dev/null failed
```
**Solutions:**
1. Check logs: `pm2 logs manage-rtc-api-dev`
2. Verify .env file exists
3. Check Node.js version compatibility
4. Run manually: `cd /var/www/apidev.manage-rtc.com/backend && node server.js`

#### nginx Reload Failed
```
Error: nginx: [emerg] unknown directive
```
**Solutions:**
1. Test config: `sudo nginx -t`
2. Check syntax in site configs
3. Verify SSL certificate paths

### Common Issues

#### 502 Bad Gateway
- Backend not running
- Wrong port in nginx upstream
- PM2 process crashed

```bash
# Check PM2 status
pm2 status

# Check if port 5000 is listening
netstat -tlnp | grep 5000

# Restart backend
pm2 restart manage-rtc-api-dev
```

#### 504 Gateway Timeout
- Backend taking too long
- Database connection issues

```bash
# Check backend logs
pm2 logs manage-rtc-api-dev

# Verify MongoDB connection
curl https://apidev.manage-rtc.com/health
```

#### SSL Certificate Errors
- Certificate expired
- Wrong certificate path

```bash
# Check certificate expiry
sudo certbot certificates

# Renew Let's Encrypt
sudo certbot renew

# Verify Cloudflare certificate
ls -la /etc/ssl/cloudflare/
```

---

## 13. Security Best Practices

### Server Security

1. **SSH Hardening**
   - Disable root login via SSH
   - Use SSH keys only (no passwords)
   - Change default SSH port (optional)

2. **Firewall (UFW)**
   ```bash
   sudo ufw allow 22
   sudo ufw allow 80
   sudo ufw allow 443
   sudo ufw enable
   ```

3. **Regular Updates**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

### Application Security

1. **Environment Variables**
   - Never commit .env files
   - Use GitHub Secrets for sensitive data
   - Rotate secrets periodically

2. **Dependencies**
   - Run `npm audit` regularly
   - Keep dependencies updated
   - Review security advisories

3. **API Security**
   - Rate limiting enabled
   - CORS properly configured
   - Input validation on all endpoints

### Monitoring Security

1. Set up fail2ban for SSH protection
2. Monitor for unusual traffic patterns
3. Enable Cloudflare security features

---

## Quick Reference Commands

### Deployment

```bash
# Manual deploy (local)
git push origin main

# Force redeploy via GitHub Actions
gh workflow run deploy-frontend.yml
gh workflow run deploy-backend.yml
```

### Server Management

```bash
# SSH as deploy user
ssh deploy@31.97.229.42

# PM2 commands
pm2 list                           # List processes
pm2 restart manage-rtc-api-dev     # Restart backend
pm2 reload manage-rtc-api-dev      # Zero-downtime reload
pm2 logs                           # View logs
pm2 monit                          # Monitor resources

# nginx commands
sudo nginx -t                      # Test config
sudo systemctl reload nginx        # Reload config
sudo systemctl restart nginx       # Restart nginx
```

### Logs

```bash
# Backend logs
pm2 logs manage-rtc-api-dev --lines 100

# nginx logs
sudo tail -f /var/log/nginx/error.log
```

---

## Support & Resources

- **GitHub Issues:** https://github.com/Sudhakarnan/manageRTC-dev/issues
- **Cloudflare Docs:** https://developers.cloudflare.com/
- **PM2 Docs:** https://pm2.keymetrics.io/docs/
- **nginx Docs:** https://nginx.org/en/docs/

---

**Document Version:** 1.0
**Last Updated:** February 5, 2026
