import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { getCertificateDataUrl, downloadCertificate } from '../certificateGenerator';

export default function CertificatePage() {
  const { name, day } = useParams();
  const [imgSrc, setImgSrc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [participantData, setParticipantData] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const decoded = decodeURIComponent(name);
        // THE FIX: Standardize the URL name to match the DB
        const cleanSearch = decoded
          .normalize('NFKD')
          .replace(/[^\w\s]/gi, '')
          .replace(/\s+/g, ' ')
          .trim()
          .toUpperCase();

        const { data, error: dbError } = await supabase
          .from('participants')
          .select('*')
          .ilike('name', `%${cleanSearch}%`)
          .eq('cert_date', day)
          .maybeSingle();

        if (dbError || !data) throw new Error("Certificate record not found.");

        setParticipantData(data);
        // Always generate based on the clean name stored in the database
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

  if (loading) return <div style={V.bg}><div className="spinner"></div><p>Verifying Credential...</p></div>;
  
  if (error) return (
    <div style={V.bg}>
      <div style={{color:'#ef4444', marginBottom:'20px'}}>{error}</div>
      <Link to="/" style={{color:'#fff', textDecoration:'underline'}}>Back to Search Portal</Link>
    </div>
  );

  return (
    <div style={V.bg}>
      <div style={V.container}>
        <div style={V.badge}>DATA INSIGHTS 2026</div>
        <h2 style={{margin:'0 0 10px 0'}}>Digital Credential</h2>
        <p style={{color:'#94a3b8', fontSize:'14px', marginBottom:'25px'}}>Issued to: <strong>{participantData?.name}</strong></p>
        
        <div style={V.imgWrap}>
          <img src={imgSrc} style={V.img} alt="Certificate" />
        </div>

        <div style={{marginTop:'30px', display:'flex', gap:'15px', justifyContent:'center'}}>
          <button 
            onClick={() => downloadCertificate(participantData.name, day, participantData.role)} 
            style={V.btn}
          >
            Download Official PDF
          </button>
        </div>
      </div>
    </div>
  );
}

const V = {
  bg: { minHeight:'100vh', background:'#0f172a', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'20px', color:'#fff', textAlign:'center', fontFamily:'sans-serif' },
  container: { maxWidth:'850px', width:'100%', background:'#1e293b', padding:'40px 20px', borderRadius:'24px', border:'1px solid rgba(255,255,255,0.1)' },
  badge: { color:'#c9a84c', fontSize:'12px', fontWeight:'bold', letterSpacing:'2px', marginBottom:'10px' },
  imgWrap: { background:'#0f172a', padding:'10px', borderRadius:'10px', boxShadow:'0 20px 50px rgba(0,0,0,0.5)' },
  img: { width:'100%', borderRadius:'5px', display:'block' },
  btn: { padding:'16px 32px', background:'#c9a84c', color:'#000', border:'none', borderRadius:'12px', fontWeight:'bold', cursor:'pointer', fontSize:'16px' }
};
