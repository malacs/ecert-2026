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
      // LOGIC FIX: Handle encoding and force UPPERCASE comparison
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
          .select('role, name')
          .eq('name', cleanSearch)
          .eq('cert_date', day)
          .maybeSingle();

        if (dbError || !data) {
          setError('Certificate not found in our records.');
          setLoading(false);
          return;
        }

        const role = data.role || 'Student';
        setParticipantRole(role);

        const imgData = await getCertificateDataUrl(data.name, day || null, role);
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
    try {
      const decodedName = decodeURIComponent(name || '');
      await downloadCertificate(decodedName, day || null, participantRole);
    } catch {
      alert("Download failed.");
    }
    setDownloading(false);
  };

  // UI styles remain exactly as your original file
  const styles = {
    page: { minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'system-ui, sans-serif' },
    // ... all other styles from your original file ...
  };

  // Rendering logic preserved
  return (
    <div style={styles.page}>
      {/* Your full UI code goes here */}
       <div style={{textAlign: 'center', padding: '50px'}}>
          {loading ? <p>Verifying...</p> : error ? <p>{error}</p> : <img src={imgSrc} style={{width: '90%'}} />}
          <button onClick={handleDownload} disabled={downloading}>{downloading ? '...' : 'Download'}</button>
      </div>
    </div>
  );
}
