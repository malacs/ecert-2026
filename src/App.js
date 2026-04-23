import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import PublicPage from './pages/PublicPage';
import AdminPage from './pages/AdminPage';
import CertificatePage from './pages/CertificatePage';
import PresentationPage from './pages/PresentationPage';

export default function App() {
  return (
    <BrowserRouter>
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
      <Routes>
        <Route path="/" element={<PublicPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/presentation" element={<PresentationPage />} />

        {/* NEW: ID-based route — fixes mobile encoding issues */}
        <Route path="/certificate/:id" element={<CertificatePage />} />

        {/* OLD: keep for backward compatibility with old links */}
        <Route path="/certificate/:name/:day" element={<CertificatePage />} />
      </Routes>
      <Analytics />
    </BrowserRouter>
  );
}
