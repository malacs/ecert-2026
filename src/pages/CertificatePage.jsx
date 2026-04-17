import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCertificateDataUrl, downloadCertificate } from '../certificateGenerator';

export default function CertificatePage() {
  const { name, day } = useParams();
  const participantName = decodeURIComponent(name || '');

  const [imgSrc, setImgSrc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!participantName) {
      setError('No participant name provided.');
      setLoading(false);
      return;
    }

    // Pass the 'day' param to the generator
    getCertificateDataUrl(participantName, day || null)
      .then((data) => {
        setImgSrc(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Certificate generation error:', err);
        setError('Failed to generate certificate. Please try again.');
        setLoading(false);
      });
  }, [participantName, day]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadCertificate(participantName, day || null);
    } catch (err) {
      alert("Download failed. Please try again.");
    }
    setDownloading(false);
  };

  const animations = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .btn-hover:hover { opacity: 0.9; transform: translateY(-1px); }
  `;

  return (
    <div style={styles.page}>
      <style>{animations}</style>

      <div style={styles.header}>
        <div style={styles.headerInner}>
          <h1 style={styles.headerTitle}>🎓 DATA INSIGHTS 2026</h1>
          <p style={styles.headerSub}>E-Certificate of Participation</p>
        </div>
      </div>

      <div style={styles.content}>
        {loading && (
          <div style={styles.centerBox}>
            <div style={styles.spinner} />
            <p style={styles.loadingText}>Generating your certificate...</p>
          </div>
        )}

        {error && (
          <div style={styles.centerBox}>
            <p style={styles.errorIcon}>⚠️</p>
            <p style={styles.errorText}>{error}</p>
            <Link to="/" style={styles.backLink}>← Go to Public Page</Link>
          </div>
        )}

        {!loading && !error && imgSrc && (
          <div style={styles.certWrap}>
            <p style={styles.nameLabel}>
              Official Certificate for: <strong>{participantName}</strong>
            </p>

            <div style={styles.imgShadowBox}>
              <img
                src={imgSrc}
                alt={`Certificate for ${participantName}`}
                style={styles.certImg}
              />
            </div>

            <div style={styles.actions}>
              <button
                className="btn-hover"
                style={{
                  ...styles.btnDownload,
                  cursor: downloading ? 'not-allowed' : 'pointer',
                  opacity: downloading ? 0.7 : 1
                }}
                onClick={handleDownload}
                disabled={downloading}
              >
                {downloading ? 'Processing PDF...' : '⬇ Download PDF'}
              </button>

              <Link to="/" className="btn-hover" style={styles.btnBack}>
                ← Back to Home
              </Link>
            </div>
          </div>
        )}
      </div>

      <footer style={styles.footer}>
        <p>DATA INSIGHTS 2026 &nbsp;•&nbsp; NEMSU Lianga Campus</p>
      </footer>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column' },
  header: { background: 'linear-gradient(135deg, #1a1060 0%, #2d1b8e 100%)', padding: '30px 24px' },
  headerInner: { maxWidth: 900, margin: '0 auto', textAlign: 'center' },
  headerTitle: { color: '#fff', fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: '-0.5px' },
  headerSub: { color: '#c9a84c', fontSize: 14, margin: '8px 0 0', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '1px' },
  content: { flex: 1, maxWidth: 950, margin: '40px auto', padding: '0 24px', width: '100%' },
  centerBox: { textAlign: 'center', padding: '100px 0' },
  spinner: { width: 40, height: 40, border: '4px solid #f3f4f6', borderTop: '4px solid #1a1060', borderRadius: '50%', margin: '0 auto 20px', animation: 'spin 0.8s linear infinite' },
  loadingText: { color: '#64748b', fontSize: 15 },
  errorIcon: { fontSize: 48, margin: '0 0 12px' },
  errorText: { color: '#ef4444', fontSize: 16, marginBottom: 16 },
  backLink: { color: '#1a1060', fontWeight: 600, textDecoration: 'none' },
  certWrap: { textAlign: 'center' },
  nameLabel: { fontSize: 14, color: '#64748b', marginBottom: 20 },
  imgShadowBox: { background: '#ddd', borderRadius: 12, padding: '2px', boxShadow: '0 20px 50px rgba(0,0,0,0.15)', maxWidth: 860, margin: '0 auto' },
  certImg: { width: '100%', borderRadius: 10, display: 'block' },
  actions: { marginTop: 32, display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' },
  btnDownload: { background: '#1a1060', color: '#fff', border: 'none', borderRadius: '10px', padding: '14px 32px', fontSize: 15, fontWeight: 700, transition: 'all 0.2s ease' },
  btnBack: { background: '#fff', color: '#1a1060', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px 32px', fontSize: 15, fontWeight: 600, textDecoration: 'none', transition: 'all 0.2s ease' },
  footer: { textAlign: 'center', padding: '30px', color: '#94a3b8', fontSize: 12, borderTop: '1px solid #e2e8f0' },
};
