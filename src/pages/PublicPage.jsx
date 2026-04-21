import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { downloadCertificate } from '../certificateGenerator';

const TRAINING_DAYS = [
  { value: '1', label: 'Day 1 - April 15' },
  { value: '2', label: 'Day 2 - April 17' },
  { value: '3', label: 'Day 3 - April 22' },
  { value: '4', label: 'Day 4 - April 24' },
  { value: '5', label: 'Day 5 - April 29' },
];

export default function PublicPage() {
  const [search, setSearch] = useState('');
  const [selectedDay, setSelectedDay] = useState('1'); 
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!search.trim()) return;
    setLoading(true);
    setHasSearched(true);

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
        <div style={S.brandBadge}>Data Insights 2026</div>
        <h2 style={S.header}>Certificate Portal</h2>
        <p style={S.subtitle}>Enter your name as it appears on your registration to download your e-certificate.</p>
        
        <form onSubmit={handleSearch}>
          <div style={S.formGroup}>
            <label style={S.label}>Step 1: Select Training Day</label>
            <select 
              value={selectedDay} 
              onChange={(e) => {
                setSelectedDay(e.target.value);
                setResults([]); 
                setHasSearched(false);
              }} 
              style={S.select}
            >
              {TRAINING_DAYS.map(day => (
                <option key={day.value} value={day.value}>{day.label}</option>
              ))}
            </select>
          </div>

          <div style={S.formGroup}>
            <label style={S.label}>Step 2: Enter Full Name</label>
            <div style={S.searchWrapper}>
              <input 
                style={S.input} 
                placeholder="Ex: Juan Dela Cruz" 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
              />
              <button type="submit" style={S.button} disabled={loading}>
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>
        </form>

        <div style={S.resultsWrapper}>
          {results.map((p) => (
            <div key={p.id} style={S.resultBox}>
              <div style={S.resInfo}>
                <div style={S.resName}>{p.name}</div>
                <div style={{...S.resRole, color: p.role === 'Speaker' ? '#b45309' : '#64748b'}}>
                  {p.role === 'Speaker' ? 'Resource Speaker' : 'Training Participant'}
                </div>
              </div>
              <button 
                style={S.downloadBtn} 
                onClick={() => downloadCertificate(p.name, p.cert_date)}
              >
                Download PDF
              </button>
            </div>
          ))}

          {hasSearched && results.length === 0 && !loading && (
            <div style={S.noRecord}>
              No record found for this name on the selected day. Please check your spelling.
            </div>
          )}
        </div>
      </div>
      <footer style={S.footer}>
        NEMSU Lianga Campus - Bachelor of Science in Computer Science
      </footer>
    </div>
  );
}

const S = {
  container: { minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#f8fafc', fontFamily: 'system-ui, sans-serif', padding: '20px' },
  card: { background: '#ffffff', padding: '40px', borderRadius: '20px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', textAlign: 'center', width: '100%', maxWidth: '500px', border: '1px solid #e2e8f0' },
  brandBadge: { background: '#eff6ff', color: '#1d4ed8', padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', display: 'inline-block', marginBottom: '15px', textTransform: 'uppercase' },
  header: { color: '#0f172a', fontSize: '28px', margin: '0 0 10px 0', fontWeight: '800' },
  subtitle: { color: '#64748b', fontSize: '14px', lineHeight: '1.5', marginBottom: '30px' },
  formGroup: { textAlign: 'left', marginBottom: '20px' },
  label: { color: '#475569', fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px', display: 'block' },
  select: { width: '100%', padding: '12px', borderRadius: '10px', background: '#fff', border: '1px solid #cbd5e1', fontSize: '0.95rem', color: '#1e293b', outline: 'none' },
  searchWrapper: { display: 'flex', gap: '8px' },
  input: { flex: 1, padding: '12px', borderRadius: '10px', background: '#fff', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none' },
  button: { padding: '0 20px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' },
  resultsWrapper: { marginTop: '20px' },
  resultBox: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f1f5f9', padding: '16px', borderRadius: '12px', marginBottom: '10px', borderLeft: '4px solid #3b82f6' },
  resInfo: { textAlign: 'left' },
  resName: { color: '#0f172a', fontWeight: 'bold', fontSize: '15px' },
  resRole: { fontSize: '0.75rem', marginTop: '2px', fontWeight: '500' },
  downloadBtn: { background: '#1e293b', color: '#fff', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.75rem', border: 'none' },
  noRecord: { color: '#ef4444', fontSize: '0.85rem', marginTop: '20px', padding: '12px', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fee2e2' },
  footer: { marginTop: '30px', color: '#94a3b8', fontSize: '0.75rem', textAlign: 'center' }
};
