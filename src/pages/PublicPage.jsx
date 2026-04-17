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

    // RESTORED: Query strictly matching Name AND Day
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
      <div style={S.card}>
        <h2 style={S.header}>Certificate Portal</h2>
        <p style={S.subtitle}>DATA INSIGHTS 2026: Virtual Training Series</p>
        
        <div style={S.formGroup}>
          <label style={S.label}>1. Select Your Training Day</label>
          <select 
            value={selectedDay} 
            onChange={(e) => {
                setSelectedDay(e.target.value);
                setResults([]); // CLEAR results on change to ensure strictness
            }} 
            style={S.select}
          >
            <option value="1">Day 1 - April 15</option>
            <option value="2">Day 2 - April 17</option>
            <option value="3">Day 3 - April 22</option>
            <option value="4">Day 4 - April 24</option>
            <option value="5">Day 5 - April 29</option>
          </select>
        </div>

        <form onSubmit={handleSearch} style={S.searchContainer}>
          <input 
            style={S.input} 
            placeholder="Type your full name..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
          <button type="submit" style={S.button}>{loading ? '...' : 'SEARCH'}</button>
        </form>

        <div style={S.resultsWrapper}>
          {results.map((p) => (
            <div key={p.id} style={S.resultBox}>
              <div style={S.resInfo}>
                <div style={S.resName}>{p.name}</div>
                <div style={{...S.resRole, color: p.role === 'Speaker' ? '#c9a84c' : '#8f9bba'}}>
                  {p.role === 'Speaker' ? '★ Resource Speaker' : 'Training Participant'}
                </div>
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
            <p style={{color: '#ff5f5f', fontSize: '13px', marginTop: '20px'}}>
              No record found for this name on the selected day.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

const S = {
  container: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#04050a', fontFamily: 'sans-serif' },
  card: { background: 'rgba(255, 255, 255, 0.03)', padding: '40px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', width: '90%', maxWidth: '480px' },
  header: { color: '#fff', fontSize: '24px', margin: '0 0 8px 0' },
  subtitle: { color: '#8f9bba', fontSize: '12px', marginBottom: '30px' },
  formGroup: { textAlign: 'left', marginBottom: '20px' },
  label: { color: '#8f9bba', fontSize: '11px', marginBottom: '8px', display: 'block' },
  select: { width: '100%', padding: '12px', borderRadius: '12px', background: '#1a1d29', border: '1px solid #333', color: '#fff' },
  searchContainer: { display: 'flex', gap: '10px' },
  input: { flex: 1, padding: '14px', borderRadius: '12px', background: '#000', color: '#fff', border: '1px solid #333' },
  button: { padding: '0 25px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' },
  resultsWrapper: { marginTop: '25px', maxHeight: '300px', overflowY: 'auto' },
  resultBox: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '16px', marginBottom: '10px', borderLeft: '4px solid #4f46e5' },
  resInfo: { textAlign: 'left' },
  resName: { color: '#fff', fontWeight: 'bold', fontSize: '14px' },
  resRole: { fontSize: '11px', marginTop: '4px' },
  downloadBtn: { background: '#c9a84c', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', border: 'none' }
};
