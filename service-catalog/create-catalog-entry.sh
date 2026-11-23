#!/usr/bin/env bash
set -euo pipefail

# Registers a custom entry in Epinio's Service Catalog, backed directly by
# the upstream Bitnami PostgreSQL Helm chart, rather than using one of
# Epinio's built-in "-dev" catalog classes (mysql-dev, postgresql-dev, ...).
# This is the "Custom Service (from Service Catalog)" piece of the example:
# a cluster operator runs this once, after which `epinio service create
# examresults-postgresql <instance-name>` works for any app.
#
# Reference: docs.epinio.io -> How-to -> Developer -> Service Catalog
# (`epinio service catalog create`).

CHART_VERSION="${CHART_VERSION:-15.5.17}" # check `helm search repo bitnami/postgresql --versions` for the current one

epinio service catalog create \
  --name examresults-postgresql \
  --chart postgresql \
  --chart-version "${CHART_VERSION}" \
  --helm-repo-name bitnami \
  --helm-repo-url https://charts.bitnami.com/bitnami \
  --secret-types "postgresql,database"

echo "Registered catalog entry 'examresults-postgresql'. Verify with:"
echo "  epinio service catalog examresults-postgresql"
