import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { downloadCertificate } from '../certificateGenerator';

const S = {
  container: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#f8fafc', padding: '20px', fontFamily: 'sans-serif' },
  notice: { width: '100%', maxWidth: '500px', background: '#fffbeb', border: '1px solid #fef3c7', padding: '15px', borderRadius: '12px', marginBottom: '20px', color: '#92400e', fontSize: '0.85rem', textAlign: 'center', lineHeight: '1.4' },
  card: { background: '#fff', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', width: '100%', maxWidth: '500px', textAlign: 'center', border: '1px solid #e2e8f0' },
  header: { color: '#0f172a', fontSize: '24px', margin: '0 0 10px 0' },
  subtitle: { color: '#64748b', fontSize: '14px', marginBottom: '25px' },
  formGroup: { textAlign: 'left', marginBottom: '15px' },
  label: { fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '5px', display: 'block' },
  input: { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '16px', boxSizing: 'border-box', outline: 'none' },
  button: { width: '100%', padding: '14px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px', marginTop: '10px' },
  result: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f1f5f9', padding: '15px', borderRadius: '12px', marginTop: '10px', borderLeft: '4px solid #3b82f6' },
  noResult: { marginTop: '20px', padding: '15px', background: '#fef2f2', color: '#ef4444', borderRadius: '10px', fontSize: '14px' }
};

export default function PublicPage() {
  const [search, setSearch] = useState('');
  const [day, setDay] = useState('1');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!search.trim()) return;
    setLoading(true);
    setHasSearched(true);
    
    // THE FIX: Remove symbols/dots and use wildcards for "Fuzzy" matching
    const cleanSearch = search
      .normalize('NFKD')
      .replace(/[^\w\s]/gi, '') // Removes dots/symbols
      .replace(/\s+/g, ' ')    // Collapses spaces
      .trim()
      .toUpperCase();

    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .ilike('name', `%${cleanSearch}%`) // Wildcard search is much more reliable
      .eq('cert_date', day);

    setResults(data || []);
    setLoading(false);
  };

  return (
    <div style={S.container}>
      <div style={S.notice}>
        ⚠️ <strong>System Note:</strong> We are optimizing mobile compatibility. If your name is not found, try searching using only your <strong>Last Name</strong>.
      </div>

      <div style={S.card}>
        <h2 style={S.header}>Certificate Portal</h2>
        <p style={S.subtitle}>NEMSU Data Insights 2026</p>

        <form onSubmit={handleSearch}>
          <div style={S.formGroup}>
            <label style={S.label}>Select Training Day</label>
            <select style={S.input} value={day} onChange={e => { setDay(e.target.value); setResults([]); }}>
              <option value="1">Day 1 - April 15</option>
              <option value="2">Day 2 - April 17</option>
              <option value="3">Day 3 - April 22</option>
              <option value="4">Day 4 - April 24</option>
              <option value="5">Day 5 - April 29</option>
            </select>
          </div>

          <div style={S.formGroup}>
            <label style={S.label}>Enter Full Name</label>
            <input 
              style={S.input} 
              placeholder="Ex: Juan Dela Cruz" 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>

          <button style={S.button} type="submit" disabled={loading}>
            {loading ? 'Searching Records...' : 'Verify & Find'}
          </button>
        </form>

        {results.map(p => (
          <div key={p.id} style={S.result}>
            <div style={{textAlign:'left'}}>
              <div style={{fontWeight:'bold', fontSize:'14px'}}>{p.name}</div>
              <div style={{fontSize:'12px', color:'#64748b'}}>{p.role}</div>
            </div>
            <button 
              style={{background:'#1e293b', color:'#fff', border:'none', padding:'8px 15px', borderRadius:'6px', cursor:'pointer', fontSize:'12px', fontWeight:'bold'}}
              onClick={() => downloadCertificate(p.name, p.cert_date, p.role)}
            >
              Download
            </button>
          </div>
        ))}

        {hasSearched && results.length === 0 && !loading && (
          <div style={S.noResult}>
            No record found for this day. Please check the spelling or try searching with just your Last Name.
          </div>
        )}
      </div>
      <footer style={{marginTop:'30px', color:'#94a3b8', fontSize:'12px'}}>© 2026 NEMSU Lianga Campus - BSCS</footer>
    </div>
  );
}
