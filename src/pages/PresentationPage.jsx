import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { getCertificateDataUrl } from '../certificateGenerator';

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
      const params = new URLSearchParams(window.location.search);
      const selectedDay = params.get('day');
      const selectedRole = params.get('role'); // Get role from URL

      if (selectedDay && DAY_MAP[selectedDay]) {
        setTrainingDayLabel(DAY_MAP[selectedDay]);
      }

      let query = supabase.from('participants').select('*');
      
      if (selectedDay) query = query.eq('cert_date', selectedDay);
      // New Role Filter Logic
      if (selectedRole && selectedRole !== 'All') {
        query = query.eq('role', selectedRole);
      }

      const { data } = await query;
      if (data) {
        // Sort alphabetically for a professional presentation
        const sorted = data.sort((a, b) => a.name.localeCompare(b.name));
        setParticipants(sorted);
      }
      setLoading(false);
    };
    fetchParticipants();
  }, []);

  const totalSlides = participants.length + 2;

  const changeSlide = useCallback((direction) => {
    setIsVisible(false);
    setTimeout(() => {
      if (direction === 'next' && currentIndex < totalSlides - 1) {
        setCurrentIndex(prev => prev + 1);
      } else if (direction === 'prev' && currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
      }
      setIsVisible(true);
    }, 300);
  }, [currentIndex, totalSlides]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') changeSlide('next');
      if (e.key === 'ArrowLeft' || e.key === 'Backspace') changeSlide('prev');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [changeSlide]);

  useEffect(() => {
    const participantIndex = currentIndex - 1;
    if (participants[participantIndex]) {
      getCertificateDataUrl(participants[participantIndex].name, participants[participantIndex].cert_date)
        .then(setCurrentCertUrl);
    }
  }, [currentIndex, participants]);

  if (loading) return <div style={S.load}>Preparing Stage...</div>;

  if (participants.length === 0) {
    return (
      <div style={S.container}>
        <div style={S.textSlide}>
          <h1 style={S.mainTitle}>No Records Found</h1>
          <p style={S.desc}>No participants match the selected criteria for {trainingDayLabel}.</p>
          <button onClick={() => window.history.back()} style={S.backBtn}>Return to Admin</button>
        </div>
      </div>
    );
  }

  const isIntro = currentIndex === 0;
  const isEnding = currentIndex === totalSlides - 1;

  return (
    <div style={S.container}>
      <div style={{ ...S.slideWrapper, opacity: isVisible ? 1 : 0, transform: isVisible ? 'scale(1)' : 'scale(0.98)' }}>
        {isIntro && (
          <div style={S.textSlide}>
            <h2 style={S.subTitle}>{fullThemeTitle}</h2>
            <h1 style={S.mainTitle}>Recognition Rites</h1>
            <div style={S.divider}></div>
            <p style={S.desc}>Presentation of Certificates for <br/><strong>{trainingDayLabel}</strong></p>
          </div>
        )}

        {!isIntro && !isEnding && currentCertUrl && (
          <div style={S.certWrapper}>
            <img src={currentCertUrl} alt="Certificate" style={S.certImg} />
          </div>
        )}

        {isEnding && (
          <div style={S.textSlide}>
            <h1 style={S.mainTitle}>Congratulations!</h1>
            <p style={S.desc}>To all the participants of {trainingDayLabel}</p>
            <div style={S.divider}></div>
            <h2 style={S.subTitle}>Thank you for participating!</h2>
          </div>
        )}
      </div>
      
      <div style={S.counter}>
        {isIntro ? 'READY' : isEnding ? 'END' : `SLIDE ${currentIndex} OF ${participants.length}`}
      </div>
    </div>
  );
}

const S = {
  container: { backgroundColor: '#000', height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative', fontFamily: 'serif' },
  slideWrapper: { display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.4s ease-out', width: '100%', height: '100%' },
  certWrapper: { display: 'flex', justifyContent: 'center', alignItems: 'center' },
  certImg: { maxHeight: '94vh', maxWidth: '94vw', objectFit: 'contain', boxShadow: '0 0 50px rgba(201, 168, 76, 0.3)' },
  textSlide: { textAlign: 'center', color: '#fff', padding: '0 10%' },
  mainTitle: { fontSize: '64px', margin: '20px 0', color: '#c9a84c', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 'bold' },
  subTitle: { fontSize: '18px', color: '#fff', fontWeight: '300', letterSpacing: '1px', lineHeight: '1.6', maxWidth: '800px', margin: '0 auto' },
  desc: { fontSize: '24px', color: '#bbb', marginTop: '20px', fontStyle: 'italic' },
  divider: { width: '100px', height: '2px', background: '#c9a84c', margin: '40px auto' },
  counter: { position: 'absolute', bottom: '20px', right: '30px', color: 'rgba(255, 255, 255, 0.2)', fontSize: '11px', fontFamily: 'sans-serif', letterSpacing: '1px' },
  load: { height: '100vh', background: '#000', color: '#c9a84c', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '20px' },
  backBtn: { marginTop: '30px', padding: '10px 25px', background: '#c9a84c', border: 'none', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold', color: '#000' }
};
