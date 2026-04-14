import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { getCertificateDataUrl } from '../certificateGenerator';

export default function PresentationPage() {
  const [participants, setParticipants] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentCertUrl, setCurrentCertUrl] = useState('');

  useEffect(() => {
    const fetchParticipants = async () => {
      const { data } = await supabase.from('participants').select('*');
      if (data) {
        const sorted = data.sort((a, b) => a.name.localeCompare(b.name));
        setParticipants(sorted);
      }
    };
    fetchParticipants();
  }, []);

  const nextSlide = useCallback(() => {
    if (currentIndex < participants.length - 1) setCurrentIndex(prev => prev + 1);
  }, [currentIndex, participants]);

  const prevSlide = useCallback(() => {
    if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
  }, [currentIndex]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') nextSlide();
      if (e.key === 'ArrowLeft') prevSlide();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide]);

  useEffect(() => {
    if (participants[currentIndex]) {
      getCertificateDataUrl(participants[currentIndex].name, participants[currentIndex].cert_date)
        .then(setCurrentCertUrl);
    }
  }, [currentIndex, participants]);

  return (
    <div style={{ backgroundColor: '#000', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      {currentCertUrl ? (
        <img src={currentCertUrl} alt="Certificate" style={{ maxHeight: '95vh', maxWidth: '95vw', boxShadow: '0 0 50px rgba(0,0,0,0.5)' }} />
      ) : (
        <p style={{ color: '#fff' }}>Loading Presentation...</p>
      )}
      
      {/* Hidden controls for the admin to see the count */}
      <div style={{ position: 'absolute', bottom: 10, right: 20, color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>
        {currentIndex + 1} / {participants.length}
      </div>
    </div>
  );
}
