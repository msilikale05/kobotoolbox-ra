#!/bin/bash
# Resilience Academy - Master Setup Orchestrator
# ================================================
# Runs all setup scripts in order after KoboToolbox containers are up.
#
# Usage:
#   bash customization/scripts/setup-all.sh
#
# Prerequisites:
#   - KoboToolbox must be running (docker containers up)
#   - Run from the basic-kobotoolbox directory

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "============================================================"
echo "  Resilience Academy - KoboToolbox Customization Setup"
echo "============================================================"
echo ""

# Detect KPI container name
KPI_CONTAINER=$(docker ps --format '{{.Names}}' | grep -E 'kpi' | grep -v worker | grep -v beat | head -1)
if [ -z "$KPI_CONTAINER" ]; then
    echo "[ERROR] KPI container not found. Is KoboToolbox running?"
    echo "        Start it with: python3 run.py"
    exit 1
fi
echo "Using KPI container: $KPI_CONTAINER"
echo ""

# =============================================
# Phase 1: Config & Injection (no new containers)
# =============================================
echo "--- Phase 1: Configuration ---"
echo ""

# F3: Registration restriction
echo "[1/4] Setting up email registration restriction..."
docker exec "$KPI_CONTAINER" python /srv/scripts/01-setup-constance.py
echo ""

# F1: Welcome dashboard (SitewideMessage)
echo "[2/4] Setting up welcome dashboard..."
docker exec "$KPI_CONTAINER" python /srv/scripts/02-setup-welcome.py
echo ""

# F2: Import survey templates
echo "[3/4] Importing survey templates..."
docker exec "$KPI_CONTAINER" python /srv/scripts/03-import-templates.py
echo ""

# F6: Tanzania map tiles
echo "[4/4] Patching Enketo map tiles..."
bash "$SCRIPT_DIR/04-patch-enketo-maps.sh"
echo ""

echo "============================================================"
echo "  Setup Complete!"
echo "============================================================"
echo ""
echo "What was configured:"
echo "  [F1]  Welcome dashboard - JS injection active"
echo "  [F2]  Survey templates - imported into library"
echo "  [F3]  Registration restriction - email domains set"
echo "  [F4]  Enketo form theme - CSS mounted (restart Enketo to apply)"
echo "  [F5]  Email templates - mounted into containers"
echo "  [F6]  Tanzania map tiles - Enketo config patched"
echo "  [F8]  GeoNode sync - container running (configure config.env)"
echo "  [F11] WhatsApp/SMS relay - container running (configure Twilio)"
echo ""
echo "Next steps:"
echo "  1. Restart containers to apply all changes:"
echo "     python3 run.py"
echo ""
echo "  2. Configure GeoNode credentials in:"
echo "     customization/services/geonode-sync/config.env"
echo ""
echo "  3. Configure Twilio credentials in:"
echo "     customization/services/webhook-relay/config.env"
echo ""
echo "  4. Add XLSForm templates to customization/templates/"
echo "     and re-run: docker exec $KPI_CONTAINER python /srv/scripts/03-import-templates.py"
