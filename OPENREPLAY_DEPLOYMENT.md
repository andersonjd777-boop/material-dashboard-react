# OpenReplay Deployment Guide for DCG Admin Dashboard

## Overview

This guide covers deploying OpenReplay for the DCG Admin Dashboard, including both self-hosted and cloud options.

## Recommended Approach: Self-Hosted on DigitalOcean

Given your existing DigitalOcean droplet (157.245.185.88), self-hosting provides:
- **Full data ownership** - Session data stays on your infrastructure
- **No recurring costs** - Only pay for server resources
- **Unlimited sessions** - No artificial caps
- **Custom retention** - Keep data as long as needed

### Hardware Requirements (Minimum)

| Component | Requirement |
|-----------|-------------|
| CPU | 4 vCPUs |
| RAM | 8 GB |
| Storage | 100 GB SSD |
| OS | Ubuntu 20.04+ |

**Note**: Your current droplet may need upgrading. Consider a separate droplet for OpenReplay.

---

## Option 1: Self-Hosted Deployment (Docker Compose)

### Prerequisites

```bash
# SSH into your server
ssh root@157.245.185.88

# Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
apt-get install docker-compose-plugin -y
```

### Installation Steps

```bash
# Create directory for OpenReplay
mkdir -p /opt/openreplay && cd /opt/openreplay

# Download installation script
git clone https://github.com/openreplay/openreplay.git
cd openreplay/scripts/helm

# Run installation (interactive)
./install.sh

# Or use one-liner with defaults:
DOMAIN_NAME=openreplay.yourdomain.com \
INSTALLATION_TYPE=standalone \
bash -x ./install.sh
```

### Post-Installation

1. **Get your project key**:
   ```bash
   # Access OpenReplay dashboard
   # Default: https://openreplay.yourdomain.com
   # Create account → Get Project Key
   ```

2. **Update DCG Dashboard environment**:
   ```bash
   # Add to dcg-admin-dashboard/.env
   REACT_APP_OPENREPLAY_PROJECT_KEY=your_project_key_here
   REACT_APP_OPENREPLAY_INGEST_POINT=https://openreplay.yourdomain.com/ingest
   ```

### Nginx Configuration for OpenReplay

Add to your existing Nginx configuration:

```nginx
# /etc/nginx/sites-available/openreplay
server {
    listen 80;
    server_name openreplay.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name openreplay.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/openreplay.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/openreplay.yourdomain.com/privkey.pem;

    # Proxy to OpenReplay
    location / {
        proxy_pass http://localhost:9000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Ingest endpoint (high traffic)
    location /ingest {
        proxy_pass http://localhost:9001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        client_max_body_size 10m;
    }
}
```

---

## Option 2: OpenReplay Cloud (Simpler Setup)

For faster deployment without infrastructure management:

### Pricing (as of 2024)

| Plan | Sessions/mo | Price | Best For |
|------|-------------|-------|----------|
| Free | 1,000 | $0 | Testing |
| Team | 10,000 | $39/mo | Small teams |
| Business | 50,000 | $149/mo | Medium teams |
| Enterprise | Unlimited | Custom | Large teams |

### Cloud Setup

1. Sign up at [openreplay.com](https://openreplay.com)
2. Create new project → Get Project Key
3. Update environment:
   ```bash
   REACT_APP_OPENREPLAY_PROJECT_KEY=your_cloud_project_key
   REACT_APP_OPENREPLAY_INGEST_POINT=https://api.openreplay.com/ingest
   ```

---

## DCG Dashboard Integration Checklist

### 1. Install Package

```bash
cd dcg-admin-dashboard
npm install @openreplay/tracker --legacy-peer-deps
```

### 2. Configure Environment

Create/update `.env`:
```env
# OpenReplay Configuration
REACT_APP_OPENREPLAY_PROJECT_KEY=your_project_key
REACT_APP_OPENREPLAY_INGEST_POINT=https://openreplay.yourdomain.com/ingest
REACT_APP_VERSION=1.0.0
```

### 3. Build and Deploy

```bash
npm run build
# Deploy build/ to your web server
```

---

## Verification

1. Open DCG Admin Dashboard in browser
2. Open DevTools → Network tab
3. Look for requests to `/ingest` endpoint
4. Log into OpenReplay dashboard → Sessions should appear

## Troubleshooting

- **No sessions appearing**: Check browser console for OpenReplay errors
- **CORS errors**: Ensure ingest endpoint is properly proxied
- **High CPU usage**: Consider scaling OpenReplay resources

