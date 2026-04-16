import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { getCertificateDataUrl } from '../certificateGenerator';

// Maps the ID from the URL to a readable Label
const DAY_MAP = {
  '1': 'Day 1 — April 15, 2026',
  '2': 'Day 2 — April 17, 2026',
  '3': 'Day 3 — April 22, 2026',
  '4': 'Day 4 — April 24, 2026',
  '5': 'Day 5 — April 29, 2026',
};

export default function PresentationPage() {
  const [participants, setParticipants] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentCertUrl, setCurrentCertUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [trainingDayLabel, setTrainingDayLabel] = useState("the Training Series");

  const fullThemeTitle = "DATA INSIGHTS 2026: Virtual Training Series on Data Mining Concepts, Techniques, and Applications";

  useEffect(() => {
    const fetchParticipants = async () => {
      // 1. Get the 'day' parameter from the URL (sent by Admin Page picker)
      const params = new URLSearchParams(window.location.search);
      const selectedDay = params.get('day');

      // 2. Set the label based on the selection
      if (selectedDay && DAY_MAP[selectedDay]) {
        setTrainingDayLabel(DAY_MAP[selectedDay]);
      }

      // 3. Build the Supabase Query
      let query = supabase.from('participants').select('*');
      
      // Filter by day if it exists in the URL
      if (selectedDay) {
        query = query.eq('cert_date', selectedDay);
      }

      const { data } = await query;
      if (data) {
        // Sort alphabetically so the presentation feels organized
        const sorted = data.sort((a, b) => a.name.localeCompare(b.name));
        setParticipants(sorted);
      }
      setLoading(false);
    };
    fetchParticipants();
  }, []);

  // Slides = Intro + All Participants + Ending
  const totalSlides = participants.length + 2;

  const changeSlide = useCallback((direction) => {
    setIsVisible(false);
    // Short timeout allows the fade-out before the content changes
    setTimeout(() => {
      if (direction === 'next' && currentIndex < totalSlides - 1) {
        setCurrentIndex(prev => prev + 1);
      } else if (direction === 'prev' && currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
      }
      setIsVisible(true);
    }, 300);
  }, [currentIndex, totalSlides]);

  // Handle Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') changeSlide('next');
      if (e.key === 'ArrowLeft' || e.key === 'Backspace') changeSlide('prev');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [changeSlide]);

  // Pre-generate the certificate for the current slide
  useEffect(() => {
    const participantIndex = currentIndex - 1;
    if (participants[participantIndex]) {
      getCertificateDataUrl(participants[participantIndex].name, participants[participantIndex].cert_date)
        .then(setCurrentCertUrl);
    }
  }, [currentIndex, participants]);

  if (loading) return <div style={S.load}>Loading Presentation...</div>;

  // Handle case where no participants are registered for the selected day
  if (participants.length === 0) {
    return (
      <div style={S.container}>
        <div style={S.textSlide}>
          <h1 style={S.mainTitle}>No Participants Found</h1>
          <p style={S.desc}>There are no registered participants for {trainingDayLabel} yet.</p>
          <button 
            onClick={() => window.history.back()} 
            style={{marginTop: '30px', padding: '10px 20px', background: '#c9a84c', border: 'none', cursor: 'pointer', borderRadius: '5px', fontWeight: 'bold'}}
          >
            Go Back to Admin
          </button>
        </div>
      </div>
    );
  }

  const isIntro = currentIndex === 0;
  const isEnding = currentIndex === totalSlides - 1;

  return (
    <div style={S.container}>
      {/* Background glow for ambience */}
      <div style={S.bgGlow}></div>

      <div style={{ 
        ...S.slideWrapper, 
        opacity: isVisible ? 1 : 0, 
        transform: isVisible ? 'scale(1) translateY(0)' : 'scale(0.98) translateY(10px)' 
      }}>
        
        {/* INTRO SLIDE */}
        {isIntro && (
          <div style={S.textSlide}>
            <h2 style={S.subTitle}>{fullThemeTitle}</h2>
            <h1 style={S.mainTitle}>Recognition Rites</h1>
            <div style={S.divider}></div>
            <p style={S.desc}>Presentation of Certificates for <br/><strong>{trainingDayLabel}</strong></p>
          </div>
        )}

        {/* CERTIFICATE SLIDE (Participants) */}
        {!isIntro && !isEnding && currentCertUrl && (
          <div style={S.certWrapper}>
            <img src={currentCertUrl} alt="Certificate" style={S.certImg} />
          </div>
        )}

        {/* ENDING SLIDE */}
        {isEnding && (
          <div style={S.textSlide}>
            <h1 style={S.mainTitle}>Congratulations!</h1>
            <p style={S.desc}>To all the participants of {trainingDayLabel}</p>
            <div style={S.divider}></div>
            <h2 style={S.subTitle}>Thank you for participating!</h2>
            <p style={{...S.desc, fontSize: '14px', marginTop: '40px', fontStyle: 'normal', opacity: 0.6}}>{fullThemeTitle}</p>
          </div>
        )}

      </div>
      
      {/* Progress Indicator */}
      <div style={S.counter}>
        {isIntro ? 'BEGIN PRESENTATION' : isEnding ? 'END OF SESSION' : `PARTICIPANT ${currentIndex} OF ${participants.length}`}
      </div>

      {/* Subtle Hint for the operator */}
      <div style={S.hint}>Use Arrow Keys to Navigate</div>
    </div>
  );
}

const S = {
  container: { backgroundColor: '#050505', height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', fontFamily: "'Playfair Display', serif", position: 'relative' },
  bgGlow: { position: 'absolute', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(201, 168, 76, 0.08) 0%, rgba(0,0,0,0) 70%)', top: '25%', left: '25%', zIndex: 0 },
  slideWrapper: { display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.4s ease-out', width: '100%', height: '100%', zIndex: 1 },
  certWrapper: { padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', boxShadow: '0 30px 60px rgba(0,0,0,0.5)' },
  certImg: { maxHeight: '88vh', maxWidth: '90vw', objectFit: 'contain', display: 'block' },
  textSlide: { textAlign: 'center', color: '#fff', padding: '0 10%' },
  mainTitle: { fontSize: '72px', margin: '20px 0', color: '#c9a84c', textTransform: 'uppercase', letterSpacing: '4px', fontWeight: 'bold', textShadow: '0 4px 10px rgba(0,0,0,0.5)' },
  subTitle: { fontSize: '18px', color: '#fff', fontWeight: '300', letterSpacing: '2px', lineHeight: '1.6', maxWidth: '800px', margin: '0 auto', opacity: 0.9 },
  desc: { fontSize: '26px', color: '#ddd', marginTop: '20px', fontStyle: 'italic', fontWeight: '300' },
  divider: { width: '150px', height: '2px', background: 'linear-gradient(90deg, transparent, #c9a84c, transparent)', margin: '40px auto' },
  counter: { position: 'absolute', bottom: '30px', left: '40px', color: 'rgba(201, 168, 76, 0.4)', fontSize: '11px', fontFamily: 'sans-serif', letterSpacing: '2px', fontWeight: 'bold' },
  hint: { position: 'absolute', bottom: '30px', right: '40px', color: 'rgba(255, 255, 255, 0.1)', fontSize: '10px', fontFamily: 'sans-serif', letterSpacing: '1px' },
  load: { height: '100vh', background: '#000', color: '#c9a84c', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '20px', letterSpacing: '2px' }
};
