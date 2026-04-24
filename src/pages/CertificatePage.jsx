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
          setError("Certificate not found.");
          return;
        }

        setParticipant(data);

        const previewUrl = await getCertificateDataUrl(
          data.name,
          data.cert_date,
          data.role
        );

        setImgSrc(previewUrl);

      } catch {
        setError("Technical error loading certificate.");
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

  if (loading) return <div style={{ textAlign: 'center', marginTop: 50 }}>Loading...</div>;

  if (error) return (
    <div style={{ textAlign: 'center', marginTop: 50 }}>
      <p>{error}</p>
      <Link to="/">Back</Link>
    </div>
  );

  return (
    <div style={{ textAlign: 'center', padding: 20 }}>
      <h2>{participant.name}</h2>

      {imgSrc && (
        <img src={imgSrc} alt="Certificate" style={{ maxWidth: '100%' }} />
      )}

      <br /><br />

      <button onClick={handleDownload} disabled={downloading}>
        {downloading ? 'Generating...' : 'Download PDF'}
      </button>
    </div>
  );
}
