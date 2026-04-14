import React, { useState, useEffect, useCallback } from 'react';
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

  // Presentation State
  const [isPresenting, setIsPresenting] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentCertUrl, setCurrentCertUrl] = useState('');

  useEffect(() => { if (authed) fetchParticipants(); }, [authed]);

  const fetchParticipants = async () => {
    const { data } = await supabase.from('participants').select('*');
    if (data) {
      // Logic: Order them alphabetically by name
      const sorted = data.sort((a, b) => a.name.localeCompare(b.name));
      setParticipants(sorted);
    }
  };

  // Keyboard navigation for presentation
  const handleKeyDown = useCallback((e) => {
    if (!isPresenting) return;
    if (e.key === 'ArrowRight') nextSlide();
    if (e.key === 'ArrowLeft') prevSlide();
    if (e.key === 'Escape') setIsPresenting(false);
  }, [isPresenting, currentIndex, participants]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const nextSlide = () => {
    if (currentIndex < participants.length - 1) setCurrentIndex(prev => prev + 1);
  };

  const prevSlide = () => {
    if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
  };

  // Load certificate image when index changes
  useEffect(() => {
    if (isPresenting && participants[currentIndex]) {
      const loadCert = async () => {
        const url = await getCertificateDataUrl(participants[currentIndex].name, participants[currentIndex].cert_date);
        setCurrentCertUrl(url);
      };
      loadCert();
    }
  }, [isPresenting, currentIndex, participants]);

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
        setName(''); 
        setEmail(''); 
        setTrainingDay(''); 
        fetchParticipants(); // Refetches and re-sorts alphabetically
    }
    setAdding(false);
  };

  const handleSendEmail = async (participant) => {
    setSending(participant.id); setMsg('');
    try {
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
      setMsg('❌ Failed to send email.');
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
        <input style={S.input} type="password" placeholder="Enter admin password"
          value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
        {pwError && <p style={S.error}>{pwError}</p>}
        <button style={S.btnPrimary} onClick={handleLogin}>Login</button>
      </div>
    </div>
  );

  return (
    <div style={S.page}>
      {/* PRESENTATION OVERLAY */}
      {isPresenting && (
        <div style={S.presOverlay}>
          <button style={S.closeBtn} onClick={() => setIsPresenting(false)}>✕ Close</button>
          
          <div style={S.presContent}>
             {currentCertUrl ? (
               <img src={currentCertUrl} alt="Certificate" style={S.presImg} />
             ) : (
               <p style={{color: '#fff'}}>Loading Certificate...</p>
             )}
          </div>

          <div style={S.presControls}>
            <button style={S.navBtn} onClick={prevSlide} disabled={currentIndex === 0}>◀ Previous</button>
            <span style={S.presCounter}>{currentIndex + 1} / {participants.length}</span>
            <button style={S.navBtn} onClick={nextSlide} disabled={currentIndex === participants.length - 1}>Next ▶</button>
          </div>
          <p style={S.presHint}>Use Keyboard Arrow Keys to Navigate</p>
        </div>
      )}

      <header style={S.header}>
        <div style={S.headerInner}>
          <div>
            <h1 style={S.headerTitle}>🎓 Admin Panel</h1>
            <p style={S.headerSub}>DATA INSIGHTS 2026 — E-Certificate Manager</p>
          </div>
          <div style={{display: 'flex', gap: 10}}>
            <button style={S.presLaunchBtn} onClick={() => {setCurrentIndex(0); setIsPresenting(true);}}>
               🖥 Start Presentation
            </button>
            <a href="/" style={S.viewPublicBtn}>View Public Page ↗</a>
          </div>
        </div>
      </header>

      <main style={S.main}>
        <div style={S.card}>
          <h2 style={S.cardTitle}>Add Participant</h2>
          <div style={S.formRow}>
            <input style={S.input} placeholder="Full name" value={name} onChange={e => setName(e.target.value)} />
            <input style={S.input} placeholder="Gmail address" type="email" value={email} onChange={e => setEmail(e.target.value)} />
            <div style={S.selectWrap}>
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
            <h2 style={S.cardTitle}>Participants (Alphabetical)</h2>
            <input style={{ ...S.input, maxWidth: 260 }} placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
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
                    <td style={S.td}>{p.email}</td>
                    <td style={S.td}>{DAY_LABEL[p.cert_date] || 'Not set'}</td>
                    <td style={S.td}>
                      <span style={p.email_sent ? S.badgeSent : S.badgePending}>
                        {p.email_sent ? '✅ Sent' : '⏳ Pending'}
                      </span>
                    </td>
                    <td style={S.td}>
                      <div style={S.actionRow}>
                        <button style={S.btnSend} onClick={() => handleSendEmail(p)} disabled={sending === p.id}>Email</button>
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
  // ... Keep all your existing styles from the prompt ...
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
  input: { flex: 1, minWidth: 200, padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none' },
  selectWrap: { display: 'flex', flexDirection: 'column', gap: 4 },
  select: { padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', background: '#fff' },
  btnPrimary: { background: '#1a1060', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  success: { color: '#16a34a', fontSize: 14, margin: '10px 0 0', background: '#f0fdf4', padding: '8px 12px', borderRadius: 6 },
  error: { color: '#dc2626', fontSize: 14, margin: '10px 0 0', background: '#fef2f2', padding: '8px 12px', borderRadius: 6 },
  listHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
  th: { textAlign: 'left', padding: '10px 12px', background: '#f9fafb', color: '#6b7280', borderBottom: '1px solid #e5e7eb' },
  td: { padding: '11px 12px', borderBottom: '1px solid #f3f4f6' },
  trEven: { background: '#fff' },
  trOdd: { background: '#fafafa' },
  badgeSent: { background: '#dcfce7', color: '#15803d', fontSize: 12, padding: '3px 10px', borderRadius: 20 },
  badgePending: { background: '#fef9c3', color: '#a16207', fontSize: 12, padding: '3px 10px', borderRadius: 20 },
  actionRow: { display: 'flex', gap: 6 },
  btnSend: { background: '#1a1060', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 12, cursor: 'pointer' },
  btnDownload: { background: '#fff', color: '#1a1060', border: '1px solid #1a1060', borderRadius: 6, padding: '6px 12px', fontSize: 12, cursor: 'pointer' },
  btnDelete: { background: '#fff', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: 6, padding: '6px 10px', fontSize: 12, cursor: 'pointer' },
  loginWrap: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1a1060 0%, #2d1b8e 100%)' },
  loginCard: { background: '#fff', borderRadius: 16, padding: '40px 36px', width: '100%', maxWidth: 380, textAlign: 'center' },
  logoCircle: { fontSize: 48, marginBottom: 16 },
  loginTitle: { fontSize: 22, fontWeight: 700, color: '#1a1060', marginBottom: 20 },

  // NEW STYLES FOR PRESENTATION
  presLaunchBtn: { background: '#c9a84c', color: '#1a1060', border: 'none', borderRadius: 6, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  presOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.95)', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 },
  closeBtn: { position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, cursor: 'pointer' },
  presContent: { width: '100%', maxWidth: 1000, boxShadow: '0 20px 50px rgba(0,0,0,0.5)', borderRadius: 10, overflow: 'hidden' },
  presImg: { width: '100%', height: 'auto', display: 'block' },
  presControls: { marginTop: 30, display: 'flex', alignItems: 'center', gap: 30 },
  navBtn: { background: '#fff', border: 'none', padding: '12px 24px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, color: '#1a1060' },
  presCounter: { color: '#fff', fontSize: 18, fontWeight: 600 },
  presHint: { color: '#6b7280', marginTop: 15, fontSize: 12 }
};
