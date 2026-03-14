#!/bin/sh
# Fix /etc/hosts for *.localhost domains inside Docker containers
# Problem: Docker adds "127.0.0.1 kf.localhost" because .localhost is a
# special TLD, which prevents containers from reaching nginx.
# Solution: Replace 127.0.0.1 entries for our subdomains with the nginx IP.
#
# This script runs as part of the Enketo entrypoint.

NGINX_IP=$(getent hosts nginx 2>/dev/null | awk '{print $1}')
if [ -z "$NGINX_IP" ]; then
  echo "[fix-hosts] Warning: cannot resolve 'nginx', skipping hosts fix"
  exit 0
fi

echo "[fix-hosts] Fixing /etc/hosts: *.localhost -> $NGINX_IP (nginx)"

for SUBDOMAIN in kf kc ee; do
  HOST="${SUBDOMAIN}.${PUBLIC_DOMAIN_NAME:-localhost}"
  # Remove the 127.0.0.1 entry and add the correct one
  sed -i "/^127\.0\.0\.1.*${HOST}$/d" /etc/hosts
  echo "${NGINX_IP}	${HOST}" >> /etc/hosts
done

echo "[fix-hosts] Done. /etc/hosts updated:"
grep -E "kf\.|kc\.|ee\." /etc/hosts
