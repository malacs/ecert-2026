import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import emailjs from '@emailjs/browser';

const ADMIN_PASSWORD = process.env.REACT_APP_ADMIN_PASSWORD || 'admindatamining2026!';
const ITEMS_PER_PAGE = 20;

const TRAINING_DAYS = [
  { value: '1', label: 'Day 1 — April 15, 2026' },
  { value: '2', label: 'Day 2 — April 17, 2026' },
  { value: '3', label: 'Day 3 — April 22, 2026' },
  { value: '4', label: 'Day 4 — April 24, 2026' },
  { value: '5', label: 'Day 5 — April 29, 2026' },
];

const DAY_LABEL = { 
  '1': 'April 15, 2026', 
  '2': 'April 17, 2026', 
  '3': 'April 22, 2026', 
  '4': 'April 24, 2026', 
  '5': 'April 29, 2026' 
};

export default function AdminPage() {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState(() => localStorage.getItem('isAdminAuthenticated') === 'true');
  const [pw, setPw] = useState('');
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all'); 
  const [showDayPicker, setShowDayPicker] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [trainingDay, setTrainingDay] = useState('');
  const [adding, setAdding] = useState(false);
  const [sending, setSending] = useState(null);
  const [sendingAll, setSendingAll] = useState(false);

  // Edit State
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', cert_date: '' });

  useEffect(() => { if (authed) fetchParticipants(); }, [authed]);

  const fetchParticipants = async () => {
    setLoading(true);
    const { data } = await supabase.from('participants').select('*').order('created_at', { ascending: false });
    if (data) setParticipants(data);
    setLoading(false);
  };

  const handleLogin = () => {
    if (pw === ADMIN_PASSWORD) {
      setAuthed(true);
      localStorage.setItem('isAdminAuthenticated', 'true');
    } else { alert('Incorrect Password'); }
  };

  const handleLogout = () => {
    if (window.confirm("Logout?")) {
      setAuthed(false);
      localStorage.removeItem('isAdminAuthenticated');
      navigate('/admin');
    }
  };

  const handleAdd = async () => {
    const cleanName = name.trim().toUpperCase();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanName || !cleanEmail || !trainingDay) return alert("Fill all fields");

    const isDuplicate = participants.some(p => p.name === cleanName && String(p.cert_date) === String(trainingDay));
    if (isDuplicate) return alert(`Duplicate: ${cleanName} already exists for this day!`);

    setAdding(true);
    await supabase.from('participants').insert([{ name: cleanName, email: cleanEmail, cert_date: trainingDay, email_sent: false }]);
    setName(''); setEmail(''); setTrainingDay('');
    fetchParticipants();
    setAdding(false);
  };

  const handleEditClick = (p) => {
    setEditingId(p.id);
    setEditForm({ name: p.name, email: p.email, cert_date: p.cert_date });
  };

  const handleUpdate = async (id) => {
    const { error } = await supabase.from('participants').update({
      name: editForm.name.toUpperCase(),
      email: editForm.email.toLowerCase(),
      cert_date: editForm.cert_date
    }).eq('id', id);

    if (!error) {
      setEditingId(null);
      fetchParticipants();
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this participant?")) {
      await supabase.from('participants').delete().eq('id', id);
      fetchParticipants();
    }
  };

  const handleSendEmail = async (p) => {
    if (p.email_sent) return;
    setSending(p.id);
    try {
      await emailjs.send(
        process.env.REACT_APP_EMAILJS_SERVICE_ID,
        process.env.REACT_APP_EMAILJS_TEMPLATE_ID,
        { to_name: p.name, to_email: p.email, certificate_url: `${window.location.origin}/certificate/${encodeURIComponent(p.name)}/${p.cert_date}` },
        process.env.REACT_APP_EMAILJS_PUBLIC_KEY
      );
      await supabase.from('participants').update({ email_sent: true }).eq('id', p.id);
      setParticipants(prev => prev.map(item => item.id === p.id ? { ...item, email_sent: true } : item));
    } catch (e) { console.error(e); }
    setSending(null);
  };

  const handleSendAll = async () => {
    const targets = filtered.filter(p => !p.email_sent);
    if (targets.length === 0) return alert("No pending emails to send.");
    if (!window.confirm(`Send ${targets.length} pending certificates?`)) return;

    setSendingAll(true);
    for (const p of targets) {
      await handleSendEmail(p);
      await new Promise(res => setTimeout(res, 1200)); 
    }
    setSendingAll(false);
    alert('Batch complete.');
  };

  const filtered = participants.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.email.toLowerCase().includes(search.toLowerCase());
    const matchesDay = selectedFilter === 'all' || String(p.cert_date) === String(selectedFilter);
    return matchesSearch && matchesDay;
  });

  const currentItems = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

  // --- LOGIN UI ---
  if (!authed) return (
    <div style={S.loginPage}>
      <div style={S.glow1}></div>
      <div style={S.glow2}></div>
      <div style={S.loginCard}>
        <div style={S.iconCircle}>🔐</div>
        <h1 style={S.loginHeader}>Admin Portal</h1>
        <p style={S.loginSubtitle}>DATA INSIGHTS 2026 Control Center</p>
        <div style={{ textAlign: 'left', marginBottom: '15px' }}>
          <label style={S.loginLabel}>Access Password</label>
          <input 
            style={S.loginInput} 
            type="password" 
            placeholder="••••••••••••" 
            value={pw} 
            onChange={e => setPw(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && handleLogin()} 
          />
        </div>
        <button style={S.loginBtn} onClick={handleLogin}>SECURE LOGIN</button>
        <p style={S.footerNote}>Authorized Personnel Only</p>
      </div>
    </div>
  );

  // --- DASHBOARD UI ---
  return (
    <div style={S.page}>
      <header style={S.header}>
        <div style={S.headerInner}>
          <h1 style={S.headerTitle}>🎓 Admin Dashboard</h1>
          <div style={{display: 'flex', gap: 10}}>
             <button style={S.presBtn} onClick={() => setShowDayPicker(true)}>📺 Presentation</button>
             <button style={S.refreshBtn} onClick={fetchParticipants}>Refresh</button>
             <button style={S.sendAllBtn} onClick={handleSendAll} disabled={sendingAll}>{sendingAll ? 'Sending...' : '📧 Send Pending'}</button>
             <button style={S.logoutBtn} onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </header>

      {showDayPicker && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <h3 style={{marginBottom: '15px'}}>Select Presentation Day</h3>
            <div style={{display:'flex', flexDirection:'column', gap:10}}>
              {TRAINING_DAYS.map(day => (
                <button key={day.value} style={S.modalBtn} onClick={() => navigate(`/presentation?day=${day.value}`)}>{day.label}</button>
              ))}
              <button style={S.cancelBtn} onClick={() => setShowDayPicker(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <main style={S.main}>
        <div style={S.card}>
          <div style={S.formRow}>
            <input style={S.input} placeholder="NAME" value={name} onChange={e => setName(e.target.value)} />
            <input style={S.input} placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
            <select style={S.select} value={trainingDay} onChange={e => setTrainingDay(e.target.value)}>
              <option value="">Select Day</option>
              {TRAINING_DAYS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
            <button style={S.btnPrimary} onClick={handleAdd}>{adding ? '...' : 'Add'}</button>
          </div>
        </div>

        <div style={S.card}>
          <div style={S.listHeader}>
            <div style={S.filterBar}>
              <button style={selectedFilter === 'all' ? S.filterBtnActive : S.filterBtn} onClick={() => {setSelectedFilter('all'); setCurrentPage(1);}}>All</button>
              {TRAINING_DAYS.map(day => (<button key={day.value} style={selectedFilter === day.value ? S.filterBtnActive : S.filterBtn} onClick={() => {setSelectedFilter(day.value); setCurrentPage(1);}}>Day {day.value}</button>))}
            </div>
            <input style={{...S.input, maxWidth: 200}} placeholder="Search..." value={search} onChange={e => {setSearch(e.target.value); setCurrentPage(1);}} />
          </div>
          
          <div style={S.tableContainer}>
            <table style={S.table}>
              <thead><tr style={S.thRow}>{['#','Name','Email','Date','Status','Actions'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
              <tbody>
                {currentItems.length > 0 ? currentItems.map((p, i) => (
                  <tr key={p.id} style={S.tr}>
                    <td style={S.td}>{((currentPage-1)*ITEMS_PER_PAGE)+i+1}</td>
                    {editingId === p.id ? (
                      <>
                        <td style={S.td}><input style={S.editInput} value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} /></td>
                        <td style={S.td}><input style={S.editInput} value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} /></td>
                        <td style={S.td}>
                          <select style={S.editInput} value={editForm.cert_date} onChange={e => setEditForm({...editForm, cert_date: e.target.value})}>
                            {TRAINING_DAYS.map(d => <option key={d.value} value={d.value}>Day {d.value}</option>)}
                          </select>
                        </td>
                      </>
                    ) : (
                      <>
                        <td style={S.td}><b>{p.name}</b></td>
                        <td style={S.td}>{p.email}</td>
                        <td style={S.td}>{DAY_LABEL[String(p.cert_date)] || p.cert_date}</td>
                      </>
                    )}
                    <td style={S.td}><span style={p.email_sent ? S.badgeSent : S.badgePending}>{p.email_sent ? 'Sent' : 'Pending'}</span></td>
                    <td style={S.td}>
                      {editingId === p.id ? (
                        <button style={S.btnSave} onClick={() => handleUpdate(p.id)}>Save</button>
                      ) : (
                        <div style={{display:'flex', alignItems:'center'}}>
                          <button style={S.btnSend} onClick={() => handleSendEmail(p)} disabled={sending === p.id || p.email_sent}>{p.email_sent ? 'Sent' : 'Email'}</button>
                          <button style={S.btnEdit} onClick={() => handleEditClick(p)}>Edit</button>
                          <button style={S.btnDelete} onClick={() => handleDelete(p.id)}>🗑</button>
                        </div>
                      )}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6" style={S.emptyState}>No participants found for this session.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div style={S.pagination}>
              <button style={currentPage === 1 ? S.pageBtnDisabled : S.pageBtn} disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}>← Back</button>
              <span style={S.pageInfo}>Page {currentPage} of {totalPages}</span>
              <button style={currentPage === totalPages ? S.pageBtnDisabled : S.pageBtn} disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)}>Next →</button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

const S = {
  // --- LOGIN ---
  loginPage: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#04050a', position: 'relative', overflow: 'hidden', fontFamily: 'sans-serif' },
  glow1: { position: 'absolute', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(79,70,229,0.15) 0%, transparent 70%)', top: '-5%', left: '-5%' },
  glow2: { position: 'absolute', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(199,168,76,0.1) 0%, transparent 70%)', bottom: '-10%', right: '-5%' },
  loginCard: { width: '100%', maxWidth: '380px', padding: '40px 30px', background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(20px)', borderRadius: '24px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)', zIndex: 1 },
  iconCircle: { width: '50px', height: '50px', background: 'rgba(79,70,229,0.1)', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 20px auto', color: '#fff' },
  loginHeader: { color: '#fff', fontSize: '22px', fontWeight: 'bold', margin: '0' },
  loginSubtitle: { color: '#8f9bba', fontSize: '12px', marginBottom: '30px' },
  loginLabel: { color: '#8f9bba', fontSize: '11px', textTransform: 'uppercase', display: 'block', marginBottom: '8px' },
  loginInput: { width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #333', background: '#000', color: '#fff', fontSize: '16px', outline: 'none', boxSizing: 'border-box' },
  loginBtn: { width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)', color: '#fff', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' },
  footerNote: { color: 'rgba(255,255,255,0.2)', fontSize: '10px', marginTop: '25px', textTransform: 'uppercase' },

  // --- DASHBOARD ---
  page: { minHeight: '100vh', background: '#f4f7fe', fontFamily: 'sans-serif' },
  header: { background: '#1a1060', padding: '15px 40px', color: 'white' },
  headerInner: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', margin: '0 auto' },
  headerTitle: { fontSize: '18px', margin: 0 },
  presBtn: { background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' },
  refreshBtn: { background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' },
  sendAllBtn: { background: '#c9a84c', border: 'none', color: '#000', padding: '6px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' },
  logoutBtn: { background: '#ff4d4f', border: 'none', color: '#fff', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' },
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  modal: { background: 'white', padding: '25px', borderRadius: '15px', width: '320px', textAlign: 'center' },
  modalBtn: { padding: '12px', border: '1px solid #eee', background: '#f8f9fa', borderRadius: '8px', cursor: 'pointer' },
  cancelBtn: { border: 'none', background: 'transparent', color: '#ff4d4f', marginTop: '15px', cursor: 'pointer' },
  main: { padding: '20px', maxWidth: '1200px', margin: '0 auto' },
  card: { background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginBottom: '20px' },
  formRow: { display: 'flex', gap: '10px' },
  input: { padding: '10px', borderRadius: '8px', border: '1px solid #ddd', flex: 1 },
  select: { padding: '10px', borderRadius: '8px', border: '1px solid #ddd' },
  btnPrimary: { background: '#1a1060', color: 'white', border: 'none', padding: '0 25px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
  listHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'center' },
  filterBar: { display: 'flex', gap: '5px' },
  filterBtn: { background: '#f0f2f5', border: 'none', padding: '7px 14px', borderRadius: '20px', cursor: 'pointer', fontSize: '13px' },
  filterBtnActive: { background: '#1a1060', color: 'white', padding: '7px 14px', borderRadius: '20px', fontSize: '13px' },
  tableContainer: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: '800px' },
  th: { textAlign: 'left', padding: '12px', borderBottom: '2px solid #f0f2f5', fontSize: '12px', color: '#888' },
  td: { padding: '12px', borderBottom: '1px solid #f5f5f5', fontSize: '14px' },
  emptyState: { textAlign: 'center', padding: '40px', color: '#999', fontStyle: 'italic' },
  editInput: { padding: '6px', borderRadius: '5px', border: '1px solid #4f46e5', width: '90%' },
  badgeSent: { background: '#e6ffed', color: '#22863a', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' },
  badgePending: { background: '#fff9e6', color: '#b08800', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' },
  btnSend: { background: '#1a1060', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', marginRight: '8px' },
  btnEdit: { background: '#f0f2f5', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', marginRight: '8px' },
  btnSave: { background: '#22863a', color: '#fff', border: 'none', padding: '6px 15px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' },
  btnDelete: { background: 'transparent', border: 'none', color: '#ff4d4f', cursor: 'pointer', fontSize: '16px' },
  pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginTop: '20px' },
  pageBtn: { background: '#fff', border: '1px solid #ddd', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' },
  pageBtnDisabled: { background: '#f5f5f5', border: '1px solid #eee', padding: '8px 16px', borderRadius: '8px', cursor: 'not-allowed', color: '#ccc' },
  pageInfo: { fontSize: '13px', color: '#666' }
};
