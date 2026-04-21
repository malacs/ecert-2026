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
  const [roleFilter, setRoleFilter] = useState('all'); // Added Role Filter state

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
    } else {
      alert('Incorrect Password');
    }
  };

  const handleAdd = async () => {
    if (!name || !email || !trainingDay) return alert("Fill all fields");
    setAdding(true);
    await supabase.from('participants').insert([{
      name: name.toUpperCase(),
      email: email.toLowerCase(),
      cert_date: trainingDay,
      role,
      email_sent: false
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
    } catch {
      alert("Failed to send email");
    }
    setSendingStatus(null);
  };

  const sendAllEmails = async () => {
    if (!window.confirm("Send emails to ALL filtered participants?")) return;
    setSendingAll(true);
    emailjs.init(process.env.REACT_APP_EMAILJS_PUBLIC_KEY);
    for (const p of filtered) {
      try {
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
      } catch (err) {
        console.error("Failed:", p.email);
      }
    }
    fetchParticipants();
    setSendingAll(false);
    alert("Process complete!");
  };

  // UPDATED FILTER LOGIC
  const filtered = participants.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesDay = selectedFilter === 'all' || String(p.cert_date) === selectedFilter;
    const matchesRole = roleFilter === 'all' || p.role === roleFilter;
    return matchesSearch && matchesDay && matchesRole;
  });

  const currentItems = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  if (!authed) return (
    <div style={S.loginPage}>
      <div style={S.loginCard}>
        <h2 style={{ color: '#fff', marginBottom: '1.5rem' }}>Admin Portal</h2>
        <input style={{ ...S.input, width: '100%', marginBottom: '1rem', textAlign: 'center' }} type="password" placeholder="Enter Password" value={pw} onChange={e => setPw(e.target.value)} />
        <button style={{ ...S.btnPrimary, width: '100%' }} onClick={handleLogin}>Log In</button>
      </div>
    </div>
  );

  return (
    <div style={S.page}>
      <header style={S.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 700, color: '#0f172a' }}>Data Insights 2026</h1>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button style={S.btnOutline} onClick={() => setShowConfigModal(true)}>Presentation Mode</button>
          <button style={{ ...S.btnOutline, color: '#ef4444' }} onClick={() => { localStorage.clear(); window.location.reload(); }}>Logout</button>
        </div>
      </header>

      <main style={S.mainContent}>
        <div style={S.card}>
          <h3 style={{ marginTop: 0, marginBottom: '1.2rem', fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase' }}>Add Participant</h3>
          <div style={S.inputGroup}>
            <input style={S.input} placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} />
            <input style={S.input} placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
            <select style={S.input} value={trainingDay} onChange={e => setTrainingDay(e.target.value)}>
              <option value="">Select Training Day</option>
              {TRAINING_DAYS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
            <select style={S.input} value={role} onChange={e => setRole(e.target.value)}>
              <option>Student</option>
              <option>Speaker</option>
            </select>
            <button style={S.btnPrimary} onClick={handleAdd}>{adding ? 'Loading...' : 'Add Now'}</button>
          </div>
        </div>

        <div style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <input style={{ ...S.input, width: '220px' }} placeholder="Search name..." value={search} onChange={e => setSearch(e.target.value)} />
                
                {/* DAY FILTER */}
                <select style={S.input} value={selectedFilter} onChange={e=>setSelectedFilter(e.target.value)}>
                    <option value="all">All Days</option>
                    {TRAINING_DAYS.map(d => <option key={d.value} value={d.value}>Day {d.value}</option>)}
                </select>

                {/* NEW ROLE FILTER */}
                <select style={S.input} value={roleFilter} onChange={e=>setRoleFilter(e.target.value)}>
                    <option value="all">All Roles</option>
                    <option value="Student">Students Only</option>
                    <option value="Speaker">Speakers Only</option>
                </select>
            </div>
            <button style={{ ...S.btnPrimary, backgroundColor: '#10b981' }} onClick={sendAllEmails} disabled={sendingAll}>
              {sendingAll ? 'Sending...' : 'Send All Filtered'}
            </button>
          </div>

          <div style={S.statsRow}>
            <div style={S.statBadge}>Total: {filtered.length}</div>
            <div style={{ ...S.statBadge, backgroundColor: '#f0fdf4', color: '#15803d' }}>Students: {filtered.filter(p => p.role === 'Student').length}</div>
            <div style={{ ...S.statBadge, backgroundColor: '#fdf2f8', color: '#be185d' }}>Speakers: {filtered.filter(p => p.role === 'Speaker').length}</div>
          </div>

          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>#</th>
                <th style={S.th}>Name</th>
                <th style={S.th}>Role</th>
                <th style={S.th}>Email</th>
                <th style={S.th}>Date</th>
                <th style={S.th}>Status</th>
                <th style={S.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((p, i) => (
                <tr key={p.id}>
                  <td style={S.td}>{((currentPage - 1) * ITEMS_PER_PAGE) + i + 1}</td>
                  <td style={{ ...S.td, fontWeight: '600' }}>{p.name}</td>
                  <td style={S.td}>{p.role}</td>
                  <td style={S.td}>{p.email}</td>
                  <td style={S.td}>{DAY_LABEL[p.cert_date]}</td>
                  <td style={S.td}>{p.email_sent ? 'Sent' : 'Pending'}</td>
                  <td style={S.td}>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button style={S.btnAction} onClick={() => sendIndividualEmail(p)}>{sendingStatus === p.id ? '...' : 'Send'}</button>
                      <button style={S.btnAction} onClick={async () => { if (window.confirm("Delete?")) { await supabase.from('participants').delete().eq('id', p.id); fetchParticipants(); } }}>Delete</button>
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
            <h3>Presentation Settings</h3>
            <select style={{ ...S.input, width: '100%', marginBottom: '10px' }} value={presDay} onChange={e => setPresDay(e.target.value)}>
              {TRAINING_DAYS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
            <select style={{ ...S.input, width: '100%', marginBottom: '20px' }} value={presRole} onChange={e => setPresRole(e.target.value)}>
              <option value="All">All Roles</option>
              <option value="Speaker">Speakers Only</option>
              <option value="Student">Students Only</option>
            </select>
            <div style={{ display: 'flex', gap: '10px' }}>
                <button style={{ ...S.btnPrimary, flex: 1 }} onClick={() => navigate(`/presentation?day=${presDay}&role=${presRole}`)}>Start</button>
                <button style={{ ...S.btnOutline, flex: 1 }} onClick={() => setShowConfigModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const S = {
  page: { minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'sans-serif' },
  header: { padding: '1rem 2rem', backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  mainContent: { padding: '2rem', maxWidth: '1200px', margin: '0 auto' },
  card: { background: '#fff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '2rem' },
  inputGroup: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' },
  input: { padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' },
  btnPrimary: { backgroundColor: '#3b82f6', color: 'white', padding: '0.6rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold' },
  btnOutline: { background: 'none', color: '#64748b', padding: '0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0', cursor: 'pointer' },
  btnAction: { padding: '4px 8px', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid #e2e8f0', cursor: 'pointer', background: '#fff' },
  statsRow: { display: 'flex', gap: '10px', marginBottom: '1rem' },
  statBadge: { padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: '#eff6ff', color: '#1d4ed8' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' },
  th: { padding: '10px', textAlign: 'left', borderBottom: '2px solid #f1f5f9', color: '#64748b' },
  td: { padding: '10px', borderBottom: '1px solid #f1f5f9' },
  overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  modal: { background: '#fff', padding: '2rem', borderRadius: '12px', width: '300px' },
  loginPage: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' },
  loginCard: { background: '#1e293b', padding: '2rem', borderRadius: '12px', width: '300px', textAlign: 'center' }
};
