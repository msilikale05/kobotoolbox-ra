# Deploying RA Customizations to a KoboToolbox Server

Complete guide for deploying the Resilience Academy customization layer
onto a fresh or existing KoboToolbox server behind a **reverse proxy with SSL**.

## Prerequisites

Before starting, ensure you have:

- SSH root access to the server
- A reverse proxy (nginx) handling SSL on port 443
- SSL certificate covering **all three subdomains**: `kf.DOMAIN`, `kc.DOMAIN`, `ee.DOMAIN`
- DNS A records for `kf.DOMAIN`, `kc.DOMAIN`, `ee.DOMAIN` pointing to the server
- Git access to this repo (private — needs a GitHub personal access token)

## Step 1: Check Firewall

Ports 80 and 443 must be open. Without this, the site won't load at all.

```bash
ufw allow 80/tcp
ufw allow 443/tcp
ufw status
```

## Step 2: Check Docker Compose Version

KoboToolbox v2.025.14+ requires Docker Compose v2.20+.

```bash
docker compose version
```

If below v2.20, upgrade:

```bash
mkdir -p /root/.docker/cli-plugins
wget -O /root/.docker/cli-plugins/docker-compose \
  "https://github.com/docker/compose/releases/download/v2.32.4/docker-compose-linux-x86_64"
chmod +x /root/.docker/cli-plugins/docker-compose
docker compose version   # Should show v2.32.4
```

## Step 3: Install KoboToolbox (if not already installed)

If KoboToolbox is not yet installed:

```bash
mkdir -p /opt/kb && cd /opt/kb
git clone https://github.com/kobotoolbox/kobo-install.git
cd kobo-install
git checkout 2.025.14   # or latest stable tag
python3 run.py --setup
```

During setup:
- Choose **"No - Use my own reverse-proxy/load-balancer"** for HTTPS
- This sets the internal port to **8080**
- Set your domain (e.g., `ramaniyangu.com`)
- Set subdomains: `kf`, `kc`, `ee`
- Leave SMTP blank if you don't have one (see Step 6 note)
- Choose **No** for backups (configure later)

## Step 4: Configure the Reverse Proxy (CRITICAL)

This step prevents three common issues:
- Form preview showing "refused to connect"
- HTTPS redirect loops
- Blank pages after login

Edit your outer nginx SSL config (e.g., `/etc/nginx/nginx.conf`):

```nginx
server {
    listen 443 ssl;
    server_name your-server-hostname;

    ssl_certificate     /path/to/cert-chain.pem;
    ssl_certificate_key /path/to/cert.key;

    # Allow large file uploads (form attachments)
    client_max_body_size 100M;

    location / {
        # MUST use 127.0.0.1, NOT a hostname like odk-02.utu.fi
        # (hostnames may resolve to 127.0.1.1 which breaks Docker DNS)
        proxy_pass http://127.0.0.1:8080;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        # MUST be hardcoded to "https", NOT $scheme
        # ($scheme = "http" because the proxy-to-Docker hop is HTTP,
        # causing an infinite redirect loop)
        proxy_set_header X-Forwarded-Proto https;

        # MUST remove X-Frame-Options entirely
        # Form preview embeds ee.domain inside kf.domain (cross-origin iframe).
        # Any X-Frame-Options header (DENY or SAMEORIGIN) blocks this.
        proxy_hide_header X-Frame-Options;
    }
}
```

Test and apply:

```bash
nginx -t && systemctl restart nginx
```

**Verify it works:**

```bash
curl -sI https://kf.YOUR_DOMAIN | grep -i "frame\|HTTP"
# Should show HTTP/1.1 200 and NO X-Frame-Options header
```

## Step 5: Clone this Repo

```bash
cd /opt/kb/
git clone -b msili-dev \
  https://YOUR_GITHUB_TOKEN@github.com/msilikale05/kobotoolbox-ra.git \
  basic-kobotoolbox
```

Directory structure should be:
```
/opt/kb/
├── basic-kobotoolbox/    <-- this repo (customizations)
├── kobo-docker/          <-- KoboToolbox containers
├── kobo-env/             <-- environment files
└── kobo-install/         <-- installer (run.py)
```

