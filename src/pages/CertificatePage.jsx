import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

// These lines are critical: They must point to the 'src' folder from the 'pages' folder
import { supabase } from '../supabaseClient';
import { getCertificateDataUrl, downloadCertificate } from '../certificateGenerator';

const normalizeName = (raw) => {
  if (!raw) return '';
  return raw
    .normalize('NFKD')
    .replace(/[\u0000-\u001F\u007F-\u009F\u00A0\u200B-\u200D\uFEFF]/g, '')
    .replace(/\+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
};

const scoreMatch = (dbName, searchName) => {
  const dbWords = normalizeName(dbName).split(' ').filter(Boolean);
  const searchWords = normalizeName(searchName).split(' ').filter(Boolean);
  if (searchWords.length === 0) return 0;
  const hits = searchWords.filter(w => dbWords.includes(w)).length;
  return Math.round((hits / searchWords.length) * 100);
};

export default function CertificatePage() {
  const { id, name, day } = useParams();

  const [imgSrc, setImgSrc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [participantRole, setParticipantRole] = useState('Student');
  const [dbName, setDbName] = useState('');
  const [dbDay, setDbDay] = useState(null);

  useEffect(() => {
    const loadCertificate = async () => {
      try {
        let data = null;

        // PATH A: UUID (The fix for mobile phone issues)
        if (id && !name) {
          const { data: row, error: err } = await supabase
            .from('participants')
            .select('*')
            .eq('id', id)
            .maybeSingle();

          if (!err && row) data = row;
        }

        // PATH B: Name/Day (Backward compatibility)
        if (!data && name && day) {
          let decoded = name;
          for (let i = 0; i < 2; i++) {
            try {
              const next = decodeURIComponent(decoded);
              if (next === decoded) break;
              decoded = next;
            } catch { break; }
          }
          const cleanSearch = normalizeName(decoded);

          const { data: allForDay } = await supabase
            .from('participants')
            .select('*')
            .eq('cert_date', day);

          if (allForDay && allForDay.length > 0) {
            const scored = allForDay
              .map(p => ({ ...p, score: scoreMatch(p.name, cleanSearch) }))
              .filter(p => p.score > 0)
              .sort((a, b) => b.score - a.score);

            if (scored.length > 0 && scored[0].score >= 45) {
              data = scored[0];
            }
          }
        }

        if (!data) {
          setError('Certificate not found. Please contact the administrator.');
          setLoading(false);
          return;
        }

        setParticipantRole(data.role || 'Student');
        setDbName(data.name);
        setDbDay(data.cert_date);

        const imgData = await getCertificateDataUrl(data.name, data.cert_date, data.role || 'Student');
        setImgSrc(imgData);
      } catch (err) {
        console.error('Certificate load error:', err);
        setError('Failed to load certificate. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadCertificate();
  }, [id, name, day]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadCertificate(dbName, dbDay, participantRole);
    } catch {
      alert("Download failed.");
    }
    setDownloading(false);
  };

  return (
    <div style={styles.page}>
      <div style={styles.heroSection}>
        <div style={styles.badge}>DATA INSIGHTS 2026</div>
        <h1 style={styles.headerTitle}>Verification Portal</h1>
        <p style={styles.headerSub}>Official Digital Credentials</p>
      </div>

      <div style={styles.content}>
        {loading ? (
          <div style={styles.centerBox}>
            <div style={styles.spinner} />
            <p>Verifying Credential...</p>
          </div>
        ) : error ? (
          <div style={styles.centerBox}>
            <p style={{ color: '#ef4444', marginBottom: '20px' }}>{error}</p>
            <Link to="/" style={styles.btnSecondary}>Back to Search</Link>
          </div>
        ) : (
          <div style={styles.certWrap}>
            <div style={styles.infoCard}>
              <p style={styles.issuedTo}>This certificate is officially issued to:</p>
              <h2 style={styles.nameHeader}>{dbName}</h2>
              <span style={styles.roleTag}>
                {participantRole === 'Speaker' ? 'Resource Speaker' : 'Participant'}
              </span>
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
