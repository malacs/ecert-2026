import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { getCertificateDataUrl, downloadCertificate } from '../certificateGenerator';

export default function CertificatePage() {
  const { id, name, day } = useParams();
  const [imgSrc, setImgSrc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [participant, setParticipant] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchRecord = async () => {
      try {
        setLoading(true);
        let data = null;

        if (id) {
          // New ID-based lookup
          const { data: record } = await supabase.from('participants').select('*').eq('id', id).single();
          data = record;
        } else if (name && day) {
          // Fallback for old name/day links
          const cleanName = decodeURIComponent(name).replace(/\+/g, ' ').trim();
          const { data: record } = await supabase.from('participants').select('*')
            .ilike('name', `%${cleanName}%`).eq('cert_date', day).maybeSingle();
          data = record;
        }

        if (!data) {
          setError("Certificate record not found.");
          return;
        }

        setParticipant(data);
        const previewUrl = await getCertificateDataUrl(data.name, data.cert_date, data.role);
        setImgSrc(previewUrl);
      } catch (err) {
        setError("Technical error loading certificate.");
      } finally {
        setLoading(false);
      }
    };
    fetchRecord();
  }, [id, name, day]);

  const handleDownload = async () => {
    if (!participant) return;
    setDownloading(true);
    await downloadCertificate(participant.name, participant.cert_date, participant.role);
    setDownloading(false);
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.badge}>DATA INSIGHTS 2026</div>
        <h1 style={styles.mainTitle}>Verification Portal</h1>
      </header>

      <main style={styles.content}>
        {loading ? (
          <div style={styles.card}><p>Verifying Credentials...</p></div>
        ) : error ? (
          <div style={styles.card}>
            <p style={{ color: '#ff4d4d' }}>{error}</p>
            <Link to="/" style={styles.btnSecondary}>Back to Search</Link>
          </div>
        ) : (
          <div style={styles.card}>
            <h2 style={styles.nameDisplay}>{participant.name}</h2>
            <div style={styles.previewBox}>
              <img src={imgSrc} alt="Certificate" style={{ width: '100%' }} />
            </div>
            <div style={styles.actionButtons}>
              <button onClick={handleDownload} disabled={downloading} style={styles.btnPrimary}>
                {downloading ? 'Generating...' : 'DOWNLOAD PDF'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', backgroundColor: '#0f172a', color: '#fff', textAlign: 'center' },
  header: { backgroundColor: '#1e293b', padding: '40px', borderBottom: '3px solid #c9a84c' },
  badge: { color: '#c9a84c', letterSpacing: '3px', fontSize: '12px', fontWeight: 'bold' },
  mainTitle: { fontSize: '28px', margin: '10px 0' },
  content: { maxWidth: '800px', margin: '20px auto', padding: '20px' },
  card: { backgroundColor: '#1e293b', padding: '30px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.1)' },
  nameDisplay: { textTransform: 'uppercase', marginBottom: '20px' },
  previewBox: { backgroundColor: '#000', padding: '5px', borderRadius: '5px', marginBottom: '20px' },
  btnPrimary: { backgroundColor: '#c9a84c', color: '#000', padding: '15px 30px', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },
  btnSecondary: { color: '#fff', textDecoration: 'none', marginTop: '10px', display: 'block' }
};
