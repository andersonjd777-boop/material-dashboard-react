#!/usr/bin/env bash
# ============================================================
# DCG Admin Dashboard — Infrastructure Remediation Script
# Run on the VPS as root or with sudo
# Generated: 2026-02-15
# ============================================================
set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

log()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err()  { echo -e "${RED}[✗]${NC} $1"; }

echo "============================================="
echo "  DCG Infrastructure Remediation Script"
echo "============================================="
echo ""

# ── LB-01: Fix PM2 crash loop ──────────────────────────────
echo ""
echo "═══ LB-01: Fix PM2 Crash Loop ═══"
if lsof -ti:4242 &>/dev/null; then
  warn "Port 4242 is in use — killing rogue process(es)..."
  sudo lsof -ti:4242 | xargs sudo kill -9 || true
  sleep 2
  log "Rogue processes cleared"
else
  log "Port 4242 is free — no rogue process"
fi
pm2 restart dcg-stripe-api 2>/dev/null && log "PM2 app restarted" || warn "PM2 app not found — restart manually"
pm2 save 2>/dev/null || true

# ── LB-03: Free disk space ─────────────────────────────────
echo ""
echo "═══ LB-03: Free Disk Space ═══"
BEFORE=$(df / --output=avail -h | tail -1 | tr -d ' ')
echo "  Disk available before cleanup: $BEFORE"

DIRS_TO_REMOVE=(
  "$HOME/dcg-admin-dashboard-new"
  "$HOME/dashboard.backup"
  "$HOME/dashboard_backup_20251221_143317"
  "$HOME/dcg-dashboard"
)

for dir in "${DIRS_TO_REMOVE[@]}"; do
  if [ -d "$dir" ]; then
    du -sh "$dir" 2>/dev/null || true
    rm -rf "$dir"
    log "Removed $dir"
  else
    echo "  (skipped $dir — does not exist)"
  fi
done

# Clean Puppeteer cache
if [ -d "$HOME/.cache/puppeteer" ]; then
  du -sh "$HOME/.cache/puppeteer" 2>/dev/null || true
  rm -rf "$HOME/.cache/puppeteer"
  log "Cleaned Puppeteer cache"
fi

# Clean PM2 logs
pm2 flush 2>/dev/null && log "PM2 logs flushed" || true

AFTER=$(df / --output=avail -h | tail -1 | tr -d ' ')
echo "  Disk available after cleanup: $AFTER"

# ── LB-05: Add HSTS Header ─────────────────────────────────
echo ""
echo "═══ LB-05: Add HSTS Header ═══"
NGINX_DASHBOARD="/etc/nginx/sites-available/dashboard.directconnectglobal.com"
if [ -f "$NGINX_DASHBOARD" ]; then
  if grep -q "Strict-Transport-Security" "$NGINX_DASHBOARD"; then
    log "HSTS header already present"
  else
    # Add HSTS inside the HTTPS server block (after ssl_certificate lines)
    sudo sed -i '/ssl_certificate_key/a\    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;' "$NGINX_DASHBOARD"
    log "HSTS header added"
  fi
else
  warn "Nginx config not found at $NGINX_DASHBOARD — add HSTS manually"
fi

# ── LB-06: Block HTTP IP Access ──────────────────────────────
echo ""
echo "═══ LB-06: Block HTTP IP Access ═══"
NGINX_DEFAULT="/etc/nginx/sites-available/default"
if [ -f "$NGINX_DEFAULT" ]; then
  if grep -q "return 444" "$NGINX_DEFAULT" 2>/dev/null; then
    log "IP-based access already blocked"
  else
    warn "Review $NGINX_DEFAULT and either remove the IP-based server block or add:"
    echo '    server { listen 80 default_server; listen [::]:80 default_server; return 444; }'
  fi
else
  warn "Default nginx config not found — check IP access manually"
fi

# ── HR-01: Security Headers ─────────────────────────────────
echo ""
echo "═══ HR-01: Add Security Headers ═══"
if [ -f "$NGINX_DASHBOARD" ]; then
  HEADERS_TO_ADD=(
    'add_header X-Frame-Options "DENY" always;'
    'add_header X-Content-Type-Options "nosniff" always;'
    'add_header Referrer-Policy "strict-origin-when-cross-origin" always;'
    'add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;'
    'add_header X-XSS-Protection "1; mode=block" always;'
  )

  for header in "${HEADERS_TO_ADD[@]}"; do
    KEY=$(echo "$header" | awk '{print $2}')
    if grep -q "$KEY" "$NGINX_DASHBOARD"; then
      echo "  (skipped $KEY — already present)"
    else
      sudo sed -i "/ssl_certificate_key/a\\    $header" "$NGINX_DASHBOARD"
      log "Added $KEY"
    fi
  done
else
  warn "Nginx config not found — add security headers manually"
fi

# ── HR-02: Nginx Rate Limiting ───────────────────────────────
echo ""
echo "═══ HR-02: Add Nginx Rate Limiting ═══"
NGINX_CONF="/etc/nginx/nginx.conf"
if [ -f "$NGINX_CONF" ]; then
  if grep -q "limit_req_zone" "$NGINX_CONF"; then
    log "Rate limiting zone already defined"
  else
    # Add rate limit zone in http block
    sudo sed -i '/http {/a\    limit_req_zone $binary_remote_addr zone=api:10m rate=30r/s;\n    limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/m;' "$NGINX_CONF"
    log "Rate limit zones added to nginx.conf"
    warn "Apply zones to location blocks in $NGINX_DASHBOARD:"
    echo '    location /api/ { limit_req zone=api burst=50 nodelay; ... }'
    echo '    location /api/admin/auth/ { limit_req zone=auth burst=3 nodelay; ... }'
  fi
