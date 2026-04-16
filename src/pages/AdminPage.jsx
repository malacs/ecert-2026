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
  const [pwError, setPwError] = useState('');
  const [participants, setParticipants] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [trainingDay, setTrainingDay] = useState('');
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(null);
  const [msg, setMsg] = useState('');
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all'); 
  const [showPresModal, setShowPresModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => { if (authed) fetchParticipants(); }, [authed]);

  const fetchParticipants = async () => {
    setLoading(true);
    // Fetch directly from Supabase to ensure fresh data
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .order('created_at', { ascending: false }); // Show newest first

    if (error) {
      setMsg('❌ Fetch Error: ' + error.message);
    } else {
      setParticipants(data || []);
    }
    setLoading(false);
  };

  const handleLogin = () => {
    if (pw === ADMIN_PASSWORD) { setAuthed(true); setPwError(''); }
    else setPwError('Incorrect password.');
  };

  const handleAdd = async () => {
    if (!name.trim() || !email.trim()) return setMsg('Please fill in both name and email.');
    setAdding(true);
    const { error } = await supabase.from('participants').insert([{
      name: name.trim().toUpperCase(), // Keep consistent with Google Form script
      email: email.trim().toLowerCase(), 
      cert_date: trainingDay || null,
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
          to_name: participant.name, 
          to_email: participant.email,
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

  // ── IMPROVED FILTERING ──
  const filtered = participants.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                          p.email.toLowerCase().includes(search.toLowerCase());
    
    // Loose comparison (==) handles string vs number mismatches from Supabase
    const matchesDay = selectedFilter === 'all' || String(p.cert_date) === String(selectedFilter);
    
    return matchesSearch && matchesDay;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentParticipants = filtered.slice(indexOfFirstItem, indexOfLastItem);

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
      {/* PRESENTATION MODAL */}
      {showPresModal && (
        <div style={S.modalOverlay}>
          <div style={S.modal}>
            <h3 style={S.cardTitle}>Select Training Day to Present</h3>
            <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
              {TRAINING_DAYS.map(d => (
                <button key={d.value} style={S.modalBtn} onClick={() => window.open(`/presentation?day=${d.value}`, '_blank')}>
                  {d.label}
                </button>
              ))}
              <button style={S.modalCancel} onClick={() => setShowPresModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <header style={S.header}>
        <div style={S.headerInner}>
          <div>
            <h1 style={S.headerTitle}>🎓 Admin Panel</h1>
            <p style={S.headerSub}>DATA INSIGHTS 2026</p>
          </div>
          <div style={{display: 'flex', gap: 12}}>
            <button style={S.refreshBtn} onClick={fetchParticipants}>{loading ? '...' : '🔄 Refresh'}</button>
            <button style={S.presLaunchBtn} onClick={() => setShowPresModal(true)}>🖥 Presentation</button>
            <a href="/" style={S.viewPublicBtn}>Public Page ↗</a>
          </div>
        </div>
      </header>

      <main style={S.main}>
        {/* ADD FORM */}
        <div style={S.card}>
          <h2 style={S.cardTitle}>Manual Add</h2>
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

        {/* LIST SECTION */}
        <div style={S.card}>
          <div style={S.listHeader}>
            <div style={{display: 'flex', alignItems: 'center', gap: 15, flexWrap: 'wrap'}}>
              <h2 style={{...S.cardTitle, margin: 0}}>Participants ({filtered.length})</h2>
              <div style={S.filterBar}>
                <button 
                  style={selectedFilter === 'all' ? S.filterBtnActive : S.filterBtn} 
                  onClick={() => {setSelectedFilter('all'); setCurrentPage(1);}}
                >All</button>
                {TRAINING_DAYS.map(day => (
                  <button 
                    key={day.value}
                    style={selectedFilter === day.value ? S.filterBtnActive : S.filterBtn} 
                    onClick={() => {setSelectedFilter(day.value); setCurrentPage(1);}}
                  >Day {day.value}</button>
                ))}
              </div>
            </div>
            <input 
              style={{ ...S.input, maxWidth: 200 }} 
              placeholder="Search..." 
              value={search} 
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} 
            />
          </div>

          <div style={S.tableWrap}>
            <table style={S.table}>
              <thead>
                <tr>{['#','Name','Email','Training Date','Status','Actions'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {currentParticipants.length > 0 ? currentParticipants.map((p, i) => (
                  <tr key={p.id} style={i % 2 === 0 ? S.trEven : S.trOdd}>
                    <td style={S.td}>{indexOfFirstItem + i + 1}</td>
                    <td style={{ ...S.td, fontWeight: 600 }}>{p.name}</td>
                    <td style={S.td}>{p.email}</td>
                    <td style={S.td}>
                        <span style={{color: '#1a1060', fontWeight: 'bold'}}>
                           {DAY_LABEL[String(p.cert_date)] || '—'}
                        </span>
                    </td>
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
                )) : (
                  <tr><td colSpan="6" style={{textAlign:'center', padding: 20}}>No participants found for this filter.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div style={S.pagination}>
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}
              style={currentPage === 1 ? S.pageBtnDisabled : S.pageBtn}>Back</button>
            <span style={S.pageInfo}>Page {currentPage} of {totalPages || 1}</span>
            <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(prev => prev + 1)}
              style={(currentPage === totalPages || totalPages === 0) ? S.pageBtnDisabled : S.pageBtn}>Next</button>
          </div>
        </div>
      </main>
    </div>
  );
}

const S = {
  // Adding the missing Refresh Button style to your existing S object
  refreshBtn: { background: 'transparent', color: '#fff', border: '1px solid #ffffff44', padding: '8px 16px', borderRadius: 4, cursor: 'pointer', fontSize: 12 },
  // ... rest of your S styles (keep your existing S object as is)
  page: { minHeight: '100vh', background: '#f8f9fc', fontFamily: 'sans-serif' },
  header: { background: '#1a1060', padding: '10px 24px' },
  headerInner: { maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 20, margin: 0 },
  headerSub: { color: '#c9a84c', fontSize: 12, margin: 0 },
  viewPublicBtn: { color: '#fff', textDecoration: 'none', fontSize: 12, border: '1px solid #ffffff44', padding: '6px 12px', borderRadius: 4 },
  presLaunchBtn: { background: '#c9a84c', color: '#1a1060', border: 'none', padding: '8px 16px', borderRadius: 4, fontWeight: 'bold', cursor: 'pointer' },
  main: { maxWidth: 1100, margin: '20px auto', padding: '0 20px' },
  card: { background: '#fff', padding: 20, borderRadius: 8, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginBottom: 20 },
  cardTitle: { margin: '0 0 15px', fontSize: 16, color: '#1a1060', fontWeight: 'bold' },
  formRow: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  input: { border: '1px solid #ddd', padding: '8px', borderRadius: 4, flex: 1 },
  select: { border: '1px solid #ddd', padding: '8px', borderRadius: 4 },
  btnPrimary: { background: '#1a1060', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 4, cursor: 'pointer' },
  success: { color: 'green', fontSize: 13 },
  error: { color: 'red', fontSize: 13 },
  listHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: { textAlign: 'left', padding: '12px 10px', background: '#f4f4f4', borderBottom: '1px solid #eee' },
  td: { padding: '12px 10px', borderBottom: '1px solid #eee' },
  trOdd: { background: '#fafafa' },
  trEven: { background: '#fff' },
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
  filterBar: { display: 'flex', gap: 5, background: '#f0f2f5', padding: '4px', borderRadius: 6 },
  filterBtn: { background: 'transparent', border: 'none', padding: '5px 12px', borderRadius: 4, fontSize: 12, cursor: 'pointer', color: '#666' },
  filterBtnActive: { background: '#1a1060', color: '#fff', border: 'none', padding: '5px 12px', borderRadius: 4, fontSize: 12, cursor: 'pointer' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#fff', padding: 30, borderRadius: 12, width: '100%', maxWidth: 400 },
  modalBtn: { background: '#f0f2f5', border: '1px solid #ddd', padding: '12px', borderRadius: 8, cursor: 'pointer', textAlign: 'left', fontSize: 14, marginBottom: 5, width: '100%' },
  modalCancel: { marginTop: 10, background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: 14, width: '100%' },
  pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20, marginTop: 20 },
  pageBtn: { background: '#1a1060', color: '#fff', border: 'none', padding: '6px 16px', borderRadius: 4, cursor: 'pointer' },
  pageBtnDisabled: { background: '#ccc', color: '#fff', border: 'none', padding: '6px 16px', borderRadius: 4, cursor: 'not-allowed' },
  pageInfo: { fontSize: 13, color: '#666' }
};
