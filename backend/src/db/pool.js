const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Epinio mounts a bound Configuration's values as files under
// /configurations/<configuration-name>/<key> (one file per key). It also
// exposes some of them as env vars, but the exact key/var names depend on
// the Helm chart backing the Service Catalog entry, so this resolves the
// connection in three steps, most-explicit first:
//   1. DATABASE_URL, if something already set one directly.
//   2. PG* env vars (node-postgres's own convention) - set these via
//      `epinio app update <app> -e PGHOST=... -e PGUSER=...` if the
//      catalog entry's secret uses different key names than step 3 guesses.
//   3. Auto-discovered from the mounted /configurations/<name>/ directory,
//      trying a few common aliases per field. Run
//      `epinio app exec examresults-backend -- ls /configurations/<name>`
//      after binding to see the real file names, and adjust CONFIG_* aliases
//      below (or just set PG* env vars) if none of the guesses match.
const CONFIG_MOUNT_ROOT = '/configurations';
const CONFIGURATION_NAME = process.env.CONFIGURATION_NAME || 'examresults-db';

const FIELD_ALIASES = {
  host: ['host', 'hostname', 'postgresql-host', 'pghost'],
  port: ['port', 'postgresql-port', 'pgport'],
  user: ['username', 'user', 'postgresql-username', 'pguser'],
  password: ['password', 'postgres-password', 'postgresql-password', 'pgpassword'],
  database: ['database', 'dbname', 'postgresql-database', 'pgdatabase'],
};

function readConfigurationDir() {
  const dir = path.join(CONFIG_MOUNT_ROOT, CONFIGURATION_NAME);
  if (!fs.existsSync(dir)) return null;

  const values = {};
  for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
    for (const alias of aliases) {
      const file = path.join(dir, alias);
      if (fs.existsSync(file)) {
        values[field] = fs.readFileSync(file, 'utf8').trim();
        break;
      }
    }
  }
  return values;
}

function resolveConnectionConfig() {
  if (process.env.DATABASE_URL) {
    return { connectionString: process.env.DATABASE_URL };
  }

  if (process.env.PGHOST) {
    return {
      host: process.env.PGHOST,
      port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE,
    };
  }

  const discovered = readConfigurationDir();
  if (discovered && discovered.host) {
    return {
      host: discovered.host,
      port: discovered.port ? Number(discovered.port) : 5432,
      user: discovered.user,
      password: discovered.password,
      database: discovered.database,
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
