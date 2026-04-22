import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { getCertificateDataUrl, downloadCertificate } from '../certificateGenerator';

export default function CertificatePage() {
  const { name, day } = useParams();
  const [imgSrc, setImgSrc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [participantRole, setParticipantRole] = useState('Student');

  useEffect(() => {
    const loadCertificate = async () => {
      // Decode and Force UPPERCASE to match Database
      const decodedName = decodeURIComponent(name || '');
      const cleanSearch = decodedName.trim().replace(/\s+/g, ' ').toUpperCase();

      if (!cleanSearch) {
        setError('No participant name provided.');
        setLoading(false);
        return;
      }

      try {
        const { data, error: dbError } = await supabase
          .from('participants')
          .select('*')
          .eq('name', cleanSearch)
          .eq('cert_date', day)
          .maybeSingle();

        if (dbError || !data) {
          setError('Certificate not found in our records.');
          setLoading(false);
          return;
        }

        setParticipantRole(data.role || 'Student');
        const imgData = await getCertificateDataUrl(data.name, day, data.role);
        setImgSrc(imgData);

      } catch (err) {
        setError('Failed to load certificate.');
      } finally {
        setLoading(false);
      }
    };
    loadCertificate();
  }, [name, day]);

  const handleDownload = async () => {
    setDownloading(true);
    await downloadCertificate(decodeURIComponent(name), day, participantRole);
    setDownloading(false);
  };

  // ... (Keep your styles and Return statement from your original CertificatePage code)
  return (
      <div style={{textAlign: 'center', padding: '50px'}}>
          {loading ? <p>Verifying...</p> : error ? <p>{error}</p> : <img src={imgSrc} style={{width: '90%'}} />}
          <button onClick={handleDownload}>{downloading ? 'Wait...' : 'Download'}</button>
      </div>
  );
}
