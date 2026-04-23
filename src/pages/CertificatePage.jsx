import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { getCertificateDataUrl, downloadCertificate } from '../certificateGenerator';

export default function CertificatePage() {
  const { name, day } = useParams();
  const participantName = decodeURIComponent(name || '').trim();

  const [imgSrc, setImgSrc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [participantRole, setParticipantRole] = useState('Student');

  useEffect(() => {
    const loadCertificate = async () => {
      if (!participantName) {
        setError('Invalid Link.');
        setLoading(false);
        return;
      }

      try {
        // LOOSE FETCH: Find the person even if the link has slightly different spacing
        const { data, error: dbError } = await supabase
          .from('participants')
          .select('role, name')
          .ilike('name', `%${participantName}%`) // Loose matching for URL links
          .eq('cert_date', day)
          .maybeSingle();

        if (dbError || !data) {
          setError('Certificate not found. Ensure the link is correct.');
          setLoading(false);
          return;
        }

        setParticipantRole(data.role || 'Student');
        const imgData = await getCertificateDataUrl(data.name, day, data.role || 'Student');
        setImgSrc(imgData);
      } catch (err) {
        setError('Error loading credential.');
      } finally {
        setLoading(false);
      }
    };

    loadCertificate();
  }, [participantName, day]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadCertificate(participantName, day, participantRole);
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
        </div>
      </div>

      <div style={styles.content}>
        {loading ? (
          <div style={styles.centerBox}><div style={styles.spinner} /><p>Verifying...</p></div>
        ) : error ? (
          <div style={styles.centerBox}>
            <p style={{color: '#ef4444', marginBottom: '20px'}}>{error}</p>
            <Link to="/" style={styles.btnSecondary}>Go to Search</Link>
          </div>
        ) : (
          <div style={styles.certWrap}>
            <div style={styles.infoCard}>
              <h2 style={styles.nameHeader}>{participantName}</h2>
              <span style={styles.roleTag}>{participantRole}</span>
            </div>
            <div style={styles.imgShadowBox}>
              <img src={imgSrc} alt="Certificate" style={styles.certImg} />
            </div>
            <div style={styles.actions}>
              <button onClick={handleDownload} disabled={downloading} style={styles.btnDownload}>
                {downloading ? 'Please wait...' : 'Download Official PDF'}
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
  page: { minHeight: '100vh', background: '#0f172a', fontFamily: 'Inter, sans-serif', color: '#fff' },
  heroSection: { background: 'radial-gradient(circle at top, #1e293b 0%, #0f172a 100%)', padding: '60px 20px', textAlign: 'center' },
  badge: { color: '#c9a84c', fontSize: '12px', fontWeight: 'bold', letterSpacing: '2px' },
  headerTitle: { fontSize: '32px', fontWeight: '800', margin: '10px 0' },
  content: { maxWidth: '1000px', margin: '-40px auto 40px', padding: '0 15px' },
  infoCard: { background: '#1e293b', padding: '30px', borderRadius: '16px', textAlign: 'center', marginBottom: '30px' },
  nameHeader: { fontSize: '24px', color: '#fff', textTransform: 'uppercase' },
  roleTag: { background: 'rgba(201, 168, 76, 0.15)', color: '#c9a84c', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', border: '1px solid #c9a84c' },
  imgShadowBox: { borderRadius: '8px', overflow: 'hidden', boxShadow: '0 0 40px rgba(0,0,0,0.5)' },
  certImg: { width: '100%', height: 'auto' },
  actions: { marginTop: '40px', display: 'flex', gap: '15px', justifyContent: 'center' },
  btnDownload: { background: '#c9a84c', color: '#000', padding: '14px 28px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer' },
  btnSecondary: { background: 'transparent', color: '#fff', padding: '14px 28px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', textDecoration: 'none', textAlign: 'center' },
  centerBox: { textAlign: 'center', padding: '100px 0' },
  spinner: { width: 40, height: 40, border: '4px solid #334155', borderTop: '4px solid #c9a84c', borderRadius: '50%', margin: '0 auto 20px', animation: 'spin 1s linear infinite' },
};
