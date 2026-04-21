import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { getCertificateDataUrl, downloadCertificate } from '../certificateGenerator';

export default function CertificatePage() {
  const { name, day } = useParams();
  const participantName = decodeURIComponent(name || '');

  const [imgSrc, setImgSrc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [participantRole, setParticipantRole] = useState('Student');

  useEffect(() => {
    const loadCertificate = async () => {
      if (!participantName) {
        setError('No participant name provided.');
        setLoading(false);
        return;
      }

      try {
        // 1. Fetch the actual role from Supabase to correctly identify Speakers
        const { data, error: dbError } = await supabase
          .from('participants')
          .select('role')
          .ilike('name', participantName)
          .eq('cert_date', day)
          .single();

        // 2. Fallback to 'Student' if database check fails
        const role = data?.role || 'Student';
        setParticipantRole(role);

        // 3. Generate the specific layout based on the role found
        const imgData = await getCertificateDataUrl(participantName, day || null, role);
        setImgSrc(imgData);
      } catch (err) {
        console.error('Error:', err);
        setError('Failed to load certificate details.');
      } finally {
        setLoading(false);
      }
    };

    loadCertificate();
  }, [participantName, day]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadCertificate(participantName, day || null, participantRole);
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
          <div style={styles.centerBox}><p>{error}</p><Link to="/" style={styles.btnBack}>Return Home</Link></div>
        ) : (
          <div style={styles.certWrap}>
            <div style={styles.infoCard}>
              <p style={styles.issuedTo}>This certificate is officially issued to:</p>
              <h2 style={styles.nameHeader}>{participantName}</h2>
              <span style={styles.roleTag}>{participantRole === 'Speaker' ? 'Resource Speaker' : 'Participant'}</span>
            </div>

            <div style={styles.imgShadowBox}>
              <img src={imgSrc} alt="Certificate" style={styles.certImg} />
            </div>

            <div style={styles.actions}>
              <button onClick={handleDownload} disabled={downloading} style={styles.btnDownload}>
                {downloading ? 'Preparing PDF...' : 'Download Official PDF'}
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
  heroSection: { background: 'radial-gradient(circle at top, #1e293b 0%, #0f172a 100%)', padding: '60px 20px', textAlign: 'center', borderBottom: '1px solid rgba(201, 168, 76, 0.2)' },
  badge: { color: '#c9a84c', fontSize: '12px', fontWeight: 'bold', letterSpacing: '2px', marginBottom: '10px' },
  headerTitle: { fontSize: '32px', fontWeight: '800', margin: '0' },
  headerSub: { color: '#94a3b8', fontSize: '16px', marginTop: '5px' },
  content: { maxWidth: '1000px', margin: '-40px auto 40px', padding: '0 20px' },
  infoCard: { background: '#1e293b', padding: '30px', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)', textAlign: 'center', marginBottom: '30px', border: '1px solid rgba(255,255,255,0.1)' },
  issuedTo: { color: '#94a3b8', fontSize: '14px', marginBottom: '5px' },
  nameHeader: { fontSize: '28px', color: '#fff', margin: '0 0 10px 0' },
  roleTag: { background: 'rgba(201, 168, 76, 0.15)', color: '#c9a84c', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', border: '1px solid #c9a84c' },
  imgShadowBox: { borderRadius: '8px', overflow: 'hidden', boxShadow: '0 0 40px rgba(0,0,0,0.5)', border: '4px solid #1e293b' },
  certImg: { width: '100%', display: 'block' },
  actions: { marginTop: '40px', display: 'flex', gap: '15px', justifyContent: 'center' },
  btnDownload: { background: '#c9a84c', color: '#000', padding: '14px 28px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer' },
  btnSecondary: { background: 'transparent', color: '#fff', padding: '14px 28px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', textDecoration: 'none', fontWeight: '600' },
  centerBox: { textAlign: 'center', padding: '100px 0' },
  spinner: { width: 40, height: 40, border: '4px solid #334155', borderTop: '4px solid #c9a84c', borderRadius: '50%', margin: '0 auto 20px', animation: 'spin 1s linear infinite' },
  btnBack: { color: '#c9a84c', textDecoration: 'none', marginTop: '10px', display: 'block' }
};
