#!/usr/bin/env bash
set -euo pipefail

# Registers a custom entry in Epinio's Service Catalog, backed directly by
# the upstream Bitnami PostgreSQL Helm chart, rather than using one of
# Epinio's built-in "-dev" catalog classes (mysql-dev, postgresql-dev, ...).
# This is the "Custom Service (from Service Catalog)" piece of the example:
# a cluster operator runs this once, after which `epinio service create
# examresults-postgresql <instance-name>` works for any app.
#
# Verified against a live cluster: binding a Service Catalog instance to an
# app does NOT expose its credentials to that app in any form (no mounted
# files, no env var) - only ordinary Kubernetes Service-discovery env vars
# for host/port. So values.yaml bakes a known, fixed username/password/
# database into the catalog entry itself via --values-file, and
# backend/epinio.yml sets matching PGUSER/PGPASSWORD/PGDATABASE. See
# README.md for the full story.
#
# Reference: docs.epinio.io -> How-to -> Developer -> Service Catalog
# (`epinio service catalog create`).

CHART_VERSION="${CHART_VERSION:-18.12.25}" # check `helm search repo bitnami/postgresql --versions` for the current one

epinio service catalog create \
  --name examresults-postgresql \
  --chart postgresql \
  --chart-version "${CHART_VERSION}" \
  --helm-repo-name bitnami \
  --helm-repo-url https://charts.bitnami.com/bitnami \
  --secret-types "postgresql,database" \
  --values-file values.yaml

echo "Registered catalog entry 'examresults-postgresql'. Verify with:"
echo "  epinio service catalog examresults-postgresql"
echo
echo "Create an instance, then bind it to the backend:"
echo "  epinio service create examresults-postgresql examresults-postgres"
echo "  epinio service bind examresults-postgres examresults-backend"
echo
echo "IMPORTANT: Postgres only applies values.yaml's auth.* settings the"
echo "FIRST time a given instance name's data volume is initialized. If you"
echo "delete and recreate an instance under the SAME name, it reuses the old"
echo "volume (and old password) - use a new name instead, or see README.md."
