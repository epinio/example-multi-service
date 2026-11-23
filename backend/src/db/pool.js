const { Pool } = require('pg');

// What actually happens on a live cluster (confirmed by deploying this app
// and dumping its own environment - see the now-removed /api/_debug route
// in git history): binding a Service Catalog instance to an app does NOT
// mount credential files under /configurations, and does NOT inject a
// DATABASE_URL or PG*-style env var. The only thing the binding gives the
// app is ordinary Kubernetes Service-discovery env vars - the standard
// `<SVCNAME>_SERVICE_HOST` / `<SVCNAME>_SERVICE_PORT` pair Kubernetes
// injects for every Service in the namespace - where <SVCNAME> is a hashed,
// per-instance name we can't predict ahead of time (e.g.
// X833E313000B0A5976ACF13934F40_POSTGRESQL_SERVICE_HOST).
//
// So: the host/port are discovered at runtime by pattern-matching those
// env vars (any pair ending in _SERVICE_HOST / _SERVICE_PORT where the port
// is 5432). The actual credentials never come from Epinio at all - they're
// set explicitly at `epinio service create` time via Bitnami's chart
// `auth.*` values (see service-catalog/create-catalog-entry.sh) and
// mirrored into this app's own PGUSER/PGPASSWORD/PGDATABASE env vars in
// backend/epinio.yml. That's a deliberate, documented choice for a teaching
// example, not a workaround for something Epinio was expected to automate.
function discoverHostPort() {
  if (process.env.PGHOST) {
    return { host: process.env.PGHOST, port: Number(process.env.PGPORT || 5432) };
  }

  const hostVar = Object.keys(process.env).find(
    (key) => key.endsWith('_SERVICE_HOST') && process.env[`${key.replace(/_HOST$/, '_PORT')}`] === '5432'
  );
  if (hostVar) {
    return { host: process.env[hostVar], port: 5432 };
  }

  return null; // falls through to the local-dev default below
}

function resolveConnectionConfig() {
  if (process.env.DATABASE_URL) {
    return { connectionString: process.env.DATABASE_URL };
  }

  const hostPort = discoverHostPort();
  if (hostPort) {
    return {
      host: hostPort.host,
      port: hostPort.port,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE,
    };
  }

  // Local development fallback (see docker-compose.yml).
  return {
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'examresults',
  };
}

const pool = new Pool(resolveConnectionConfig());

module.exports = { pool };
