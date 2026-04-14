import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { downloadCertificate, getCertificateDataUrl } from '../certificateGenerator';
import emailjs from '@emailjs/browser';

const ADMIN_PASSWORD = process.env.REACT_APP_ADMIN_PASSWORD || 'admin2026';

const TRAINING_DAYS = [
  { value: '1', label: 'Day 1 — April 15, 2026' },
  { value: '2', label: 'Day 2 — April 17, 2026' },
  { value: '3', label: 'Day 3 — April 22, 2026' },
  { value: '4', label: 'Day 4 — April 24, 2026' },
  { value: '5', label: 'Day 5 — April 29, 2026' },
  { value: '6', label: 'Day 6 — May 1, 2026' },
];

const DAY_LABEL = {
  '1': 'April 15, 2026', '2': 'April 17, 2026', '3': 'April 22, 2026',
  '4': 'April 24, 2026', '5': 'April 29, 2026', '6': 'May 1, 2026',
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
    const { data } = await supabase.from('participants').select('*').order('created_at', { ascending: false });
    if (data) setParticipants(data);
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
    else { setMsg('✅ Participant added!'); setName(''); setEmail(''); setTrainingDay(''); fetchParticipants(); }
    setAdding(false);
  };

  const handleSendEmail = async (participant) => {
    setSending(participant.id); setMsg('');
    try {
      await getCertificateDataUrl(participant.name, participant.cert_date || null);
      await emailjs.send(
        process.env.REACT_APP_EMAILJS_SERVICE_ID,
        process.env.REACT_APP_EMAILJS_TEMPLATE_ID,
        {
          to_name: participant.name, to_email: participant.email, email: participant.email,
          message: `Congratulations! Please find your e-certificate for DATA INSIGHTS 2026.`,
          certificate_url: `${window.location.origin}/certificate/${encodeURIComponent(participant.name)}/${participant.cert_date || ''}`,
        },
        process.env.REACT_APP_EMAILJS_PUBLIC_KEY
      );
      await supabase.from('participants').update({ email_sent: true }).eq('id', participant.id);
      setMsg(`✅ Email sent to ${participant.email}`);
      fetchParticipants();
    } catch (e) {
      setMsg('❌ Failed to send email. Error: ' + (e?.text || e?.message || JSON.stringify(e)));
    }
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
        <p style={S.loginSub}>DATA INSIGHTS 2026</p>
        <input style={S.input} type="password" placeholder="Enter admin password"
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
            <p style={S.headerSub}>DATA INSIGHTS 2026 — E-Certificate Manager</p>
          </div>
          <a href="/" style={S.viewPublicBtn}>View Public Page ↗</a>
        </div>
      </header>
      <main style={S.main}>
        <div style={S.card}>
          <h2 style={S.cardTitle}>Add Participant</h2>
          <div style={S.formRow}>
            <input style={S.input} placeholder="Full name (as it appears on certificate)"
              value={name} onChange={e => setName(e.target.value)} />
            <input style={S.input} placeholder="Gmail address" type="email"
              value={email} onChange={e => setEmail(e.target.value)} />
            <div style={S.selectWrap}>
              <label style={S.selectLabel}>Training Day</label>
              <select style={S.select} value={trainingDay} onChange={e => setTrainingDay(e.target.value)}>
                <option value="">— Select Day —</option>
                {TRAINING_DAYS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
            <button style={S.btnPrimary} onClick={handleAdd} disabled={adding}>
              {adding ? 'Adding...' : '+ Add'}
            </button>
          </div>
          {msg && <p style={msg.startsWith('✅') ? S.success : S.error}>{msg}</p>}
        </div>

        <div style={S.card}>
          <div style={S.listHeader}>
            <h2 style={S.cardTitle}>Participants ({participants.length})</h2>
            <input style={{ ...S.input, maxWidth: 260, marginBottom: 0 }}
              placeholder="Search name or email..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {filtered.length === 0 ? (
            <p style={S.empty}>No participants yet. Add one above!</p>
          ) : (
            <div style={S.tableWrap}>
              <table style={S.table}>
                <thead>
                  <tr>
                    {['#','Name','Email','Training Day','Status','Actions'].map(h => (
                      <th key={h} style={S.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p, i) => (
                    <tr key={p.id} style={i % 2 === 0 ? S.trEven : S.trOdd}>
                      <td style={S.td}>{i + 1}</td>
                      <td style={{ ...S.td, fontWeight: 500 }}>{p.name}</td>
                      <td style={{ ...S.td, color: '#555' }}>{p.email}</td>
                      <td style={{ ...S.td, fontSize: 12, color: '#555' }}>
                        {p.cert_date ? DAY_LABEL[p.cert_date] || `Day ${p.cert_date}` : <span style={{ color: '#9ca3af' }}>Not set</span>}
                      </td>
                      <td style={S.td}>
                        <span style={p.email_sent ? S.badgeSent : S.badgePending}>
                          {p.email_sent ? '✅ Sent' : '⏳ Pending'}
                        </span>
                      </td>
                      <td style={S.td}>
                        <div style={S.actionRow}>
                          <button style={S.btnSend} onClick={() => handleSendEmail(p)} disabled={sending === p.id}>
                            {sending === p.id ? 'Sending...' : '📧 Send Email'}
                          </button>
                          <button style={S.btnDownload} onClick={() => downloadCertificate(p.name, p.cert_date || null)}>
                            ⬇ Download
                          </button>
                          <button style={S.btnDelete} onClick={() => handleDelete(p.id)}>🗑</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

const S = {
  page: { minHeight: '100vh', background: '#f5f6fa', fontFamily: 'Inter, sans-serif' },
  header: { background: 'linear-gradient(135deg, #1a1060 0%, #2d1b8e 100%)', padding: '0 24px' },
  headerInner: { maxWidth: 1100, margin: '0 auto', padding: '20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: 700, margin: 0 },
  headerSub: { color: '#c9a84c', fontSize: 14, margin: '4px 0 0' },
  viewPublicBtn: { color: '#e8c96d', fontSize: 13, textDecoration: 'none', border: '1px solid #c9a84c', padding: '6px 14px', borderRadius: 6 },
  main: { maxWidth: 1100, margin: '32px auto', padding: '0 24px' },
  card: { background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 24, marginBottom: 24 },
  cardTitle: { fontSize: 17, fontWeight: 600, color: '#1a1060', margin: '0 0 16px' },
  formRow: { display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' },
  input: { flex: 1, minWidth: 200, padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', marginBottom: 0 },
  selectWrap: { display: 'flex', flexDirection: 'column', gap: 4 },
  selectLabel: { fontSize: 12, color: '#6b7280', fontWeight: 500 },
  select: { padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', background: '#fff', minWidth: 200, cursor: 'pointer' },
  btnPrimary: { background: '#1a1060', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' },
  success: { color: '#16a34a', fontSize: 14, margin: '10px 0 0', background: '#f0fdf4', padding: '8px 12px', borderRadius: 6 },
  error: { color: '#dc2626', fontSize: 14, margin: '10px 0 0', background: '#fef2f2', padding: '8px 12px', borderRadius: 6 },
  listHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
  th: { textAlign: 'left', padding: '10px 12px', background: '#f9fafb', color: '#6b7280', fontWeight: 600, fontSize: 13, borderBottom: '1px solid #e5e7eb' },
  td: { padding: '11px 12px', borderBottom: '1px solid #f3f4f6', verticalAlign: 'middle' },
  trEven: { background: '#fff' },
  trOdd: { background: '#fafafa' },
  badgeSent: { background: '#dcfce7', color: '#15803d', fontSize: 12, padding: '3px 10px', borderRadius: 20, fontWeight: 500 },
  badgePending: { background: '#fef9c3', color: '#a16207', fontSize: 12, padding: '3px 10px', borderRadius: 20, fontWeight: 500 },
  actionRow: { display: 'flex', gap: 6 },
  btnSend: { background: '#1a1060', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 500 },
  btnDownload: { background: '#fff', color: '#1a1060', border: '1px solid #1a1060', borderRadius: 6, padding: '6px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 500 },
  btnDelete: { background: '#fff', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: 6, padding: '6px 10px', fontSize: 12, cursor: 'pointer' },
  empty: { color: '#9ca3af', textAlign: 'center', padding: '32px 0', fontSize: 14 },
  loginWrap: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1a1060 0%, #2d1b8e 100%)' },
  loginCard: { background: '#fff', borderRadius: 16, padding: '40px 36px', width: '100%', maxWidth: 380, textAlign: 'center' },
  logoCircle: { fontSize: 48, marginBottom: 16 },
  loginTitle: { fontSize: 22, fontWeight: 700, color: '#1a1060', margin: '0 0 4px' },
  loginSub: { fontSize: 13, color: '#9ca3af', margin: '0 0 24px' },
};
