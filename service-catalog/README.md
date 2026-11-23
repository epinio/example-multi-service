# Custom Service Catalog entry

Epinio ships five built-in catalog classes (mysql, postgresql, redis,
rabbitmq, mongodb-dev), but the catalog is also meant to be extended -
`epinio service catalog create` registers any Helm chart as a new catalog
entry. `create-catalog-entry.sh` does that for the upstream Bitnami
PostgreSQL chart, under our own name (`examresults-postgresql`), which is
the "Custom Service (from Service Catalog)" piece of this example.

Run once per cluster, as an operator (needs more privilege than a regular
`epinio push`):

```powershell
.\create-catalog-entry.sh
```

(Or on PowerShell directly: `bash create-catalog-entry.sh` if you don't have
a POSIX shell handy.)

Then, per app deployment:

```powershell
epinio service create examresults-postgresql examresults-db
epinio service bind examresults-db examresults-backend
```

`examresults-db` becomes the Configuration name backend/epinio.yml binds and
backend/src/db/pool.js reads from (`/configurations/examresults-db/*`).

**Caveat:** `--chart-version` is left as a placeholder (defaulted to a
recent-at-time-of-writing Bitnami chart version) - check
`helm search repo bitnami/postgresql --versions` for whatever is current
before running this against a real cluster. This also hasn't been run
against a live Epinio cluster while building this example (none was
available), so treat the exact `--secret-types` value as a starting point:
confirm it against `epinio service catalog create --help` and, after
creating an instance, `epinio configuration show examresults-db` to see
what keys actually come through.
