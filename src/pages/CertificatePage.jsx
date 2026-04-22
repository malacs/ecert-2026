import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { getCertificateDataUrl, downloadCertificate } from '../certificateGenerator';

export default function CertificatePage() {
  const { name, day } = useParams();

  // Decode and basic cleanup for display
  const displayName = decodeURIComponent(name || '').replace(/\s+/g, ' ').trim();

  const [imgSrc, setImgSrc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [participantRole, setParticipantRole] = useState('Student');

  useEffect(() => {
    const loadCertificate = async () => {
      if (!displayName) {
        setError('No participant name provided.');
        setLoading(false);
        return;
      }

      try {
        // SUPER-CLEAN SEARCH: Remove dots and symbols to ensure "L." matches "L"
        const cleanSearch = displayName
          .replace(/\./g, '') // Removes dots
          .replace(/\s+/g, ' ') 
          .trim();

        const { data, error: dbError } = await supabase
          .from('participants')
          .select('role, name')
          // Using % wildcards and loose naming to catch variations
          .ilike('name', `%${cleanSearch}%`)
          .eq('cert_date', day)
          .maybeSingle();

        if (dbError || !data) {
          setError('Certificate not found in our records.');
          setLoading(false);
          return;
        }

        const role = data.role || 'Student';
        setParticipantRole(role);

        // ALWAYS use data.name from DB for the actual image generation
        const imgData = await getCertificateDataUrl(data.name, day || null, role);
        setImgSrc(imgData);
      } catch (err) {
        setError('Failed to load certificate details.');
      } finally {
        setLoading(false);
      }
    };

    loadCertificate();
  }, [displayName, day]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      // Use the CLEAN name from the database for the PDF filename
      await downloadCertificate(displayName, day || null, participantRole);
    } catch (err) {
      alert("Download failed.");
    }
    setDownloading(false);
  };

  return (
    <div style={styles.page}>
      <div style={styles.heroSection}>
        <div style={styles.headerInner}>
          <div style={styles.badge}>DATA INSIGHTS 2026</div>
          <h1 style={styles.headerTitle}>Verification Portal</h1>
          <p style={styles.headerSub}>Official Digital Credentials</p>
        </div>
      </div>

      <div style={styles.content}>
        {loading ? (
          <div style={styles.centerBox}><div style={styles.spinner} /><p>Verifying Credential...</p></div>
        ) : error ? (
          <div style={styles.centerBox}>
            <p style={{ color: '#ef4444', marginBottom: '20px' }}>{error}</p>
            <Link to="/" style={styles.btnSecondary}>Back to Search</Link>
          </div>
        ) : (
          <div style={styles.certWrap}>
            <div style={styles.infoCard}>
              <p style={styles.issuedTo}>This certificate is officially issued to:</p>
              <h2 style={styles.nameHeader}>{displayName}</h2>
              <span style={styles.roleTag}>{participantRole === 'Speaker' ? 'Resource Speaker' : 'Participant'}</span>
            </div>

            <div style={styles.imgShadowBox}>
              <img src={imgSrc} alt="Certificate" style={styles.certImg} />
            </div>

            <div style={styles.actions}>
              <button onClick={handleDownload} disabled={downloading} style={styles.btnDownload}>
                {downloading ? 'Generating PDF...' : 'Download Official PDF'}
              </button>
              <Link to="/" style={styles.btnSecondary}>Back to Portal</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#0f172a', fontFamily: 'Inter, sans-serif', color: '#fff', boxSizing: 'border-box' },
  heroSection: { background: 'radial-gradient(circle at top, #1e293b 0%, #0f172a 100%)', padding: '60px 20px', textAlign: 'center', borderBottom: '1px solid rgba(201, 168, 76, 0.2)' },
  badge: { color: '#c9a84c', fontSize: '12px', fontWeight: 'bold', letterSpacing: '2px', marginBottom: '10px' },
  headerTitle: { fontSize: 'calc(24px + 1vw)', fontWeight: '800', margin: '0' },
  headerSub: { color: '#94a3b8', fontSize: '16px', marginTop: '5px' },
  content: { maxWidth: '1000px', margin: '-40px auto 40px', padding: '0 15px', boxSizing: 'border-box' },
  infoCard: { background: '#1e293b', padding: '30px 20px', borderRadius: '16px', textAlign: 'center', marginBottom: '30px', border: '1px solid rgba(255,255,255,0.1)', boxSizing: 'border-box' },
  issuedTo: { color: '#94a3b8', fontSize: '14px', marginBottom: '5px' },
  nameHeader: { fontSize: '24px', color: '#fff', margin: '0 0 10px 0', wordBreak: 'break-word', textTransform: 'uppercase' },
  roleTag: { background: 'rgba(201, 168, 76, 0.15)', color: '#c9a84c', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', border: '1px solid #c9a84c' },
  imgShadowBox: { borderRadius: '8px', overflow: 'hidden', boxShadow: '0 0 40px rgba(0,0,0,0.5)', border: '4px solid #1e293b', maxWidth: '100%' },
  certImg: { width: '100%', height: 'auto', display: 'block' },
  actions: { marginTop: '40px', display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' },
  btnDownload: { background: '#c9a84c', color: '#000', padding: '14px 28px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', minWidth: '200px' },
  btnSecondary: { background: 'transparent', color: '#fff', padding: '14px 28px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', textDecoration: 'none', fontWeight: '600', minWidth: '200px', textAlign: 'center' },
  centerBox: { textAlign: 'center', padding: '100px 0' },
  spinner: { width: 40, height: 40, border: '4px solid #334155', borderTop: '4px solid #c9a84c', borderRadius: '50%', margin: '0 auto 20px', animation: 'spin 1s linear infinite' },
};
