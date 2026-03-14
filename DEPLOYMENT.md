# Deploying RA Customizations to a KoboToolbox Server

This guide covers deploying the Resilience Academy customization layer
onto an existing KoboToolbox server that uses a **reverse proxy with SSL**
(not Let's Encrypt managed by KoboToolbox).

## Prerequisites

- A running KoboToolbox instance (v2.025.14+) installed via `kobo-install`
- SSH root access to the server
- A reverse proxy (nginx) handling SSL termination on port 443
- SSL certificate covering: `kf.DOMAIN`, `kc.DOMAIN`, `ee.DOMAIN`
- DNS records for `kf.DOMAIN`, `kc.DOMAIN`, `ee.DOMAIN` pointing to the server
- Docker Compose v2.20+ (`docker compose version`)
- Git access to this repo (private — requires GitHub token or SSH key)

## Step 1: Firewall

Ensure ports 80 and 443 are open:

```bash
ufw allow 80/tcp
ufw allow 443/tcp
ufw status
```

## Step 2: Docker Compose Version

KoboToolbox v2.025.14+ requires Docker Compose v2.20+. Check:

```bash
docker compose version
```

If too old, update:

```bash
wget -O /tmp/dc "https://github.com/docker/compose/releases/download/v2.32.4/docker-compose-linux-x86_64"
cp /tmp/dc /root/.docker/cli-plugins/docker-compose
chmod +x /root/.docker/cli-plugins/docker-compose
docker compose version
```

## Step 3: Clone this repo

```bash
cd /opt/kb/   # or wherever kobo-docker lives
git clone -b msili-dev https://YOUR_TOKEN@github.com/msilikale05/kobotoolbox-ra.git basic-kobotoolbox
```

The directory structure must be:
```
/opt/kb/
├── basic-kobotoolbox/    <-- this repo
├── kobo-docker/
├── kobo-env/
└── kobo-install/
```

## Step 4: Configure the custom Docker Compose file

1. Copy the template:
   ```bash
   cp basic-kobotoolbox/docker-compose.frontend.custom.yml kobo-docker/docker-compose.frontend.custom.yml
   ```

2. Replace `YOUR_DOMAIN` with your actual domain in the copied file:
   ```bash
   sed -i 's/YOUR_DOMAIN/odk.utu.fi/g' kobo-docker/docker-compose.frontend.custom.yml
   ```

3. Verify the replacements:
   ```bash
   grep "YOUR_DOMAIN" kobo-docker/docker-compose.frontend.custom.yml
   # Should return nothing — all replaced
   ```

## Step 5: Enable custom compose in kobo-install

```bash
nano /opt/kb/kobo-install/.run.conf
```

Set `"use_frontend_custom_yml": true`.

## Step 6: Configure the reverse proxy (outer nginx)

If your server uses a separate nginx for SSL termination (not managed by
KoboToolbox), configure it as follows. This is **critical** for form
preview and data collection to work.

Edit `/etc/nginx/nginx.conf` (or wherever your SSL server block is):

```nginx
server {
    listen 443 ssl;
    server_name your-server.example.com;

    ssl_certificate     /path/to/cert-chain.pem;
    ssl_certificate_key /path/to/cert.key;

    client_max_body_size 100M;

    location / {
        # Proxy to Docker nginx (KoboToolbox uses port 8080 with reverse proxy)
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        # MUST be hardcoded to "https" — not $scheme
        proxy_set_header X-Forwarded-Proto https;
        # Remove X-Frame-Options so Enketo form preview works in iframe
        # (kf.domain embeds ee.domain which is cross-origin)
        proxy_hide_header X-Frame-Options;
    }
}
```

Key points:
- **`proxy_pass` must use `127.0.0.1:8080`** (not a hostname that resolves
  to 127.0.1.1, which breaks Docker container DNS)
- **`X-Forwarded-Proto` must be hardcoded to `https`** (using `$scheme`
  causes redirect loops because the proxy-to-Docker hop is HTTP)
- **Do NOT add `X-Frame-Options`** — Django sends its own, and the form
  preview needs Enketo (ee.domain) to be embeddable from KPI (kf.domain)

Test and reload:
```bash
nginx -t && systemctl restart nginx
```

## Step 7: Run KoboToolbox setup

```bash
cd /opt/kb/kobo-install
python3 run.py --setup
```

During setup:
- Choose **"No - Use my own reverse-proxy/load-balancer"** for HTTPS
- Internal port will be set to **8080**
- Keep all other existing settings

## Step 8: Verify email verification is bypassed for superuser

After creating a superuser (`python manage.py createsuperuser`), you may
need to verify the email address manually:

```bash
# Find the KPI container name
docker ps | grep kpi

# Verify all emails (replace CONTAINER with actual name)
echo 'from allauth.account.models import EmailAddress' > /tmp/fix.py
echo 'for e in EmailAddress.objects.all():' >> /tmp/fix.py
echo '    e.verified = True' >> /tmp/fix.py
echo '    e.save()' >> /tmp/fix.py
echo '    print("Verified:", e.email)' >> /tmp/fix.py
docker cp /tmp/fix.py CONTAINER:/tmp/fix.py
docker exec CONTAINER bash -c "cd /srv/src/kpi && python manage.py shell < /tmp/fix.py"
```

## Step 9: Run setup scripts

```bash
# Replace CONTAINER with actual KPI container name (e.g., kobofe-kpi-1)

# F3: Restrict self-registration to allowed email domains
docker exec -it CONTAINER python /srv/scripts/01-setup-constance.py

# F1: Welcome dashboard message
docker exec -it CONTAINER python /srv/scripts/02-setup-welcome.py

# F2: Import survey templates (add .xlsx files to customization/templates/ first)
docker exec -it CONTAINER python /srv/scripts/03-import-templates.py
```

## Troubleshooting

### "refused to connect" in form preview iframe

**Cause:** The reverse proxy adds `X-Frame-Options` header, blocking
cross-origin iframe (kf.domain embedding ee.domain).

**Fix:** Remove `X-Frame-Options` from the reverse proxy config.
Use `proxy_hide_header X-Frame-Options;` without adding it back.

### Form collect links show internal URL (http://ee.domain.internal/x/...)

**Cause:** `ENKETO_URL` environment variable is set to the internal URL
instead of the public HTTPS URL.

**Fix:** In `docker-compose.frontend.custom.yml`, ensure:
```yaml
kpi:
  environment:
    - ENKETO_URL=https://ee.YOUR_DOMAIN
```
Then recreate the KPI container (not just restart):
```bash
docker compose ... up -d --force-recreate kpi
```

### 500 error on /environment/ endpoint after login

**Cause:** The `PROJECT_METADATA_FIELDS` constance setting was set as a
JSON string of plain strings, but KPI expects each field to be a dict
with a `label` key.

**Fix:** Delete the bad setting:
```bash
docker exec POSTGRES_CONTAINER psql -U kobo koboform -c \
  "DELETE FROM constance_config WHERE key='PROJECT_METADATA_FIELDS';"
docker restart KPI_CONTAINER
```

### Login hangs indefinitely (HARAKIRI timeout)

**Cause:** `EMAIL_BACKEND` defaults to SMTP but `EMAIL_HOST` is empty.
When KPI tries to send any email (login signal, verification), it hangs
trying to connect to a non-existent SMTP server on port 25.

**Fix:** Either configure SMTP during `run.py --setup`, or add to the
custom compose file under `kpi.environment`:
```yaml
- EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```
This logs emails to the console instead of sending them. Remove this
line once SMTP is properly configured.

### HTTPS redirect loop (301 to same URL)

**Cause:** The reverse proxy sends `X-Forwarded-Proto: $scheme` which
evaluates to `http` (the proxy-to-Docker hop), so Docker nginx
keeps redirecting to HTTPS.

**Fix:** Hardcode the header: `proxy_set_header X-Forwarded-Proto https;`

### Containers can't reach public URLs (ee.domain, kf.domain)

**Cause:** Inside Docker, the public hostname resolves to `127.0.1.1`
(server's /etc/hosts for its own hostname), and port 443 isn't
available inside the container.

**Fix:** Use `extra_hosts` with `host-gateway` in the custom compose file.
This makes the container resolve public hostnames to the Docker host IP,
where the reverse proxy listens on 443.

### Database migration errors during upgrade

When upgrading across multiple versions (e.g., 2.023 to 2.025):

- **InconsistentMigrationHistory (guardian):**
  ```bash
  docker exec POSTGRES psql -U kobo koboform -c \
    "INSERT INTO django_migrations (app, name, applied) VALUES ('guardian', '0001_initial', NOW());"
  docker exec POSTGRES psql -U kobo koboform -c \
    "INSERT INTO django_migrations (app, name, applied) VALUES ('guardian', '0002_generic_permissions_index', NOW());"
  ```

- **"relation already exists" (mfa):**
  ```bash
  docker exec POSTGRES psql -U kobo koboform -c \
    "DROP TABLE IF EXISTS mfa_mfaavailabletouser, mfa_kobomfamethod CASCADE;"
  docker exec POSTGRES psql -U kobo koboform -c \
    "DELETE FROM django_migrations WHERE app='mfa';"
  # Then re-run: python manage.py migrate mfa
  ```

- **project_ownership table missing:**
  ```bash
  # Run: python manage.py migrate project_ownership
  # Then: python manage.py migrate
  ```

## Updating Customizations

After making changes locally:

```bash
# Local
git add -A && git commit -m "description" && git push myfork msili-dev

# Server
cd /opt/kb/basic-kobotoolbox && git pull
cp docker-compose.frontend.custom.yml ../kobo-docker/
sed -i 's/YOUR_DOMAIN/odk.utu.fi/g' ../kobo-docker/docker-compose.frontend.custom.yml
cd /opt/kb/kobo-install
python3 run.py --stop && python3 run.py
```
