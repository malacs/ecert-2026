import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { getCertificateDataUrl } from '../certificateGenerator';

export default function PresentationPage() {
  const [participants, setParticipants] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0); // 0 will be Intro
  const [currentCertUrl, setCurrentCertUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(true);

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

  // Total slides = Participants + Intro (1) + Ending (1)
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
    // Only fetch certificate if we are NOT on Intro (0) or Ending (last)
    const participantIndex = currentIndex - 1;
    if (participants[participantIndex]) {
      getCertificateDataUrl(participants[participantIndex].name, participants[participantIndex].cert_date)
        .then(setCurrentCertUrl);
    }
  }, [currentIndex, participants]);

  if (loading) return <div style={S.load}>Loading...</div>;

  // Logic to determine what to show
  const isIntro = currentIndex === 0;
  const isEnding = currentIndex === totalSlides - 1;
  const currentParticipant = participants[currentIndex - 1];

  return (
    <div style={S.container}>
      <div style={{ ...S.slideWrapper, opacity: isVisible ? 1 : 0, transform: isVisible ? 'scale(1)' : 'scale(0.95)' }}>
        
        {/* INTRO SLIDE */}
        {isIntro && (
          <div style={S.textSlide}>
            <h2 style={S.subTitle}>DATA INSIGHTS 2026</h2>
            <h1 style={S.mainTitle}>Recognition Rites</h1>
            <div style={S.divider}></div>
            <p style={S.desc}>Virtual Awarding of E-Certificates</p>
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
            <p style={S.desc}>To all the participants of Day 1 - 5</p>
            <div style={S.divider}></div>
            <h2 style={S.subTitle}>Thank you for joining us!</h2>
          </div>
        )}

      </div>
      
      <div style={S.counter}>
        {isIntro ? 'START' : isEnding ? 'END' : `${currentIndex} / ${participants.length}`}
      </div>
    </div>
  );
}

const S = {
  container: { backgroundColor: '#000', height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', fontFamily: 'serif' },
  slideWrapper: { display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.5s ease-in-out', width: '100%', height: '100%' },
  certImg: { maxHeight: '92vh', maxWidth: '92vw', boxShadow: '0 0 100px rgba(201, 168, 76, 0.2)', objectFit: 'contain' },
  textSlide: { textAlign: 'center', color: '#fff', padding: '40px' },
  mainTitle: { fontSize: '64px', margin: '10px 0', color: '#c9a84c', textTransform: 'uppercase', letterSpacing: '4px' },
  subTitle: { fontSize: '24px', color: '#fff', fontWeight: '300', letterSpacing: '2px' },
  desc: { fontSize: '20px', color: '#aaa', marginTop: '20px', fontStyle: 'italic' },
  divider: { width: '100px', height: '2px', background: '#c9a84c', margin: '30px auto' },
  counter: { position: 'absolute', bottom: '20px', right: '30px', color: 'rgba(255,255,255,0.2)', fontSize: '14px', fontFamily: 'sans-serif' },
  load: { height: '100vh', background: '#000', color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center' }
};
