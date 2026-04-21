import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import emailjs from '@emailjs/browser';

const ADMIN_PASSWORD = process.env.REACT_APP_ADMIN_PASSWORD;
const ITEMS_PER_PAGE = 20;

const TRAINING_DAYS = [
  { value: '1', label: 'Day 1 — April 15, 2026' },
  { value: '2', label: 'Day 2 — April 17, 2026' },
  { value: '3', label: 'Day 3 — April 22, 2026' },
  { value: '4', label: 'Day 4 — April 24, 2026' },
  { value: '5', label: 'Day 5 — April 29, 2026' },
];

const DAY_LABEL = {
  '1': 'April 15, 2026', '2': 'April 17, 2026', '3': 'April 22, 2026', '4': 'April 24, 2026', '5': 'April 29, 2026'
};

export default function AdminPage() {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState(() => localStorage.getItem('isAdminAuthenticated') === 'true');
  const [pw, setPw] = useState('');
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [trainingDay, setTrainingDay] = useState('');
  const [role, setRole] = useState('Student');
  const [adding, setAdding] = useState(false);
  const [sendingStatus, setSendingStatus] = useState(null);
  const [sendingAll, setSendingAll] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [presDay, setPresDay] = useState('1');
  const [presRole, setPresRole] = useState('All');

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

  const handleAdd = async () => {
    if (!name || !email || !trainingDay) return alert("Please fill all fields");
    setAdding(true);
    await supabase.from('participants').insert([{
      name: name.toUpperCase(), email: email.toLowerCase(), cert_date: trainingDay, role, email_sent: false
    }]);
    setName(''); setEmail(''); setTrainingDay(''); setRole('Student');
    fetchParticipants();
    setAdding(false);
  };

  const sendIndividualEmail = async (p) => {
    setSendingStatus(p.id);
    try {
      emailjs.init(process.env.REACT_APP_EMAILJS_PUBLIC_KEY);
      await emailjs.send(
        process.env.REACT_APP_EMAILJS_SERVICE_ID,
        process.env.REACT_APP_EMAILJS_TEMPLATE_ID,
        {
          to_name: p.name,
          to_email: p.email,
          certificate_url: `${window.location.origin}/certificate/${encodeURIComponent(p.name)}/${p.cert_date}`
        }
      );
      await supabase.from('participants').update({ email_sent: true }).eq('id', p.id);
      setParticipants(prev => prev.map(item => item.id === p.id ? { ...item, email_sent: true } : item));
    } catch { alert("Email failed to send."); }
    setSendingStatus(null);
  };

  const filtered = participants.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesDay = selectedFilter === 'all' || String(p.cert_date) === selectedFilter;
    const matchesRole = roleFilter === 'all' || p.role === roleFilter;
    return matchesSearch && matchesDay && matchesRole;
  });

  const pendingList = filtered.filter(p => !p.email_sent);

  const sendAllEmails = async () => {
    if (pendingList.length === 0) return alert("No pending emails to send in this filtered view.");
    if (!window.confirm(`Send emails to ${pendingList.length} participants?`)) return;
    setSendingAll(true);
    emailjs.init(process.env.REACT_APP_EMAILJS_PUBLIC_KEY);
    for (const p of pendingList) {
      try {
        await emailjs.send(
          process.env.REACT_APP_EMAILJS_SERVICE_ID, process.env.REACT_APP_EMAILJS_TEMPLATE_ID,
          { to_name: p.name, to_email: p.email, certificate_url: `${window.location.origin}/certificate/${encodeURIComponent(p.name)}/${p.cert_date}` }
        );
        await supabase.from('participants').update({ email_sent: true }).eq('id', p.id);
      } catch (err) { console.error("Failed:", p.email); }
    }
    fetchParticipants();
    setSendingAll(false);
    alert("Bulk sending process finished.");
  };

  const currentItems = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  if (!authed) return (
    <div style={L.container}>
      <div style={L.card}>
        <div style={L.iconBox}>DI</div>
        <h2 style={L.title}>Admin Access</h2>
        <div style={{ textAlign: 'left', width: '100%' }}>
          <label style={L.label}>System Password</label>
          <input style={L.input} type="password" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
          <button style={L.button} onClick={handleLogin}>Authenticate</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={S.page}>
      <header style={S.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={S.miniLogo}>DI</div>
          <h1 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 700 }}>Data Insights 2026</h1>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button style={{ ...S.btnOutline, backgroundColor: '#eff6ff', color: '#3b82f6', borderColor: '#dbeafe' }} onClick={() => setShowConfigModal(true)}>Presentation Mode</button>
          <button style={{ ...S.btnOutline, color: '#ef4444' }} onClick={() => { localStorage.clear(); window.location.reload(); }}>Logout</button>
        </div>
      </header>

      <main style={S.mainContent}>
        <div style={S.card}>
          <h3 style={S.cardTitle}>Add Participant</h3>
          <div style={S.inputGrid}>
            <input style={S.input} placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} />
            <input style={S.input} placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} />
            <select style={S.input} value={trainingDay} onChange={e => setTrainingDay(e.target.value)}>
              <option value="">Select Day</option>
              {TRAINING_DAYS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
            <select style={S.input} value={role} onChange={e => setRole(e.target.value)}><option>Student</option><option>Speaker</option></select>
            <button style={S.btnPrimary} onClick={handleAdd}>{adding ? '...' : 'Add Now'}</button>
          </div>
        </div>

        <div style={S.card}>
          <div style={S.filterBar}>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <input style={{ ...S.input, width: '200px' }} placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
              <select style={S.input} value={selectedFilter} onChange={e => setSelectedFilter(e.target.value)}>
                <option value="all">All Days</option>
                {TRAINING_DAYS.map(d => <option key={d.value} value={d.value}>Day {d.value}</option>)}
              </select>
            </div>
            <button style={{ ...S.btnPrimary, backgroundColor: '#10b981' }} onClick={sendAllEmails} disabled={sendingAll}>
              {sendingAll ? 'Sending...' : `Send All Emails (${pendingList.length} pending)`}
            </button>
          </div>

          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Name</th><th style={S.th}>Role</th><th style={S.th}>Status</th><th style={S.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((p) => (
                <tr key={p.id}>
                  <td style={S.td}><strong>{p.name}</strong><br/><small>{p.email}</small></td>
                  <td style={S.td}>{p.role}</td>
                  <td style={S.td}>
                    <span style={{ color: p.email_sent ? '#059669' : '#d97706', fontWeight: 'bold', fontSize: '0.7rem' }}>
                      {p.email_sent ? 'SENT' : 'PENDING'}
                    </span>
                  </td>
                  <td style={S.td}>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button style={S.btnAction} onClick={() => sendIndividualEmail(p)}>
                        {sendingStatus === p.id ? '...' : (p.email_sent ? 'Resend' : 'Send')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {showConfigModal && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <h3 style={{ marginTop: 0 }}>Presentation View</h3>
            <label style={S.modalLabel}>Day</label>
            <select style={{ ...S.input, width: '100%', marginBottom: '10px' }} value={presDay} onChange={e => setPresDay(e.target.value)}>
              {TRAINING_DAYS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
            <label style={S.modalLabel}>Role</label>
            <select style={{ ...S.input, width: '100%', marginBottom: '20px' }} value={presRole} onChange={e => setPresRole(e.target.value)}>
              <option value="All">All Roles</option><option value="Speaker">Speakers</option><option value="Student">Students</option>
            </select>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button style={{ ...S.btnPrimary, flex: 1 }} onClick={() => navigate(`/presentation?day=${presDay}&role=${presRole}`)}>Launch</button>
              <button style={{ ...S.btnOutline, flex: 1 }} onClick={() => setShowConfigModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ... Styles S, L are unchanged from previous versions
const S = {
  page: { minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'system-ui, sans-serif' },
  header: { padding: '0.8rem 2rem', backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 },
  miniLogo: { width: '32px', height: '32px', background: '#3b82f6', borderRadius: '8px', display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 'bold', fontSize: '0.8rem' },
  mainContent: { padding: '2rem', maxWidth: '1200px', margin: '0 auto' },
  card: { background: '#fff', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '2rem', border: '1px solid #e2e8f0' },
  cardTitle: { marginTop: 0, marginBottom: '1.2rem', fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' },
  inputGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' },
  input: { padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', color: '#1e293b', outline: 'none' },
  btnPrimary: { backgroundColor: '#3b82f6', color: 'white', padding: '0.6rem 1.2rem', borderRadius: '8px', border: 'none', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem' },
  btnOutline: { background: 'none', color: '#475569', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontWeight: '500', cursor: 'pointer', fontSize: '0.85rem' },
  btnAction: { padding: '4px 10px', fontSize: '0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', color: '#475569', fontWeight: '600' },
  filterBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '12px' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' },
  th: { padding: '12px', textAlign: 'left', borderBottom: '2px solid #f1f5f9', color: '#64748b', fontWeight: '600' },
  td: { padding: '12px', borderBottom: '1px solid #f1f5f9', color: '#475569' },
  overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  modal: { background: '#fff', padding: '2rem', borderRadius: '20px', width: '340px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' },
  modalLabel: { fontSize: '0.75rem', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '5px', marginLeft: '2px' }
};

const L = {
  container: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', fontFamily: 'system-ui, sans-serif' },
  card: { backgroundColor: '#1e293b', padding: '3rem', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', textAlign: 'center', width: '100%', maxWidth: '380px', border: '1px solid rgba(255,255,255,0.05)' },
  iconBox: { width: '60px', height: '60px', background: '#3b82f6', borderRadius: '16px', display: 'grid', placeItems: 'center', color: '#fff', fontSize: '1.5rem', fontWeight: '800', margin: '0 auto 20px auto' },
  title: { color: '#ffffff', fontSize: '24px', margin: '0 0 8px 0', fontWeight: '700' },
  label: { color: '#94a3b8', fontSize: '0.8rem', fontWeight: '600', marginBottom: '8px', display: 'block', marginLeft: '4px' },
  input: { width: '100%', padding: '14px', borderRadius: '12px', background: '#0f172a', border: '1px solid #334155', color: '#fff', fontSize: '1rem', outline: 'none', marginBottom: '20px', textAlign: 'center' },
  button: { width: '100%', padding: '14px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }
};
