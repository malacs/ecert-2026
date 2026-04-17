import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { downloadCertificate } from '../certificateGenerator';

export default function PublicPage() {
  const [search, setSearch] = useState('');
  const [selectedDay, setSelectedDay] = useState('1'); // Default to Day 1
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!search.trim()) return;

    setLoading(true);
    // Logic: Filter by both name and the specific day selected
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .ilike('name', `%${search.trim()}%`)
      .eq('cert_date', selectedDay);

    if (error) {
      alert("Error fetching certificate");
    } else {
      setResults(data || []);
    }
    setLoading(false);
  };

  return (
    <div style={S.container}>
      <div style={S.card}>
        <h2>Claim Your Certificate</h2>
        
        {/* Simple Day Selector using your existing style theme */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ color: '#fff', marginRight: '10px' }}>Select Session:</label>
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

        <form onSubmit={handleSearch}>
          <input
            style={S.input}
            placeholder="ENTER YOUR FULL NAME"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" style={S.button} disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        <div style={{ marginTop: '20px' }}>
          {results.map((p) => (
            <div key={p.id} style={S.resultBox}>
              <span style={{ color: '#fff' }}>{p.name}</span>
              <button 
                style={S.downloadBtn} 
                onClick={() => downloadCertificate(p.name, p.cert_date)}
              >
                Download PDF
              </button>
            </div>
          ))}
          {results.length === 0 && search && !loading && (
            <p style={{ color: '#ff4d4f' }}>No record found for Day {selectedDay}.</p>
          )}
        </div>
      </div>
    </div>
  );
}

const S = {
  container: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#0a1020' },
  card: { background: 'rgba(255,255,255,0.1)', padding: '30px', borderRadius: '15px', textAlign: 'center', width: '400px' },
  input: { width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '5px', border: 'none' },
  select: { padding: '8px', borderRadius: '5px', background: '#fff', marginBottom: '10px' },
  button: { width: '100%', padding: '10px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' },
  resultBox: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.1)', padding: '10px', marginTop: '10px', borderRadius: '5px' },
  downloadBtn: { background: '#c9a84c', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }
};
