# ManageRTC Server Analysis Report

**Date:** February 5, 2026
**Server:** 31.97.229.42 (Hostinger VPS)
**Analyst:** Claude Code

---

## 1. System Information

| Property | Value |
|----------|-------|
| **Operating System** | Ubuntu 24.04.3 LTS (Noble Numbat) |
| **Kernel** | 6.8.0-90-generic (x86_64) |
| **Node.js Version** | v22.19.0 |
| **NPM Version** | 10.9.3 |
| **Total RAM** | 3.8 GB |
| **Available RAM** | 3.2 GB |
| **Total Disk** | 48 GB |
| **Used Disk** | 6.8 GB (15%) |
| **Available Disk** | 41 GB |

---

## 2. Users

### System Users with Shell Access

| User | UID | Home Directory | Shell | Notes |
|------|-----|----------------|-------|-------|
| root | 0 | /root | /bin/bash | System admin |
| ubuntu | 1000 | /home/ubuntu | /bin/bash | Default user |
| **deploy** | 1001 | /home/deploy | /bin/bash | **Deployment user** |

### Deploy User Details

- **Groups:** deploy(1001), sudo(27), users(100)
- **SSH Keys Configured:** Yes (2 GitHub Actions keys)
- **PM2 Home:** /home/deploy/.pm2
- **Authorized Keys:**
  - `github-actions@amasqis` (ed25519)
  - `github-actions-managertc` (ed25519)

---

## 3. Running Services

### Key Services

| Service | Status | Description |
|---------|--------|-------------|
| nginx | active | Web server / Reverse proxy |
| pm2-deploy | active | PM2 process manager |
| ssh | active | SSH server |
| cron | active | Scheduled tasks |
| systemd-resolved | active | DNS resolution |

### PM2 Processes (under deploy user)

| ID | Name | Status | Port | Uptime | Memory | Script Path |
|----|------|--------|------|--------|--------|-------------|
| 1 | manage-rtc-api-dev | online | 5000 | 36h | 150.7 MB | /var/www/apidev.manage-rtc.com/backend/server.js |
| 2 | pm2-live-logs | online | 4000 | 36h | 109.9 MB | /home/deploy/pm2-live-logs |
| 0 (module) | pm2-server-monit | online | - | - | 70.5 MB | Monitoring module |

---

## 4. Ports in Use

| Port | Protocol | Service | Bound To | Process |
|------|----------|---------|----------|---------|
| 22 | TCP | SSH | 0.0.0.0 | systemd |
| 80 | TCP | HTTP | 0.0.0.0 | nginx |
| 443 | TCP | HTTPS | 0.0.0.0 | nginx |
| 5000 | TCP | Backend API | :: (IPv6) | node (PM2) |
| 4000 | TCP | PM2 Live Logs | :: (IPv6) | node (PM2) |
| 7681 | TCP | ttyd (internal) | 127.0.0.1 | ttyd |
| 7682 | TCP | ttyd (public) | 0.0.0.0 | ttyd |

---

## 5. Directory Structure

### Deployment Directories

```
/var/www/
├── dev.manage-rtc.com/
│   └── frontend/              # React production build
│       ├── index.html
│       ├── asset-manifest.json
│       ├── favicon.png
│       ├── robots.txt
│       ├── assets/
│       └── static/
│           ├── css/
│           ├── js/
│           └── media/
│
├── apidev.manage-rtc.com/
│   └── backend/               # Node.js backend
│       ├── server.js          # Main entry point
│       ├── package.json
│       ├── .env               # Environment variables
│       ├── config/
│       ├── controllers/       # 27 controller directories
│       ├── models/            # 11 model directories
│       ├── routes/
│       ├── services/          # 27 service directories
│       ├── socket/
│       ├── jobs/
│       ├── migrations/
│       └── node_modules/
│
├── api.dev.manage-rtc.com/    # Possibly old/unused
└── html/                      # Default nginx directory

/home/deploy/
├── .pm2/                      # PM2 configuration & logs
│   ├── logs/
│   ├── pids/
│   └── dump.pm2
├── .ssh/
│   └── authorized_keys        # GitHub Actions SSH keys
├── frontend_release/          # Temp directory for frontend builds
├── releases/                  # Release staging directory
└── pm2-live-logs/             # PM2 log viewer app
```

---

## 6. Nginx Configuration

### Sites Enabled

| Site | Config File |
|------|-------------|
| dev.manage-rtc.com | /etc/nginx/sites-enabled/dev.manage-rtc.com |
| apidev.manage-rtc.com | /etc/nginx/sites-enabled/apidev.manage-rtc.com |

### Frontend Configuration (dev.manage-rtc.com)

```nginx
# HTTP -> HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name dev.manage-rtc.com;
    return 301 https://$host$request_uri;
}

# HTTPS Frontend (React SPA)
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name dev.manage-rtc.com;

    ssl_certificate     /etc/ssl/cloudflare/manage-rtc.com.pem;
    ssl_certificate_key /etc/ssl/cloudflare/manage-rtc.com.key;

    root /var/www/dev.manage-rtc.com/frontend;
    index index.html;

    # SPA fallback
    location = /index.html { add_header Cache-Control "no-store"; }
    location / { try_files $uri /index.html; }

    # Static cache
    location ~* \.(?:js|css|svg|png|jpg|jpeg|gif|woff2?)$ {
        expires 7d;
        access_log off;
        add_header Cache-Control "public, max-age=604800, immutable";
    }
}
```

