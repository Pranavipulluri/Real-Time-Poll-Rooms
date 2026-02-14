import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import CreatePoll from './pages/CreatePoll';
import Poll from './pages/Poll';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/create" replace />} />
        <Route path="/create" element={<CreatePoll />} />
        <Route path="/poll/:id" element={<Poll />} />
      </Routes>
    </Router>
  );
}

export default App;
