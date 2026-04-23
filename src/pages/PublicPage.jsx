import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { downloadCertificate } from '../certificateGenerator';

export default function PublicPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [day, setDay] = useState('1');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    // .ilike with % allows searching partial names (e.g., "Mar" finds "Marvin")
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .ilike('name', `%${searchTerm}%`)
      .eq('cert_date', day);

    if (!error) setResults(data || []);
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: '800px', margin: 'auto', padding: '20px', fontFamily: 'Arial' }}>
      <h2 style={{ textAlign: 'center' }}>Search Certificate</h2>
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <select value={day} onChange={(e) => setDay(e.target.value)} style={{ padding: '10px' }}>
          {[1, 2, 3, 4, 5].map(d => <option key={d} value={d}>Day {d}</option>)}
        </select>
        <input 
          placeholder="Enter Name (Partial or Full)" 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          style={{ flex: 1, padding: '10px' }}
        />
        <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', cursor: 'pointer' }}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      <div style={{ border: '1px solid #ddd', borderRadius: '8px' }}>
        {results.map((p) => (
          <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', borderBottom: '1px solid #eee', alignItems: 'center' }}>
            <div>
              <strong>{p.name}</strong> <br />
              <small style={{ color: '#666' }}>{p.role} — Day {p.cert_date}</small>
            </div>
            <button 
              onClick={() => downloadCertificate(p.name, p.cert_date, p.role)}
              style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer' }}
            >
              Download PDF
            </button>
          </div>
        ))}
        {results.length === 0 && !loading && <p style={{ padding: '20px', textAlign: 'center' }}>No records found.</p>}
      </div>
    </div>
  );
}
