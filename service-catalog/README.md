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
bash create-catalog-entry.sh
```

Then, per app deployment:

```powershell
epinio service create examresults-postgresql examresults-postgres
epinio service bind examresults-postgres examresults-backend
```

## What actually happens when you bind it (verified on a live cluster)

The docs describe a `/configurations/<name>/<key>` file mount for
user-created Configurations (`epinio configuration create`). **That does
not apply to a bound Service Catalog instance** - we deployed this app
against a real cluster and confirmed `/configurations` doesn't exist in the
container at all. What binding actually gives the app is ordinary
Kubernetes Service-discovery env vars: a hashed, per-instance pair like
`X833E313000B0A5976ACF13934F40_POSTGRESQL_SERVICE_HOST` /
`..._SERVICE_PORT` - host and port only, **no credentials in any form**.

So the username/password/database are set explicitly, at the catalog level,
via `values.yaml` (passed with `--values-file` in
`create-catalog-entry.sh`) rather than discovered at runtime. The app side
of this is `backend/src/db/pool.js`, which:
- discovers the host/port by scanning its own environment for a
  `*_SERVICE_HOST` / `*_SERVICE_PORT` pair where the port is `5432`
  (works regardless of the exact hash, which we can't predict ahead of
  time), and
- reads `PGUSER`/`PGPASSWORD`/`PGDATABASE` from its own env vars, which
  `backend/epinio.yml` sets to the exact same values `values.yaml` bakes
  into the chart.

## The one real gotcha: Postgres only initializes once per volume

Bitnami's chart only applies `auth.username`/`auth.password`/`auth.database`
the first time a given release's PersistentVolumeClaim is initialized.
Deleting a service instance and recreating it **under the same name**
reuses the same (deterministically-named) PVC, so the old password wins
silently - this cost real debugging time while building this example. If
you need to reset credentials, either delete the instance's PVC manually
first, or just create the next instance under a new name.

## Caveat

`--chart-version` in `create-catalog-entry.sh` defaults to whatever was
current when this was written - check `helm search repo bitnami/postgresql
--versions` before relying on it.
