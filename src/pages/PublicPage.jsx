import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { downloadCertificate } from '../certificateGenerator';

export default function PublicPage() {
  const [search, setSearch] = useState('');
  const [day, setDay] = useState('1');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!search.trim()) return;
    setLoading(true);
    
    // SEARCH FIX: Uses % wildcard so names with dots (L.) or middle initials match easily
    const { data } = await supabase
      .from('participants')
      .select('*')
      .ilike('name', `%${search.trim().toUpperCase()}%`)
      .eq('cert_date', day);

    setResults(data || []);
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
      <div style={{ background: '#fff', padding: '40px', borderRadius: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', width: '100%', maxWidth: '450px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '28px', color: '#0f172a', marginBottom: '10px' }}>Certificate Portal</h2>
        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '30px' }}>NEMSU Data Insights 2026 Virtual Training</p>
        
        <form onSubmit={handleSearch}>
          <select style={S_PUB.input} value={day} onChange={e => setDay(e.target.value)}>
            <option value="1">Day 1 - April 15</option>
            <option value="2">Day 2 - April 17</option>
            <option value="3">Day 3 - April 22</option>
            <option value="4">Day 4 - April 24</option>
            <option value="5">Day 5 - April 29</option>
          </select>
          <input 
            style={S_PUB.input} 
            placeholder="Enter your Full Name" 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
          <button style={S_PUB.btn} type="submit">{loading ? 'Searching...' : 'Find My Certificate'}</button>
        </form>

        <div style={{ marginTop: '20px' }}>
          {results.map(p => (
            <div key={p.id} style={S_PUB.resCard}>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 'bold', fontSize: '15px' }}>{p.name}</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>{p.role}</div>
              </div>
              <button 
                style={S_PUB.dlBtn} 
                onClick={() => downloadCertificate(p.name, p.cert_date, p.role)}
              >
                Download
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const S_PUB = {
  input: { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', marginBottom: '15px', fontSize: '16px', boxSizing: 'border-box' },
  btn: { width: '100%', padding: '14px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' },
  resCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f1f5f9', padding: '15px', borderRadius: '12px', marginBottom: '10px' },
  dlBtn: { background: '#1e293b', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }
};
