import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { downloadCertificate } from '../certificateGenerator';

const S = {
  container: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#f8fafc', padding: '20px', fontFamily: 'sans-serif' },
  card: { background: '#fff', padding: '35px 25px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', width: '100%', maxWidth: '500px', textAlign: 'center', border: '1px solid #e2e8f0', boxSizing: 'border-box' },
  header: { color: '#0f172a', fontSize: '24px', marginBottom: '10px', fontWeight: 'bold' },
  subtitle: { color: '#64748b', fontSize: '14px', marginBottom: '25px' },
  input: { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', marginBottom: '15px', fontSize: '16px', boxSizing: 'border-box' },
  button: { width: '100%', padding: '14px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' },
  result: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f1f5f9', padding: '15px', borderRadius: '12px', marginTop: '10px', textAlign: 'left' },
  errorBox: { marginTop: '20px', padding: '15px', background: '#fef2f2', color: '#ef4444', borderRadius: '10px', fontSize: '14px', border: '1px solid #fee2e2' }
};

export default function PublicPage() {
  const [search, setSearch] = useState('');
  const [day, setDay] = useState('1');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!search.trim()) return;
    setLoading(true);
    setSearched(true);
    
    // THE FIX: We use a "Loose" search so MARVIN LI L. matches even if the user types MARVIN LI
    const { data } = await supabase
      .from('participants')
      .select('*')
      .ilike('name', `%${search.trim().toUpperCase()}%`)
      .eq('cert_date', day);

    setResults(data || []);
    setLoading(false);
  };

  return (
    <div style={S.container}>
      <div style={S.card}>
        <h2 style={S.header}>Certificate Portal</h2>
        <p style={S.subtitle}>NEMSU Data Insights 2026</p>
        <form onSubmit={handleSearch}>
          <select style={S.input} value={day} onChange={e => setDay(e.target.value)}>
            <option value="1">Day 1 - April 15</option>
            <option value="2">Day 2 - April 17</option>
            <option value="3">Day 3 - April 22</option>
            <option value="4">Day 4 - April 24</option>
            <option value="5">Day 5 - April 29</option>
          </select>
          <input 
            style={S.input} 
            placeholder="Enter Full Name" 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
          <button style={S.button} type="submit">{loading ? 'Searching...' : 'Find Certificate'}</button>
        </form>

        {results.map(p => (
          <div key={p.id} style={S.result}>
            <div>
              <div style={{fontWeight:'bold', fontSize:'14px'}}>{p.name}</div>
              <div style={{fontSize:'12px', color:'#64748b'}}>{p.role}</div>
            </div>
            <button 
              style={{background:'#1e293b', color:'#fff', border:'none', padding:'8px 12px', borderRadius:'6px', cursor:'pointer'}}
              onClick={() => downloadCertificate(p.name, p.cert_date, p.role)}
            >
              Download
            </button>
          </div>
        ))}

        {searched && results.length === 0 && !loading && (
          <div style={S.errorBox}>No record found. Please try searching with just your <b>Last Name</b>.</div>
        )}
      </div>
      <footer style={{marginTop:'20px', fontSize:'10px', color:'#94a3b8'}}>NEMSU Lianga Campus - BSCS</footer>
    </div>
  );
}
