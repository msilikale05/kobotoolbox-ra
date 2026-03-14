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

# Enketo branding - inject JS to replace logo + disable gzip so sub_filter works
ENKETO_BRANDING_CONF="/etc/nginx/includes/enketo_branding.conf"
cat > "$ENKETO_BRANDING_CONF" << 'NGINX'
sub_filter_once on;
sub_filter '</head>' '<script>document.addEventListener("DOMContentLoaded",function(){function r(){document.querySelectorAll("img").forEach(function(i){if(i.src&&(i.src.indexOf("data:image/svg")>-1||i.alt.toLowerCase().indexOf("logo")>-1||i.alt.toLowerCase().indexOf("brand")>-1)){i.src="/custom-static/images/ra-logo-dark.png";i.alt="Ramani Yangu";}});};r();new MutationObserver(function(){r()}).observe(document.body,{childList:true,subtree:true});setTimeout(function(){r()},3000);});</script>\n</head>';
sub_filter_types text/html;

location /custom-static {
    alias /srv/custom-static;
    expires -1;
    add_header Cache-Control "no-cache, no-store, must-revalidate";
}
NGINX

# Inject 'include' into Enketo (ee) server block AND disable gzip from upstream
sed -i '/server_name.*ee\./,/^}/{
    /location \/ {/i\    include /etc/nginx/includes/enketo_branding.conf;
}' "$NGINX_CONF"

# Disable gzip from Enketo upstream so sub_filter can work
# Also set Host header so Enketo generates public URLs (not internal docker hostname)
sed -i '/proxy_pass.*enketo_express/i\        proxy_set_header Accept-Encoding "";\n        proxy_set_header Host ee.'"${PUBLIC_DOMAIN_NAME:-ramaniyangu.com}"';' "$NGINX_CONF"

# Fix X-Frame-Options: DENY -> SAMEORIGIN so form preview iframe works
sed -i '/proxy_pass.*kpi/i\        proxy_hide_header X-Frame-Options;\n        add_header X-Frame-Options SAMEORIGIN;' "$NGINX_CONF"

echo "Custom branding applied successfully."
