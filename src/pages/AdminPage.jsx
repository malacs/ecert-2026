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

const DAY_LABEL = { '1': 'April 15, 2026', '2': 'April 17, 2026', '3': 'April 22, 2026', '4': 'April 24, 2026', '5': 'April 29, 2026' };

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
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [presDay, setPresDay] = useState('1');
  const [presRole, setPresRole] = useState('All');

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
    if (!name || !email || !trainingDay) return alert("Please fill all fields");
    setAdding(true);
    
    // LOGIC FIX: Clean name for DB
    const cleanName = name
      .normalize('NFKD') 
      .replace(/[^\w\s]/gi, '') 
      .replace(/\s+/g, ' ') 
      .trim()
      .toUpperCase();

    const payload = { name: cleanName, email: email.trim().toLowerCase(), cert_date: trainingDay, role };

    const { error } = editingId 
      ? await supabase.from('participants').update(payload).eq('id', editingId)
      : await supabase.from('participants').insert([{ ...payload, email_sent: false }]);

    if (!error) {
      notify(editingId ? "Updated & Cleaned!" : "Added Successfully!");
      setName(''); setEmail(''); setTrainingDay(''); setRole('Student'); setEditingId(null);
      fetchParticipants();
    } else {
      alert("Error: " + error.message);
    }
    setAdding(false);
  };

  const startEdit = (p) => {
    setEditingId(p.id);
    setName(p.name);
    setEmail(p.email);
    setTrainingDay(String(p.cert_date));
    setRole(p.role);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const sendIndividualEmail = async (p) => {
    setSendingStatus(p.id);
    try {
      emailjs.init(process.env.REACT_APP_EMAILJS_PUBLIC_KEY);
      await emailjs.send(process.env.REACT_APP_EMAILJS_SERVICE_ID, process.env.REACT_APP_EMAILJS_TEMPLATE_ID, {
        to_name: p.name, to_email: p.email,
        certificate_url: `${window.location.origin}/certificate/${encodeURIComponent(p.name)}/${p.cert_date}`
      });
      await supabase.from('participants').update({ email_sent: true }).eq('id', p.id);
      notify("Email sent!");
      fetchParticipants();
    } catch { notify("Failed", "error"); }
    setSendingStatus(null);
  };

  const filtered = participants.filter(p => {
    const cleanSearch = search.normalize('NFKD').replace(/[^\w\s]/gi, '').replace(/\s+/g, ' ').trim().toLowerCase();
    const matchesSearch = p.name.toLowerCase().includes(cleanSearch);
    const matchesDay = selectedFilter === 'all' || String(p.cert_date) === selectedFilter;
    const matchesRole = roleFilter === 'all' || p.role === roleFilter;
    return matchesSearch && matchesDay && matchesRole;
  });

  const availableToSend = filtered.filter(p => !p.email_sent);
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const currentItems = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  if (authLoading) return <div style={L.container}>Verifying...</div>;

  if (!user) return (
    <div style={L.container}>
      <div style={L.card}>
        <h2 style={L.title}>Admin Access</h2>
        <input style={L.input} type="email" placeholder="Email" value={emailLogin} onChange={e => setEmailLogin(e.target.value)} />
        <input style={L.input} type="password" placeholder="Password" value={pw} onChange={e => setPw(e.target.value)} />
        <button style={L.button} onClick={async () => {
          const { error } = await supabase.auth.signInWithPassword({ email: emailLogin, password: pw });
          if (error) alert(error.message);
        }}>Authenticate</button>
      </div>
    </div>
  );

  return (
    <div style={S.page}>
      {notification && <div style={{ ...S.toast, backgroundColor: notification.type === 'error' ? '#ef4444' : '#10b981' }}>{notification.msg}</div>}
      <header style={S.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={S.miniLogo}>DI</div>
          <h1 style={{ fontSize: '1.1rem', margin: 0 }}>Data Insights 2026</h1>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button style={S.btnOutline} onClick={() => setShowConfigModal(true)}>Presentation</button>
          <button style={{ ...S.btnOutline, color: '#ef4444' }} onClick={() => supabase.auth.signOut()}>Logout</button>
        </div>
      </header>

      <main style={S.mainContent}>
        <div style={S.card}>
          <h3 style={S.cardTitle}>{editingId ? 'EDIT PARTICIPANT' : 'ADD PARTICIPANT'}</h3>
          <div style={S.inputGrid}>
            <input style={S.input} placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
            <input style={S.input} placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
            <select style={S.input} value={trainingDay} onChange={e => setTrainingDay(e.target.value)}>
              <option value="">Select Day</option>
              {TRAINING_DAYS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
            <select style={S.input} value={role} onChange={e => setRole(e.target.value)}>
              <option>Student</option><option>Speaker</option>
            </select>
            <button style={S.btnPrimary} onClick={handleSave}>{adding ? '...' : 'SAVE'}</button>
          </div>
        </div>

        <div style={S.card}>
          <div style={S.filterBar}>
            <input style={{...S.input, maxWidth:'300px'}} placeholder="Search name..." value={search} onChange={e => {setSearch(e.target.value); setCurrentPage(1);}} />
            <button style={{...S.btnPrimary, backgroundColor:'#10b981'}} onClick={() => alert("Bulk Send Triggered")}>Send to {availableToSend.length} Pending</button>
          </div>
          <div style={{overflowX:'auto'}}>
            <table style={S.table}>
              <thead><tr><th>Name</th><th>Role</th><th>Day</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {currentItems.map(p => (
                  <tr key={p.id}>
                    <td style={{fontWeight:'bold'}}>{p.name}</td>
                    <td>{p.role}</td>
                    <td>Day {p.cert_date}</td>
                    <td style={{color: p.email_sent ? '#10b981' : '#f59e0b'}}>{p.email_sent ? 'SENT' : 'PENDING'}</td>
                    <td>
                      <div style={{display:'flex', gap:'5px'}}>
                        <button style={S.btnAction} onClick={() => startEdit(p)}>Edit</button>
                        <button style={S.btnAction} onClick={() => sendIndividualEmail(p)}>Email</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={S.pagination}>
            <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}>Prev</button>
            <span>Page {currentPage} of {totalPages || 1}</span>
            <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}>Next</button>
          </div>
        </div>
      </main>

      {showConfigModal && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <h3>Presentation Mode</h3>
            <button onClick={() => setShowConfigModal(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

const S = {
  page: { minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'sans-serif' },
  header: { padding: '1rem 2rem', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  miniLogo: { width: '30px', height: '30px', background: '#3b82f6', borderRadius: '6px', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 'bold' },
  mainContent: { padding: '2rem', maxWidth: '1200px', margin: '0 auto' },
  card: { background: '#fff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '2rem' },
  cardTitle: { margin: '0 0 1rem 0', fontSize: '0.8rem', color: '#64748b' },
  inputGrid: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
  input: { padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' },
  btnPrimary: { background: '#3b82f6', color: '#fff', padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
  btnOutline: { background: 'none', border: '1px solid #e2e8f0', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' },
  btnAction: { padding: '5px 10px', fontSize: '0.7rem', cursor: 'pointer', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '4px' },
  filterBar: { display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' },
  pagination: { display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '20px' },
  toast: { position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', padding: '10px 20px', borderRadius: '8px', color: '#fff', zIndex: 1000 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'grid', placeItems: 'center', zIndex: 1000 },
  modal: { background: '#fff', padding: '2rem', borderRadius: '12px' }
};

const L = {
  container: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' },
  card: { background: '#1e293b', padding: '2.5rem', borderRadius: '20px', textAlign: 'center', width: '320px' },
  title: { color: '#fff', marginBottom: '1.5rem' },
  input: { width: '100%', padding: '12px', borderRadius: '8px', border: 'none', marginBottom: '1rem', boxSizing: 'border-box' },
  button: { width: '100%', padding: '12px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }
};
