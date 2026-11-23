const express = require('express');
const { pool } = require('../db/pool');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT id, name, max_marks FROM subjects ORDER BY name');
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, max_marks } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    const { rows } = await pool.query(
      'INSERT INTO subjects (name, max_marks) VALUES ($1, $2) RETURNING id, name, max_marks',
      [name, max_marks || 100]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: `subject "${req.body.name}" already exists` });
    }
    next(err);
  }
});

module.exports = router;