### Backend Configuration (apidev.manage-rtc.com)

```nginx
upstream apidev_node {
    server 127.0.0.1:5000;
    keepalive 64;
}

# HTTP -> HTTPS redirect
server {
    listen 80;
    server_name apidev.manage-rtc.com;
    return 301 https://$host$request_uri;
}

# HTTPS reverse proxy
server {
    listen 443 ssl http2;
    server_name apidev.manage-rtc.com;

    ssl_certificate     /etc/letsencrypt/live/apidev.manage-rtc.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/apidev.manage-rtc.com/privkey.pem;
    include             /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;

    # WebSockets (Socket.IO)
    location /socket.io/ {
        proxy_pass         http://apidev_node;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection "upgrade";
        proxy_set_header   Host $host;
        proxy_read_timeout 60s;
    }

    # API
    location / {
        proxy_pass         http://apidev_node;
        proxy_http_version 1.1;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }
}
```

---

## 7. SSL Certificates

### Frontend (Cloudflare Origin Certificate)

| Property | Value |
|----------|-------|
| Type | Cloudflare Origin Certificate |
| Location | /etc/ssl/cloudflare/manage-rtc.com.pem |
| Key | /etc/ssl/cloudflare/manage-rtc.com.key |
| Domain | dev.manage-rtc.com |

### Backend (Let's Encrypt)

| Property | Value |
|----------|-------|
| Type | Let's Encrypt |
| Location | /etc/letsencrypt/live/apidev.manage-rtc.com/ |
| Auto-renewal | Yes (via certbot) |
| Domain | apidev.manage-rtc.com |

---

## 8. Existing GitHub Actions Workflows

### deploy-frontend.yml
- **Trigger:** Push to `main` branch (react/** paths)
- **Actions:**
  1. Checkout code
  2. Setup Node.js 20
  3. Write .env.production
  4. npm ci && npm run build
  5. SCP upload to /home/deploy/frontend_release/
  6. Copy to /var/www/dev.manage-rtc.com/frontend/
  7. Reload nginx

### deploy-backend.yml
- **Trigger:** Push to `main` branch (backend/** paths)
- **Actions:**
  1. Checkout code
  2. Create backend.tar.gz (excluding node_modules, .env)
  3. SCP upload to /home/deploy/
  4. Extract and rsync to /var/www/apidev.manage-rtc.com/backend/
  5. Write .env file from secrets
  6. npm ci --omit=dev
  7. PM2 reload manage-rtc-api-dev

### ci-cd.yml
- **Trigger:** Push/PR to main, develop
- **Jobs:** Backend tests, Frontend tests, Security audit, Integration tests
- **Note:** Deploy jobs are placeholders (Docker-based, not active)

---

## 9. GitHub Secrets Required

Based on the existing workflows, these secrets must be configured:

### SSH Connection
| Secret | Description |
|--------|-------------|
| VPS_HOST | 31.97.229.42 |
| VPS_USER | deploy |
| VPS_SSH_KEY | Private SSH key for deploy user |

### Frontend Environment
| Secret | Description |
|--------|-------------|
| CLERK_PUBLISHABLE_KEY_PUBLIC | Clerk authentication public key |

### Backend Environment
| Secret | Description |
|--------|-------------|
| ENV_PORT | 5000 |
| ENV_MONGO_URI | MongoDB connection URI |
| ENV_CLERK_SECRET_KEY | Clerk secret key |
| ENV_CLERK_JWT_KEY | Clerk JWT key |
| ENV_CLERK_PUBLISHABLE_KEY | Clerk publishable key |
| ENV_JWT | JWT secret |
| ENV_SOCKETS_ENABLED | true/false |
| ENV_ZONE_ID | Cloudflare zone ID |
| ENV_CLOUDFLARE_API_KEY | Cloudflare API key |
| ENV_DOMAIN | manage-rtc.com |
| ENV_VPS_IP | 31.97.229.42 |

---

## 10. Current Issues & Recommendations

### Issues Identified

1. **No Backup Strategy:** Current workflows don't backup before deployment
2. **Limited Zero-Downtime:** PM2 reload is used but no health checks
3. **No Rollback Mechanism:** No easy way to rollback failed deployments
4. **Source Maps in Production:** Frontend removes .map files, which is good
5. **PM2 Ecosystem Config Missing:** No ecosystem.config.js file found

### Recommendations

1. Add backup step before each deployment
2. Implement health checks after deployment
3. Add rollback capability
4. Create PM2 ecosystem.config.js for consistent configuration
5. Add deployment notifications (Slack/Discord)
6. Consider blue-green deployment for true zero-downtime

---

## 11. Summary

The server is well-configured with:
- Modern Ubuntu 24.04 LTS
- Latest Node.js LTS (v22)
- nginx reverse proxy with SSL
- PM2 process manager with monitoring
- Separate deploy user with appropriate permissions
- GitHub Actions SSH keys already configured

The existing deployment workflow is functional but can be enhanced with:
- Pre-deployment backups
- Health checks
- Rollback support
- Better logging and notifications