## Step 6: Deploy the Custom Compose File

```bash
cd /opt/kb

# Copy the template
cp basic-kobotoolbox/docker-compose.frontend.custom.yml \
   kobo-docker/docker-compose.frontend.custom.yml

# Replace YOUR_DOMAIN with your actual domain
# Example: ramaniyangu.com, odk.utu.fi, etc.
sed -i 's/YOUR_DOMAIN/ramaniyangu.com/g' \
   kobo-docker/docker-compose.frontend.custom.yml

# Verify — should return nothing (all placeholders replaced)
grep "YOUR_DOMAIN" kobo-docker/docker-compose.frontend.custom.yml
```

**If you have NO SMTP server configured**, edit the file and uncomment the
`EMAIL_BACKEND` line. Without this, login will hang indefinitely:

```bash
nano kobo-docker/docker-compose.frontend.custom.yml
# Uncomment: - EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```

## Step 7: Enable Custom Compose and Start

```bash
# Enable the custom compose file
nano /opt/kb/kobo-install/.run.conf
# Set: "use_frontend_custom_yml": true

# Start KoboToolbox
cd /opt/kb/kobo-install
python3 run.py --stop
python3 run.py
```

Wait for the "Ready" message with the URL and credentials.

## Step 8: Create Superuser and Verify Email

```bash
# Find your KPI container name
docker ps | grep kpi
# Look for the one with "/bin/bash docker/en..." (not worker/beat)
# Example: kobofe-kpi-1

# Create superuser
docker exec -it kobofe-kpi-1 python manage.py createsuperuser

# Bypass email verification for the superuser
echo 'from allauth.account.models import EmailAddress' > /tmp/verify.py
echo 'for e in EmailAddress.objects.all():' >> /tmp/verify.py
echo '    e.verified = True' >> /tmp/verify.py
echo '    e.save()' >> /tmp/verify.py
echo '    print("Verified:", e.email)' >> /tmp/verify.py
docker cp /tmp/verify.py kobofe-kpi-1:/tmp/verify.py
docker exec kobofe-kpi-1 bash -c "cd /srv/src/kpi && python manage.py shell < /tmp/verify.py"
```

## Step 9: Run Setup Scripts

```bash
# Close registration (admin adds users manually)
docker exec -it kobofe-kpi-1 python /srv/scripts/01-setup-constance.py

# Set up welcome dashboard message
docker exec -it kobofe-kpi-1 python /srv/scripts/02-setup-welcome.py

# Import survey templates (add .xlsx files to customization/templates/ first)
docker exec -it kobofe-kpi-1 python /srv/scripts/03-import-templates.py
```

## Step 10: Verify Everything Works

Test each of these:

| Test | URL | Expected |
|------|-----|----------|
| Login page | `https://kf.YOUR_DOMAIN/accounts/login/` | RA-branded login |
| Main dashboard | `https://kf.YOUR_DOMAIN/` | Project list after login |
| Form preview | Create a form > Preview | Form loads in iframe |
| Collect data link | Deploy a form > Copy link | `https://ee.YOUR_DOMAIN/x/...` |
| Enketo direct | `https://ee.YOUR_DOMAIN/` | "Enketo Express is running" |
| KoboCAT | `https://kc.YOUR_DOMAIN/` | Redirects to kf |

If form preview shows "refused to connect", revisit Step 4 (nginx config).
If collect data link shows `http://ee.domain.internal/...`, revisit Step 6 (ENKETO_URL).

## Updating Customizations

After making changes locally:

```bash
# Local machine
git add -A && git commit -m "description"
git push myfork msili-dev

# Server
cd /opt/kb/basic-kobotoolbox && git pull
cp docker-compose.frontend.custom.yml ../kobo-docker/
sed -i 's/YOUR_DOMAIN/ramaniyangu.com/g' ../kobo-docker/docker-compose.frontend.custom.yml
cd /opt/kb/kobo-install
python3 run.py --stop && python3 run.py
```

## Troubleshooting

### Form preview: "ee.domain refused to connect"

**Cause:** `X-Frame-Options` header blocks the cross-origin iframe.
The form preview embeds Enketo (`ee.domain`) inside KPI (`kf.domain`).

