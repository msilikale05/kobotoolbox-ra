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

# Docker mounts /etc/hosts as a bind mount — sed -i can't rename it.
# Instead, read-modify-write the contents in place.
TMPFILE=$(mktemp)
cp /etc/hosts "$TMPFILE"

for SUBDOMAIN in kf kc ee; do
  HOST="${SUBDOMAIN}.${PUBLIC_DOMAIN_NAME:-localhost}"
  # Remove 127.0.0.1 entries for this host
  grep -v "^127\.0\.0\.1.*${HOST}" "$TMPFILE" > "${TMPFILE}.new"
  mv "${TMPFILE}.new" "$TMPFILE"
  # Add nginx entry
  echo "${NGINX_IP}	${HOST}" >> "$TMPFILE"
done

# Overwrite /etc/hosts in place (cat > works on Docker bind mounts)
cat "$TMPFILE" > /etc/hosts
rm -f "$TMPFILE"

echo "[fix-hosts] Done. /etc/hosts updated:"
grep -E "kf\.|kc\.|ee\." /etc/hosts
