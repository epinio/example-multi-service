# Exam Results - a complex Epinio application example

A small Student Exam Marks / Report Card system, built to exercise every
piece an Epinio "complex application" needs to touch:

| Piece | Where |
|---|---|
| Frontend | [`frontend/`](frontend) - React SPA (teachers enter marks, students view results) |
| Backend | [`backend/`](backend) - Node/Express REST API + PostgreSQL |
| Microservice | [`report-service/`](report-service) - Node/Puppeteer PDF report-card renderer |
| Custom Service (Service Catalog) | [`service-catalog/`](service-catalog) - registers a Bitnami-PostgreSQL-backed catalog entry |
| Custom Buildpack | [`builder/`](builder) - installs Chromium's runtime libraries so Puppeteer can launch |
| `.epinio-sync.yaml` | [`frontend/.epinio-sync.yaml`](frontend/.epinio-sync.yaml) - live-reload dev loop via `epinio app watch` |
| Epinio manifests | `epinio.yml` in each app directory |

## Architecture

```
 ┌──────────┐      /api/*       ┌──────────┐    POST /render    ┌────────────────┐
 │ frontend │ ───────────────▶ │ backend  │ ──────────────────▶│ report-service  │
 │ (React)  │ ◀─ PDF / JSON ── │ (Express)│ ◀── PDF buffer ──── │ (Puppeteer)     │
 └──────────┘                   └────┬─────┘                    └─────────────────┘
                                      │ bound Configuration
                                      ▼
                             ┌──────────────────┐
                             │ examresults-db    │
                             │ (PostgreSQL, from  │
                             │ the Service Catalog)│
                             └──────────────────┘
```

The frontend never talks to `report-service` directly - the backend proxies
the PDF request. That keeps the microservice an internal implementation
detail and means only one app's route needs to be public-facing from the
frontend's point of view.

## Running it locally (no Epinio/Kubernetes needed)

```powershell
docker compose up --build
```

Then open <http://localhost:8080>. The backend runs its own migration
(`backend/src/db/migrate.js`) on container start, and seeds five subjects.
Add a student and some marks on the Teacher tab, then switch to Student to
view results and download a PDF report card.

This uses `Dockerfile.dev` files in each app directory, which exist **only**
for this local loop - they are not used when deploying to Epinio, which
builds each app from source with a buildpack instead (see below).

**This full loop has been run and verified**: students/subjects/marks CRUD,
the grading/percentage math, the frontend UI (including the runtime
`API_URL` config injection), and report-service actually rendering a real
PDF (`%PDF-1.4` magic bytes confirmed) both directly and proxied through the
backend. One real bug was caught and fixed in the process: Puppeteer v23's
`page.pdf()` returns a `Uint8Array`, not a Node `Buffer` - `res.send()` only
writes raw bytes for an actual `Buffer`, otherwise it JSON-serializes the
typed array one byte at a time. `report-service/src/index.js` now wraps the
result in `Buffer.from(...)` before sending it.

## Deploying to Epinio

Requires a running Epinio installation and `epinio target <namespace>`
already set. None of the steps below were run against a live cluster while
building this example (none was available) - treat them as a correct,
carefully-researched starting point, not a verified one, and see the
caveats in [`builder/README.md`](builder/README.md) and
[`service-catalog/README.md`](service-catalog/README.md).

1. **Register and create the database service** (once per cluster, then once per deployment):
   ```powershell
   cd service-catalog
   bash create-catalog-entry.sh      # operator step, run once per cluster
   epinio service create examresults-postgresql examresults-db
   ```

2. **Build the custom builder image** for the report-service (see
   [`builder/README.md`](builder/README.md) for the full `pack` command and
   the Paketo version you need to pin first).

3. **Push the backend** and bind the database to it:
   ```powershell
   cd backend
   epinio push -f epinio.yml
   epinio service bind examresults-db examresults-backend
   ```

4. **Push the report-service**, with the custom builder image set in its
   `epinio.yml`:
   ```powershell
   cd report-service
   epinio push -f epinio.yml
   ```
   Then wire the backend to it:
   ```powershell
   epinio app show examresults-report-service   # note its route
   epinio app update examresults-backend -e REPORT_SERVICE_URL=https://<that-route>
   ```

5. **Push the frontend**, then point it at the backend's route the same way:
   ```powershell
   cd frontend
   epinio push -f epinio.yml
   epinio app show examresults-backend          # note its route
   epinio app update examresults-frontend -e API_URL=https://<that-route>
   ```

6. **Iterate on the frontend** without a full rebuild using the sync file:
   ```powershell
   epinio app watch examresults-frontend
   ```
   (`epinio app watch` is marked experimental upstream and validated on a
   limited set of builders - see `frontend/.epinio-sync.yaml` for the exact
   config and docs link.)

A step-by-step version of this, written for someone following along rather
than skimming a README, is the subject of the companion docs PR (see below).

## Known gaps / what to double-check against a real cluster

- `backend/src/db/pool.js` reads the bound Postgres Configuration's values
  from `/configurations/examresults-db/<key>` with a guessed set of common
  key-name aliases (`host`, `username`, `password`, ...), since the exact
  secret keys the Bitnami PostgreSQL chart produces couldn't be confirmed
  without a live cluster. Run `epinio app exec examresults-backend -- ls
  /configurations/examresults-db` after binding and adjust `FIELD_ALIASES`
  in that file (or just set `PGHOST`/`PGUSER`/etc. directly with `epinio app
  update -e ...`) if none of the guesses match.
- `builder/builder.toml` needs the current `paketo-buildpacks/nodejs`
  version/image filled in before `pack builder create` will work.
- `service-catalog/create-catalog-entry.sh`'s `CHART_VERSION` default should
  be checked against `helm search repo bitnami/postgresql --versions`.
- Inter-app URLs (`REPORT_SERVICE_URL`, `API_URL`) are wired manually via
  `epinio app update -e` after each app's public route is known, since
  Epinio's in-cluster Service name for an app is a hashed, non-obvious
  string rather than something derivable from the app name.
