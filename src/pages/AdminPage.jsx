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

const DAY_LABEL = {
  '1': 'April 15, 2026', '2': 'April 17, 2026', '3': 'April 22, 2026', '4': 'April 24, 2026', '5': 'April 29, 2026'
};

export default function AdminPage() {
  const navigate = useNavigate();

  // Authentication & Notifications
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // Participants State
  const [participants, setParticipants] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Form & Edit State
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [trainingDay, setTrainingDay] = useState('');
  const [role, setRole] = useState('Student');
  const [emailLogin, setEmailLogin] = useState('');
  const [pw, setPw] = useState('');

  // Action States
  const [processing, setProcessing] = useState(false);
  const [sendingStatus, setSendingStatus] = useState(null);
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
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => authListener.subscription.unsubscribe();
  }, []);

  useEffect(() => { if (user) fetchParticipants(); }, [user]);

  const fetchParticipants = async () => {
    const { data } = await supabase.from('participants').select('*').order('created_at', { ascending: false });
    if (data) setParticipants(data);
  };

  const handleLogin = async () => {
    if (!emailLogin || !pw) return notify("Enter credentials", "error");
    setAuthLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: emailLogin, password: pw });
    if (error) { notify(error.message, "error"); setAuthLoading(false); }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleSaveParticipant = async () => {
    if (!name || !email || !trainingDay) return notify("Please fill all fields", "error");
    setProcessing(true);
    const payload = { name: name.toUpperCase(), email: email.toLowerCase(), cert_date: trainingDay, role };

    if (editingId) {
      const { error } = await supabase.from('participants').update(payload).eq('id', editingId);
      if (!error) notify("Participant updated successfully");
      setEditingId(null);
    } else {
      const { error } = await supabase.from('participants').insert([{ ...payload, email_sent: false }]);
      if (!error) notify("Participant added successfully");
    }

    setName(''); setEmail(''); setTrainingDay(''); setRole('Student');
    fetchParticipants();
    setProcessing(false);
  };

  const startEdit = (p) => {
    setEditingId(p.id);
    setName(p.name);
    setEmail(p.email);
    setTrainingDay(String(p.cert_date));
    setRole(p.role);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this record?")) return;
    const { error } = await supabase.from('participants').delete().eq('id', id);
    if (!error) { notify("Record deleted", "error"); fetchParticipants(); }
  };

  const sendIndividualEmail = async (p) => {
    setSendingStatus(p.id);
    try {
      emailjs.init(process.env.REACT_APP_EMAILJS_PUBLIC_KEY);
      await emailjs.send(
        process.env.REACT_APP_EMAILJS_SERVICE_ID, process.env.REACT_APP_EMAILJS_TEMPLATE_ID,
        { to_name: p.name, to_email: p.email, certificate_url: `${window.location.origin}/certificate/${encodeURIComponent(p.name)}/${p.cert_date}` }
      );
      await supabase.from('participants').update({ email_sent: true }).eq('id', p.id);
      notify("Email sent successfully");
      fetchParticipants();
    } catch { notify("Email failed to send", "error"); }
    setSendingStatus(null);
  };

  const filtered = participants.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) &&
    (selectedFilter === 'all' || String(p.cert_date) === selectedFilter) &&
    (roleFilter === 'all' || p.role === roleFilter)
  );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const currentItems = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  if (authLoading) return <div style={L.container}><p style={{color:'#fff'}}>Authenticating...</p></div>;

  if (!user) return (
    <div style={L.container}>
      <div style={L.card}>
        <div style={L.iconBox}>DI</div>
        <h2 style={L.title}>Admin Access</h2>
        <div style={{ textAlign: 'left', width: '100%' }}>
          <input style={L.input} type="email" placeholder="Email" value={emailLogin} onChange={e => setEmailLogin(e.target.value)} />
          <input style={L.input} type="password" placeholder="Password" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
          <button style={L.button} onClick={handleLogin}>Login</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={S.page}>
      {notification && (
        <div style={{ ...S.toast, backgroundColor: notification.type === 'error' ? '#ef4444' : '#10b981' }}>
          {notification.msg}
        </div>
      )}

      <header style={S.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={S.miniLogo}>DI</div>
          <h1 style={{ fontSize: '1rem', margin: 0, fontWeight: 700 }}>Data Insights 2026</h1>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button style={S.btnOutline} onClick={() => setShowConfigModal(true)}>Presentation</button>
          <button style={{ ...S.btnOutline, color: '#ef4444' }} onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <main style={S.mainContent}>
        <div style={{ ...S.card, borderLeft: editingId ? '6px solid #3b82f6' : '1px solid #e2e8f0' }}>
          <h3 style={S.cardTitle}>{editingId ? 'Edit Participant' : 'New Participant'}</h3>
          <div style={S.inputGrid}>
            <input style={S.input} placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} />
            <input style={S.input} placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
            <select style={S.input} value={trainingDay} onChange={e => setTrainingDay(e.target.value)}>
              <option value="">Select Day</option>
              {TRAINING_DAYS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
            <select style={S.input} value={role} onChange={e => setRole(e.target.value)}>
              <option>Student</option><option>Speaker</option>
            </select>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button style={S.btnPrimary} onClick={handleSaveParticipant}>{processing ? '...' : editingId ? 'Update' : 'Add'}</button>
              {editingId && <button style={S.btnOutline} onClick={() => { setEditingId(null); setName(''); setEmail(''); }}>Cancel</button>}
            </div>
          </div>
        </div>

        <div style={S.card}>
          <div style={S.filterBar}>
            <input style={{ ...S.input, width: '220px' }} placeholder="Search name..." value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} />
            <div style={S.statsRow}><div style={S.statBadge}>Total: {filtered.length}</div></div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>#</th><th style={S.th}>Name / Email</th><th style={S.th}>Role</th><th style={S.th}>Status</th><th style={S.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((p, i) => (
                  <tr key={p.id}>
                    <td style={S.td}>{((currentPage - 1) * ITEMS_PER_PAGE) + i + 1}</td>
                    <td style={S.td}><strong>{p.name}</strong><br/><small style={{color: '#64748b'}}>{p.email}</small></td>
                    <td style={S.td}>{p.role}</td>
                    <td style={S.td}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: p.email_sent ? '#10b981' : '#f59e0b' }}>
                        {p.email_sent ? 'SENT' : 'PENDING'}
                      </span>
                    </td>
                    <td style={S.td}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button style={S.btnAction} onClick={() => startEdit(p)}>Edit</button>
                        <button style={S.btnAction} onClick={() => sendIndividualEmail(p)}>{sendingStatus === p.id ? '...' : 'Send'}</button>
                        <button style={{ ...S.btnAction, color: '#ef4444' }} onClick={() => handleDelete(p.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={S.pagination}>
            <button style={{ ...S.btnOutline, visibility: currentPage === 1 ? 'hidden' : 'visible' }} onClick={() => setCurrentPage(p => p - 1)}>Previous</button>
            <span style={{ fontSize: '0.8rem' }}>Page {currentPage} of {totalPages || 1}</span>
            <button style={{ ...S.btnOutline, visibility: currentPage === totalPages || totalPages === 0 ? 'hidden' : 'visible' }} onClick={() => setCurrentPage(p => p + 1)}>Next</button>
          </div>
        </div>
      </main>

      {showConfigModal && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <h3 style={{ marginTop: 0 }}>Presentation View</h3>
            <label style={{ fontSize: '0.8rem', color: '#64748b' }}>Training Day</label>
            <select style={{ ...S.input, width: '100%', marginBottom: '15px' }} value={presDay} onChange={e => setPresDay(e.target.value)}>
              {TRAINING_DAYS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
            <label style={{ fontSize: '0.8rem', color: '#64748b' }}>Category</label>
            <select style={{ ...S.input, width: '100%', marginBottom: '25px' }} value={presRole} onChange={e => setPresRole(e.target.value)}>
              <option value="All">All Roles</option><option value="Speaker">Speakers Only</option><option value="Student">Students Only</option>
            </select>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button style={{ ...S.btnPrimary, flex: 1 }} onClick={() => navigate(`/presentation?day=${presDay}&role=${presRole}`)}>Launch</button>
              <button style={{ ...S.btnOutline, flex: 1 }} onClick={() => setShowConfigModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const S = {
  page: { minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'system-ui, sans-serif' },
  header: { padding: '1rem 2rem', backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  miniLogo: { width: '32px', height: '32px', background: '#3b82f6', borderRadius: '8px', display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 'bold' },
  mainContent: { padding: '2rem', maxWidth: '1100px', margin: '0 auto' },
  card: { background: '#fff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '1.5rem' },
  cardTitle: { marginTop: 0, marginBottom: '1rem', fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' },
  inputGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' },
  input: { padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' },
  btnPrimary: { backgroundColor: '#3b82f6', color: '#fff', border: 'none', padding: '0.6rem 1rem', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' },
  btnOutline: { background: 'none', border: '1px solid #e2e8f0', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem' },
  btnAction: { padding: '4px 8px', fontSize: '0.7rem', border: '1px solid #e2e8f0', borderRadius: '4px', cursor: 'pointer', background: '#fff', fontWeight: 'bold' },
  filterBar: { display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' },
  statsRow: { display: 'flex', gap: '10px' },
  statBadge: { padding: '4px 12px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold', background: '#eff6ff', color: '#1d4ed8' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' },
  th: { textAlign: 'left', padding: '10px', borderBottom: '2px solid #f1f5f9', color: '#64748b' },
  td: { padding: '10px', borderBottom: '1px solid #f1f5f9' },
  pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginTop: '1.5rem' },
  toast: { position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', padding: '12px 24px', borderRadius: '8px', color: '#fff', fontWeight: 'bold', zIndex: 1000 },
  overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  modal: { background: '#fff', padding: '2rem', borderRadius: '16px', width: '320px' }
};

const L = {
  container: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' },
  card: { backgroundColor: '#1e293b', padding: '2.5rem', borderRadius: '24px', textAlign: 'center', width: '320px' },
  iconBox: { width: '50px', height: '50px', background: '#3b82f6', borderRadius: '12px', display: 'grid', placeItems: 'center', color: '#fff', fontSize: '1.2rem', fontWeight: '800', margin: '0 auto 20px' },
  title: { color: '#fff', fontSize: '1.2rem', marginBottom: '20px' },
  input: { width: '100%', padding: '12px', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: '#fff', marginBottom: '15px', boxSizing: 'border-box' },
  button: { width: '100%', padding: '12px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }
};
