function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function reportCardHtml({ student, marks, summary }) {
  const rows = marks.map((m) => `
    <tr>
      <td>${escapeHtml(m.subject_name)}</td>
      <td>${escapeHtml(m.term)}</td>
      <td>${m.marks_obtained} / ${m.max_marks}</td>
    </tr>
  `).join('');

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a1a; padding: 40px; }
  h1 { font-size: 22px; margin-bottom: 0; }
  .subtitle { color: #555; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; margin-top: 24px; }
  th, td { border: 1px solid #ccc; padding: 8px 12px; text-align: left; }
  th { background: #f2f2f2; }
  .summary { margin-top: 24px; font-size: 14px; }
  .grade { font-size: 28px; font-weight: bold; }
</style>
</head>
<body>
  <h1>Report Card</h1>
  <p class="subtitle">${escapeHtml(student.name)} &middot; Roll No. ${escapeHtml(student.roll_no)} &middot; Class ${escapeHtml(student.class_name)}</p>

  <table>
    <thead>
      <tr><th>Subject</th><th>Term</th><th>Marks</th></tr>
    </thead>
    <tbody>
      ${rows || '<tr><td colspan="3">No marks recorded yet</td></tr>'}
    </tbody>
  </table>

  <div class="summary">
    <p>Total: ${summary.totalObtained} / ${summary.totalMax} (${summary.percentage}%)</p>
    <p class="grade">Grade: ${summary.grade}</p>
  </div>
</body>
</html>`;
}

module.exports = { reportCardHtml };
