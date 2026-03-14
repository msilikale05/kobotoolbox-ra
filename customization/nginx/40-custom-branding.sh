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
sub_filter '</head>' '<link rel="stylesheet" href="/custom-static/css/custom-theme.css?v=4" />\n<script src="/custom-static/js/ra-welcome.js?v=2" defer></script>\n</head>';
sub_filter_types text/html;

location /custom-static {
    alias /srv/custom-static;
    expires -1;
    add_header Cache-Control "no-cache, no-store, must-revalidate";
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

# Enketo branding - inject CSS to replace logo
ENKETO_BRANDING_CONF="/etc/nginx/includes/enketo_branding.conf"
cat > "$ENKETO_BRANDING_CONF" << 'NGINX'
sub_filter_once on;
sub_filter '</head>' '<style>.form-header__branding img{max-height:48px!important;width:200px!important;content:url(/custom-static/images/ra-logo-dark.png)!important;}</style>\n</head>';
sub_filter_types text/html;

location /custom-static {
    alias /srv/custom-static;
    expires -1;
    add_header Cache-Control "no-cache, no-store, must-revalidate";
}
NGINX

# Inject 'include' directive into Enketo (ee) server block
sed -i '/server_name.*ee\./,/^}/{
    /location \/ {/i\    include /etc/nginx/includes/enketo_branding.conf;
}' "$NGINX_CONF"

# Fix X-Frame-Options: DENY -> SAMEORIGIN so form preview iframe works
sed -i '/proxy_pass.*kpi/i\        proxy_hide_header X-Frame-Options;\n        add_header X-Frame-Options SAMEORIGIN;' "$NGINX_CONF"

echo "Custom branding applied successfully."
