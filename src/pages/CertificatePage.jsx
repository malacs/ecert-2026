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

        if (id) {
          const { data: record } = await supabase.from('participants').select('*').eq('id', id).single();
          data = record;
        } else if (name && day) {
          const decodedName = decodeURIComponent(name).replace(/\+/g, ' ').trim();
          const { data: record } = await supabase.from('participants').select('*')
            .ilike('name', `%${decodedName}%`).eq('cert_date', day).maybeSingle();
          data = record;
        }

        if (!data) {
          setError("Certificate not found.");
          return;
        }

        setParticipant(data);
        const url = await getCertificateDataUrl(data.name, data.cert_date, data.role);
        setImgSrc(url);
      } catch {
        setError("Error loading certificate.");
      } finally {
        setLoading(false);
      }
    };
    fetchRecord();
  }, [id, name, day]);

  const handleDownload = async () => {
    if (!participant) return;
    setDownloading(true);
    await downloadCertificate(participant.name, participant.cert_date, participant.role);
    setDownloading(false);
  };

  if (loading) return <div style={{backgroundColor:'#0f172a', minHeight:'100vh', color:'#fff', textAlign:'center', paddingTop:'100px'}}>Loading Credentials...</div>;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: '#fff', textAlign: 'center', padding: '20px' }}>
      <h2 style={{ color: '#c9a84c', marginTop: '40px' }}>DATA INSIGHTS 2026</h2>
      <p style={{ letterSpacing: '2px', fontSize: '12px' }}>OFFICIAL VERIFICATION PORTAL</p>

      {error ? (
        <div style={{ marginTop: '50px' }}>
          <p>{error}</p>
          <Link to="/" style={{ color: '#c9a84c' }}>Return to Home</Link>
        </div>
      ) : (
        <div style={{ maxWidth: '900px', margin: '40px auto', backgroundColor: '#1e293b', padding: '30px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <h1 style={{ textTransform: 'uppercase', marginBottom: '30px' }}>{participant.name}</h1>
          
          <div style={{ border: '5px solid #0f172a', borderRadius: '8px', overflow: 'hidden', marginBottom: '30px' }}>
            <img src={imgSrc} alt="Certificate Preview" style={{ width: '100%', display: 'block' }} />
          </div>

          <button 
            onClick={handleDownload} 
            disabled={downloading}
            style={{ backgroundColor: '#c9a84c', color: '#000', padding: '15px 40px', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            {downloading ? 'GENERATING PDF...' : 'DOWNLOAD CERTIFICATE'}
          </button>
        </div>
      )}
    </div>
  );
}
