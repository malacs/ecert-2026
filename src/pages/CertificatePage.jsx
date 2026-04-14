import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getCertificateDataUrl, downloadCertificate } from '../certificateGenerator';

export default function CertificatePage() {
  const { name, day } = useParams(); // ✅ FIXED
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

    getCertificateDataUrl(participantName, day || null) // ✅ FIXED
      .then((data) => {
        setImgSrc(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Certificate generation error:', err);
        setError('Failed to generate certificate. Please try again.');
        setLoading(false);
      });

  }, [participantName, day]); // ✅ FIXED

  const handleDownload = async () => {
    setDownloading(true);
    await downloadCertificate(participantName, day || null); // ✅ FIXED
    setDownloading(false);
  };

  // Spinner animation
  const spinnerStyle = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;

  return (
    <div style={styles.page}>
      <style>{spinnerStyle}</style>

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
            <a href="/" style={styles.backLink}>← Go to Public Page</a>
          </div>
        )}

        {!loading && !error && imgSrc && (
          <div style={styles.certWrap}>
            <p style={styles.nameLabel}>
              Certificate for: <strong>{participantName}</strong>
            </p>

            <img
              src={imgSrc}
              alt={`Certificate for ${participantName}`}
              style={styles.certImg}
            />

            <div style={styles.actions}>
              <button
                style={styles.btnDownload}
                onClick={handleDownload}
                disabled={downloading}
              >
                {downloading ? 'Generating PDF...' : '⬇ Download PDF'}
              </button>

              <a href="/" style={styles.btnBack}>← Back to Home</a>
            </div>
          </div>
        )}
      </div>

      <footer style={styles.footer}>
        <p>DATA INSIGHTS 2026 &nbsp;•&nbsp; North Eastern Mindanao State University – Lianga Campus</p>
      </footer>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f5f6fa',
    fontFamily: 'Inter, sans-serif',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    background: 'linear-gradient(135deg, #1a1060 0%, #2d1b8e 100%)',
    padding: '24px',
  },
  headerInner: { maxWidth: 900, margin: '0 auto', textAlign: 'center' },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: 700, margin: 0 },
  headerSub: { color: '#c9a84c', fontSize: 14, margin: '6px 0 0' },

  content: {
    flex: 1,
    maxWidth: 900,
    margin: '40px auto',
    padding: '0 24px',
    width: '100%',
  },

  centerBox: { textAlign: 'center', padding: '80px 0' },

  spinner: {
    width: 48,
    height: 48,
    border: '5px solid #e5e7eb',
    borderTop: '5px solid #1a1060',
    borderRadius: '50%',
    margin: '0 auto 20px',
    animation: 'spin 1s linear infinite',
  },

  loadingText: { color: '#6b7280', fontSize: 16 },

  errorIcon: { fontSize: 48, margin: '0 0 12px' },
  errorText: { color: '#dc2626', fontSize: 16, marginBottom: 16 },

  backLink: { color: '#1a1060', fontWeight: 600, textDecoration: 'none' },

  certWrap: { textAlign: 'center' },

  nameLabel: { fontSize: 15, color: '#6b7280', marginBottom: 16 },

  certImg: {
    width: '100%',
    maxWidth: 860,
    borderRadius: 12,
    boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
    display: 'block',
    margin: '0 auto',
  },

  actions: {
    marginTop: 24,
    display: 'flex',
    justifyContent: 'center',
    gap: 16,
    flexWrap: 'wrap',
  },

  btnDownload: {
    background: '#1a1060',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '12px 28px',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
  },

  btnBack: {
    background: '#fff',
    color: '#1a1060',
    border: '1px solid #1a1060',
    borderRadius: 8,
    padding: '12px 28px',
    fontSize: 15,
    fontWeight: 600,
    textDecoration: 'none',
    display: 'inline-block',
  },

  footer: {
    textAlign: 'center',
    padding: '24px',
    color: '#9ca3af',
    fontSize: 13,
  },
};
