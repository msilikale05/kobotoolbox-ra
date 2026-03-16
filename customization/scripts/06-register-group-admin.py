#!/usr/bin/env python3
"""
Re-register Django Group in Admin
==================================
KoboToolbox explicitly unregisters Django's Group model from the admin.
This script re-registers it so that admins can create groups like
"dashboard_viewer" and assign users to them.

Run via:
  docker exec kobo-docker-kpi-1 python /srv/scripts/06-register-group-admin.py

This only needs to run once — Django admin registrations persist for the
lifetime of the process. Since KPI's WSGI workers restart on deploy,
this should be called from a startup hook or run manually after restart.

UPDATE-PROOF: Does not modify any core files.
"""
import os
import sys

sys.path.insert(0, '/srv/src/kpi')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kobo.settings')

import django
django.setup()

from django.contrib import admin
from django.contrib.auth.models import Group

# Check if Group is already registered
try:
    admin.site.unregister(Group)
except admin.sites.NotRegistered:
    pass

# Re-register with default GroupAdmin
from django.contrib.auth.admin import GroupAdmin
admin.site.register(Group, GroupAdmin)

print('Django Group model re-registered in admin.')
print('You can now manage groups at /admin/auth/group/')
