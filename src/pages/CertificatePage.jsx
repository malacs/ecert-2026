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
        setError('No participant name provided.');
        setLoading(false);
        return;
      }

      try {
        // ✅ FIX: normalize search
        const cleanSearch = participantName
          .trim()
          .replace(/\s+/g, ' ')
          .toUpperCase();

        // ✅ FIX: flexible match + fallback
        const { data, error: dbError } = await supabase
          .from('participants')
          .select('role, name')
          .ilike('name', `%${cleanSearch}%`)
          .eq('cert_date', day);

        if (dbError || !data || data.length === 0) {
          setError('Certificate not found in our records.');
          setLoading(false);
          return;
        }

        // pick first match
        const record = data[0];

        const role = record.role || 'Student';
        setParticipantRole(role);

        const imgData = await getCertificateDataUrl(record.name, day || null, role);
        setImgSrc(imgData);

      } catch (err) {
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
    } catch {
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
            <p style={{color: '#ef4444', marginBottom: '20px'}}>{error}</p>
            <Link to="/" style={styles.btnSecondary}>Back to Search</Link>
          </div>
        ) : (
          <div style={styles.certWrap}>
            <div style={styles.infoCard}>
              <p style={styles.issuedTo}>This certificate is officially issued to:</p>
              <h2 style={styles.nameHeader}>{participantName}</h2>
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
