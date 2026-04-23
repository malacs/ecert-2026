import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

const S = {
  container: { minHeight: '100vh', background: '#f8fafc', padding: '20px', fontFamily: 'system-ui, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', maxWidth: '1000px', margin: '0 auto 2rem' },
  title: { fontSize: '24px', fontWeight: '800', color: '#0f172a' },
  btnLogout: { padding: '8px 16px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
  
  card: { background: '#fff', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', padding: '20px', maxWidth: '1000px', margin: '0 auto' },
  
  // Stats Section
  statsRow: { display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' },
  statBadge: { padding: '8px 16px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 'bold', border: '1px solid #e2e8f0' },
  
  // Filter Section
  filterBar: { display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' },
  input: { flex: 1, minWidth: '200px', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' },
  select: { padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff' },

  // Table Section
  tableWrapper: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '12px', borderBottom: '2px solid #f1f5f9', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' },
  td: { padding: '12px', borderBottom: '1px solid #f1f5f9', fontSize: '0.9rem', color: '#1e293b' },
  roleTag: { padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 'bold' }
};

export default function AdminPage() {
  const navigate = useNavigate();
  const [participants, setParticipants] = useState([]);
  const [filters, setFilters] = useState({ name: '', day: 'All', role: 'All' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('participants').select('*').order('name', { ascending: true });
    if (!error) setParticipants(data || []);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // Redirect to login/public page and clear navigation history
    navigate('/', { replace: true });
  };

  // Logic for stats and filtering
  const filteredList = participants.filter(p => {
    const matchName = p.name.toLowerCase().includes(filters.name.toLowerCase());
    const matchDay = filters.day === 'All' || String(p.cert_date) === filters.day;
    const matchRole = filters.role === 'All' || p.role === filters.role;
    return matchName && matchDay && matchRole;
  });

  const totalCount = filteredList.length;
  const speakerCount = filteredList.filter(p => p.role === 'Speaker').length;
  const studentCount = filteredList.filter(p => p.role === 'Student').length;

  return (
    <div style={S.container}>
      <div style={S.header}>
        <h1 style={S.title}>Admin Panel</h1>
        <button onClick={handleLogout} style={S.btnLogout}>Logout</button>
      </div>

      <div style={S.card}>
        {/* Stats Display */}
        <div style={S.statsRow}>
          <div style={{...S.statBadge, background: '#eff6ff', color: '#1d4ed8'}}>Total: {totalCount}</div>
          <div style={{...S.statBadge, background: '#f0fdf4', color: '#166534'}}>Students: {studentCount}</div>
          <div style={{...S.statBadge, background: '#fff7ed', color: '#9a3412'}}>Speakers: {speakerCount}</div>
        </div>

        {/* Search & Filter Bar */}
        <div style={S.filterBar}>
          <input 
            style={S.input} 
            placeholder="Search by name..." 
            value={filters.name}
            onChange={(e) => setFilters({...filters, name: e.target.value})}
          />
          <select 
            style={S.select} 
            value={filters.day}
            onChange={(e) => setFilters({...filters, day: e.target.value})}
          >
            <option value="All">All Days</option>
            <option value="1">Day 1</option>
            <option value="2">Day 2</option>
            <option value="3">Day 3</option>
            <option value="4">Day 4</option>
            <option value="5">Day 5</option>
          </select>
          <select 
            style={S.select} 
            value={filters.role}
            onChange={(e) => setFilters({...filters, role: e.target.value})}
          >
            <option value="All">All Roles</option>
            <option value="Student">Student</option>
            <option value="Speaker">Speaker</option>
          </select>
        </div>

        {/* Data Table */}
        <div style={S.tableWrapper}>
          {loading ? <p>Loading data...</p> : (
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Name</th>
                  <th style={S.th}>Role</th>
                  <th style={S.th}>Day</th>
                  <th style={S.th}>Email</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((p) => (
                  <tr key={p.id}>
                    <td style={S.td}><strong>{p.name}</strong></td>
                    <td style={S.td}>
                      <span style={{
                        ...S.roleTag, 
                        background: p.role === 'Speaker' ? '#ffedd5' : '#dcfce7',
                        color: p.role === 'Speaker' ? '#9a3412' : '#166534'
                      }}>
                        {p.role}
                      </span>
                    </td>
                    <td style={S.td}>Day {p.cert_date}</td>
                    <td style={S.td}>{p.email || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!loading && filteredList.length === 0 && (
            <p style={{textAlign: 'center', color: '#64748b', padding: '20px'}}>No records found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
