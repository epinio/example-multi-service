const express = require('express');
const cors = require('cors');

const studentsRouter = require('./routes/students');
const subjectsRouter = require('./routes/subjects');
const marksRouter = require('./routes/marks');
const reportCardRouter = require('./routes/reportcard');

const app = express();
const PORT = process.env.PORT || 3000;

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

app.listen(PORT, () => {
  console.log(`examresults-backend listening on port ${PORT}`);
});
