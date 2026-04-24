import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { getCertificateDataUrl, downloadCertificate } from '../certificateGenerator';

export default function CertificatePage() {
  const { name, day } = useParams();
  const [imgSrc, setImgSrc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [participant, setParticipant] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchRecord = async () => {
      try {
        setLoading(true);
        // Fix for mobile: handle plus signs and URL encoded spaces
        const decodedName = decodeURIComponent(name).replace(/\+/g, ' ').trim();

        const { data, error: dbError } = await supabase
          .from('participants')
          .select('*')
          .ilike('name', `%${decodedName}%`)
          .eq('cert_date', day)
          .maybeSingle();

        if (dbError || !data) {
          setError(`No record found for "${decodedName}" on Day ${day}.`);
          setLoading(false);
          return;
        }

        setParticipant(data);
        const previewUrl = await getCertificateDataUrl(data.name, data.cert_date, data.role);
        setImgSrc(previewUrl);
      } catch (err) {
        setError("Technical error loading the certificate.");
      } finally {
        setLoading(false);
      }
    };

    if (name && day) fetchRecord();
  }, [name, day]);

  const handleDownload = async () => {
    if (!participant) return;
    setDownloading(true);
    await downloadCertificate(participant.name, participant.cert_date, participant.role);
    setDownloading(false);
  };

  return (
    <div style={styles.container}>
      {/* Restored your high-end Header */}
      <header style={styles.header}>
        <div style={styles.badge}>DATA INSIGHTS 2026</div>
        <h1 style={styles.mainTitle}>Verification Portal</h1>
        <p style={styles.subtitle}>OFFICIAL DIGITAL CREDENTIALS</p>
      </header>

      <main style={styles.content}>
        {loading ? (
          <div style={styles.card}>
            <p style={{ color: '#94a3b8' }}>Verifying security credentials...</p>
          </div>
        ) : error ? (
          <div style={styles.card}>
            <p style={{ color: '#ff4d4d', fontSize: '18px' }}>{error}</p>
            <Link to="/" style={styles.btnSecondary}>Back to Search</Link>
          </div>
        ) : (
          <div style={styles.card}>
            <div style={styles.infoSection}>
              <p style={styles.label}>This certificate is officially issued to:</p>
              <h2 style={styles.nameDisplay}>{participant.name}</h2>
              <div style={styles.roleTag}>
                {participant.role === 'Speaker' ? 'Resource Speaker' : 'Student Participant'}
              </div>
            </div>

            {/* Restored the large certificate preview box */}
            <div style={styles.previewBox}>
              {imgSrc ? (
                <img src={imgSrc} alt="Preview" style={styles.image} />
              ) : (
                <p>Generating high-resolution preview...</p>
              )}
            </div>

            <div style={styles.actionButtons}>
              <button 
                onClick={handleDownload} 
                disabled={downloading} 
                style={styles.btnPrimary}
              >
                {downloading ? 'Preparing PDF...' : 'DOWNLOAD CERTIFICATE'}
              </button>
              <Link to="/" style={styles.btnSecondary}>Verify Another</Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#0f172a',
    color: '#fff',
    fontFamily: '"Inter", Arial, sans-serif',
    paddingBottom: '60px',
  },
  header: {
    backgroundColor: '#1e293b',
    padding: '50px 20px',
    textAlign: 'center',
    borderBottom: '3px solid #c9a84c',
    marginBottom: '40px',
  },
  badge: {
    color: '#c9a84c',
    fontSize: '14px',
    fontWeight: 'bold',
    letterSpacing: '4px',
    marginBottom: '8px',
  },
  mainTitle: { fontSize: '36px', margin: '0', fontWeight: '900' },
  subtitle: { color: '#64748b', fontSize: '12px', letterSpacing: '2px', marginTop: '5px' },
  content: { maxWidth: '900px', margin: '0 auto', padding: '0 20px' },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: '16px',
    padding: '40px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    border: '1px solid rgba(255,255,255,0.1)',
    textAlign: 'center',
  },
  infoSection: { marginBottom: '30px' },
  label: { color: '#94a3b8', fontSize: '14px', marginBottom: '10px' },
  nameDisplay: { fontSize: '32px', textTransform: 'uppercase', margin: '10px 0', color: '#fff' },
  roleTag: {
    display: 'inline-block',
    border: '1px solid #c9a84c',
    color: '#c9a84c',
    padding: '4px 16px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  previewBox: {
    backgroundColor: '#0f172a',
    padding: '10px',
    borderRadius: '8px',
    margin: '30px 0',
    border: '1px solid #334155',
    boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  },
  image: { width: '100%', borderRadius: '4px', display: 'block' },
  actionButtons: { display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' },
  btnPrimary: {
    backgroundColor: '#c9a84c',
    color: '#000',
    padding: '16px 40px',
    borderRadius: '8px',
    border: 'none',
    fontWeight: '900',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  btnSecondary: {
    backgroundColor: 'transparent',
    color: '#fff',
    padding: '16px 40px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.2)',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '600',
  },
};
