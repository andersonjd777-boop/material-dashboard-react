# DCG Monitoring Implementation Roadmap

## Priority Matrix

```
HIGH IMPACT
    │
    │  ┌─────────────────┐    ┌─────────────────┐
    │  │  1. OpenReplay  │    │  4. Netdata     │
    │  │  (Frontend)     │    │  (Infra Metrics)│
    │  │  Est: 2-4 hrs   │    │  Est: 1-2 hrs   │
    │  └─────────────────┘    └─────────────────┘
    │
    │  ┌─────────────────┐    ┌─────────────────┐
    │  │  2. Better Stack│    │  5. CrowdSec    │
    │  │  (Alerting/Logs)│    │  (Security)     │
    │  │  Est: 2-4 hrs   │    │  Est: 2-3 hrs   │
    │  └─────────────────┘    └─────────────────┘
    │
    │  ┌─────────────────┐    ┌─────────────────┐
    │  │  3. Better      │    │  6. SQLite      │
    │  │  Uptime         │    │  Monitor        │
    │  │  Est: 30 min    │    │  Est: 2-3 hrs   │
    │  └─────────────────┘    └─────────────────┘
    │
LOW IMPACT ──────────────────────────────────────▶
           LOW EFFORT                  HIGH EFFORT
```

---

## Phase 1: Immediate (Week 1)

### 1.1 OpenReplay Integration ✅ READY
**Status**: Code implemented, ready to deploy  
**Time**: 2-4 hours  
**Steps**:
1. Install npm package: `npm install @openreplay/tracker --legacy-peer-deps`
2. Add environment variables to `.env`
3. Deploy frontend build
4. Verify sessions appearing in dashboard

### 1.2 Better Uptime (External Monitoring)
**Time**: 30 minutes  
**Cost**: Free tier (3 monitors)  
**Steps**:
1. Sign up at betteruptime.com
2. Add monitors:
   - `https://<YOUR_SERVER_DOMAIN>:3000/health` (API Health)
   - `https://admin.directconnectglobal.com` (Dashboard)
   - `https://<YOUR_SERVER_DOMAIN>` (Server)
3. Configure Slack/email alerts

---

## Phase 2: Core Infrastructure (Week 2)

### 2.1 Better Stack (Logging + Alerting)
**Time**: 2-4 hours  
**Cost**: Free tier (1GB/mo) or $25/mo  
**Steps**:
1. Sign up at betterstack.com
2. Create source for DCG logs
3. Install Node.js integration:
   ```bash
   npm install @logtail/node
   ```
4. Update PM2 ecosystem config to forward logs
5. Create alert rules for critical patterns

**Integration Code**:
```javascript
// services/logger.js
const { Logtail } = require("@logtail/node");
const logtail = new Logtail(process.env.LOGTAIL_TOKEN);

module.exports = {
  info: (msg, meta) => logtail.info(msg, meta),
  error: (msg, meta) => logtail.error(msg, meta),
  warn: (msg, meta) => logtail.warn(msg, meta),
};
```

### 2.2 Netdata (Infrastructure Metrics)
**Time**: 1-2 hours  
**Cost**: Free  
**Steps**:
1. Install on server:
   ```bash
   bash <(curl -Ss https://my-netdata.io/kickstart.sh)
   ```
2. Configure Nginx reverse proxy for Netdata dashboard
3. Set up CPU/memory/disk alerts

**Nginx Config**:
```nginx
location /netdata/ {
    proxy_pass http://localhost:19999/;
    proxy_set_header Host $host;
}
```

---

## Phase 3: Security Hardening (Week 3)

### 3.1 CrowdSec + Fail2Ban
**Time**: 2-3 hours  
**Cost**: Free  
**Steps**:
1. Install Fail2Ban:
   ```bash
   apt-get install fail2ban
   cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
   ```
2. Install CrowdSec:
   ```bash
   curl -s https://packagecloud.io/install/repositories/crowdsec/crowdsec/script.deb.sh | sudo bash
   apt-get install crowdsec crowdsec-firewall-bouncer-iptables
   ```
3. Configure SSH and HTTP jails
4. Connect to CrowdSec console for community threat intel

---

## Phase 4: Optimization (Week 4)

### 4.1 SQLite Monitoring
**Time**: 2-3 hours  
**Cost**: Free  
**Steps**:
1. Add health check function to Auto-Healer script
2. Set up database size alerts
3. Implement automatic old bug cleanup

**Script Addition**:
```bash
# Add to dcg_auto_healer.sh
check_database_health() {
    local db_size=$(stat -c%s "$DB_FILE" 2>/dev/null || echo 0)
    local db_size_mb=$((db_size / 1024 / 1024))
    
    if [ $db_size_mb -gt 100 ]; then
        send_alert "Database size warning: ${db_size_mb}MB"
    fi
    
    # Vacuum old entries (keep last 30 days)
    sqlite3 "$DB_FILE" "DELETE FROM bugs WHERE detected_at < datetime('now', '-30 days');"
    sqlite3 "$DB_FILE" "VACUUM;"
}
```

---

## Cost Summary

| Tool | Free Tier | Paid Tier | Recommendation |
|------|-----------|-----------|----------------|
| OpenReplay | Self-hosted (free) | Cloud $39/mo | Self-host |
| Better Stack | 1GB logs/mo | $25/mo | Start free |
| Better Uptime | 3 monitors | $24/mo | Start free |
| Netdata | Unlimited | N/A | Self-host |
| CrowdSec | Unlimited | N/A | Self-host |

**Total Monthly Cost**: $0-88/mo depending on scale

---

## Potential Conflicts

| New Tool | Existing Tool | Conflict? | Resolution |
|----------|---------------|-----------|------------|
| Better Stack | Auto-Healer email alerts | Partial overlap | Keep Auto-Healer for fixes, use Better Stack for alerting |
| Netdata | PM2 monitoring | Minimal | PM2 for app-level, Netdata for server-level |
| CrowdSec | iptables rules | Possible | Review existing firewall rules before install |
| OpenReplay | None | None | Fills new gap |

---

## Success Metrics

After full implementation, measure:
- **MTTR** (Mean Time to Resolution): Target <30 minutes
- **Alert Noise**: <5 false positives/week
- **Uptime**: 99.9% (8.7 hours downtime/year max)
- **Security Incidents**: 0 successful intrusions
- **Frontend Errors**: <1% session error rate

---

## Next Steps

1. ☐ Install OpenReplay npm package and deploy
2. ☐ Sign up for Better Uptime (free tier)
3. ☐ Evaluate Better Stack trial
4. ☐ Schedule server access for Netdata/CrowdSec installation

