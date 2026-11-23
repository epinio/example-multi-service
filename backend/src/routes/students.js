const express = require('express');
const { pool } = require('../db/pool');

const router = express.Router();

// List all students
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, roll_no, name, class_name FROM students ORDER BY class_name, roll_no'
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// Create a student
router.post('/', async (req, res, next) => {
  try {
    const { roll_no, name, class_name } = req.body;
    if (!roll_no || !name || !class_name) {
      return res.status(400).json({ error: 'roll_no, name and class_name are required' });
    }
    const { rows } = await pool.query(
      'INSERT INTO students (roll_no, name, class_name) VALUES ($1, $2, $3) RETURNING id, roll_no, name, class_name',
      [roll_no, name, class_name]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: `roll_no "${req.body.roll_no}" already exists` });
    }
    next(err);
  }
});

// Fetch one student
router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, roll_no, name, class_name FROM students WHERE id = $1',
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Student not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
