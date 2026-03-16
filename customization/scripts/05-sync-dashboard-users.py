#!/usr/bin/env python3
"""
Sync Dashboard Viewer Group → JSON config
==========================================
Reads members of the Django "dashboard_viewer" group and writes
their usernames to the dashboard-users.json config file.

This file is mounted into the KPI container and can be run:
  - On container startup (via entrypoint or manually)
  - Periodically via cron
  - Manually: docker exec kobo-docker-kpi-1 python /srv/scripts/05-sync-dashboard-users.py

The dashboard JS (ra-dashboard-view.js) reads dashboard-users.json
to determine which users see only the dashboard.

UPDATE-PROOF: Uses Django ORM via KPI's manage.py environment.
"""
import json
import os
import sys

# Add KPI to Python path
sys.path.insert(0, '/srv/src/kpi')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kobo.settings')

import django
django.setup()

from django.contrib.auth.models import Group

GROUP_NAME = 'dashboard_viewer'
OUTPUT_PATH = '/srv/custom-static/config/dashboard-users.json'


def sync():
    try:
        group = Group.objects.get(name=GROUP_NAME)
        usernames = list(
            group.user_set.filter(is_active=True)
            .values_list('username', flat=True)
        )
    except Group.DoesNotExist:
        # Group doesn't exist yet — create it so admin can see it
        Group.objects.create(name=GROUP_NAME)
        usernames = []
        print(f'Created group "{GROUP_NAME}" (no members yet)')

    # Write to JSON config
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, 'w') as f:
        json.dump({'users': usernames}, f, indent=2)

    print(f'Dashboard users synced: {len(usernames)} user(s) → {OUTPUT_PATH}')
    if usernames:
        print(f'  Users: {", ".join(usernames)}')


if __name__ == '__main__':
    sync()
