import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { getCertificateDataUrl, downloadCertificate } from '../certificateGenerator';

export default function CertificatePage() {
  // We pull name and day from the URL (e.g., /certificate/MARVIN/1)
  const { name, day } = useParams();
  
  const [imgSrc, setImgSrc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [participant, setParticipant] = useState(null);

  useEffect(() => {
    const fetchRecord = async () => {
      try {
        setLoading(true);
        const decodedName = decodeURIComponent(name).trim();

        // 1. DATABASE LOOKUP
        // We use .ilike and % wildcards so 'marvin' matches 'MARVIN G. ALTERADO'
        const { data, error: dbError } = await supabase
          .from('participants')
          .select('*')
          .ilike('name', `%${decodedName}%`)
          .eq('cert_date', day)
          .maybeSingle();

        if (dbError || !data) {
          setError(`No record found for "${decodedName}" on Day ${day}. Please check the link.`);
          setLoading(false);
          return;
        }

        setParticipant(data);

        // 2. GENERATE PREVIEW
        // This calls your Canvas-based generator
        const previewUrl = await getCertificateDataUrl(data.name, data.cert_date, data.role);
        setImgSrc(previewUrl);
      } catch (err) {
        console.error(err);
        setError("Technical error loading the certificate.");
      } finally {
        setLoading(false);
      }
    };

    if (name && day) {
      fetchRecord();
    }
  }, [name, day]);

  const handleDownload = async () => {
    if (!participant) return;
    setDownloading(true);
    try {
      await downloadCertificate(participant.name, participant.cert_date, participant.role);
    } catch (err) {
      alert("Download failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.eventBadge}>DATA INSIGHTS 2026</div>
        <h1 style={styles.title}>Verification Portal</h1>
        <p style={styles.subtitle}>Official Digital Credentials</p>
      </header>

      <main style={styles.mainContent}>
        {loading ? (
          <div style={styles.statusBox}>
            <div className="spinner"></div>
            <p>Verifying participant records...</p>
          </div>
        ) : error ? (
          <div style={styles.statusBox}>
            <p style={{ color: '#ff4d4d', fontSize: '18px' }}>{error}</p>
            <Link to="/" style={styles.btnSecondary}>Back to Search</Link>
          </div>
        ) : (
          <div style={styles.certCard}>
            <div style={styles.verifyInfo}>
              <p style={styles.label}>This certificate is officially issued to:</p>
              <h2 style={styles.participantName}>{participant.name}</h2>
              <span style={styles.roleTag}>
                {participant.role === 'Speaker' ? 'Resource Speaker' : 'Student Participant'}
              </span>
            </div>

            <div style={styles.imageContainer}>
              <img src={imgSrc} alt="Certificate Preview" style={styles.certPreview} />
            </div>

            <div style={styles.actionArea}>
              <button 
                onClick={handleDownload} 
                disabled={downloading} 
                style={styles.btnPrimary}
              >
                {downloading ? 'Preparing PDF...' : 'Download Certificate'}
              </button>
              <Link to="/" style={styles.btnSecondary}>Verify Another</Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Styles to keep the Dark UI theme consistent
const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#0f172a',
    color: '#ffffff',
    fontFamily: '"Inter", sans-serif',
    paddingBottom: '50px',
  },
  header: {
    backgroundColor: '#1e293b',
    padding: '60px 20px',
    textAlign: 'center',
    borderBottom: '2px solid #c9a84c',
  },
  eventBadge: {
    color: '#c9a84c',
    fontSize: '14px',
    fontWeight: 'bold',
    letterSpacing: '3px',
    marginBottom: '10px',
  },
  title: { fontSize: '32px', margin: '0', fontWeight: '800' },
  subtitle: { color: '#94a3b8', marginTop: '5px' },
  mainContent: {
    maxWidth: '1000px',
    margin: '-40px auto 0',
    padding: '0 20px',
  },
  statusBox: {
    backgroundColor: '#1e293b',
    padding: '100px 20px',
    borderRadius: '16px',
    textAlign: 'center',
    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
  },
  certCard: {
    backgroundColor: '#1e293b',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  verifyInfo: {
    padding: '40px 20px',
    textAlign: 'center',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  },
  label: { color: '#94a3b8', marginBottom: '10px' },
  participantName: { fontSize: '28px', textTransform: 'uppercase', margin: '0 0 15px 0' },
  roleTag: {
    border: '1px solid #c9a84c',
    color: '#c9a84c',
    padding: '5px 15px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  imageContainer: {
    padding: '20px',
    backgroundColor: '#0f172a',
  },
  certPreview: {
    width: '100%',
    height: 'auto',
    borderRadius: '4px',
    display: 'block',
  },
  actionArea: {
    padding: '40px 20px',
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
    flexWrap: 'wrap',
  },
  btnPrimary: {
    backgroundColor: '#c9a84c',
    color: '#000',
    padding: '15px 35px',
    borderRadius: '8px',
    border: 'none',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'transform 0.2s',
  },
  btnSecondary: {
    backgroundColor: 'transparent',
    color: '#fff',
    padding: '15px 35px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.3)',
    textDecoration: 'none',
    fontWeight: 'bold',
    fontSize: '16px',
  },
};
