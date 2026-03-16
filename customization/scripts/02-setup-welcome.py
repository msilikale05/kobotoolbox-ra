#!/usr/bin/env python3
"""
F1: Welcome Dashboard - SitewideMessage Setup
==============================================
Creates a SitewideMessage in the KPI database to display a
welcome/announcement banner for all users.

Run inside the KPI container:
  docker exec -it kobo-docker-kpi-1 python /srv/scripts/02-setup-welcome.py

UPDATE-PROOF: Writes to database, not files.
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kobo.settings.base')
sys.path.insert(0, '/srv/src/kpi')

django.setup()

WELCOME_SLUG = 'ra-welcome-message'

WELCOME_BODY = """
<div style="background: linear-gradient(135deg, #1a2a3a, #54a8dc); color: #fff; padding: 16px 24px; border-radius: 6px; margin-bottom: 12px;">
  <strong style="font-size: 15px;">Welcome to Resilience Academy Data Collection</strong>
  <p style="margin: 8px 0 0; font-size: 13px; opacity: 0.9;">
    Use this platform to create surveys, collect field data, and analyze results for urban resilience research across Tanzania.
    Need help? Contact <a href="mailto:info@ramaniyangu.com" style="color: #fff; text-decoration: underline;">info@ramaniyangu.com</a>
  </p>
</div>
"""

def setup_welcome_message():
    """Create or update the sitewide welcome message."""
    try:
        from hub.models import SitewideMessage
    except ImportError:
        print("[WARN] SitewideMessage model not found. Skipping.")
        print("       The JS-based welcome panel (ra-welcome.js) will still work.")
        return

    msg, created = SitewideMessage.objects.update_or_create(
        slug=WELCOME_SLUG,
        defaults={
            'body': WELCOME_BODY.strip(),
        }
    )

    action = 'Created' if created else 'Updated'
    print(f"[OK] {action} SitewideMessage: {WELCOME_SLUG}")


def setup_site_name():
    """Update Django Site name to Resilience Academy."""
    try:
        from django.contrib.sites.models import Site
        site = Site.objects.get_current()
        site.name = 'Resilience Academy Data Collection'
        site.save()
        print(f"[OK] Site name set to: {site.name}")
    except (ImportError, RuntimeError):
        print("[SKIP] django.contrib.sites not available in this KPI version")


if __name__ == '__main__':
    print("=" * 60)
    print("Resilience Academy - Welcome Dashboard Setup")
    print("=" * 60)
    setup_welcome_message()
    setup_site_name()
    print("\nDone.")
