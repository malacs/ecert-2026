import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';

const DAY_MAP = {
  '1': 'Day 1 — April 15, 2026',
  '2': 'Day 2 — April 17, 2026',
  '3': 'Day 3 — April 22, 2026',
  '4': 'Day 4 — April 24, 2026',
  '5': 'Day 5 — April 29, 2026',
};

export default function PublicPage() {
  const [search, setSearch] = useState('');
  const [selectedDay, setSelectedDay] = useState('1');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    
    // BACK TO OLD LOGIC: Search exactly as typed
    if (!search) return;

    setLoading(true);
    setHasSearched(true);

    try {
      const { data, error } = await supabase
        .from('participants')
        .select('*')
        .ilike('name', `%${search}%`)
        .eq('cert_date', selectedDay);

      if (error) throw error;
      setResults(data || []);
    } catch (err) {
      console.error(err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.container}>
      <div style={S.card}>
        <h1 style={S.title}>E-Certificate Portal</h1>
        <p style={S.subtitle}>Data Insights 2026: Virtual Training Series</p>

        <form onSubmit={handleSearch} style={S.form}>
          <select 
            style={S.select} 
            value={selectedDay} 
            onChange={(e) => setSelectedDay(e.target.value)}
          >
            {Object.entries(DAY_MAP).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>

          <input
            style={S.input}
            placeholder="Enter your Full Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <button type="submit" style={S.button} disabled={loading}>
            {loading ? 'Searching...' : 'Claim Certificate'}
          </button>
        </form>

        {hasSearched && (
          <div style={S.resultsArea}>
            {results.length > 0 ? (
              results.map((p) => (
                <Link 
                  key={p.id} 
                  to={`/certificate/${encodeURIComponent(p.name)}/${p.cert_date}`} 
                  style={S.resultItem}
                >
                  <div style={S.resultInfo}>
                    <span style={S.resultName}>{p.name}</span>
                    <span style={S.resultRole}>{p.role}</span>
                  </div>
                  <span style={S.viewBtn}>View →</span>
                </Link>
              ))
            ) : (
              <p style={S.noResult}>No record found. Please check the spelling or selected day.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const S = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a', padding: '20px' },
  card: { backgroundColor: '#1e293b', padding: '40px', borderRadius: '24px', width: '100%', maxWidth: '500px', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' },
  title: { color: '#fff', fontSize: '28px', marginBottom: '8px', fontWeight: '800' },
  subtitle: { color: '#94a3b8', fontSize: '14px', marginBottom: '30px' },
  form: { display: 'flex', flexDirection: 'column', gap: '15px' },
  select: { padding: '14px', borderRadius: '12px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', fontSize: '15px' },
  input: { padding: '14px', borderRadius: '12px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', fontSize: '15px' },
  button: { padding: '14px', borderRadius: '12px', border: 'none', backgroundColor: '#3b82f6', color: '#fff', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' },
  resultsArea: { marginTop: '30px', textAlign: 'left', borderTop: '1px solid #334155', paddingTop: '20px' },
  resultItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', padding: '15px', borderRadius: '12px', marginBottom: '10px', textDecoration: 'none', border: '1px solid #334155' },
  resultInfo: { display: 'flex', flexDirection: 'column' },
  resultName: { color: '#fff', fontWeight: '600', fontSize: '15px' },
  resultRole: { color: '#64748b', fontSize: '12px' },
  viewBtn: { color: '#3b82f6', fontSize: '13px', fontWeight: 'bold' },
  noResult: { color: '#ef4444', fontSize: '14px', textAlign: 'center' }
};
