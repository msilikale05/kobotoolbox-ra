#!/usr/bin/env python3
"""
F10: Enable Open Registration with Admin Approval Workflow
============================================================
Enables open registration in KoboToolbox via Constance config.
New users can sign up, but are deactivated by the webhook-relay
background scheduler until an admin approves them.

Run inside the KPI container:
  docker exec -it kobo-docker-kpi-1 python /srv/scripts/07-enable-registration.py

UPDATE-PROOF: Writes to database (constance_config table), not files.
"""
import os
import sys
import django

# Bootstrap Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kobo.settings.base')
sys.path.insert(0, '/srv/src/kpi')

django.setup()

from constance import config


def enable_registration():
    """Enable open registration so new users can sign up."""
    try:
        config.REGISTRATION_OPEN = True
        print("[OK] REGISTRATION_OPEN = True")
    except AttributeError:
        print("[WARN] REGISTRATION_OPEN not available in this KPI version.")

    # Remove domain restrictions so any email can register
    try:
        config.REGISTRATION_ALLOWED_EMAIL_DOMAINS = ''
        print("[OK] REGISTRATION_ALLOWED_EMAIL_DOMAINS cleared (any email allowed)")
    except AttributeError:
        print("[SKIP] REGISTRATION_ALLOWED_EMAIL_DOMAINS not available")


def ensure_superusers_active():
    """Make sure all superusers remain active (safety check)."""
    from django.contrib.auth import get_user_model
    User = get_user_model()
    superusers = User.objects.filter(is_superuser=True, is_active=False)
    for u in superusers:
        u.is_active = True
        u.save(update_fields=['is_active'])
        print(f"[FIX] Re-activated superuser: {u.username}")

    if not superusers.exists():
        print("[OK] All superusers are active")


if __name__ == '__main__':
    print("=" * 60)
    print("Resilience Academy - Enable Registration with Admin Approval")
    print("=" * 60)
    enable_registration()
    ensure_superusers_active()
    print()
    print("Registration is now open. New users will be deactivated by the")
    print("webhook-relay background scheduler until approved by an admin.")
    print()
    print("Admin approval workflow:")
    print("  1. User signs up at /accounts/signup/")
    print("  2. Webhook-relay detects new user, sets is_active=False")
    print("  3. Admin receives email notification")
    print("  4. Admin approves via User Management or webhook-relay API")
    print("  5. User can then log in")
    print()
    print("Done.")
