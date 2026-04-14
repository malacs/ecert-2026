import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { getCertificateDataUrl } from '../certificateGenerator';

export default function PresentationPage() {
  const [participants, setParticipants] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentCertUrl, setCurrentCertUrl] = useState('');
  const [loading, setLoading] = useState(true);

  // 1. Load participants in alphabetical order
  useEffect(() => {
    const fetchParticipants = async () => {
      const { data } = await supabase.from('participants').select('*');
      if (data) {
        const sorted = data.sort((a, b) => a.name.localeCompare(b.name));
        setParticipants(sorted);
      }
      setLoading(false);
    };
    fetchParticipants();
  }, []);

  // 2. Navigation Logic
  const nextSlide = useCallback(() => {
    if (currentIndex < participants.length - 1) setCurrentIndex(prev => prev + 1);
  }, [currentIndex, participants]);

  const prevSlide = useCallback(() => {
    if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
  }, [currentIndex]);

  // 3. Keyboard Listeners (Space or Arrows)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') nextSlide();
      if (e.key === 'ArrowLeft') prevSlide();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide]);

  // 4. Generate Certificate Image for current slide
  useEffect(() => {
    if (participants[currentIndex]) {
      getCertificateDataUrl(participants[currentIndex].name, participants[currentIndex].cert_date)
        .then(setCurrentCertUrl);
    }
  }, [currentIndex, participants]);

  if (loading) return <div style={S.load}>Loading Presentation...</div>;

  return (
    <div style={S.container}>
      {currentCertUrl ? (
        <img src={currentCertUrl} alt="Certificate" style={S.certImg} />
      ) : (
        <div style={{color: '#fff'}}>No participants found.</div>
      )}
      
      {/* Small indicator for the Admin (visible in Meet) */}
      <div style={S.counter}>
        {currentIndex + 1} / {participants.length}
      </div>
    </div>
  );
}

const S = {
  container: {
    backgroundColor: '#000',
    height: '100vh',
    width: '100vw',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  certImg: {
    maxHeight: '98vh',
    maxWidth: '98vw',
    boxShadow: '0 0 50px rgba(0,0,0,0.8)',
    objectFit: 'contain'
  },
  counter: {
    position: 'absolute',
    bottom: '10px',
    right: '20px',
    color: 'rgba(255,255,255,0.3)',
    fontSize: '12px',
    fontFamily: 'sans-serif'
  },
  load: {
    height: '100vh',
    background: '#000',
    color: '#fff',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  }
};
