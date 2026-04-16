import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
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
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all'); 
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => { if (authed) fetchParticipants(); }, [authed]);

  const fetchParticipants = async () => {
    setLoading(true);
    const { data } = await supabase.from('participants').select('*').order('created_at', { ascending: false });
    if (data) setParticipants(data);
    setTimeout(() => setLoading(false), 800); // Keep spinning briefly for visual feedback
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

  // --- SEND ALL FEATURE ---
  const handleSendAll = async () => {
    if (selectedFilter === 'all') return alert("Please select a specific Day (Day 1, Day 2, etc.) first.");
    
    const targets = filtered.filter(p => !p.email_sent);
    if (targets.length === 0) return alert("All certificates for this day have already been sent!");
    
    if (!window.confirm(`Send certificates to ${targets.length} participants?`)) return;

    setSendingAll(true);
    for (const p of targets) {
      await handleSendEmail(p);
      await new Promise(res => setTimeout(res, 1200)); // Delay to respect EmailJS limits
    }
    setSendingAll(false);
    alert(`Successfully processed ${targets.length} emails.`);
  };

  const handleAdd = async () => {
    if (!name.trim() || !email.trim() || !trainingDay) return alert("Fill all fields");
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
    // Convert both to String to ensure '2' matches "2" (Day 2 fix)
    const matchesDay = selectedFilter === 'all' || String(p.cert_date).includes(String(selectedFilter));
    return matchesSearch && matchesDay;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const currentParticipants = filtered.slice(indexOfLastItem - itemsPerPage, indexOfLastItem);

  if (!authed) return (
    <div style={S.loginWrap}>
       <div style={S.loginCard}>
         <h2 style={{color: '#1a1060'}}>Admin Access</h2>
         <input style={S.input} type="password" placeholder="Password" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === 'Enter' && pw === ADMIN_PASSWORD && setAuthed(true)} />
         <button style={S.btnPrimary} onClick={() => pw === ADMIN_PASSWORD ? setAuthed(true) : alert('Incorrect')}>Login</button>
       </div>
    </div>
  );

  return (
    <div style={S.page}>
      <header style={S.header}>
        <div style={S.headerInner}>
          <h1 style={S.headerTitle}>🎓 DATA INSIGHTS Admin</h1>
          <div style={{display: 'flex', gap: 12}}>
             <button style={S.refreshBtn} onClick={fetchParticipants}>
               <span style={loading ? S.spinning : S.staticIcon}>🔄</span> Refresh
             </button>
             <button style={S.sendAllBtn} onClick={handleSendAll} disabled={sendingAll}>
               {sendingAll ? '⏳ Processing...' : '📧 Send All (Filtered)'}
             </button>
          </div>
        </div>
      </header>

      <main style={S.main}>
        <div style={S.card}>
          <h3 style={{marginTop: 0, color: '#1a1060'}}>Add Manual Participant</h3>
          <div style={S.formRow}>
            <input style={S.input} placeholder="FULL NAME" value={name} onChange={e => setName(e.target.value)} />
            <input style={S.input} placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} />
            <select style={S.select} value={trainingDay} onChange={e => setTrainingDay(e.target.value)}>
              <option value="">Select Training Day</option>
              {TRAINING_DAYS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
            <button style={S.btnPrimary} onClick={handleAdd}>{adding ? 'Adding...' : '+ Add'}</button>
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
            <input style={{...S.input, maxWidth: 250}} placeholder="🔍 Search name or email..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          <table style={S.table}>
            <thead>
              <tr style={S.thRow}>{['#','Name','Email','Training Date','Status','Actions'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {currentParticipants.map((p, i) => (
                <tr key={p.id} style={i % 2 === 0 ? S.trEven : S.trOdd}>
                  <td style={S.td}>{((currentPage-1)*itemsPerPage) + i + 1}</td>
                  <td style={S.td}><b>{p.name}</b></td>
                  <td style={S.td}>{p.email}</td>
                  <td style={S.td}>{DAY_LABEL[String(p.cert_date)] || p.cert_date}</td>
                  <td style={S.td}>
                    <span style={p.email_sent ? S.badgeSent : S.badgePending}>{p.email_sent ? 'SENT' : 'PENDING'}</span>
                  </td>
                  <td style={S.td}>
                    <button style={S.btnSend} onClick={() => handleSendEmail(p)} disabled={sending === p.id}>
                      {sending === p.id ? '...' : 'Email'}
                    </button>
                    <button style={S.btnDelete} onClick={async () => {if(window.confirm('Delete?')){await supabase.from('participants').delete().eq('id', p.id); fetchParticipants();}}}>🗑</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div style={{textAlign: 'center', padding: 40, color: '#999'}}>No participants found for this view.</div>}
        </div>
      </main>
    </div>
  );
}

const S = {
  page: { minHeight: '100vh', background: '#f4f7fe', fontFamily: 'Segoe UI, Roboto, sans-serif' },
  header: { background: '#1a1060', padding: '15px 40px', color: 'white', boxShadow: '0 2px 10px rgba(0,0,0,0.2)' },
  headerInner: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', margin: '0 auto' },
  headerTitle: { fontSize: '20px', margin: 0, fontWeight: '600' },
  refreshBtn: { background: '#ffffff15', border: '1px solid #ffffff33', color: 'white', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: '0.2s' },
  sendAllBtn: { background: '#c9a84c', color: '#1a1060', border: 'none', padding: '8px 18px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' },
  main: { padding: '30px', maxWidth: '1200px', margin: '0 auto' },
  card: { background: 'white', padding: '25px', borderRadius: '15px', boxShadow: '0 5px 20px rgba(0,0,0,0.05)', marginBottom: '25px' },
  formRow: { display: 'flex', gap: '12px' },
  input: { padding: '12px', borderRadius: '8px', border: '1px solid #e0e0e0', flex: 1, fontSize: '14px' },
  select: { padding: '12px', borderRadius: '8px', border: '1px solid #e0e0e0', background: 'white' },
  btnPrimary: { background: '#1a1060', color: 'white', border: 'none', padding: '12px 25px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
  filterBar: { display: 'flex', gap: '8px' },
  filterBtn: { background: '#f0f0f0', border: '1px solid #ddd', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', fontSize: '13px' },
  filterBtnActive: { background: '#1a1060', color: 'white', border: '1px solid #1a1060', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', fontSize: '13px' },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '10px' },
  thRow: { borderBottom: '2px solid #f0f0f0' },
  th: { textAlign: 'left', padding: '15px 12px', color: '#666', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  td: { padding: '15px 12px', borderBottom: '1px solid #f8f8f8', fontSize: '14px' },
  trEven: { background: '#ffffff' },
  trOdd: { background: '#fafafa' },
  badgeSent: { background: '#e6ffed', color: '#22863a', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', border: '1px solid #cef7d2' },
  badgePending: { background: '#fff9e6', color: '#b08800', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', border: '1px solid #fff1c5' },
  btnSend: { background: '#1a1060', color: 'white', border: 'none', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' },
  btnDelete: { background: 'none', border: 'none', color: '#ff4d4f', cursor: 'pointer', fontSize: '16px', marginLeft: '10px' },
  spinning: { display: 'inline-block', animation: 'spin 1s linear infinite' },
  staticIcon: { display: 'inline-block' },
  loginWrap: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#1a1060' },
  loginCard: { background: 'white', padding: '50px', borderRadius: '20px', textAlign: 'center', width: '350px' },
  listHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }
};
