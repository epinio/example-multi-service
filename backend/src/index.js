const express = require('express');
const cors = require('cors');

const { migrate } = require('./db/migrate');
const studentsRouter = require('./routes/students');
const subjectsRouter = require('./routes/subjects');
const marksRouter = require('./routes/marks');
const reportCardRouter = require('./routes/reportcard');

const app = express();
const PORT = process.env.PORT || 3000;

// Buildpack-deployed apps have no separate migration step, so run it here.
// Idempotent (CREATE TABLE IF NOT EXISTS) and retried a few times in case
// the database service is still coming up when this app starts.
async function migrateWithRetry(attempts = 5, delayMs = 2000) {
  for (let i = 1; i <= attempts; i++) {
    try {
      await migrate();
      console.log('Migration complete: schema is up to date.');
      return;
    } catch (err) {
      console.error(`Migration attempt ${i}/${attempts} failed: ${err.message}`);
      if (i === attempts) throw err;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/students', studentsRouter);
app.use('/api/subjects', subjectsRouter);
app.use('/api/marks', marksRouter);
app.use('/api', reportCardRouter);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

migrateWithRetry().catch((err) => {
  console.error('Giving up on migration, starting anyway:', err.message);
});

app.listen(PORT, () => {
  console.log(`examresults-backend listening on port ${PORT}`);
});
