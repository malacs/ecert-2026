import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { downloadCertificate } from '../certificateGenerator';

export default function PublicPage() {
  const [search, setSearch] = useState('');
  const [selectedDay, setSelectedDay] = useState('1'); 
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    
    // 1. CLEAN INPUT: Strip everything except letters and numbers
    const cleanInput = search
      .normalize('NFKD')
      .replace(/[^a-zA-Z0-9]/g, '') // Removes spaces, commas, periods
      .toUpperCase();

    if (!cleanInput) return;

    setLoading(true);
    setHasSearched(true);

    try {
      // 2. Fetch all participants for that day (since we can't do complex regex in simple Supabase ilike)
      const { data, error } = await supabase
        .from('participants')
        .select('*')
        .eq('cert_date', selectedDay);

      if (!error && data) {
        // 3. FUZZY FILTER: Compare cleaned input vs cleaned database name
        const matches = data.filter(p => {
          const cleanDBName = p.name.normalize('NFKD').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
          return cleanDBName.includes(cleanInput);
        });
        setResults(matches);
      } else {
        setResults([]);
      }
    } catch { setResults([]); }
    setLoading(false);
  };

  return (
    <div style={P.container}>
      <div style={P.card}>
        <div style={P.badge}>DATA INSIGHTS 2026</div>
        <h2 style={P.title}>Certificate Portal</h2>
        <p style={P.sub}>Select your day and enter your name.</p>
        
        <form onSubmit={handleSearch}>
          <select style={P.input} value={selectedDay} onChange={e => {setSelectedDay(e.target.value); setResults([]); setHasSearched(false);}}>
            <option value="1">Day 1 - April 15</option>
            <option value="2">Day 2 - April 17</option>
            <option value="3">Day 3 - April 22</option>
            <option value="4">Day 4 - April 24</option>
            <option value="5">Day 5 - April 29</option>
          </select>
          
          <div style={{ display: 'flex', gap: '8px', marginTop: '15px' }}>
            <input 
              style={{ ...P.input, flex: 1 }} 
              placeholder="Full Name (e.g. Juan Dela Cruz)" 
              value={search} 
              onChange={e => setSearch(e.target.value)}
            />
            <button type="submit" style={P.btn} disabled={loading}>{loading ? '...' : 'Search'}</button>
          </div>
        </form>

        <div style={{ marginTop: '20px' }}>
          {results.map(p => (
            <div key={p.id} style={P.res}>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{p.name}</div>
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{p.role}</div>
              </div>
              <button style={P.dl} onClick={() => downloadCertificate(p.name, p.cert_date, p.role)}>Download PDF</button>
            </div>
          ))}
          {hasSearched && results.length === 0 && !loading && (
            <div style={P.error}>Record not found. Check the day or try searching just your last name.</div>
          )}
        </div>
      </div>
      <p style={{ marginTop: '20px', fontSize: '0.7rem', color: '#94a3b8' }}>NEMSU Lianga Campus - BSCS</p>
    </div>
  );
}

const P = {
  container: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '20px' },
  card: { background: '#fff', padding: '30px', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', width: '100%', maxWidth: '450px', textAlign: 'center', boxSizing: 'border-box' },
  badge: { fontSize: '0.65rem', fontWeight: 'bold', color: '#3b82f6', background: '#eff6ff', padding: '4px 12px', borderRadius: '20px', display: 'inline-block', marginBottom: '10px' },
  title: { margin: '0 0 10px', color: '#0f172a' },
  sub: { fontSize: '0.85rem', color: '#64748b', marginBottom: '25px' },
  input: { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '1rem', outline: 'none' },
  btn: { background: '#3b82f6', color: '#fff', border: 'none', padding: '0 20px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' },
  res: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f1f5f9', padding: '12px', borderRadius: '10px', marginBottom: '8px' },
  dl: { background: '#0f172a', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '6px', fontSize: '0.7rem', cursor: 'pointer' },
  error: { background: '#fef2f2', color: '#ef4444', padding: '10px', borderRadius: '8px', fontSize: '0.8rem', border: '1px solid #fee2e2' }
};
