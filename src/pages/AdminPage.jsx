import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { downloadCertificate } from '../certificateGenerator';
import emailjs from '@emailjs/browser';

const ADMIN_PASSWORD = process.env.REACT_APP_ADMIN_PASSWORD || 'admin2026';

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
  const [pwError, setPwError] = useState('');
  const [participants, setParticipants] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [trainingDay, setTrainingDay] = useState('');
  const [adding, setAdding] = useState(false);
  const [sending, setSending] = useState(null);
  const [msg, setMsg] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => { if (authed) fetchParticipants(); }, [authed]);

  const fetchParticipants = async () => {
    const { data } = await supabase.from('participants').select('*');
    if (data) {
      const sorted = data.sort((a, b) => a.name.localeCompare(b.name));
      setParticipants(sorted);
    }
  };

  // NEW PRESENTATION LOGIC: Opens a clean tab
  const startPresentation = () => {
    window.open('/presentation', '_blank');
  };

  const handleLogin = () => {
    if (pw === ADMIN_PASSWORD) { setAuthed(true); setPwError(''); }
    else setPwError('Incorrect password.');
  };

  const handleAdd = async () => {
    if (!name.trim() || !email.trim()) return setMsg('Please fill in both name and email.');
    setAdding(true);
    const { error } = await supabase.from('participants').insert([{
      name: name.trim(), email: email.trim(), cert_date: trainingDay || null,
    }]);
    if (error) setMsg('❌ Error: ' + error.message);
    else { 
        setMsg('✅ Participant added!'); 
        setName(''); setEmail(''); setTrainingDay(''); 
        fetchParticipants(); 
    }
    setAdding(false);
  };

  const handleSendEmail = async (participant) => {
    setSending(participant.id);
    try {
      await emailjs.send(
        process.env.REACT_APP_EMAILJS_SERVICE_ID,
        process.env.REACT_APP_EMAILJS_TEMPLATE_ID,
        {
          to_name: participant.name, to_email: participant.email,
          certificate_url: `${window.location.origin}/certificate/${encodeURIComponent(participant.name)}/${participant.cert_date || ''}`,
        },
        process.env.REACT_APP_EMAILJS_PUBLIC_KEY
      );
      await supabase.from('participants').update({ email_sent: true }).eq('id', participant.id);
      setMsg(`✅ Email sent to ${participant.email}`);
      fetchParticipants();
    } catch (e) { setMsg('❌ Email failed.'); }
    setSending(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this participant?')) return;
    await supabase.from('participants').delete().eq('id', id);
    fetchParticipants();
  };

  const filtered = participants.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase())
  );

  if (!authed) return (
    <div style={S.loginWrap}>
      <div style={S.loginCard}>
        <div style={S.logoCircle}>🎓</div>
        <h2 style={S.loginTitle}>Admin Login</h2>
        <input style={S.input} type="password" placeholder="Password"
          value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
        {pwError && <p style={S.error}>{pwError}</p>}
        <button style={S.btnPrimary} onClick={handleLogin}>Login</button>
      </div>
    </div>
  );

  return (
    <div style={S.page}>
      <header style={S.header}>
        <div style={S.headerInner}>
          <div>
            <h1 style={S.headerTitle}>🎓 Admin Panel</h1>
            <p style={S.headerSub}>DATA INSIGHTS 2026</p>
          </div>
          <div style={{display: 'flex', gap: 12}}>
            <button style={S.presLaunchBtn} onClick={startPresentation}>🖥 Start Presentation</button>
            <a href="/" style={S.viewPublicBtn}>Public Page ↗</a>
          </div>
        </div>
      </header>

      <main style={S.main}>
        <div style={S.card}>
          <h2 style={S.cardTitle}>Add Participant</h2>
          <div style={S.formRow}>
            <input style={S.input} placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
            <input style={S.input} placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
            <select style={S.select} value={trainingDay} onChange={e => setTrainingDay(e.target.value)}>
              <option value="">Select Day</option>
              {TRAINING_DAYS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
            <button style={S.btnPrimary} onClick={handleAdd}>{adding ? '...' : '+ Add'}</button>
          </div>
          {msg && <p style={msg.startsWith('✅') ? S.success : S.error}>{msg}</p>}
        </div>

        <div style={S.card}>
          <div style={S.listHeader}>
            <h2 style={S.cardTitle}>Participants (A-Z)</h2>
            <input style={{ ...S.input, maxWidth: 200 }} placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={S.tableWrap}>
            <table style={S.table}>
              <thead>
                <tr>{['#','Name','Email','Day','Status','Actions'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <tr key={p.id} style={i % 2 === 0 ? S.trEven : S.trOdd}>
                    <td style={S.td}>{i + 1}</td>
                    <td style={{ ...S.td, fontWeight: 600 }}>{p.name}</td>
                    <td style={S.td}>{p.email}</td>
                    <td style={S.td}>{DAY_LABEL[p.cert_date] || '—'}</td>
                    <td style={S.td}>
                      <span style={p.email_sent ? S.badgeSent : S.badgePending}>
                        {p.email_sent ? 'Sent' : 'Pending'}
                      </span>
                    </td>
                    <td style={S.td}>
                      <div style={S.actionRow}>
                        <button style={S.btnSend} onClick={() => handleSendEmail(p)}>{sending === p.id ? '...' : 'Email'}</button>
                        <button style={S.btnDownload} onClick={() => downloadCertificate(p.name, p.cert_date)}>⬇</button>
                        <button style={S.btnDelete} onClick={() => handleDelete(p.id)}>🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

const S = {
  page: { minHeight: '100vh', background: '#f8f9fc', fontFamily: 'sans-serif' },
  header: { background: '#1a1060', padding: '10px 24px' },
  headerInner: { maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 20, margin: 0 },
  headerSub: { color: '#c9a84c', fontSize: 12, margin: 0 },
  viewPublicBtn: { color: '#fff', textDecoration: 'none', fontSize: 12, border: '1px solid #ffffff44', padding: '6px 12px', borderRadius: 4 },
  presLaunchBtn: { background: '#c9a84c', color: '#1a1060', border: 'none', padding: '8px 16px', borderRadius: 4, fontWeight: 'bold', cursor: 'pointer' },
  main: { maxWidth: 1100, margin: '20px auto', padding: '0 20px' },
  card: { background: '#fff', padding: 20, borderRadius: 8, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginBottom: 20 },
  cardTitle: { margin: '0 0 15px', fontSize: 16, color: '#1a1060' },
  formRow: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  input: { border: '1px solid #ddd', padding: '8px', borderRadius: 4, flex: 1 },
  select: { border: '1px solid #ddd', padding: '8px', borderRadius: 4 },
  btnPrimary: { background: '#1a1060', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 4, cursor: 'pointer' },
  success: { color: 'green', fontSize: 13 },
  error: { color: 'red', fontSize: 13 },
  listHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: 10 },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: { textAlign: 'left', padding: '10px', background: '#f4f4f4', borderBottom: '1px solid #eee' },
  td: { padding: '10px', borderBottom: '1px solid #eee' },
  trOdd: { background: '#fafafa' },
  badgeSent: { background: '#e6ffed', color: '#22863a', padding: '2px 8px', borderRadius: 10, fontSize: 11 },
  badgePending: { background: '#fffdef', color: '#735c0f', padding: '2px 8px', borderRadius: 10, fontSize: 11 },
  actionRow: { display: 'flex', gap: 5 },
  btnSend: { background: '#1a1060', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: 3, cursor: 'pointer' },
  btnDownload: { background: '#fff', border: '1px solid #1a1060', padding: '4px 8px', borderRadius: 3, cursor: 'pointer' },
  btnDelete: { background: 'none', border: 'none', color: 'red', cursor: 'pointer' },
  loginWrap: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1060' },
  loginCard: { background: '#fff', padding: 40, borderRadius: 12, textAlign: 'center' },
  logoCircle: { fontSize: 40 },
  loginTitle: { margin: '10px 0' },
};
