import React, { useState } from 'react';
import TeacherView from './TeacherView.jsx';
import StudentView from './StudentView.jsx';

export default function App() {
  const [tab, setTab] = useState('student');

  return (
    <div className="app">
      <header>
        <h1>Exam Results</h1>
        <p>Student Exam Marks &amp; Report Card System</p>
      </header>
      <nav>
        <button className={tab === 'student' ? 'active' : ''} onClick={() => setTab('student')}>Student</button>
        <button className={tab === 'teacher' ? 'active' : ''} onClick={() => setTab('teacher')}>Teacher</button>
      </nav>
      {tab === 'student' ? <StudentView /> : <TeacherView />}
    </div>
  );
}
