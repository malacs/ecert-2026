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

        // 1. Try fetching by ID (Modern Method)
        if (id && id.length > 10) { 
          const { data: record } = await supabase
            .from('participants')
            .select('*')
            .eq('id', id)
            .single();
          data = record;
        }

        // 2. Fallback: Search by Name and Day (Manual/Old Links)
        if (!data && name && day) {
          const decodedName = decodeURIComponent(name).replace(/\+/g, ' ').trim();
          const { data: record } = await supabase
            .from('participants')
            .select('*')
            .ilike('name', `%${decodedName}%`)
            .eq('cert_date', day)
            .maybeSingle();
          data = record;
        }

        if (!data) {
          setError(`No record found. Please verify the link or check the spelling.`);
          return;
        }

        setParticipant(data);
        const previewUrl = await getCertificateDataUrl(data.name, data.cert_date, data.role);
        setImgSrc(previewUrl);

      } catch (err) {
        console.error(err);
        setError("Error loading the verification portal.");
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

  if (loading) return (
    <div style={styles.fullPageCenter}>
      <p>Verifying Digital Credentials...</p>
    </div>
  );

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.badge}>DATA INSIGHTS 2026</div>
        <h1 style={styles.mainTitle}>Verification Portal</h1>
        <p style={styles.subtitle}>Official Digital Credentials</p>
      </header>

      <main style={styles.content}>
        {error ? (
          <div style={styles.card}>
            <p style={{ color: '#ff4d4d', marginBottom: '20px' }}>{error}</p>
            <Link to="/" style={styles.btnSecondary}>Return to Search</Link>
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

            <div style={styles.previewBox}>
              {imgSrc ? (
                <img src={imgSrc} alt="Certificate" style={styles.image} />
              ) : (
                <p style={{color: '#64748b'}}>Rendering Preview...</p>
              )}
            </div>

            <div style={styles.actionButtons}>
              <button onClick={handleDownload} disabled={downloading} style={styles.btnPrimary}>
                {downloading ? 'PREPARING PDF...' : 'DOWNLOAD CERTIFICATE'}
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
  fullPageCenter: { minHeight: '100vh', backgroundColor: '#0f172a', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff' },
  container: { minHeight: '100vh', backgroundColor: '#0f172a', color: '#fff', fontFamily: 'sans-serif', paddingBottom: '60px' },
  header: { backgroundColor: '#1e293b', padding: '50px 20px', textAlign: 'center', borderBottom: '3px solid #c9a84c', marginBottom: '40px' },
  badge: { color: '#c9a84c', fontSize: '12px', fontWeight: 'bold', letterSpacing: '3px' },
  mainTitle: { fontSize: '32px', margin: '10px 0', fontWeight: '800' },
  subtitle: { color: '#94a3b8', fontSize: '14px' },
  content: { maxWidth: '900px', margin: '0 auto', padding: '0 20px' },
  card: { backgroundColor: '#1e293b', borderRadius: '16px', padding: '40px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' },
  infoSection: { marginBottom: '30px' },
  label: { color: '#94a3b8', fontSize: '14px' },
  nameDisplay: { fontSize: '28px', textTransform: 'uppercase', margin: '15px 0' },
  roleTag: { display: 'inline-block', border: '1px solid #c9a84c', color: '#c9a84c', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold' },
  previewBox: { backgroundColor: '#0f172a', padding: '10px', borderRadius: '8px', marginBottom: '30px' },
  image: { width: '100%', borderRadius: '4px', display: 'block' },
  actionButtons: { display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' },
  btnPrimary: { backgroundColor: '#c9a84c', color: '#000', padding: '16px 30px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer' },
  btnSecondary: { backgroundColor: 'transparent', color: '#fff', padding: '16px 30px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', textDecoration: 'none' }
};
