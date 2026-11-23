const configuredUrl = window.__CONFIG__ && window.__CONFIG__.API_URL;
const API_BASE = configuredUrl && configuredUrl.startsWith('http') ? configuredUrl : '';

async function request(path, options) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  listStudents: () => request('/api/students'),
  createStudent: (data) => request('/api/students', { method: 'POST', body: JSON.stringify(data) }),
  listSubjects: () => request('/api/subjects'),
  listMarks: (studentId) => request(`/api/marks?student_id=${studentId}`),
  saveMark: (data) => request('/api/marks', { method: 'POST', body: JSON.stringify(data) }),
  reportData: (studentId) => request(`/api/students/${studentId}/report-data`),
  reportCardUrl: (studentId) => `${API_BASE}/api/students/${studentId}/report-card`,
};
