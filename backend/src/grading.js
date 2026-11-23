function gradeFor(percentage) {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B';
  if (percentage >= 60) return 'C';
  if (percentage >= 50) return 'D';
  return 'F';
}

function summarize(marksRows) {
  const obtained = marksRows.reduce((sum, m) => sum + m.marks_obtained, 0);
  const max = marksRows.reduce((sum, m) => sum + m.max_marks, 0);
  const percentage = max > 0 ? Number(((obtained / max) * 100).toFixed(2)) : 0;
  return {
    totalObtained: obtained,
    totalMax: max,
    percentage,
    grade: gradeFor(percentage),
  };
}

module.exports = { gradeFor, summarize };
