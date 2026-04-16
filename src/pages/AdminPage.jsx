import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { downloadCertificate } from '../certificateGenerator';
import emailjs from '@emailjs/browser';

const ADMIN_PASSWORD = process.env.REACT_APP_ADMIN_PASSWORD || 'admindatamining2026!';

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
  '5': 'April 29, 2026',
};

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState('');
  const [participants, setParticipants] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [trainingDay, setTrainingDay] = useState('');
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(null);
  const [sendingAll, setSendingAll] = useState(false);
  const [msg, setMsg] = useState('');
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all'); 
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => { if (authed) fetchParticipants(); }, [authed]);

  const fetchParticipants = async () => {
    setLoading(true);
    const { data } = await supabase.from('participants').select('*').order('created_at', { ascending: false });
    if (data) setParticipants(data);
    setLoading(false);
  };

  const handleSendEmail = async (p) => {
    setSending(p.id);
    try {
      await emailjs.send(
        process.env.REACT_APP_EMAILJS_SERVICE_ID,
        process.env.REACT_APP_EMAILJS_TEMPLATE_ID,
        {
          to_name: p.name, 
          to_email: p.email,
          certificate_url: `${window.location.origin}/certificate/${encodeURIComponent(p.name)}/${p.cert_date}`,
        },
        process.env.REACT_APP_EMAILJS_PUBLIC_KEY
      );
      await supabase.from('participants').update({ email_sent: true }).eq('id', p.id);
      fetchParticipants();
    } catch (e) { console.error(e); }
    setSending(null);
  };

  // --- NEW: SEND ALL EMAILS FOR CURRENT DAY ---
  const handleSendAll = async () => {
    if (selectedFilter === 'all') return alert("Please select a specific Day (Day 1, Day 2, etc.) before using Send All.");
    
    const targets = filtered.filter(p => !p.email_sent);
    if (targets.length === 0) return alert("No pending emails for this day!");
    
    if (!window.confirm(`Send certificates to ${targets.length} participants?`)) return;

    setSendingAll(true);
    for (const p of targets) {
      await handleSendEmail(p);
      // Small delay to prevent hitting EmailJS rate limits too hard
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    setSendingAll(false);
    setMsg(`✅ Finished sending ${targets.length} emails!`);
  };

  const handleAdd = async () => {
    if (!name.trim() || !email.trim()) return;
    setAdding(true);
    await supabase.from('participants').insert([{
      name: name.trim().toUpperCase(), 
      email: email.trim().toLowerCase(), 
      cert_date: trainingDay,
      email_sent: false
    }]);
    setName(''); setEmail(''); setTrainingDay('');
    fetchParticipants();
    setAdding(false);
  };

  const filtered = participants.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.email.toLowerCase().includes(search.toLowerCase());
    // This "String" wrapping fixes the Day 2 display issue
    const matchesDay = selectedFilter === 'all' || String(p.cert_date) === String(selectedFilter);
    return matchesSearch && matchesDay;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const currentParticipants = filtered.slice(indexOfLastItem - itemsPerPage, indexOfLastItem);

  if (!authed) return (
    <div style={S.loginWrap}>
       <div style={S.loginCard}>
         <h2>Admin Login</h2>
         <input style={S.input} type="password" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === 'Enter' && pw === ADMIN_PASSWORD && setAuthed(true)} />
         <button style={S.btnPrimary} onClick={() => pw === ADMIN_PASSWORD ? setAuthed(true) : alert('Wrong PW')}>Login</button>
       </div>
    </div>
  );

  return (
    <div style={S.page}>
      <header style={S.header}>
        <div style={S.headerInner}>
          <h1 style={S.headerTitle}>🎓 Admin Panel</h1>
          <div style={{display: 'flex', gap: 10}}>
             <button style={S.refreshBtn} onClick={fetchParticipants}>
               <span style={loading ? S.spinning : {}}>🔄</span> Refresh List
             </button>
             <button style={S.sendAllBtn} onClick={handleSendAll} disabled={sendingAll}>
               {sendingAll ? 'Sending...' : '📧 Send All (Current Day)'}
             </button>
          </div>
        </div>
      </header>

      <main style={S.main}>
        <div style={S.card}>
          <div style={S.formRow}>
            <input style={S.input} placeholder="FULL NAME" value={name} onChange={e => setName(e.target.value)} />
            <input style={S.input} placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
            <select style={S.select} value={trainingDay} onChange={e => setTrainingDay(e.target.value)}>
              <option value="">Select Day</option>
              {TRAINING_DAYS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
            <button style={S.btnPrimary} onClick={handleAdd}>{adding ? '...' : '+ Add Participant'}</button>
          </div>
        </div>

        <div style={S.card}>
          <div style={S.listHeader}>
            <div style={S.filterBar}>
              <button style={selectedFilter === 'all' ? S.filterBtnActive : S.filterBtn} onClick={() => setSelectedFilter('all')}>All</button>
              {TRAINING_DAYS.map(day => (
                <button key={day.value} style={selectedFilter === day.value ? S.filterBtnActive : S.filterBtn} onClick={() => setSelectedFilter(day.value)}>Day {day.value}</button>
              ))}
            </div>
            <input style={{...S.input, maxWidth: 200}} placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          <table style={S.table}>
            <thead>
              <tr>{['#','Name','Email','Training Date','Status','Actions'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {currentParticipants.map((p, i) => (
                <tr key={p.id} style={i % 2 === 0 ? S.trEven : S.trOdd}>
                  <td style={S.td}>{i + 1}</td>
                  <td style={S.td}><b>{p.name}</b></td>
                  <td style={S.td}>{p.email}</td>
                  <td style={S.td}>{DAY_LABEL[String(p.cert_date)] || '—'}</td>
                  <td style={S.td}>
                    <span style={p.email_sent ? S.badgeSent : S.badgePending}>{p.email_sent ? 'Sent' : 'Pending'}</span>
                  </td>
                  <td style={S.td}>
                    <button style={S.btnSend} onClick={() => handleSendEmail(p)}>{sending === p.id ? '...' : 'Email'}</button>
                    <button style={S.btnDelete} onClick={async () => {if(window.confirm('Delete?')){await supabase.from('participants').delete().eq('id', p.id); fetchParticipants();}}}>🗑</button>
                  </td>
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
  page: { minHeight: '100vh', background: '#f0f2f5', fontFamily: 'Inter, sans-serif' },
  header: { background: '#1a1060', padding: '15px 30px', color: 'white' },
  headerInner: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: '22px', margin: 0 },
  refreshBtn: { background: '#ffffff22', border: '1px solid #ffffff44', color: 'white', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer' },
  sendAllBtn: { background: '#c9a84c', color: '#1a1060', border: 'none', padding: '8px 15px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' },
  main: { padding: '20px' },
  card: { background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '20px' },
  formRow: { display: 'flex', gap: '10px' },
  input: { padding: '10px', borderRadius: '6px', border: '1px solid #ddd', flex: 1 },
  select: { padding: '10px', borderRadius: '6px', border: '1px solid #ddd' },
  btnPrimary: { background: '#1a1060', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer' },
  filterBar: { display: 'flex', gap: '5px' },
  filterBtn: { background: '#eee', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer' },
  filterBtnActive: { background: '#1a1060', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer' },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '10px' },
  th: { textAlign: 'left', padding: '12px', background: '#f8f9fa', borderBottom: '2px solid #eee' },
  td: { padding: '12px', borderBottom: '1px solid #eee' },
  badgeSent: { background: '#d4edda', color: '#155724', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' },
  badgePending: { background: '#fff3cd', color: '#856404', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' },
  btnSend: { background: '#1a1060', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', marginRight: '5px' },
  btnDelete: { background: 'none', border: 'none', color: 'red', cursor: 'pointer' },
  spinning: { display: 'inline-block', animation: 'spin 1s linear infinite' },
  loginWrap: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#1a1060' },
  loginCard: { background: 'white', padding: '40px', borderRadius: '12px', textAlign: 'center' },
  listHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }
};

// Add this to your index.css or App.css for the spinning effect
/* @keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
*/
