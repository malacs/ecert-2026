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
      // BACK TO OLD LOGIC: Use decoded name exactly as it is in the URL
      const decodedName = decodeURIComponent(name || '');

      if (!decodedName) {
        setError('No participant name provided.');
        setLoading(false);
        return;
      }

      try {
        const { data, error: dbError } = await supabase
          .from('participants')
          .select('role, name')
          .eq('name', decodedName)
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

  const styles = {
    page: { minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
    card: { backgroundColor: '#fff', padding: '20px', borderRadius: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', textAlign: 'center', maxWidth: '90%' },
    img: { width: '100%', marginBottom: '20px', borderRadius: '8px' },
    btn: { padding: '10px 20px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }
  };

  return (
    <div style={styles.page}>
       <div style={styles.card}>
          {loading ? <p>Verifying certificate...</p> : error ? <p style={{color: '#ef4444'}}>{error}</p> : (
            <>
              <img src={imgSrc} style={styles.img} alt="Certificate" />
              <div style={{display: 'flex', gap: '10px', justifyContent: 'center'}}>
                <button style={styles.btn} onClick={handleDownload} disabled={downloading}>
                  {downloading ? 'Preparing Download...' : 'Download Certificate'}
                </button>
                <Link to="/" style={{...styles.btn, backgroundColor: '#64748b', textDecoration: 'none'}}>Back Home</Link>
              </div>
            </>
          )}
      </div>
    </div>
  );
}
