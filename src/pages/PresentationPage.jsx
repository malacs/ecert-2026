import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { getCertificateDataUrl } from '../certificateGenerator';

export default function PresentationPage() {
  const [participants, setParticipants] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentCertUrl, setCurrentCertUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(true);

  // 1. Load participants and sort A-Z
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

  // 2. Navigation with Fade Transition
  const changeSlide = useCallback((direction) => {
    setIsVisible(false); // Trigger fade out

    setTimeout(() => {
      if (direction === 'next' && currentIndex < participants.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else if (direction === 'prev' && currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
      }
      setIsVisible(true); // Trigger fade in
    }, 300); // Matches the CSS transition time
  }, [currentIndex, participants]);

  // 3. Keyboard Listeners
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') changeSlide('next');
      if (e.key === 'ArrowLeft') changeSlide('prev');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [changeSlide]);

  // 4. Generate Certificate Image
  useEffect(() => {
    if (participants[currentIndex]) {
      getCertificateDataUrl(participants[currentIndex].name, participants[currentIndex].cert_date)
        .then(setCurrentCertUrl);
    }
  }, [currentIndex, participants]);

  if (loading) return <div style={S.load}>Loading Presentation...</div>;

  return (
    <div style={S.container}>
      <div 
        style={{
          ...S.slideWrapper,
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'scale(1)' : 'scale(0.98)',
        }}
      >
        {currentCertUrl ? (
          <img src={currentCertUrl} alt="Certificate" style={S.certImg} />
        ) : (
          <div style={{color: '#fff'}}>Loading Certificate...</div>
        )}
      </div>
      
      {/* Ghost Counter: very subtle so only you notice the progress */}
      <div style={S.counter}>
        {currentIndex + 1} / {participants.length}
      </div>
    </div>
  );
}

const S = {
  container: {
    backgroundColor: '#000', // Black background for a cinematic feel
    height: '100vh',
    width: '100vw',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  slideWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'opacity 0.4s ease-in-out, transform 0.4s ease-in-out',
    width: '100%',
    height: '100%'
  },
  certImg: {
    maxHeight: '95vh', // Slightly smaller to ensure no scrolling
    maxWidth: '95vw',
    boxShadow: '0 0 60px rgba(0,0,0,0.9)',
    objectFit: 'contain',
    borderRadius: '2px'
  },
  counter: {
    position: 'absolute',
    bottom: '15px',
    right: '20px',
    color: 'rgba(255,255,255,0.15)', // Very faint
    fontSize: '12px',
    fontFamily: 'sans-serif'
  },
  load: {
    height: '100vh',
    background: '#000',
    color: '#fff',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: 'sans-serif'
  }
};
