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
        const cleanSearch = decodeURIComponent(name)
          .normalize('NFKD')
          .replace(/[^\w\s]/gi, '')
          .replace(/\s+/g, ' ')
          .trim()
          .toUpperCase();

        const { data } = await supabase
          .from('participants')
          .select('*')
          .ilike('name', `%${cleanSearch}%`)
          .eq('cert_date', day)
          .maybeSingle();

        if (!data) throw new Error("Certificate not found.");

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

  if (loading) return <div style={V.bg}>Loading...</div>;
  if (error) return <div style={V.bg}>{error}<br/><Link to="/" style={{color:'#fff', marginTop:'20px', display:'block'}}>Back to Portal</Link></div>;

  return (
    <div style={V.bg}>
      <div style={V.container}>
        <h2 style={{margin:'0 0 5px 0'}}>Credential Verified</h2>
        <p style={{color:'#94a3b8', fontSize:'14px', marginBottom:'20px'}}>Official Certificate for {decodeURIComponent(name)}</p>
        <img src={imgSrc} style={V.img} alt="Cert" />
        <div style={{marginTop:'25px'}}>
          <button onClick={() => downloadCertificate(decodeURIComponent(name), day, role)} style={V.btn}>Download PDF</button>
        </div>
      </div>
    </div>
  );
}

const V = {
  bg: { minHeight:'100vh', background:'#0f172a', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'20px', boxSizing:'border-box', color:'#fff', textAlign:'center' },
  container: { maxWidth:'800px', width:'100%', background:'#1e293b', padding:'30px', borderRadius:'20px', border:'1px solid rgba(255,255,255,0.1)' },
  img: { width:'100%', borderRadius:'10px', boxShadow:'0 20px 40px rgba(0,0,0,0.4)' },
  btn: { padding:'15px 40px', background:'#c9a84c', color:'#000', border:'none', borderRadius:'10px', fontWeight:'bold', cursor:'pointer', fontSize:'16px' }
};
