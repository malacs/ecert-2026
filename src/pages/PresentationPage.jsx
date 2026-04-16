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
      // 1. Get the 'day' parameter from the URL (sent by Admin Page)
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
      if (e.key === 'ArrowRight' || e.key === ' ') changeSlide('next');
      if (e.key === 'ArrowLeft') changeSlide('prev');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [changeSlide]);

  useEffect(() => {
    // Only fetch certificate if we are between Intro and Ending
    const participantIndex = currentIndex - 1;
    if (participants[participantIndex]) {
      getCertificateDataUrl(participants[participantIndex].name, participants[participantIndex].cert_date)
        .then(setCurrentCertUrl);
    }
  }, [currentIndex, participants]);

  if (loading) return <div style={S.load}>Loading Presentation...</div>;

  const isIntro = currentIndex === 0;
  const isEnding = currentIndex === totalSlides - 1;

  return (
    <div style={S.container}>
      <div style={{ ...S.slideWrapper, opacity: isVisible ? 1 : 0, transform: isVisible ? 'scale(1)' : 'scale(0.95)' }}>
        
        {/* INTRO SLIDE */}
        {isIntro && (
          <div style={S.textSlide}>
            <h2 style={S.subTitle}>{fullThemeTitle}</h2>
            <h1 style={S.mainTitle}>Recognition Rites</h1>
            <div style={S.divider}></div>
            <p style={S.desc}>Presentation of Certificates for {trainingDayLabel}</p>
          </div>
        )}

        {/* CERTIFICATE SLIDE */}
        {!isIntro && !isEnding && currentCertUrl && (
          <img src={currentCertUrl} alt="Certificate" style={S.certImg} />
        )}

        {/* ENDING SLIDE */}
        {isEnding && (
          <div style={S.textSlide}>
            <h1 style={S.mainTitle}>Congratulations!</h1>
            <p style={S.desc}>To all the participants of {trainingDayLabel}</p>
            <div style={S.divider}></div>
            <h2 style={S.subTitle}>Thank you for participating!</h2>
            <p style={{...S.desc, fontSize: '14px', marginTop: '40px'}}>{fullThemeTitle}</p>
          </div>
        )}

      </div>
      
      <div style={S.counter}>
        {isIntro ? 'INTRO' : isEnding ? 'FINISH' : `${currentIndex} / ${participants.length}`}
      </div>
    </div>
  );
}

const S = {
  container: { backgroundColor: '#000', height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', fontFamily: 'serif' },
  slideWrapper: { display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.5s ease-in-out', width: '100%', height: '100%' },
  certImg: { maxHeight: '92vh', maxWidth: '92vw', boxShadow: '0 0 100px rgba(201, 168, 76, 0.15)', objectFit: 'contain' },
  textSlide: { textAlign: 'center', color: '#fff', padding: '0 10%' },
  mainTitle: { fontSize: '72px', margin: '20px 0', color: '#c9a84c', textTransform: 'uppercase', letterSpacing: '4px', fontWeight: 'bold' },
  subTitle: { fontSize: '18px', color: '#fff', fontWeight: '300', letterSpacing: '2px', lineHeight: '1.6', maxWidth: '800px', margin: '0 auto' },
  desc: { fontSize: '24px', color: '#ccc', marginTop: '20px', fontStyle: 'italic' },
  divider: { width: '120px', height: '3px', background: '#c9a84c', margin: '40px auto' },
  counter: { position: 'absolute', bottom: '20px', right: '30px', color: 'rgba(255,255,255,0.1)', fontSize: '12px', fontFamily: 'sans-serif' },
  load: { height: '100vh', background: '#000', color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center' }
};
