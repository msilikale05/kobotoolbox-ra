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
sub_filter_once off;
sub_filter 'href="/static/favicon.png"' 'href="/custom-static/images/favicon.png"';
sub_filter 'href="/static/apple-touch-icon.png"' 'href="/custom-static/images/favicon.png"';
sub_filter 'href="/static/safari-pinned-tab.svg" color="#2095f3"' 'href="/custom-static/images/favicon.png" color="#54a8dc"';
sub_filter '<meta name="description" content="KoboToolbox is a free toolkit for collecting and managing data in challenging environments and is the most widely-used tool in humanitarian emergencies">' '<meta name="description" content="Ramani Yangu - Resilience Academy Data Collection Platform for urban resilience research across Tanzania">\n<meta property="og:title" content="Ramani Yangu - Data Collection">\n<meta property="og:description" content="Resilience Academy Data Collection Platform for urban resilience research across Tanzania">\n<meta property="og:image" content="https://kf.ramaniyangu.com/custom-static/images/ra-logo-dark.png">\n<meta property="og:type" content="website">\n<meta property="og:url" content="https://kf.ramaniyangu.com">\n<meta name="twitter:card" content="summary">\n<meta name="twitter:title" content="Ramani Yangu - Data Collection">\n<meta name="twitter:image" content="https://kf.ramaniyangu.com/custom-static/images/ra-logo-dark.png">';
sub_filter '</head>' '<link rel="stylesheet" href="/custom-static/css/custom-theme.css?v=4" />\n<script src="/custom-static/js/ra-welcome.js?v=2" defer></script>\n<script src="/custom-static/js/ra-submission-badge.js?v=6" defer></script>\n</head>';
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

# Enketo branding - inject CSS + JS to replace logo permanently
ENKETO_BRANDING_CONF="/etc/nginx/includes/enketo_branding.conf"
cat > "$ENKETO_BRANDING_CONF" << 'NGINX'
sub_filter_once off;
sub_filter 'href="/x/images/favicon.ico"' 'href="/custom-static/images/favicon.png"';
sub_filter 'href="/x/images/icon_180x180.png"' 'href="/custom-static/images/favicon.png"';
sub_filter 'href="/images/favicon.ico"' 'href="/custom-static/images/favicon.png"';
sub_filter 'href="/images/icon_180x180.png"' 'href="/custom-static/images/favicon.png"';
sub_filter '<title>Enketo Express for KoboToolbox</title>' '<title>Ramani Yangu - Data Collection Form</title>\n<meta property="og:title" content="Ramani Yangu - Data Collection Form">\n<meta property="og:description" content="Resilience Academy Data Collection Platform">\n<meta property="og:image" content="https://kf.ramaniyangu.com/custom-static/images/ra-logo-dark.png">\n<meta property="og:type" content="website">\n<meta name="twitter:card" content="summary">\n<meta name="twitter:image" content="https://kf.ramaniyangu.com/custom-static/images/ra-logo-dark.png">';
sub_filter '</head>' '<style>.form-header__branding img[alt="brand logo"],.form-header__branding img[src^="data:image/svg"]{content:url(/custom-static/images/ra-logo-dark.png)!important}.enketo-power img[alt="Enketo logo"]{content:url(/custom-static/images/ra-logo-dark.png)!important}</style><script>(function(){function fix(){var done=document.querySelector(".ra-link-done");if(done)return;var w=document.querySelector(".form-header__branding .logo-wrapper");if(w&&w.tagName!=="A"){var a=document.createElement("a");a.href="https://resilienceacademy.ac.tz";a.target="_blank";a.rel="noopener";a.className="ra-link-done";w.parentNode.insertBefore(a,w);a.appendChild(w)}}document.addEventListener("DOMContentLoaded",function(){fix();setTimeout(fix,2000);setTimeout(fix,5000)})})()</script>\n<link rel="stylesheet" href="/custom-static/css/enketo-branding.css?v=6" />\n<script src="/custom-static/js/ra-enketo-branding.js?v=4" defer></script>\n</head>';
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

# Fix X-Frame-Options: DENY so form preview iframe works.
# The preview embeds ee.domain inside kf.domain (cross-origin), so we must
# strip X-Frame-Options entirely from all upstream responses.
# - uwsgi_hide_header: for KPI/KoboCAT (served via uwsgi)
# - proxy_hide_header: for Enketo (served via proxy_pass)
sed -i '/include.*proxy_pass\.conf/i\        uwsgi_hide_header X-Frame-Options;' "$NGINX_CONF"
sed -i '/proxy_pass.*enketo_express/i\        proxy_hide_header X-Frame-Options;' "$NGINX_CONF"

echo "Custom branding applied successfully."
