import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { downloadCertificate, getCertificateDataUrl } from '../certificateGenerator';
import emailjs from '@emailjs/browser';

const ADMIN_PASSWORD = process.env.REACT_APP_ADMIN_PASSWORD || 'admin2026';

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState('');
  const [pwError, setPwError] = useState('');
  const [participants, setParticipants] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [adding, setAdding] = useState(false);
  const [sending, setSending] = useState(null);
  const [msg, setMsg] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (authed) fetchParticipants();
  }, [authed]);

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
    const { error } = await supabase.from('participants').insert([{ name: name.trim(), email: email.trim() }]);
    if (error) setMsg('Error: ' + error.message);
    else { setMsg('✅ Participant added!'); setName(''); setEmail(''); fetchParticipants(); }
    setAdding(false);
  };

  const handleSendEmail = async (participant) => {
    setSending(participant.id);
    setMsg('');
    try {
      await getCertificateDataUrl(participant.name);
      await emailjs.send(
        process.env.REACT_APP_EMAILJS_SERVICE_ID,
        process.env.REACT_APP_EMAILJS_TEMPLATE_ID,
        {
          to_name: participant.name,
          to_email: participant.email,
          email: participant.email,        // ← fixes the {{email}} Reply To field
          message: `Congratulations! Please find your e-certificate for DATA INSIGHTS 2026.`,
          certificate_url: `${window.location.origin}/certificate/${encodeURIComponent(participant.name)}`,
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
    <div style={styles.loginWrap}>
      <div style={styles.loginCard}>
        <div style={styles.logoCircle}>🎓</div>
        <h2 style={styles.loginTitle}>Admin Login</h2>
        <p style={styles.loginSub}>DATA INSIGHTS 2026</p>
        <input
          style={styles.input}
          type="password"
          placeholder="Enter admin password"
          value={pw}
          onChange={e => setPw(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
        />
        {pwError && <p style={styles.error}>{pwError}</p>}
        <button style={styles.btnPrimary} onClick={handleLogin}>Login</button>
      </div>
    </div>
  );

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div>
            <h1 style={styles.headerTitle}>🎓 Admin Panel</h1>
            <p style={styles.headerSub}>DATA INSIGHTS 2026 — E-Certificate Manager</p>
          </div>
          <a href="/" style={styles.viewPublicBtn}>View Public Page ↗</a>
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Add Participant</h2>
          <div style={styles.formRow}>
            <input
              style={styles.input}
              placeholder="Full name (as it appears on certificate)"
              value={name}
              onChange={e => setName(e.target.value)}
            />
            <input
              style={styles.input}
              placeholder="Gmail address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              type="email"
            />
            <button style={styles.btnPrimary} onClick={handleAdd} disabled={adding}>
              {adding ? 'Adding...' : '+ Add'}
            </button>
          </div>
          {msg && <p style={msg.startsWith('✅') ? styles.success : styles.error}>{msg}</p>}
        </div>

        <div style={styles.card}>
          <div style={styles.listHeader}>
            <h2 style={styles.cardTitle}>Participants ({participants.length})</h2>
            <input
              style={{ ...styles.input, maxWidth: 260, marginBottom: 0 }}
              placeholder="Search name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {filtered.length === 0 ? (
            <p style={styles.empty}>No participants yet. Add one above!</p>
          ) : (
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>#</th>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Email</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p, i) => (
                    <tr key={p.id} style={i % 2 === 0 ? styles.trEven : styles.trOdd}>
                      <td style={styles.td}>{i + 1}</td>
                      <td style={{ ...styles.td, fontWeight: 500 }}>{p.name}</td>
                      <td style={{ ...styles.td, color: '#555' }}>{p.email}</td>
                      <td style={styles.td}>
                        <span style={p.email_sent ? styles.badgeSent : styles.badgePending}>
                          {p.email_sent ? '✅ Sent' : '⏳ Pending'}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.actionRow}>
                          <button style={styles.btnSend} onClick={() => handleSendEmail(p)} disabled={sending === p.id}>
                            {sending === p.id ? 'Sending...' : '📧 Send Email'}
                          </button>
                          <button style={styles.btnDownload} onClick={() => downloadCertificate(p.name)}>
                            ⬇ Download
                          </button>
                          <button style={styles.btnDelete} onClick={() => handleDelete(p.id)}>🗑</button>
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

const styles = {
  page: { minHeight: '100vh', background: '#f5f6fa', fontFamily: 'Inter, sans-serif' },
  header: { background: 'linear-gradient(135deg, #1a1060 0%, #2d1b8e 100%)', padding: '0 24px' },
  headerInner: { maxWidth: 1100, margin: '0 auto', padding: '20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: 700, margin: 0 },
  headerSub: { color: '#c9a84c', fontSize: 14, margin: '4px 0 0' },
  viewPublicBtn: { color: '#e8c96d', fontSize: 13, textDecoration: 'none', border: '1px solid #c9a84c', padding: '6px 14px', borderRadius: 6 },
  main: { maxWidth: 1100, margin: '32px auto', padding: '0 24px' },
  card: { background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 24, marginBottom: 24 },
  cardTitle: { fontSize: 17, fontWeight: 600, color: '#1a1060', margin: '0 0 16px' },
  formRow: { display: 'flex', gap: 12, flexWrap: 'wrap' },
  input: { flex: 1, minWidth: 200, padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', marginBottom: 0 },
  btnPrimary: { background: '#1a1060', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
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
