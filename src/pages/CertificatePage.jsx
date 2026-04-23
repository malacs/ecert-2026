import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { generateCertificate } from '../certificateGenerator';

export default function CertificatePage() {
  const { name, day } = useParams();
  const [loading, setLoading] = useState(true);
  const [participant, setParticipant] = useState(null);
  const [certUrl, setCertUrl] = useState(null);

  useEffect(() => {
    const loadCertificate = async () => {
      try {
        // MOBILE FIX: Decode and trim name to prevent "Not Found" errors
        const decodedName = decodeURIComponent(name).trim();

        const { data, error } = await supabase
          .from('participants')
          .select('*')
          .ilike('name', decodedName) // Case-insensitive match
          .eq('cert_date', day)
          .maybeSingle();

        if (error || !data) {
          setLoading(false);
          return;
        }

        setParticipant(data);
        
        // Generate the visual preview for the mobile user
        const { imgData } = await generateCertificate(data.name, data.cert_date, data.role);
        setCertUrl(imgData);
        setLoading(false);
      } catch (err) {
        console.error("Error loading certificate:", err);
        setLoading(false);
      }
    };

    loadCertificate();
  }, [name, day]);

  if (loading) {
    return (
      <div style={styles.container}>
        <p style={{color: '#fff'}}>Verifying Certificate...</p>
      </div>
    );
  }

  if (!participant) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2 style={{color: '#ef4444'}}>Certificate Not Found</h2>
          <p style={{color: '#94a3b8'}}>We couldn't find a record for "{decodeURIComponent(name)}".</p>
          <Link to="/" style={styles.link}>Return to Search</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Your E-Certificate is Ready</h2>
        <p style={styles.subtitle}>Day {participant.cert_date} — Data Insights 2026</p>
        
        {certUrl && (
          <div style={styles.previewBox}>
            <img src={certUrl} alt="Certificate Preview" style={styles.image} />
          </div>
        )}

        <button 
          style={styles.button}
          onClick={async () => {
            const { downloadCertificate } = await import('../certificateGenerator');
            downloadCertificate(participant.name, participant.cert_date, participant.role);
          }}
        >
          Download PDF Certificate
        </button>
        <br />
        <Link to="/" style={styles.link}>Back to Home</Link>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', padding: '20px' },
  card: { background: '#1e293b', padding: '2rem', borderRadius: '24px', textAlign: 'center', width: '100%', maxWidth: '600px', border: '1px solid #334155' },
  title: { color: '#fff', fontSize: '24px', marginBottom: '8px' },
  subtitle: { color: '#94a3b8', fontSize: '14px', marginBottom: '20px' },
  previewBox: { background: '#0f172a', borderRadius: '12px', padding: '10px', marginBottom: '20px', overflow: 'hidden' },
  image: { width: '100%', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' },
  button: { background: '#3b82f6', color: '#fff', padding: '14px 28px', borderRadius: '12px', border: 'none', fontWeight: 'bold', cursor: 'pointer', width: '100%' },
  link: { color: '#94a3b8', display: 'block', marginTop: '20px', textDecoration: 'none', fontSize: '14px' }
};
