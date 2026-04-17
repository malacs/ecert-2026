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

const DAY_LABEL = { '1': 'April 15, 2026', '2': 'April 17, 2026', '3': 'April 22, 2026', '4': 'April 24, 2026', '5': 'April 29, 2026' };

export default function AdminPage() {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState(() => localStorage.getItem('isAdminAuthenticated') === 'true');
  const [pw, setPw] = useState('');
  const [participants, setParticipants] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [trainingDay, setTrainingDay] = useState('');
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(null);
  const [sendingAll, setSendingAll] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all'); 
  const [showDayPicker, setShowDayPicker] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

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

  const handleSendEmail = async (p) => {
    if (p.email_sent) return; // Skip if already sent
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
    if (targets.length === 0) return alert("All emails in this view are already sent!");
    if (!window.confirm(`Send ${targets.length} pending certificates?`)) return;

    setSendingAll(true);
    for (const p of targets) {
      await handleSendEmail(p);
      await new Promise(res => setTimeout(res, 1500)); 
    }
    setSendingAll(false);
    alert('Finished sending batch.');
  };

  const handleAdd = async () => {
    const cleanName = name.trim().toUpperCase();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanName || !cleanEmail || !trainingDay) return alert("Fill all fields");

    // Check for duplicates before adding
    const isDuplicate = participants.some(p => p.name === cleanName && String(p.cert_date) === String(trainingDay));
    if (isDuplicate) return alert(`Note: ${cleanName} is already added for this day!`);

    setAdding(true);
    await supabase.from('participants').insert([{ name: cleanName, email: cleanEmail, cert_date: trainingDay, email_sent: false }]);
    setName(''); setEmail(''); setTrainingDay('');
    fetchParticipants();
    setAdding(false);
  };

  const filtered = participants.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.email.toLowerCase().includes(search.toLowerCase());
    const matchesDay = selectedFilter === 'all' || String(p.cert_date) === String(selectedFilter);
    return matchesSearch && matchesDay;
  });

  const currentItems = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

  if (!authed) return (
    <div style={S.loginPage}>
      <div style={S.loginCard}>
        <h1 style={{ color: '#fff', fontSize: '20px' }}>Admin Portal</h1>
        <input style={S.loginInput} type="password" placeholder="Password" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
        <button style={S.loginBtn} onClick={handleLogin}>Login</button>
      </div>
    </div>
  );

  return (
    <div style={S.page}>
      <header style={S.header}>
        <div style={S.headerInner}>
          <h1 style={S.headerTitle}>Dashboard</h1>
          <div style={{display: 'flex', gap: 10}}>
             <button style={S.refreshBtn} onClick={fetchParticipants}>Refresh</button>
             <button style={S.sendAllBtn} onClick={handleSendAll} disabled={sendingAll}>{sendingAll ? 'Sending...' : 'Send All Pending'}</button>
             <button style={S.logoutBtn} onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </header>
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
              <button style={selectedFilter === 'all' ? S.filterBtnActive : S.filterBtn} onClick={() => setSelectedFilter('all')}>All</button>
              {TRAINING_DAYS.map(day => (<button key={day.value} style={selectedFilter === day.value ? S.filterBtnActive : S.filterBtn} onClick={() => setSelectedFilter(day.value)}>Day {day.value}</button>))}
            </div>
            <input style={{...S.input, maxWidth: 200}} placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <table style={S.table}>
            <thead><tr style={S.thRow}>{['#','Name','Email','Date','Status','Actions'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>
              {currentItems.map((p, i) => (
                <tr key={p.id} style={S.tr}>
                  <td style={S.td}>{((currentPage-1)*ITEMS_PER_PAGE)+i+1}</td>
                  <td style={S.td}><b>{p.name}</b></td>
                  <td style={S.td}>{p.email}</td>
                  <td style={S.td}>{DAY_LABEL[String(p.cert_date)] || p.cert_date}</td>
                  <td style={S.td}><span style={p.email_sent ? S.badgeSent : S.badgePending}>{p.email_sent ? 'Sent' : 'Pending'}</span></td>
                  <td style={S.td}><button style={S.btnSend} onClick={() => handleSendEmail(p)} disabled={sending === p.id || p.email_sent}>{p.email_sent ? 'Sent' : 'Email'}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

const S = {
  loginPage: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#0a0a1a' },
  loginCard: { width: '320px', padding: '30px', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' },
  loginInput: { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #333', background: '#000', color: '#fff', marginBottom: '15px' },
  loginBtn: { width: '100%', padding: '12px', borderRadius: '10px', border: 'none', background: '#4f46e5', color: '#fff', fontWeight: 'bold', cursor: 'pointer' },
  page: { minHeight: '100vh', background: '#f4f7fe' },
  header: { background: '#1a1060', padding: '15px 40px', color: 'white' },
  headerInner: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', margin: '0 auto' },
  headerTitle: { fontSize: '18px', margin: 0 },
  refreshBtn: { background: 'transparent', border: '1px solid #fff', color: '#fff', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' },
  sendAllBtn: { background: '#c9a84c', border: 'none', color: '#000', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' },
  logoutBtn: { background: '#ff4d4f', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' },
  main: { padding: '20px', maxWidth: '1200px', margin: '0 auto' },
  card: { background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginBottom: '20px' },
  formRow: { display: 'flex', gap: '10px' },
  input: { padding: '10px', borderRadius: '8px', border: '1px solid #ddd', flex: 1 },
  select: { padding: '10px', borderRadius: '8px', border: '1px solid #ddd' },
  btnPrimary: { background: '#1a1060', color: 'white', border: 'none', padding: '0 20px', borderRadius: '8px', cursor: 'pointer' },
  listHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '15px' },
  filterBar: { display: 'flex', gap: '5px' },
  filterBtn: { background: '#eee', border: 'none', padding: '6px 12px', borderRadius: '15px', cursor: 'pointer' },
  filterBtnActive: { background: '#1a1060', color: 'white', padding: '6px 12px', borderRadius: '15px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '10px', borderBottom: '2px solid #eee', fontSize: '12px', color: '#666' },
  td: { padding: '10px', borderBottom: '1px solid #f5f5f5', fontSize: '13px' },
  badgeSent: { background: '#e6ffed', color: '#22863a', padding: '3px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: 'bold' },
  badgePending: { background: '#fff9e6', color: '#b08800', padding: '3px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: 'bold' },
  btnSend: { background: '#1a1060', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', fontSize: '11px', cursor: 'pointer' }
};
