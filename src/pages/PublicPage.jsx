import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { downloadCertificate } from '../utils/certificateGenerator';

const TRAINING_DAYS = [
  { value: '1', label: 'Day 1' },
  { value: '2', label: 'Day 2' },
  { value: '3', label: 'Day 3' },
  { value: '4', label: 'Day 4' },
  { value: '5', label: 'Day 5' },
];

export default function PublicPage() {
  const [search, setSearch] = useState('');
  const [selectedDay, setSelectedDay] = useState('1'); // Default to Day 1
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!search.trim()) return;

    setLoading(true);
    setSearched(true);

    // FIX: Filter by Name AND the selected Training Day
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .ilike('name', `%${search.trim()}%`)
      .eq('cert_date', selectedDay);

    if (error) {
      console.error(error);
      alert("Error fetching data");
    } else {
      setResults(data || []);
    }
    setLoading(false);
  };

  return (
    <div style={S.container}>
      <div style={S.card}>
        <h1 style={S.title}>Claim Your Certificate</h1>
        <p style={S.subtitle}>DATA INSIGHTS 2026: Virtual Training Series</p>

        {/* DAY SELECTOR TABS */}
        <div style={S.tabContainer}>
          {TRAINING_DAYS.map((day) => (
            <button
              key={day.value}
              onClick={() => {
                setSelectedDay(day.value);
                setResults([]); // Clear results when switching days
                setSearched(false);
              }}
              style={selectedDay === day.value ? S.tabActive : S.tab}
            >
              {day.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearch} style={S.searchBox}>
          <input
            style={S.input}
            placeholder="Enter your Full Name (e.g. JUAN DELA CRUZ)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" style={S.searchBtn} disabled={loading}>
            {loading ? 'Searching...' : 'Find Certificate'}
          </button>
        </form>

        <div style={S.resultsArea}>
          {results.length > 0 ? (
            results.map((p) => (
              <div key={p.id} style={S.resultItem}>
                <div>
                  <div style={S.resName}>{p.name}</div>
                  <div style={S.resInfo}>Day {p.cert_date} Participant</div>
                </div>
                <button 
                  style={S.downloadBtn}
                  onClick={() => downloadCertificate(p.name, p.cert_date)}
                >
                  📥 Download PDF
                </button>
              </div>
            ))
          ) : (
            searched && !loading && (
              <p style={S.noResult}>No record found for {search.toUpperCase()} on Day {selectedDay}.</p>
            )
          )}
        </div>
      </div>
    </div>
  );
}

const S = {
  container: { minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#0a0a1a', padding: '20px' },
  card: { width: '100%', maxWidth: '600px', background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(10px)', padding: '40px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' },
  title: { color: '#fff', margin: '0 0 10px 0', fontSize: '28px' },
  subtitle: { color: '#8f9bba', margin: '0 0 30px 0', fontSize: '14px' },
  
  // Tabs
  tabContainer: { display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '20px' },
  tab: { padding: '8px 16px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: '13px' },
  tabActive: { padding: '8px 16px', borderRadius: '20px', border: 'none', background: '#4f46e5', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' },
  
  // Search
  searchBox: { display: 'flex', flexDirection: 'column', gap: '12px' },
  input: { padding: '15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: '16px', textAlign: 'center', outline: 'none' },
  searchBtn: { padding: '15px', borderRadius: '12px', border: 'none', background: '#4f46e5', color: '#fff', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' },
  
  // Results
  resultsArea: { marginTop: '30px', textAlign: 'left' },
  resultItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '15px 20px', borderRadius: '12px', marginBottom: '10px', border: '1px solid rgba(255,255,255,0.05)' },
  resName: { color: '#fff', fontWeight: 'bold', fontSize: '16px' },
  resInfo: { color: '#8f9bba', fontSize: '12px' },
  downloadBtn: { background: '#c9a84c', color: '#1a1060', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' },
  noResult: { color: '#ff4d4f', fontSize: '14px' }
};