**Fix:** In the outer nginx config, add `proxy_hide_header X-Frame-Options;`
and do NOT add any `X-Frame-Options` or `add_header` directive back.
See Step 4 above.

### Form collect links show internal URL (http://ee.domain.internal/x/...)

**Cause:** `ENKETO_URL` is set to the internal Docker URL instead of
the public HTTPS URL. Enketo generates links based on how KPI calls it.

**Fix:** Ensure `docker-compose.frontend.custom.yml` has:
```yaml
kpi:
  environment:
    - ENKETO_URL=https://ee.YOUR_DOMAIN
  extra_hosts:
    - "ee.YOUR_DOMAIN:host-gateway"
```
After changing, you must **recreate** (not just restart) the container
and flush the Enketo Redis cache:
```bash
cd /opt/kb/kobo-install && python3 run.py --stop && python3 run.py
# Then flush cached URLs:
docker exec REDIS_CACHE redis-cli -p 6380 -a REDIS_PASSWORD FLUSHALL
```

### Form preview: "Could not connect with Form Server"

**Cause:** Enketo inside Docker cannot reach `kf.YOUR_DOMAIN` because
the hostname resolves to `127.0.1.1` (the server's loopback) inside
the container, and port 443 isn't available there.

**Fix:** Add `extra_hosts` to the `enketo_express` service in the
custom compose file:
```yaml
enketo_express:
  extra_hosts:
    - "kf.YOUR_DOMAIN:host-gateway"
    - "kc.YOUR_DOMAIN:host-gateway"
    - "ee.YOUR_DOMAIN:host-gateway"
```
This routes the hostname to the Docker host where nginx listens on 443.

### Login hangs (page loads forever, then timeout)

**Cause:** No SMTP server is configured. `EMAIL_BACKEND` defaults to
SMTP, and KPI tries to send email on login (audit log, verification).
The connection to non-existent SMTP hangs forever.

**Fix:** Add to the custom compose under `kpi.environment`:
```yaml
- EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```
Remove this line once a real SMTP server is configured.

### HTTPS redirect loop (site keeps redirecting)

**Cause:** The reverse proxy sends `X-Forwarded-Proto: $scheme` which
equals `http` (the proxy-to-Docker connection is HTTP), so KoboToolbox
keeps redirecting to HTTPS.

**Fix:** Hardcode the header in the outer nginx:
```nginx
proxy_set_header X-Forwarded-Proto https;
```

### 500 error after login (Server Error)

**Cause:** The `/environment/` endpoint crashes. Most commonly because
`PROJECT_METADATA_FIELDS` was set incorrectly in Constance config.

**Fix:**
```bash
docker exec POSTGRES_CONTAINER psql -U kobo koboform \
  -c "DELETE FROM constance_constance WHERE key='PROJECT_METADATA_FIELDS';"
# Flush cache
docker exec REDIS_CACHE redis-cli -p 6380 -a REDIS_PASSWORD FLUSHALL
docker restart KPI_CONTAINER
```

### "Confirm your email" page after login

**Cause:** The user's email address is not verified in allauth.

**Fix:** Run the email verification script from Step 8 above.

### Database migration errors (upgrading versions)

When upgrading across multiple KoboToolbox versions:

**InconsistentMigrationHistory (guardian):**
```bash
docker exec POSTGRES psql -U kobo koboform -c \
  "INSERT INTO django_migrations (app, name, applied) VALUES ('guardian', '0001_initial', NOW());"
docker exec POSTGRES psql -U kobo koboform -c \
  "INSERT INTO django_migrations (app, name, applied) VALUES ('guardian', '0002_generic_permissions_index', NOW());"
```

**"relation already exists" (mfa):**
```bash
docker exec POSTGRES psql -U kobo koboform -c \
  "DROP TABLE IF EXISTS mfa_mfaavailabletouser, mfa_kobomfamethod CASCADE;"
docker exec POSTGRES psql -U kobo koboform -c \
  "DELETE FROM django_migrations WHERE app='mfa';"
# Then: python manage.py migrate mfa
```

**project_ownership table missing:**
```bash
# Run inside KPI container:
python manage.py migrate project_ownership
python manage.py migrate
```
