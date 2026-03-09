#!/bin/bash
set -e

# Custom Branding Injection Script
# =================================
# This script runs AFTER the default KoboToolbox nginx config is generated (30-*).
# It patches the nginx config to:
#   1. Serve custom static files from /srv/custom-static/
#   2. Inject a custom CSS <link> tag into all HTML responses via sub_filter

NGINX_CONF="/etc/nginx/conf.d/default.conf"
BRANDING_CONF="/etc/nginx/includes/custom_branding.conf"

echo "Applying custom branding to nginx configuration..."

# Write the custom branding nginx include file
cat > "$BRANDING_CONF" << 'NGINX'
sub_filter_once on;
sub_filter '</head>' '<link rel="stylesheet" href="/custom-static/css/custom-theme.css" />\n</head>';
sub_filter_types text/html;

location /custom-static {
    alias /srv/custom-static;
    expires 7d;
    add_header Cache-Control "public, immutable";
}
NGINX

# Inject 'include' directive into KPI (kf) server block, before 'location /static'
sed -i '/server_name.*kf\./,/^}/{
    /location \/static {/i\    include /etc/nginx/includes/custom_branding.conf;
}' "$NGINX_CONF"

# Inject 'include' directive into KoboCAT (kc) server block, before 'location /static'
sed -i '/server_name.*kc\./,/^}/{
    /location \/static {/i\    include /etc/nginx/includes/custom_branding.conf;
}' "$NGINX_CONF"

echo "Custom branding applied successfully."
