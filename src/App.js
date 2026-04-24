import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import CertificatePage from './pages/CertificatePage';
// ... other imports

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* New ID-based route for mobile stability */}
        <Route path="/certificate/:id" element={<CertificatePage />} />
        
        {/* Backward compatibility for old links */}
        <Route path="/certificate/:name/:day" element={<CertificatePage />} />
        
        {/* Your other routes */}
        <Route path="/" element={<PublicPage />} />
      </Routes>
    </BrowserRouter>
  );
}
