#!/usr/bin/env python3
"""
F2: Survey Template Import
===========================
Imports XLSForm survey templates into the KoboToolbox library
as shared assets available to all users.

Run inside the KPI container:
  docker exec -it kobo-docker-kpi-1 python /srv/scripts/03-import-templates.py

UPDATE-PROOF: Uses KPI's Python API (Asset model), not direct SQL.
"""
import os
import sys
import glob
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kobo.settings.base')
sys.path.insert(0, '/srv/src/kpi')

django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()
from kpi.models import Asset
from formpack.utils.xls_to_ss_structure import xls_to_dicts

TEMPLATES_DIR = '/srv/templates'

# Map filenames to metadata
TEMPLATE_META = {
    'urban_resilience_survey.xlsx': {
        'name': 'Urban Resilience Assessment',
        'description': 'Comprehensive survey for assessing urban resilience factors including infrastructure, community preparedness, and environmental risks.',
        'sector': 'Humanitarian - Disaster Risk Reduction',
    },
    'flood_mapping_survey.xlsx': {
        'name': 'Flood Mapping & Impact Survey',
        'description': 'Field survey for mapping flood-affected areas, documenting water levels, damage assessment, and community impact.',
        'sector': 'Humanitarian - Disaster Risk Reduction',
    },
    'community_assessment_survey.xlsx': {
        'name': 'Community Needs Assessment',
        'description': 'General community assessment covering demographics, livelihoods, infrastructure access, and disaster preparedness.',
        'sector': 'Humanitarian - Coordination / Information Management',
    },
}


def get_admin_user():
    """Get the superuser account to own the templates."""
    admin = User.objects.filter(is_superuser=True).first()
    if not admin:
        print("[ERROR] No superuser found. Create one first.")
        sys.exit(1)
    return admin


def import_template(filepath, owner):
    """Import a single XLSForm as a template asset."""
    filename = os.path.basename(filepath)
    meta = TEMPLATE_META.get(filename, {})
    name = meta.get('name', filename.replace('.xlsx', '').replace('_', ' ').title())

    # Check if already imported
    existing = Asset.objects.filter(
        name=name,
        owner=owner,
        asset_type='template',
    ).first()

    if existing:
        print(f"[SKIP] Template already exists: {name}")
        return

    try:
        with open(filepath, 'rb') as f:
            content = xls_to_dicts(f)

        asset = Asset.objects.create(
            name=name,
            asset_type='template',
            content=content,
            owner=owner,
            settings={
                'description': meta.get('description', ''),
                'sector': {'label': meta.get('sector', ''), 'value': meta.get('sector', '')},
                'country': [{'label': 'Tanzania', 'value': 'TZA'}],
                'organization': 'Resilience Academy',
            },
        )
        # Make it discoverable (public)
        from kpi.models.object_permission import ObjectPermission
        from django.contrib.auth.models import AnonymousUser
        asset.assign_perm(AnonymousUser(), 'view_asset')

        print(f"[OK] Imported template: {name} (uid={asset.uid})")

    except Exception as e:
        print(f"[ERROR] Failed to import {filename}: {e}")


if __name__ == '__main__':
    print("=" * 60)
    print("Resilience Academy - Survey Template Import")
    print("=" * 60)

    owner = get_admin_user()
    print(f"Using admin account: {owner.username}\n")

    templates = glob.glob(os.path.join(TEMPLATES_DIR, '*.xlsx'))
    if not templates:
        print(f"[WARN] No .xlsx files found in {TEMPLATES_DIR}")
        print("       Place XLSForm templates there and re-run.")
        sys.exit(0)

    for filepath in sorted(templates):
        import_template(filepath, owner)

    print(f"\nImported {len(templates)} template(s). Done.")
