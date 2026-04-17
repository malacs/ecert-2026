import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { downloadCertificate } from '../certificateGenerator'; // Ensure this path is correct

const TRAINING_DAYS = [
  { value: '1', label: 'Day 1 (April 15)' },
  { value: '2', label: 'Day 2 (April 17)' },
  { value: '3', label: 'Day 3 (April 22)' },
  { value: '4', label: 'Day 4 (April 24)' },
  { value: '5', label: 'Day 5 (April 29)' },
];

export default function PublicPage() {
  const [search, setSearch] = useState('');
  const [selectedDay, setSelectedDay] = useState('1'); 
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!search.trim()) return;

    setLoading(true);
    setSearched(true);

    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .ilike('name', `%${search.trim()}%`)
      .eq('cert_date', selectedDay);

    if (error) {
      console.error("Supabase Error:", error);
      alert("Error searching for participant.");
    } else {
      setResults(data || []);
    }
    setLoading(false);
  };

  return (
    <div style={S.container}>
      <div style={S.card}>
        <h1 style={S.title}>Claim Your E-Certificate</h1>
        <p style={S.subtitle}>DATA INSIGHTS 2026: Virtual Training Series</p>

        {/* --- DAY SELECTOR --- */}
        <div style={S.tabContainer}>
          {TRAINING_DAYS.map((day) => (
            <button
              key={day.value}
              type="button"
              onClick={() => {
                setSelectedDay(day.value);
                setResults([]);
                setSearched(false);
              }}
              style={selectedDay === day.value ? S.tabActive : S.tab}
            >
              {day.label}
            </button>
          ))}
        </div>

        {/* --- SEARCH FORM --- */}
        <form onSubmit={handleSearch} style={S.searchBox}>
          <input
            style={S.input}
            placeholder="Type your full name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" style={S.searchBtn} disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {/* --- RESULTS AREA --- */}
        <div style={S.resultsArea}>
          {results.length > 0 ? (
            results.map((p) => (
              <div key={p.id} style={S.resultItem}>
                <div style={{ flex: 1 }}>
                  <div style={S.resName}>{p.name}</div>
                  <div style={S.resInfo}>Verified Participant - Day {p.cert_date}</div>
                </div>
                <button 
                  style={S.downloadBtn}
                  onClick={() => downloadCertificate(p.name, p.cert_date)}
                >
                  📥 Download
                </button>
              </div>
            ))
          ) : (
            searched && !loading && (
              <p style={S.noResult}>No records found for this name on the selected day.</p>
            )
          )}
        </div>
      </div>
    </div>
  );
}

const S = {
  container: { minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#0a0a1a', padding: '20px', fontFamily: 'Arial, sans-serif' },
  card: { width: '100%', maxWidth: '600px', background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(12px)', padding: '40px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' },
  title: { color: '#fff', margin: '0 0 10px 0', fontSize: '24px' },
  subtitle: { color: '#8f9bba', margin: '0 0 30px 0', fontSize: '14px' },
  tabContainer: { display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px', marginBottom: '25px' },
  tab: { padding: '8px 14px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: '12px' },
  tabActive: { padding: '8px 14px', borderRadius: '20px', border: 'none', background: '#4f46e5', color: '#fff', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' },
  searchBox: { display: 'flex', flexDirection: 'column', gap: '12px' },
  input: { padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: '16px', textAlign: 'center', outline: 'none' },
  searchBtn: { padding: '14px', borderRadius: '12px', border: 'none', background: '#4f46e5', color: '#fff', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' },
  resultsArea: { marginTop: '30px' },
  resultItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '15px 20px', borderRadius: '12px', marginBottom: '10px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'left' },
  resName: { color: '#fff', fontWeight: 'bold', fontSize: '15px' },
  resInfo: { color: '#8f9bba', fontSize: '11px', marginTop: '4px' },
  downloadBtn: { background: '#c9a84c', color: '#1a1060', border: 'none', padding: '8px 14px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' },
  noResult: { color: '#ff4d4f', fontSize: '13px', marginTop: '20px' }
};
