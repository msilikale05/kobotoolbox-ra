#!/usr/bin/env python3
"""
F3: Email Registration Restriction via Constance Config
========================================================
Configures KoboToolbox to restrict new account registration to
approved email domains (Resilience Academy).

Run inside the KPI container:
  docker exec -it kobo-docker-kpi-1 python /srv/scripts/01-setup-constance.py

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

# Restrict registration to these email domains
ALLOWED_DOMAINS = [
    'resilienceacademy.ac.tz',
    'udsm.ac.tz',
    'aru.ac.tz',
    'ardhi.ac.tz',
    'sua.ac.tz',
]

def setup_registration_restriction():
    """Configure email domain restriction for new registrations."""
    domain_list = ' '.join(ALLOWED_DOMAINS)

    try:
        config.REGISTRATION_ALLOWED_EMAIL_DOMAINS = domain_list
        print(f"[OK] Registration restricted to domains: {domain_list}")
    except AttributeError:
        print("[WARN] REGISTRATION_ALLOWED_EMAIL_DOMAINS not available in this KPI version.")
        print("       Registration restriction must be configured via Django admin.")

def setup_sitewide_settings():
    """Set basic Constance settings for RA branding."""
    settings_map = {
        'MFA_ENABLED': False,
        'ALLOW_UNSECURED_BROWSER_CONNECTIONS': True,
        'PROJECT_METADATA_FIELDS': '["description","sector","country","operational_purpose","collects_pii"]',
    }

    for key, value in settings_map.items():
        try:
            setattr(config, key, value)
            print(f"[OK] Set {key} = {value}")
        except AttributeError:
            print(f"[SKIP] {key} not available in this KPI version")

if __name__ == '__main__':
    print("=" * 60)
    print("Resilience Academy - Constance Configuration")
    print("=" * 60)
    setup_registration_restriction()
    setup_sitewide_settings()
    print("\nDone.")
