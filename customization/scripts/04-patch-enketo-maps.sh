#!/bin/bash
# F6: Tanzania Map Tiles - Patch Enketo Config
# =============================================
# Adds a Tanzania-centered OpenStreetMap tile layer to Enketo's config.json
# and sets it as the default map view.
#
# Run on the host (patches the config file before Enketo starts):
#   bash customization/scripts/04-patch-enketo-maps.sh
#
# UPDATE-PROOF: Patches the generated config.json, not source code.

set -e

ENKETO_CONFIG="${ENKETO_CONFIG:-/Users/msilikale/Sites/kobotoolbox/kobo-env/enketo_express/config.json}"

if [ ! -f "$ENKETO_CONFIG" ]; then
    echo "[ERROR] Enketo config not found at: $ENKETO_CONFIG"
    exit 1
fi

echo "Patching Enketo config for Tanzania map tiles..."

# Use Python to safely modify JSON
python3 << 'PYEOF'
import json
import sys

config_path = sys.argv[1] if len(sys.argv) > 1 else "/Users/msilikale/Sites/kobotoolbox/kobo-env/enketo_express/config.json"

with open(config_path, 'r') as f:
    config = json.load(f)

# Tanzania-centered map layer (added as first/default option)
tz_layer = {
    "name": "Tanzania OSM",
    "tiles": ["https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"],
    "attribution": "&copy; <a href=\"https://openstreetmap.org\">OpenStreetMap</a> contributors"
}

# Check if already patched
existing_names = [m.get('name', '') for m in config.get('maps', [])]
if 'Tanzania OSM' in existing_names:
    print("[SKIP] Tanzania OSM layer already present")
    sys.exit(0)

# Insert Tanzania layer as first (default) option
config.setdefault('maps', [])
config['maps'].insert(0, tz_layer)

# Set default map center to Dar es Salaam, Tanzania
config['map'] = {
    "center": [-6.7924, 39.2083],
    "zoom": 12
}

with open(config_path, 'w') as f:
    json.dump(config, f, indent=4)

print("[OK] Added Tanzania OSM as default map layer")
print("[OK] Set default center to Dar es Salaam (-6.79, 39.21)")
PYEOF

echo "Done."
