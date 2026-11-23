import React, { useEffect, useState } from 'react';
import { api } from './api';

export default function StudentView() {
  const [students, setStudents] = useState([]);
  const [studentId, setStudentId] = useState('');
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.listStudents().then(setStudents).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!studentId) { setReport(null); return; }
    api.reportData(studentId).then(setReport).catch((e) => setError(e.message));
  }, [studentId]);

  return (
    <div>
      <h2>View results</h2>
      <select value={studentId} onChange={(e) => setStudentId(e.target.value)}>
        <option value="">Choose a student…</option>
        {students.map((s) => (
          <option key={s.id} value={s.id}>{s.name} ({s.roll_no})</option>
        ))}
      </select>

      {error && <p className="error">{error}</p>}

      {report && (
        <>
          <table>
            <thead><tr><th>Subject</th><th>Term</th><th>Marks</th></tr></thead>
            <tbody>
              {report.marks.map((m, i) => (
                <tr key={i}><td>{m.subject_name}</td><td>{m.term}</td><td>{m.marks_obtained} / {m.max_marks}</td></tr>
              ))}
            </tbody>
          </table>

          <div className="summary-card">
            <p>Total: {report.summary.totalObtained} / {report.summary.totalMax} ({report.summary.percentage}%)</p>
            <p><strong>Grade: {report.summary.grade}</strong></p>
            <a className="button" href={api.reportCardUrl(studentId)} target="_blank" rel="noreferrer">
              Download report card (PDF)
            </a>
          </div>
        </>
      )}
    </div>
  );
}
