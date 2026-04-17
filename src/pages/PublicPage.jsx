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
    // Filter by name and the specific training day
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .ilike('name', `%${search.trim()}%`)
      .eq('cert_date', selectedDay);

    if (error) {
      console.error(error);
    } else {
      setResults(data || []);
    }
    setLoading(false);
  };

  return (
    <div style={S.container}>
      <div style={S.card}>
        <h2 style={S.header}>Claim Your Certificate</h2>
        
        {/* Day Selector - Keep it simple to match your UI */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ color: '#fff', fontSize: '12px', display: 'block', marginBottom: '5px' }}>Select Session:</label>
          <select 
            value={selectedDay} 
            onChange={(e) => setSelectedDay(e.target.value)}
            style={S.select}
          >
            <option value="1">Day 1 - April 15</option>
            <option value="2">Day 2 - April 17</option>
            <option value="3">Day 3 - April 22</option>
            <option value="4">Day 4 - April 24</option>
            <option value="5">Day 5 - April 29</option>
          </select>
        </div>

        <form onSubmit={handleSearch} style={S.searchBox}>
          <input
            style={S.input}
            placeholder="ENTER YOUR FULL NAME"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" style={S.button} disabled={loading}>
            {loading ? '...' : 'Search'}
          </button>
        </form>

        <div style={{ marginTop: '20px' }}>
          {results.map((p) => (
            <div key={p.id} style={S.resultBox}>
              <span style={{ color: '#fff', fontSize: '14px' }}>{p.name}</span>
              <button 
                style={S.downloadBtn} 
                onClick={() => downloadCertificate(p.name, p.cert_date)}
              >
                Download PDF
              </button>
            </div>
          ))}
          {results.length === 0 && search && !loading && (
            <p style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '10px' }}>
              No record found for Day {selectedDay}.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

const S = {
  container: { minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#0a1020', padding: '20px' },
  card: { background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)', padding: '30px', borderRadius: '12px', textAlign: 'center', width: '100%', maxWidth: '400px', border: '1px solid rgba(255,255,255,0.1)' },
  header: { color: '#fff', marginBottom: '20px', fontSize: '20px' },
  select: { width: '100%', padding: '10px', borderRadius: '6px', background: '#fff', border: 'none', marginBottom: '10px', fontSize: '14px' },
  searchBox: { display: 'flex', gap: '5px' },
  input: { flex: 1, padding: '10px', borderRadius: '6px', border: 'none', fontSize: '13px' },
  button: { padding: '10px 20px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
  resultBox: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.1)', padding: '12px', marginTop: '10px', borderRadius: '8px' },
  downloadBtn: { background: '#c9a84c', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', color: '#000', fontSize: '12px' }
};
