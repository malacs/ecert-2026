import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PublicPage from './pages/PublicPage';
import AdminPage from './pages/AdminPage';
import CertificatePage from './pages/CertificatePage';
import PresentationPage from './pages/PresentationPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/presentation" element={<PresentationPage />} />
        <Route path="/certificate/:name/:day" element={<CertificatePage />} />
      </Routes>
    </BrowserRouter>
  );
}
