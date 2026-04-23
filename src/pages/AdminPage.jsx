import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

const styles = {
  container: { minHeight: '100vh', background: '#f8fafc', padding: '20px', fontFamily: 'Inter, system-ui, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', maxWidth: '1200px', margin: '0 auto 2rem' },
  title: { fontSize: '28px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.5px' },
  btnLogout: { padding: '10px 20px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', transition: '0.2s opacity' },
  
  card: { background: '#fff', borderRadius: '24px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '30px', maxWidth: '1200px', margin: '0 auto' },
  
  // Stats
  statsRow: { display: 'flex', gap: '15px', marginBottom: '25px', flexWrap: 'wrap' },
  statBadge: { padding: '12px 20px', borderRadius: '15px', fontSize: '0.9rem', fontWeight: '700', display: 'flex', flexDirection: 'column' },
  statLabel: { fontSize: '0.7rem', textTransform: 'uppercase', opacity: 0.8, marginBottom: '4px' },
  
  // Controls
  filterBar: { display: 'flex', gap: '12px', marginBottom: '25px', flexWrap: 'wrap', alignItems: 'center' },
  input: { flex: 1, minWidth: '250px', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px' },
  select: { padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer' },
  btnAdd: { padding: '12px 24px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' },

  // Table
  tableWrapper: { overflowX: 'auto', borderRadius: '12px', border: '1px solid #f1f5f9' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  th: { padding: '16px', background: '#f8fafc', color: '#64748b', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', borderBottom: '2px solid #f1f5f9' },
  td: { padding: '16px', borderBottom: '1px solid #f1f5f9', fontSize: '14px', color: '#334155' },
  
  // Modal & Overlay
  overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modal: { background: '#fff', padding: '40px', borderRadius: '24px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' },
  
  // Toast
  toast: { position: 'fixed', bottom: '30px', right: '30px', padding: '16px 24px', borderRadius: '12px', color: '#fff', fontWeight: 'bold', boxShadow: '0 10px 15px rgba(0,0,0,0.1)', zIndex: 2000 }
};

export default function AdminPage() {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null);
  
  // Filter States
  const [search, setSearch] = useState('');
  const [filterDay, setFilterDay] = useState('All');
  const [filterRole, setFilterRole] = useState('All');

  // Form State
  const [form, setForm] = useState({ name: '', email: '', day: '1', role: 'Student' });

  useEffect(() => { fetchParticipants(); }, []);

  const fetchParticipants = async () => {
    setLoading(true);
    const { data } = await supabase.from('participants').select('*').order('created_at', { ascending: false });
    setList(data || []);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/', { replace: true });
  };

  const showNotification = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('participants').insert([{
      name: form.name.trim(),
      email: form.email.trim(),
      cert_date: form.day,
      role: form.role
    }]);

    if (!error) {
      showNotification('Participant added successfully!');
      setShowModal(false);
      setForm({ name: '', email: '', day: '1', role: 'Student' });
      fetchParticipants();
    } else {
      showNotification('Error adding participant', 'error');
    }
  };

  // Advanced Filtering Logic
  const filtered = list.filter(p => {
    const nameMatch = p.name.toLowerCase().includes(search.toLowerCase());
    const dayMatch = filterDay === 'All' || String(p.cert_date) === filterDay;
    const roleMatch = filterRole === 'All' || p.role === filterRole;
    return nameMatch && dayMatch && roleMatch;
  });

  return (
    <div style={styles.container}>
      {toast && (
        <div style={{ ...styles.toast, background: toast.type === 'error' ? '#ef4444' : '#10b981' }}>
          {toast.msg}
        </div>
      )}

      <div style={styles.header}>
        <h1 style={styles.title}>Data Insights Admin</h1>
        <button onClick={handleLogout} style={styles.btnLogout}>Logout</button>
      </div>

      <div style={styles.card}>
        {/* Stats Row */}
        <div style={styles.statsRow}>
          <div style={{ ...styles.statBadge, background: '#eff6ff', color: '#1d4ed8' }}>
            <span style={styles.statLabel}>Total Records</span>
            <span>{filtered.length}</span>
          </div>
          <div style={{ ...styles.statBadge, background: '#ecfdf5', color: '#059669' }}>
            <span style={styles.statLabel}>Students</span>
            <span>{filtered.filter(x => x.role === 'Student').length}</span>
          </div>
          <div style={{ ...styles.statBadge, background: '#fff7ed', color: '#d97706' }}>
            <span style={styles.statLabel}>Speakers</span>
            <span>{filtered.filter(x => x.role === 'Speaker').length}</span>
          </div>
        </div>

        {/* Filter Bar */}
        <div style={styles.filterBar}>
          <input 
            style={styles.input} 
            placeholder="Filter by name..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select style={styles.select} value={filterDay} onChange={(e) => setFilterDay(e.target.value)}>
            <option value="All">All Days</option>
            {[1,2,3,4,5].map(d => <option key={d} value={d}>Day {d}</option>)}
          </select>
          <select style={styles.select} value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
            <option value="All">All Roles</option>
            <option value="Student">Student</option>
            <option value="Speaker">Speaker</option>
          </select>
          <button style={styles.btnAdd} onClick={() => setShowModal(true)}>+ Add New</button>
        </div>

        {/* Table */}
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Participant Name</th>
                <th style={styles.th}>Role</th>
                <th style={styles.th}>Training Day</th>
                <th style={styles.th}>Email Address</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td style={{ ...styles.td, fontWeight: '700' }}>{p.name}</td>
                  <td style={styles.td}>
                    <span style={{ 
                      padding: '4px 10px', 
                      borderRadius: '6px', 
                      fontSize: '11px', 
                      fontWeight: 'bold',
                      background: p.role === 'Speaker' ? '#fef3c7' : '#d1fae5',
                      color: p.role === 'Speaker' ? '#92400e' : '#065f46'
                    }}>
                      {p.role.toUpperCase()}
                    </span>
                  </td>
                  <td style={styles.td}>Day {p.cert_date}</td>
                  <td style={styles.td}>{p.email || <span style={{ opacity: 0.3 }}>N/A</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Participant Modal */}
      {showModal && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h2 style={{ marginBottom: '20px', fontWeight: '800' }}>Add Participant</h2>
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input 
                required 
                style={styles.input} 
                placeholder="Full Name" 
                value={form.name}
                onChange={e => setForm({...form, name: e.target.value})}
              />
              <input 
                style={styles.input} 
                placeholder="Email (Optional)" 
                value={form.email}
                onChange={e => setForm({...form, email: e.target.value})}
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <select style={{ ...styles.select, flex: 1 }} value={form.day} onChange={e => setForm({...form, day: e.target.value})}>
                  {[1,2,3,4,5].map(d => <option key={d} value={d}>Day {d}</option>)}
                </select>
                <select style={{ ...styles.select, flex: 1 }} value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                  <option value="Student">Student</option>
                  <option value="Speaker">Speaker</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" style={{ ...styles.btnAdd, flex: 1 }}>Save</button>
                <button type="button" onClick={() => setShowModal(false)} style={{ ...styles.select, flex: 1 }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
