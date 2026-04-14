import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { getCertificateDataUrl } from '../certificateGenerator';

export default function PresentationPage() {
  const [participants, setParticipants] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentCertUrl, setCurrentCertUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(true);

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

  // 2. Navigation with Animation Trigger
  const changeSlide = useCallback((direction) => {
    // Start Fade Out
    setIsVisible(false);

    // Wait for fade out animation (300ms) before changing the content
    setTimeout(() => {
      if (direction === 'next' && currentIndex < participants.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else if (direction === 'prev' && currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
      }
      // Start Fade In
      setIsVisible(true);
    }, 300);
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
          <div style={{color: '#fff'}}>Preparing slide...</div>
        )}
      </div>
      
      {/* Participant Name Overlay (Optional: makes it look like a real production) */}
      <div style={{...S.nameTag, opacity: isVisible ? 1 : 0}}>
         {participants[currentIndex]?.name}
      </div>

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
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    fontFamily: 'sans-serif'
  },
  slideWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'opacity 0.4s ease-in-out, transform 0.4s ease-in-out', // The "Life" part
    width: '100%',
    height: '100%'
  },
  certImg: {
    maxHeight: '90vh',
    maxWidth: '90vw',
    boxShadow: '0 0 80px rgba(0,0,0,0.9)',
    objectFit: 'contain',
    borderRadius: '4px'
  },
  nameTag: {
    position: 'absolute',
    bottom: '40px',
    background: 'rgba(26, 16, 96, 0.8)',
    color: '#fff',
    padding: '8px 24px',
    borderRadius: '50px',
    fontSize: '18px',
    fontWeight: '600',
    letterSpacing: '1px',
    transition: 'opacity 0.4s ease',
    border: '1px solid #c9a84c'
  },
  counter: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    color: 'rgba(255,255,255,0.4)',
    fontSize: '14px',
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
