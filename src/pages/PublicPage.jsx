import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { downloadCertificate } from '../certificateGenerator';

export default function PublicPage() {
  const [search, setSearch] = useState('');
  const [selectedDay, setSelectedDay] = useState('1'); 
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!search.trim()) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .ilike('name', `%${search.trim()}%`)
      .eq('cert_date', selectedDay);

    if (!error) setResults(data || []);
    setLoading(false);
  };

  return (
    <div style={S.container}>
      {/* Background Glows for a Tech Look */}
      <div style={S.glow1}></div>
      <div style={S.glow2}></div>

      <div style={S.card}>
        <h2 style={S.header}>E-Certificate Portal</h2>
        <p style={S.subtitle}>DATA INSIGHTS 2026: Virtual Training Series</p>
        
        <div style={S.formGroup}>
          <label style={S.label}>Select Training Session</label>
          <select 
            value={selectedDay} 
            onChange={(e) => setSelectedDay(e.target.value)}
            style={S.select}
          >
            <option value="1">Session 1 - April 15</option>
            <option value="2">Session 2 - April 17</option>
            <option value="3">Session 3 - April 22</option>
            <option value="4">Session 4 - April 24</option>
            <option value="5">Session 5 - April 29</option>
          </select>
        </div>

        <form onSubmit={handleSearch} style={S.searchContainer}>
          <input
            style={S.input}
            placeholder="TYPE YOUR FULL NAME"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" style={S.button} disabled={loading}>
            {loading ? '...' : 'SEARCH'}
          </button>
        </form>

        <div style={S.resultsWrapper}>
          {results.map((p) => (
            <div key={p.id} style={S.resultBox}>
              <div style={S.resInfo}>
                <div style={S.resName}>{p.name}</div>
                <div style={S.resDate}>Verified Participant</div>
              </div>
              <button 
                style={S.downloadBtn} 
                onClick={() => downloadCertificate(p.name, p.cert_date)}
              >
                DOWNLOAD
              </button>
            </div>
          ))}
          {results.length === 0 && search && !loading && (
            <p style={S.errorText}>No record found for Session {selectedDay}.</p>
          )}
        </div>
      </div>
    </div>
  );
}

const S = {
  container: { 
    height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', 
    background: '#04050a', overflow: 'hidden', position: 'relative', fontFamily: 'Inter, sans-serif' 
  },
  // High-tech glow effects
  glow1: { position: 'absolute', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(79,70,229,0.15) 0%, transparent 70%)', top: '-10%', left: '-5%' },
  glow2: { position: 'absolute', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(199,168,76,0.1) 0%, transparent 70%)', bottom: '-10%', right: '-5%' },
  
  card: { 
    background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(20px)', padding: '40px', 
    borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', 
    width: '90%', maxWidth: '450px', zIndex: 1, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' 
  },
  header: { color: '#fff', fontSize: '26px', fontWeight: '800', margin: '0 0 8px 0', letterSpacing: '1px' },
  subtitle: { color: '#8f9bba', fontSize: '12px', marginBottom: '30px', fontWeight: '500' },
  
  formGroup: { textAlign: 'left', marginBottom: '20px' },
  label: { color: '#8f9bba', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', display: 'block', paddingLeft: '5px' },
  
  select: { 
    width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', 
    border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '14px', outline: 'none', cursor: 'pointer' 
  },
  
  searchContainer: { display: 'flex', gap: '10px' },
  input: { 
    flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', 
    background: 'rgba(0,0,0,0.2)', color: '#fff', fontSize: '14px', outline: 'none', transition: 'all 0.3s' 
  },
  button: { 
    padding: '0 25px', background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)', 
    color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', fontSize: '13px' 
  },
  
  resultsWrapper: { marginTop: '25px' },
  resultBox: { 
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
    background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 0%, transparent 100%)', 
    padding: '15px 20px', borderRadius: '16px', borderLeft: '4px solid #c9a84c', marginBottom: '12px' 
  },
  resInfo: { textAlign: 'left' },
  resName: { color: '#fff', fontWeight: '700', fontSize: '15px' },
  resDate: { color: '#c9a84c', fontSize: '10px', textTransform: 'uppercase', marginTop: '2px' },
  
  downloadBtn: { 
    background: '#c9a84c', border: 'none', padding: '8px 15px', borderRadius: '8px', 
    cursor: 'pointer', fontWeight: '800', color: '#000', fontSize: '11px', transition: 'transform 0.2s' 
  },
  errorText: { color: '#ff5f5f', fontSize: '13px', marginTop: '15px' }
};
