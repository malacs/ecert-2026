import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { getCertificateDataUrl, downloadCertificate } from '../certificateGenerator';

export default function CertificatePage() {
  const { name, day } = useParams();
  const [imgSrc, setImgSrc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [role, setRole] = useState('Student');

  useEffect(() => {
    const load = async () => {
      try {
        const decodedName = decodeURIComponent(name).trim();
        
        // FIX: Using ilike with wildcards to handle hidden dots/spaces from the email link
        const { data, error: dbError } = await supabase
          .from('participants')
          .select('*')
          .ilike('name', `%${decodedName}%`)
          .eq('cert_date', day)
          .maybeSingle();

        if (dbError || !data) throw new Error("Certificate not found in our records.");

        setRole(data.role);
        const img = await getCertificateDataUrl(data.name, day, data.role);
        setImgSrc(img);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [name, day]);

  if (loading) return <div style={V.bg}>Verifying...</div>;
  
  if (error) return (
    <div style={V.bg}>
      <h2 style={{color:'#ef4444'}}>{error}</h2>
      <Link to="/" style={{color:'#fff', marginTop:'20px', display:'block'}}>Back to Search</Link>
    </div>
  );

  return (
    <div style={V.bg}>
      <div style={V.container}>
        <h1 style={{fontSize:'1.5rem', marginBottom:'10px'}}>Verification Portal</h1>
        <p style={{color:'#94a3b8', marginBottom:'20px'}}>Official Digital Credentials</p>
        <img src={imgSrc} style={V.img} alt="Verified Certificate" />
        <div style={{marginTop:'30px'}}>
          <button 
            onClick={() => downloadCertificate(decodeURIComponent(name), day, role)} 
            style={V.btn}
          >
            Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}

const V = {
  bg: { minHeight: '100vh', background: '#0f172a', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', textAlign: 'center' },
  container: { maxWidth: '800px', width: '100%', background: '#1e293b', padding: '40px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' },
  img: { width: '100%', borderRadius: '10px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' },
  btn: { padding: '15px 40px', background: '#c9a84c', color: '#000', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }
};
