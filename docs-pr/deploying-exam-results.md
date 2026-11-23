# Deploying a complex application: Exam Results

This walkthrough deploys a small multi-component application to Epinio: a
student exam marks / report card system made of a frontend, a backend, a
microservice, and a database provisioned from a custom Service Catalog
entry - built to exercise the pieces a single-app tutorial doesn't reach:
multiple apps wired together, the Service Catalog, a custom builder image,
and the `epinio app watch` inner dev loop.

Source: <https://github.com/epinio/example-multi-service>

## What you'll deploy

- **`frontend`** - a React single-page app. Teachers enter marks, students
  view their results and download a PDF report card.
- **`backend`** - a Node/Express REST API backed by PostgreSQL. It is the
  only app the frontend talks to directly.
- **`report-service`** - a Node microservice that renders the PDF report
  card with Puppeteer (headless Chromium). The backend calls it internally;
  it's never exposed to the frontend.
- **`examresults-db`** - a PostgreSQL instance, created from a *custom*
  Service Catalog entry backed by the upstream Bitnami PostgreSQL chart.

## Prerequisites

- An Epinio installation you're targeted at (`epinio target <namespace>`)
- `epinio`, `pack`, `helm`, and `docker` CLIs
- Cluster-operator access, to register the custom catalog entry and build
  the custom builder image

## 1. Register the custom Service Catalog entry

Epinio ships five built-in catalog classes (mysql, postgresql, redis,
rabbitmq, mongodb-dev), but you can also register your own, backed by any
Helm chart:

```powershell
cd service-catalog
bash create-catalog-entry.sh
```

This runs `epinio service catalog create` against the upstream Bitnami
PostgreSQL chart, under the name `examresults-postgresql`. Check
`CHART_VERSION` in that script against `helm search repo bitnami/postgresql
--versions` first.

Create the actual instance:

```powershell
epinio service create examresults-postgresql examresults-db
```

## 2. Build the custom builder image

`report-service` needs Chromium's runtime shared libraries, which the
default buildpack has no reason to ship. `builder/` defines a small custom
Cloud Native Buildpack that installs them, combined with the standard
Paketo Node.js buildpack into one builder image:

```powershell
cd builder
pack builder create ghcr.io/<your-org>/examresults-chromium-builder:latest --config builder.toml
docker push ghcr.io/<your-org>/examresults-chromium-builder:latest
```

Pin the current `paketo-buildpacks/nodejs` version in `builder.toml` first -
see `builder/README.md`.

## 3. Push the backend

```powershell
cd backend
epinio push -f epinio.yml
epinio service bind examresults-db examresults-backend
```

The bound database's connection details are mounted at
`/configurations/examresults-db/*` inside the container; `src/db/pool.js`
reads them from there.

## 4. Push the microservice

Point `report-service/epinio.yml`'s `staging.builder` at the image you
pushed in step 2, then:

```powershell
cd report-service
epinio push -f epinio.yml
epinio app show examresults-report-service
```

Note the route it prints, then wire the backend to it:

```powershell
epinio app update examresults-backend -e REPORT_SERVICE_URL=https://<report-service-route>
```

## 5. Push the frontend

```powershell
cd frontend
epinio push -f epinio.yml
epinio app show examresults-backend
epinio app update examresults-frontend -e API_URL=https://<backend-route>
```

Open the frontend's route. Add a student and some marks on the Teacher tab,
then switch to Student to view results and download a report card PDF.

## 6. Iterate on the frontend without a full rebuild

`frontend/.epinio-sync.yaml` configures `epinio app watch`, which rebuilds
and syncs only changed files into the already-running container on save:

```powershell
epinio app watch examresults-frontend
```

`epinio app watch` is experimental and validated against a limited set of
buildpacks/stacks - if it doesn't pick up changes, fall back to a normal
`epinio push`.

## Troubleshooting

- **Backend can't connect to the database:** run `epinio app exec
  examresults-backend -- ls /configurations/examresults-db` to see the
  actual files Epinio mounted, and compare them against the aliases
  `src/db/pool.js` looks for.
- **report-service fails to render a PDF:** `epinio app logs
  report-service` first - a missing shared library error means the builder
  image's package list (`builder/buildpacks/chromium/bin/build`) needs
  another entry for your base stack.
