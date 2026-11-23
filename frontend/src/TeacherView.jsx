import React, { useEffect, useState } from 'react';
import { api } from './api';

export default function TeacherView() {
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [form, setForm] = useState({ student_id: '', subject_id: '', term: 'Final Term', marks_obtained: '' });
  const [newStudent, setNewStudent] = useState({ roll_no: '', name: '', class_name: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function refresh() {
    setStudents(await api.listStudents());
    setSubjects(await api.listSubjects());
  }

  useEffect(() => { refresh().catch((e) => setError(e.message)); }, []);

  async function handleAddStudent(e) {
    e.preventDefault();
    setError('');
    try {
      await api.createStudent(newStudent);
      setNewStudent({ roll_no: '', name: '', class_name: '' });
      setMessage('Student added.');
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSaveMark(e) {
    e.preventDefault();
    setError('');
    try {
      await api.saveMark({
        ...form,
        student_id: Number(form.student_id),
        subject_id: Number(form.subject_id),
        marks_obtained: Number(form.marks_obtained),
      });
      setMessage('Marks saved.');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h2>Add a student</h2>
      <form onSubmit={handleAddStudent}>
        <input placeholder="Roll No." value={newStudent.roll_no}
               onChange={(e) => setNewStudent({ ...newStudent, roll_no: e.target.value })} required />
        <input placeholder="Full name" value={newStudent.name}
               onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })} required />
        <input placeholder="Class, e.g. 10-A" value={newStudent.class_name}
               onChange={(e) => setNewStudent({ ...newStudent, class_name: e.target.value })} required />
        <button type="submit">Add student</button>
      </form>

      <h2>Enter marks</h2>
      <form onSubmit={handleSaveMark}>
        <select value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })} required>
          <option value="">Student…</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>{s.name} ({s.roll_no})</option>
          ))}
        </select>
        <select value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })} required>
          <option value="">Subject…</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>{s.name} (/{s.max_marks})</option>
          ))}
        </select>
        <input placeholder="Term" value={form.term}
               onChange={(e) => setForm({ ...form, term: e.target.value })} />
        <input type="number" placeholder="Marks obtained" value={form.marks_obtained}
               onChange={(e) => setForm({ ...form, marks_obtained: e.target.value })} required />
        <button type="submit">Save marks</button>
      </form>

      {message && <p>{message}</p>}
      {error && <p className="error">{error}</p>}

      <h2>Students</h2>
      <table>
        <thead><tr><th>Roll No.</th><th>Name</th><th>Class</th></tr></thead>
        <tbody>
          {students.map((s) => (
            <tr key={s.id}><td>{s.roll_no}</td><td>{s.name}</td><td>{s.class_name}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
