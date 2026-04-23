import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { getCertificateDataUrl, downloadCertificate } from '../certificateGenerator';

export default function CertificatePage() {
  const { id, name, day } = useParams();
  const [imgSrc, setImgSrc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [dbData, setDbData] = useState(null);

  useEffect(() => {
    const loadCertificate = async () => {
      try {
        let data = null;

        // 1. Try finding by ID first (Most reliable for links)
        if (id && id.length > 20) { 
          const { data: row } = await supabase.from('participants').select('*').eq('id', id).maybeSingle();
          if (row) data = row;
        }

        // 2. Fallback to Name and Day search (Simplified)
        if (!data && name && day) {
          const cleanName = decodeURIComponent(name).trim();
          const { data: rows } = await supabase
            .from('participants')
            .select('*')
            .ilike('name', `%${cleanName}%`) // Case-insensitive partial match
            .eq('cert_date', day);

          if (rows && rows.length > 0) data = rows[0];
        }

        if (!data) {
          setError(`We couldn't find a record for "${decodeURIComponent(name || 'this participant')}".`);
          setLoading(false);
          return;
        }

        setDbData(data);
        const imgData = await getCertificateDataUrl(data.name, data.cert_date, data.role || 'Participant');
        setImgSrc(imgData);
      } catch (err) {
        setError('Technical error loading certificate.');
      } finally {
        setLoading(false);
      }
    };
    loadCertificate();
  }, [id, name, day]);

  const handleDownload = async () => {
    if (!dbData) return;
    setDownloading(true);
    await downloadCertificate(dbData.name, dbData.cert_date, dbData.role || 'Participant');
    setDownloading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#fff', textAlign: 'center', padding: '40px 20px' }}>
      <h2 style={{ color: '#c9a84c' }}>DATA INSIGHTS 2026</h2>
      <h1>Verification Portal</h1>
      
      <div style={{ maxWidth: '900px', margin: '20px auto', background: '#1e293b', padding: '30px', borderRadius: '15px', border: '1px solid #334155' }}>
        {loading ? <p>Verifying Credentials...</p> : error ? (
          <div>
            <p style={{ color: '#ef4444' }}>{error}</p>
            <Link to="/" style={btnStyle}>Return to Search</Link>
          </div>
        ) : (
          <>
            <p>This certificate is officially issued to:</p>
            <h2 style={{ textTransform: 'uppercase' }}>{dbData.name}</h2>
            <div style={{ margin: '30px 0', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
              {imgSrc ? <img src={imgSrc} alt="Certificate" style={{ width: '100%', borderRadius: '5px' }} /> : <p>Generating Preview...</p>}
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button onClick={handleDownload} disabled={downloading} style={{ ...btnStyle, background: '#c9a84c', color: '#000' }}>
                {downloading ? 'Processing...' : 'Download PDF'}
              </button>
              <Link to="/" style={btnStyle}>Back to Portal</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const btnStyle = { padding: '12px 25px', borderRadius: '8px', textDecoration: 'none', color: '#fff', border: '1px solid #fff', fontWeight: 'bold', cursor: 'pointer' };