else
  warn "nginx.conf not found at $NGINX_CONF"
fi

# ── HR-05: Enable Gzip Compression ──────────────────────────
echo ""
echo "═══ HR-05: Enable Gzip Compression ═══"
if [ -f "$NGINX_CONF" ]; then
  if grep -q "gzip_types" "$NGINX_CONF"; then
    log "Gzip compression already configured"
  else
    sudo sed -i '/http {/a\    gzip on;\n    gzip_vary on;\n    gzip_proxied any;\n    gzip_comp_level 6;\n    gzip_min_length 1000;\n    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;' "$NGINX_CONF"
    log "Gzip compression enabled"
  fi
else
  warn "nginx.conf not found — enable gzip manually"
fi

# ── HR-06: Database Backups ──────────────────────────────────
echo ""
echo "═══ HR-06: Automate Database Backups ═══"
BACKUP_SCRIPT="/opt/dcg/backup-db.sh"
sudo mkdir -p /opt/dcg/backups

cat <<'BACKUP_EOF' | sudo tee "$BACKUP_SCRIPT" > /dev/null
#!/bin/bash
# DCG SQLite Daily Backup
DB_PATH="/home/dcg/material-dashboard-react/server/database.sqlite"
BACKUP_DIR="/opt/dcg/backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=14

if [ -f "$DB_PATH" ]; then
  sqlite3 "$DB_PATH" ".backup '${BACKUP_DIR}/database_${DATE}.sqlite'"
  gzip "${BACKUP_DIR}/database_${DATE}.sqlite"
  echo "Backup created: database_${DATE}.sqlite.gz"
  find "$BACKUP_DIR" -name "database_*.sqlite.gz" -mtime +${RETENTION_DAYS} -delete
  echo "Old backups cleaned (retention: ${RETENTION_DAYS} days)"
fi
BACKUP_EOF

sudo chmod +x "$BACKUP_SCRIPT"
log "Backup script created at $BACKUP_SCRIPT"

# Add cron job (daily at 2 AM)
CRON_LINE="0 2 * * * $BACKUP_SCRIPT >> /var/log/dcg-backup.log 2>&1"
(sudo crontab -l 2>/dev/null | grep -v "backup-db.sh"; echo "$CRON_LINE") | sudo crontab -
log "Cron job added: daily backup at 2 AM"

# ── HR-07: Static Asset Caching ──────────────────────────────
echo ""
echo "═══ HR-07: Static Asset Caching ═══"
if [ -f "$NGINX_DASHBOARD" ]; then
  if grep -q "expires" "$NGINX_DASHBOARD"; then
    log "Caching headers already present"
  else
    warn "Add caching rules to $NGINX_DASHBOARD inside the HTTPS server block:"
    cat <<'CACHE_GUIDE'
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
CACHE_GUIDE
  fi
fi

# ── HR-08: PM2 Cluster Mode ─────────────────────────────────
echo ""
echo "═══ HR-08: Enable PM2 Cluster Mode ═══"
warn "After upgrading to a multi-core server (LB-02), update ecosystem.config.js:"
echo '    instances: "max"  // Use all available CPU cores'
echo '    exec_mode: "cluster"'

# ── HR-09: Firewall Hardening ────────────────────────────────
echo ""
echo "═══ HR-09: Firewall Hardening ═══"
if command -v ufw &>/dev/null; then
  if sudo ufw status | grep -q "active"; then
    log "UFW is active"
    sudo ufw status numbered
  else
    warn "UFW is installed but inactive. Enable with:"
    echo "    sudo ufw default deny incoming"
    echo "    sudo ufw default allow outgoing"
    echo "    sudo ufw allow 22/tcp    # SSH"
    echo "    sudo ufw allow 80/tcp    # HTTP (redirect)"
    echo "    sudo ufw allow 443/tcp   # HTTPS"
    echo "    sudo ufw enable"
  fi
else
  warn "UFW not installed. Install with: sudo apt install ufw"
fi

# ── Reload Nginx ─────────────────────────────────────────────
echo ""
echo "═══ Reloading Nginx ═══"
if sudo nginx -t 2>&1; then
  sudo systemctl reload nginx
  log "Nginx reloaded successfully"
else
  err "Nginx config test failed — fix errors before reloading"
fi

# ── Summary ──────────────────────────────────────────────────
echo ""
echo "============================================="
echo "  Remediation Summary"
echo "============================================="
echo ""
echo "  ✅ Automated:"
echo "     - PM2 crash loop fix (LB-01)"
echo "     - Disk cleanup (LB-03)"
echo "     - HSTS header (LB-05)"
echo "     - Security headers (HR-01)"
echo "     - Rate limiting zones (HR-02)"
echo "     - Gzip compression (HR-05)"
echo "     - Database backup cron (HR-06)"
echo ""
echo "  ⚠️  Manual steps required:"
echo "     - LB-02: Upgrade server (4 vCPU / 8GB, ~\$48/mo)"
echo "     - LB-06: Review IP-based nginx block"
echo "     - HR-03: Set up Cloudflare CDN (free tier)"
echo "     - HR-07: Add caching rules to nginx"
echo "     - HR-08: Enable cluster mode after server upgrade"
echo "     - HR-09: Configure UFW firewall"
echo "     - HR-11: Write disaster recovery plan"
echo ""
echo "  Run 'sudo nginx -t && sudo systemctl reload nginx' after manual edits"
echo ""
