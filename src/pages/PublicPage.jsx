import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { downloadCertificate } from '../certificateGenerator';

const S = {
  container: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#f8fafc', padding: '20px', fontFamily: 'sans-serif' },
  notice: { width: '100%', maxWidth: '500px', background: '#fffbeb', border: '1px solid #fef3c7', padding: '12px', borderRadius: '12px', marginBottom: '15px', textAlign: 'center', fontSize: '0.8rem', color: '#92400e' },
  card: { background: '#fff', padding: '35px 25px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', width: '100%', maxWidth: '500px', textAlign: 'center', border: '1px solid #e2e8f0', boxSizing: 'border-box' },
  header: { color: '#0f172a', fontSize: '24px', marginBottom: '10px' },
  subtitle: { color: '#64748b', fontSize: '14px', marginBottom: '25px' },
  input: { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', marginBottom: '15px', fontSize: '16px', boxSizing: 'border-box' },
  button: { width: '100%', padding: '14px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' },
  result: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f1f5f9', padding: '15px', borderRadius: '12px', marginTop: '10px', textAlign: 'left' }
};

export default function PublicPage() {
  const [search, setSearch] = useState('');
  const [day, setDay] = useState('1');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const cleanSearch = search
      .normalize('NFKD')
      .replace(/[^\w\s]/gi, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase();

    if(!cleanSearch) return setLoading(false);

    const { data } = await supabase
      .from('participants')
      .select('*')
      .ilike('name', `%${cleanSearch}%`)
      .eq('cert_date', day);

    setResults(data || []);
    setLoading(false);
  };

  return (
    <div style={S.container}>
      <div style={S.notice}>
        ⚠️ <strong>Mobile Note:</strong> If your name is not found, try searching using only your <strong>Last Name</strong> or use a desktop browser.
      </div>
      <div style={S.card}>
        <h2 style={S.header}>Certificate Portal</h2>
        <p style={S.subtitle}>NEMSU Data Insights 2026 Virtual Training</p>
        <form onSubmit={handleSearch}>
          <select style={S.input} value={day} onChange={e => setDay(e.target.value)}>
            <option value="1">Day 1 - April 15</option>
            <option value="2">Day 2 - April 17</option>
            <option value="3">Day 3 - April 22</option>
            <option value="4">Day 4 - April 24</option>
            <option value="5">Day 5 - April 29</option>
          </select>
          <input style={S.input} placeholder="Enter Full Name" value={search} onChange={e => setSearch(e.target.value)} />
          <button style={S.button} type="submit">{loading ? 'Searching...' : 'Find Certificate'}</button>
        </form>
        {results.map(p => (
          <div key={p.id} style={S.result}>
            <div>
              <div style={{fontWeight:'bold', fontSize:'14px'}}>{p.name}</div>
              <div style={{fontSize:'12px', color:'#64748b'}}>{p.role}</div>
            </div>
            <button 
              style={{background:'#1e293b', color:'#fff', border:'none', padding:'8px 12px', borderRadius:'6px', cursor:'pointer', fontSize:'12px'}}
              onClick={() => downloadCertificate(p.name, p.cert_date, p.role)}
            >
              Download
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
