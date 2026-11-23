const express = require('express');
const { pool } = require('../db/pool');

const router = express.Router();

// List marks, optionally filtered by student
router.get('/', async (req, res, next) => {
  try {
    const { student_id } = req.query;
    const { rows } = await pool.query(
      `SELECT m.id, m.student_id, m.subject_id, s.name AS subject_name,
              m.term, m.marks_obtained, s.max_marks
       FROM marks m
       JOIN subjects s ON s.id = m.subject_id
       WHERE ($1::int IS NULL OR m.student_id = $1)
       ORDER BY s.name`,
      [student_id || null]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// Enter or update a mark (teacher-facing)
router.post('/', async (req, res, next) => {
  try {
    const { student_id, subject_id, term, marks_obtained } = req.body;
    if (!student_id || !subject_id || marks_obtained === undefined) {
      return res.status(400).json({ error: 'student_id, subject_id and marks_obtained are required' });
    }
    const { rows } = await pool.query(
      `INSERT INTO marks (student_id, subject_id, term, marks_obtained)
       VALUES ($1, $2, COALESCE($3, 'Final Term'), $4)
       ON CONFLICT (student_id, subject_id, term)
       DO UPDATE SET marks_obtained = EXCLUDED.marks_obtained
       RETURNING id, student_id, subject_id, term, marks_obtained`,
      [student_id, subject_id, term, marks_obtained]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
