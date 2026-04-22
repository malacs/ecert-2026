import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { downloadCertificate } from '../certificateGenerator';

const S = {
  container: { minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#f8fafc', fontFamily: 'system-ui, sans-serif', padding: '15px' },
  card: { background: '#ffffff', padding: '40px 20px', borderRadius: '20px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', textAlign: 'center', width: '100%', maxWidth: '500px', border: '1px solid #e2e8f0', boxSizing: 'border-box' },
  brandBadge: { background: '#eff6ff', color: '#1d4ed8', padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', display: 'inline-block', marginBottom: '15px', textTransform: 'uppercase' },
  header: { color: '#0f172a', fontSize: '28px', margin: '0 0 10px 0', fontWeight: '800' },
  subtitle: { color: '#64748b', fontSize: '14px', lineHeight: '1.5', marginBottom: '30px' },
  formGroup: { textAlign: 'left', marginBottom: '20px' },
  label: { color: '#475569', fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px', display: 'block' },
  select: { width: '100%', padding: '12px', borderRadius: '10px', background: '#fff', border: '1px solid #cbd5e1', fontSize: '16px', color: '#1e293b', outline: 'none', boxSizing: 'border-box' },
  searchWrapper: { display: 'flex', gap: '8px', flexWrap: 'nowrap' },
  input: { flex: 1, padding: '12px', borderRadius: '10px', background: '#fff', border: '1px solid #cbd5e1', fontSize: '16px', outline: 'none', minWidth: '0', boxSizing: 'border-box' },
  button: { padding: '12px 20px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem', whiteSpace: 'nowrap' },
  resultsWrapper: { marginTop: '20px' },
  resultBox: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f1f5f9', padding: '16px', borderRadius: '12px', marginBottom: '10px', borderLeft: '4px solid #3b82f6', gap: '10px', flexWrap: 'wrap' },
  resInfo: { textAlign: 'left', flex: 1 },
  resName: { color: '#0f172a', fontWeight: 'bold', fontSize: '15px', wordBreak: 'break-word' },
  resRole: { fontSize: '0.75rem', marginTop: '2px', fontWeight: '500' },
  downloadBtn: { background: '#1e293b', color: '#fff', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.75rem', border: 'none', flexShrink: 0 },
  noRecord: { color: '#ef4444', fontSize: '0.85rem', marginTop: '20px', padding: '12px', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fee2e2' },
  footer: { marginTop: '30px', color: '#94a3b8', fontSize: '0.75rem', textAlign: 'center' }
};

export default function PublicPage() {
  const [search, setSearch] = useState('');
  const [selectedDay, setSelectedDay] = useState('1'); 
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();

    // MATCHES ADMIN CLEANER: Strips Google Docs junk and mobile hidden chars
    const normalized = search
      .normalize('NFKD')
      .replace(/[\u00A0\u1680​\u180e\u2000-\u200b\u202f\u205f\u3000\ufeff]/g, ' ') 
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase();

    if (!normalized) return;

    setLoading(true);
    setHasSearched(true);

    try {
      const { data, error } = await supabase
        .from('participants')
        .select('*')
        .ilike('name', `%${normalized}%`)
        .eq('cert_date', selectedDay);

      if (!error) setResults(data || []);
      else setResults([]);
    } catch {
      setResults([]);
    }
    setLoading(false);
  };

  return (
    <div style={S.container}>
      <div style={S.card}>
        <div style={S.brandBadge}>Data Insights 2026</div>
        <h2 style={S.header}>Certificate Portal</h2>
        <p style={S.subtitle}>Enter your name to download your e-certificate.</p>
        
        <form onSubmit={handleSearch}>
          <div style={S.formGroup}>
            <label style={S.label}>Step 1: Select Training Day</label>
            <select 
              value={selectedDay} 
              onChange={(e) => { setSelectedDay(e.target.value); setResults([]); setHasSearched(false); }} 
              style={S.select}
            >
              <option value="1">Day 1 - April 15</option>
              <option value="2">Day 2 - April 17</option>
              <option value="3">Day 3 - April 22</option>
              <option value="4">Day 4 - April 24</option>
              <option value="5">Day 5 - April 29</option>
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
                type="text"
                autoComplete="off"
              />
              <button type="submit" style={S.button} disabled={loading}>{loading ? '...' : 'Search'}</button>
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
                onClick={() => downloadCertificate(p.name, p.cert_date, p.role)}
              >
                Download PDF
              </button>
            </div>
          ))}
          {hasSearched && results.length === 0 && !loading && (
            <div style={S.noRecord}>
              Certificate not found. Ensure you selected the correct day or try using just your last name.
            </div>
          )}
        </div>
      </div>
      <footer style={S.footer}>NEMSU Lianga Campus - BS in Computer Science</footer>
    </div>
  );
}
