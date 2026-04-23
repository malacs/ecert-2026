import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { getCertificateDataUrl, downloadCertificate } from '../certificateGenerator';

// ─── MOBILE FIX ──────────────────────────────────────────────────────────────
// Some mobile Gmail/browser combinations mangle URL-encoded names:
//   - %20 becomes + or a literal space then gets re-encoded
//   - %09 (tab) appears from some Android keyboards  
//   - Unicode zero-width spaces or NBSP get injected
// Strategy: decode aggressively, then normalize to clean ASCII uppercase.
const robustDecodeName = (raw) => {
  if (!raw) return '';
  let decoded = raw;

  // Try decoding up to 2 times to handle double-encoding (e.g. %2520 → %20 → space)
  for (let i = 0; i < 2; i++) {
    try {
      const next = decodeURIComponent(decoded);
      if (next === decoded) break; // nothing changed, stop
      decoded = next;
    } catch {
      break; // malformed, stop trying
    }
  }

  // Replace + signs used as spaces (common in mobile query strings)
  decoded = decoded.replace(/\+/g, ' ');

  // Strip ALL invisible/control characters (tabs, zero-width spaces, NBSP, etc.)
  decoded = decoded
    .normalize('NFKD')
    .replace(/[\u0000-\u001F\u007F-\u009F\u00A0\u200B-\u200D\uFEFF]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();

  return decoded;
};
// ─────────────────────────────────────────────────────────────────────────────

export default function CertificatePage() {
  const { name, day } = useParams();

  // Apply robust decode immediately so all logic uses the clean name
  const participantName = robustDecodeName(name);

  const [imgSrc, setImgSrc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [participantRole, setParticipantRole] = useState('Student');
  const [dbName, setDbName] = useState('');

  useEffect(() => {
    const loadCertificate = async () => {
      if (!participantName) {
        setError('No participant name provided.');
        setLoading(false);
        return;
      }

      try {
        // PRIMARY LOOKUP: exact match via ilike (case-insensitive)
        let { data, error: dbError } = await supabase
          .from('participants')
          .select('role, name')
          .ilike('name', participantName)
          .eq('cert_date', day)
          .maybeSingle();

        // FALLBACK: if exact ilike fails, try splitting and matching on last name
        // This catches cases where mobile adds an extra invisible char mid-name
        if ((dbError || !data) && participantName.includes(' ')) {
          const parts = participantName.split(' ');
          const lastName = parts[parts.length - 1];

          const { data: fallbackData } = await supabase
            .from('participants')
            .select('role, name')
            .ilike('name', `%${lastName}%`)
            .eq('cert_date', day);

          // Among fallback results, find the closest match
          if (fallbackData && fallbackData.length > 0) {
            // Sort by similarity: prefer names that contain the most matching words
            const scored = fallbackData.map(p => {
              const dbWords = p.name.toUpperCase().split(' ');
              const searchWords = participantName.split(' ');
              const matchCount = searchWords.filter(w => dbWords.includes(w)).length;
              return { ...p, score: matchCount };
            });
            scored.sort((a, b) => b.score - a.score);
            if (scored[0].score > 0) {
              data = scored[0];
              dbError = null;
            }
          }
        }

        if (dbError || !data) {
          setError('Certificate not found in our records. Please check your name spelling or contact the administrator.');
          setLoading(false);
          return;
        }

        const role = data.role || 'Student';
        setParticipantRole(role);
        setDbName(data.name);

        // Use data.name from DB (guaranteed clean) for generation
        const imgData = await getCertificateDataUrl(data.name, day || null, role);
        setImgSrc(imgData);
      } catch (err) {
        console.error('Certificate load error:', err);
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
      // Use the DB name for download to ensure clean output
      await downloadCertificate(dbName || participantName, day || null, participantRole);
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
              <h2 style={styles.nameHeader}>{dbName || participantName}</h2>
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
