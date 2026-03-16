#!/bin/bash
set -e

# Dashboard Public Sharing - Nginx Routes
# =========================================
# Serves the public dashboard HTML page for shared/embed URLs.
# Separate from 40-custom-branding.sh to minimize risk to the main site.
# If this script fails, only sharing breaks — the rest of the site works.

NGINX_CONF="/etc/nginx/conf.d/default.conf"
SHARING_CONF="/etc/nginx/includes/dashboard_sharing.conf"

echo "Configuring dashboard sharing routes..."

cat > "$SHARING_CONF" << 'NGINX'
# Public dashboard view (no login required)
location ~ ^/dashboard/(public|embed)/[a-f0-9]+ {
    alias /srv/custom-static/dashboard-public.html;
    default_type text/html;
    add_header Cache-Control "no-cache, no-store, must-revalidate";
    add_header X-Frame-Options "";
}
NGINX

# Inject into KPI (kf) server block
sed -i '/server_name.*kf\./,/^}/{
    /location \/static {/i\    include /etc/nginx/includes/dashboard_sharing.conf;
}' "$NGINX_CONF"

echo "Dashboard sharing routes configured."

# Offline status page for field teams
STATUS_CONF="/etc/nginx/includes/status_page.conf"
cat > "$STATUS_CONF" << 'NGINX2'
location = /status {
    alias /srv/custom-static/status.html;
    default_type text/html;
    add_header Cache-Control "no-cache";
}
NGINX2

sed -i '/server_name.*kf\./,/^}/{
    /location \/static {/i\    include /etc/nginx/includes/status_page.conf;
}' "$NGINX_CONF"

echo "Status page route configured."
