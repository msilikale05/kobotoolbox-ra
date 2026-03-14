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

# Enketo branding - inject CSS + JS to replace logo permanently
ENKETO_BRANDING_CONF="/etc/nginx/includes/enketo_branding.conf"
cat > "$ENKETO_BRANDING_CONF" << 'NGINX'
sub_filter_once off;
sub_filter 'href="/x/images/favicon.ico"' 'href="/custom-static/images/favicon.png"';
sub_filter 'href="/x/images/icon_180x180.png"' 'href="/custom-static/images/favicon.png"';
sub_filter '</head>' '<style>.form-header__branding .logo-wrapper{cursor:pointer}.form-header__branding img[alt="brand logo"],.form-header__branding img[src^="data:image/svg"]{content:url(/custom-static/images/ra-logo-dark.png)!important;visibility:visible!important}.enketo-power img[alt="Enketo logo"]{content:url(/custom-static/images/ra-logo-dark.png)!important}</style><script>(function(){var RA_LOGO="/custom-static/images/ra-logo-dark.png";var RA_URL="https://resilienceacademy.ac.tz";function fix(){document.querySelectorAll("img").forEach(function(img){if((img.alt==="brand logo"||img.alt==="Ramani Yangu"||(img.src&&img.src.indexOf("data:image/svg+xml")===0))&&img.closest(".form-header__branding")){img.src=RA_LOGO;img.alt="Ramani Yangu";img.removeAttribute("data-original");var wrapper=img.closest(".logo-wrapper");if(wrapper&&wrapper.tagName!=="A"){var link=document.createElement("a");link.href=RA_URL;link.target="_blank";link.rel="noopener";wrapper.parentNode.insertBefore(link,wrapper);link.appendChild(wrapper)}}});document.querySelectorAll("img[alt=\\"Enketo logo\\"]").forEach(function(img){img.src=RA_LOGO;img.alt="Ramani Yangu"})}var obs=new MutationObserver(fix);document.addEventListener("DOMContentLoaded",function(){fix();obs.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:["src"]})});setTimeout(fix,1000);setTimeout(fix,3000);setTimeout(fix,5000);setInterval(fix,2000)})()</script>\n</head>';
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
