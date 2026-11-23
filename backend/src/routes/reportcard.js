const express = require('express');
const { pool } = require('../db/pool');
const { summarize } = require('../grading');

const router = express.Router();

const REPORT_SERVICE_URL = process.env.REPORT_SERVICE_URL || 'http://localhost:4000';

async function loadReportData(studentId) {
  const studentRes = await pool.query(
    'SELECT id, roll_no, name, class_name FROM students WHERE id = $1',
    [studentId]
  );
  if (studentRes.rows.length === 0) return null;

  const marksRes = await pool.query(
    `SELECT s.name AS subject_name, m.term, m.marks_obtained, s.max_marks
     FROM marks m
     JOIN subjects s ON s.id = m.subject_id
     WHERE m.student_id = $1
     ORDER BY s.name`,
    [studentId]
  );

  return {
    student: studentRes.rows[0],
    marks: marksRes.rows,
    summary: summarize(marksRes.rows),
  };
}

// JSON report data, used by the frontend to render an on-screen preview
router.get('/students/:id/report-data', async (req, res, next) => {
  try {
    const data = await loadReportData(req.params.id);
    if (!data) return res.status(404).json({ error: 'Student not found' });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// Proxies to the report-service microservice, which renders the PDF.
// Keeping this hop in the backend means the frontend only ever talks
// to one API, and the microservice stays an internal implementation detail.
router.get('/students/:id/report-card', async (req, res, next) => {
  try {
    const data = await loadReportData(req.params.id);
    if (!data) return res.status(404).json({ error: 'Student not found' });

    const upstream = await fetch(`${REPORT_SERVICE_URL}/render`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      return res.status(502).json({ error: 'report-service failed', detail: text });
    }

    const pdfBuffer = Buffer.from(await upstream.arrayBuffer());
    res.set('Content-Type', 'application/pdf');
    res.set('Content-Disposition', `attachment; filename="report-card-${data.student.roll_no}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
