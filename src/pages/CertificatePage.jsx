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

        // ✅ PRIMARY (ID-based)
        if (id) {
          const { data: record, error } = await supabase
            .from('participants')
            .select('*')
            .eq('id', id)
            .single();

          if (!error) data = record;
        }

        // ⚠️ FALLBACK (old links)
        if (!data && name && day) {
          const decodedName = decodeURIComponent(name)
            .replace(/\+/g, ' ')
            .trim()
            .toUpperCase();

          const { data: record } = await supabase
            .from('participants')
            .select('*')
            .ilike('name', decodedName)
            .eq('cert_date', day)
            .maybeSingle();

          data = record;
        }

        if (!data) {
          setError('No record found in our database.');
          return;
        }

        setParticipant(data);

        const previewUrl = await getCertificateDataUrl(
          data.name,
          data.cert_date,
          data.role
        );

        setImgSrc(previewUrl);
      } catch (err) {
        setError('Technical error loading certificate.');
      } finally {
        setLoading(false);
      }
    };

    fetchRecord();
  }, [id, name, day]);

  const handleDownload = async () => {
    if (!participant) return;
    setDownloading(true);
    await downloadCertificate(
      participant.name,
      participant.cert_date,
      participant.role
    );
    setDownloading(false);
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.badge}>DATA INSIGHTS 2026</div>
        <h1 style={styles.mainTitle}>Verification Portal</h1>
        <p style={styles.subtitle}>OFFICIAL DIGITAL CREDENTIALS</p>
      </header>

      <main style={styles.content}>
        {loading ? (
          <div style={styles.card}>
            <p style={{ color: '#94a3b8' }}>Verifying security credentials...</p>
          </div>
        ) : error ? (
          <div style={styles.card}>
            <p style={{ color: '#ff4d4d', fontSize: '18px' }}>{error}</p>
            <Link to="/" style={styles.btnSecondary}>Back to Search</Link>
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
                <img src={imgSrc} alt="Preview" style={styles.image} />
              ) : (
                <p>Generating preview...</p>
              )}
            </div>

            <div style={styles.actionButtons}>
              <button onClick={handleDownload} disabled={downloading} style={styles.btnPrimary}>
                {downloading ? 'Preparing PDF...' : 'DOWNLOAD CERTIFICATE'}
              </button>
              <Link to="/" style={styles.btnSecondary}>Verify Another</Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
