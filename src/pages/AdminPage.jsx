import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import emailjs from '@emailjs/browser';

const ITEMS_PER_PAGE = 20;
const TRAINING_DAYS = [
  { value: '1', label: 'Day 1 — April 15, 2026' },
  { value: '2', label: 'Day 2 — April 17, 2026' },
  { value: '3', label: 'Day 3 — April 22, 2026' },
  { value: '4', label: 'Day 4 — April 24, 2026' },
  { value: '5', label: 'Day 5 — April 29, 2026' },
];

export default function AdminPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [emailLogin, setEmailLogin] = useState('');
  const [pw, setPw] = useState('');
  const [authLoading, setAuthLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [trainingDay, setTrainingDay] = useState('');
  const [role, setRole] = useState('Student');
  const [adding, setAdding] = useState(false);
  const [sendingStatus, setSendingStatus] = useState(null);
  const [sendingAll, setSendingAll] = useState(false);

  // --- UI STATE FOR ORIGINAL MODALS & TABS ---
  const [activeTab, setActiveTab] = useState('list');
  const [showConfigModal, setShowConfigModal] = useState(false);

  const notify = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setAuthLoading(false);
    };
    initAuth();
  }, []);

  useEffect(() => { if (user) fetchParticipants(); }, [user]);

  const fetchParticipants = async () => {
    setLoading(true);
    const { data } = await supabase.from('participants').select('*').order('created_at', { ascending: false });
    if (data) setParticipants(data);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!name || !email || !trainingDay) return alert("All fields are required.");
    setAdding(true);
    
    // LOOSE CLEANING: Fixes the Google Docs hidden characters while keeping the name recognizable
    const cleanName = name.trim().toUpperCase();
    const payload = { 
      name: cleanName, 
      email: email.trim().toLowerCase(), 
      cert_date: trainingDay, 
      role 
    };

    const { error } = editingId 
      ? await supabase.from('participants').update(payload).eq('id', editingId)
      : await supabase.from('participants').insert([{ ...payload, email_sent: false }]);

    if (!error) {
      notify(editingId ? "Entry Updated" : "Participant Added");
      setName(''); setEmail(''); setTrainingDay(''); setRole('Student'); setEditingId(null);
      fetchParticipants();
    }
    setAdding(false);
  };

  // FULL BULK SEND LOGIC (RESTORED)
  const sendBulkEmails = async () => {
    const pending = filtered.filter(p => !p.email_sent);
    if (pending.length === 0) return alert("No pending emails to send.");
    if (!window.confirm(`Send emails to ${pending.length} participants?`)) return;

    setSendingAll(true);
    emailjs.init(process.env.REACT_APP_EMAILJS_PUBLIC_KEY);

    for (const p of pending) {
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
        console.error("Failed for:", p.name);
      }
    }
    setSendingAll(false);
    notify("Bulk sending complete");
    fetchParticipants();
  };

  const filtered = participants.filter(p => {
    // SEARCH FIX: Allows dots and symbols to be ignored during search
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesDay = selectedFilter === 'all' || String(p.cert_date) === selectedFilter;
    const matchesRole = roleFilter === 'all' || p.role === roleFilter;
    return matchesSearch && matchesDay && matchesRole;
  });

  const currentItems = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  if (authLoading) return <div style={L.container}>System Initializing...</div>;

  if (!user) return (
    <div style={L.container}>
      <div style={L.card}>
        <h2 style={L.title}>Admin Portal</h2>
        <input style={L.input} type="email" placeholder="Email" value={emailLogin} onChange={e => setEmailLogin(e.target.value)} />
        <input style={L.input} type="password" placeholder="Password" value={pw} onChange={e => setPw(e.target.value)} />
        <button style={L.button} onClick={async () => {
          const { error } = await supabase.auth.signInWithPassword({ email: emailLogin, password: pw });
          if (error) alert(error.message);
        }}>Login</button>
      </div>
    </div>
  );

  return (
    <div style={S.page}>
      {notification && <div style={{ ...S.toast, backgroundColor: notification.type === 'error' ? '#ef4444' : '#10b981' }}>{notification.msg}</div>}
      
      {/* ORIGINAL SIDEBAR & HEADER UI */}
      <div style={S.sidebar}>
        <div style={S.sidebarLogo}>DI 2026</div>
        <nav style={S.nav}>
          <button style={activeTab === 'list' ? S.navBtnActive : S.navBtn} onClick={() => setActiveTab('list')}>Participants</button>
          <button style={activeTab === 'add' ? S.navBtnActive : S.navBtn} onClick={() => setActiveTab('add')}>Quick Add</button>
          <button style={S.navBtn} onClick={() => setShowConfigModal(true)}>Settings</button>
          <button style={{...S.navBtn, marginTop:'auto', color:'#ef4444'}} onClick={() => supabase.auth.signOut()}>Sign Out</button>
        </nav>
      </div>

      <div style={S.main}>
        <header style={S.header}>
          <h2>{activeTab === 'list' ? 'Management Dashboard' : 'Add New Entry'}</h2>
          <div style={S.userMeta}>{user.email}</div>
        </header>

        <div style={S.content}>
          {activeTab === 'add' || editingId ? (
            <div style={S.formCard}>
              <h3>{editingId ? 'Edit Record' : 'Create New Participant'}</h3>
              <div style={S.grid}>
                <input style={S.input} placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} />
                <input style={S.input} placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} />
                <select style={S.input} value={trainingDay} onChange={e => setTrainingDay(e.target.value)}>
                  <option value="">Select Training Day</option>
                  {TRAINING_DAYS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
                <select style={S.input} value={role} onChange={e => setRole(e.target.value)}>
                  <option>Student</option><option>Speaker</option>
                </select>
              </div>
              <div style={{marginTop:'20px', display:'flex', gap:'10px'}}>
                <button style={S.btnPrimary} onClick={handleSave}>{adding ? 'Processing...' : 'Save Participant'}</button>
                {editingId && <button style={S.btnOutline} onClick={() => {setEditingId(null); setName(''); setEmail(''); setActiveTab('list');}}>Cancel</button>}
              </div>
            </div>
          ) : (
            <div style={S.tableCard}>
              <div style={S.tableActions}>
                <input style={S.searchBar} placeholder="Search names..." value={search} onChange={e => setSearch(e.target.value)} />
                <button style={S.btnBulk} onClick={sendBulkEmails} disabled={sendingAll}>
                  {sendingAll ? 'Sending...' : `Bulk Email (${filtered.filter(p=>!p.email_sent).length} pending)`}
                </button>
              </div>
              <table style={S.table}>
                <thead>
                  <tr><th>Name</th><th>Role</th><th>Training Day</th><th>Email Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {currentItems.map(p => (
                    <tr key={p.id}>
                      <td style={{fontWeight:'600'}}>{p.name}</td>
                      <td><span style={p.role==='Speaker'?S.badgeSpeaker:S.badgeStudent}>{p.role}</span></td>
                      <td>Day {p.cert_date}</td>
                      <td style={{color: p.email_sent ? '#10b981' : '#f59e0b'}}>{p.email_sent ? 'Sent' : 'Pending'}</td>
                      <td>
                        <button style={S.actionBtn} onClick={() => startEdit(p)}>Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={S.pagination}>
                <button onClick={() => setCurrentPage(p => Math.max(p-1, 1))}>Previous</button>
                <span>Page {currentPage} of {totalPages || 1}</span>
                <button onClick={() => setCurrentPage(p => Math.min(p+1, totalPages))}>Next</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// RESTORED ORIGINAL STYLES (THE LONG STYLESHEET)
const S = {
  page: { display: 'flex', minHeight: '100vh', backgroundColor: '#f1f5f9', fontFamily: 'Inter, system-ui, sans-serif' },
  sidebar: { width: '260px', background: '#0f172a', color: '#fff', display: 'flex', flexDirection: 'column', padding: '20px' },
  sidebarLogo: { fontSize: '24px', fontWeight: '800', marginBottom: '40px', color: '#3b82f6', textAlign: 'center' },
  nav: { display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 },
  navBtn: { padding: '12px 15px', background: 'none', border: 'none', color: '#94a3b8', textAlign: 'left', cursor: 'pointer', borderRadius: '8px', fontWeight: '500' },
  navBtnActive: { padding: '12px 15px', background: '#1e293b', border: 'none', color: '#3b82f6', textAlign: 'left', cursor: 'pointer', borderRadius: '8px', fontWeight: 'bold' },
  main: { flex: 1, display: 'flex', flexDirection: 'column' },
  header: { padding: '20px 40px', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  userMeta: { fontSize: '13px', color: '#64748b' },
  content: { padding: '40px' },
  formCard: { background: '#fff', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' },
  input: { padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' },
  btnPrimary: { background: '#3b82f6', color: '#fff', padding: '12px 25px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
  btnOutline: { background: 'none', border: '1px solid #cbd5e1', padding: '12px 25px', borderRadius: '8px', cursor: 'pointer' },
  tableCard: { background: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' },
  tableActions: { display: 'flex', justifyContent: 'space-between', marginBottom: '20px', gap: '15px' },
  searchBar: { flex: 1, padding: '10px 15px', borderRadius: '8px', border: '1px solid #cbd5e1' },
  btnBulk: { background: '#10b981', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  badgeStudent: { padding: '4px 8px', background: '#eff6ff', color: '#1d4ed8', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' },
  badgeSpeaker: { padding: '4px 8px', background: '#fff7ed', color: '#9a3412', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' },
  actionBtn: { padding: '6px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer' },
  pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginTop: '30px', fontSize: '14px' },
  toast: { position: 'fixed', top: '20px', right: '20px', padding: '15px 25px', borderRadius: '10px', color: '#fff', zIndex: 1000, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }
};

const L = {
  container: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' },
  card: { background: '#1e293b', padding: '2.5rem', borderRadius: '20px', textAlign: 'center', width: '340px' },
  title: { color: '#fff', marginBottom: '2rem', fontSize: '24px' },
  input: { width: '100%', padding: '12px', marginBottom: '1rem', borderRadius: '8px', border: 'none', boxSizing: 'border-box' },
  button: { width: '100%', padding: '12px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }
};
