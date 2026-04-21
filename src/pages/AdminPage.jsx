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
  '1': 'April 15, 2026',
  '2': 'April 17, 2026',
  '3': 'April 22, 2026',
  '4': 'April 24, 2026',
  '5': 'April 29, 2026'
};

export default function AdminPage() {
  const navigate = useNavigate();

  // Authentication State
  const [user, setUser] = useState(null);
  const [emailLogin, setEmailLogin] = useState('');
  const [pw, setPw] = useState('');
  const [authLoading, setAuthLoading] = useState(true);

  // Participants State
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [trainingDay, setTrainingDay] = useState('');
  const [role, setRole] = useState('Student');

  // Action States
  const [adding, setAdding] = useState(false);
  const [sendingStatus, setSendingStatus] = useState(null);
  const [sendingAll, setSendingAll] = useState(false);

  // Modal State
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [presDay, setPresDay] = useState('1');
  const [presRole, setPresRole] = useState('All');

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setAuthLoading(false);
    };
    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) fetchParticipants();
  }, [user]);

  const fetchParticipants = async () => {
    setLoading(true);
    const { data } = await supabase.from('participants').select('*').order('created_at', { ascending: false });
    if (data) setParticipants(data);
    setLoading(false);
  };

  const handleLogin = async () => {
    if (!emailLogin || !pw) return alert("Enter both email and password");
    setAuthLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: emailLogin,
      password: pw,
    });
    if (error) {
      alert("Authentication Failed: " + error.message);
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleAdd = async () => {
    if (!name || !email || !trainingDay) return alert("Please fill all fields");
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
      alert("Email failed to send.");
    }
    setSendingStatus(null);
  };

  // Filtering Logic
  const filtered = participants.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesDay = selectedFilter === 'all' || String(p.cert_date) === selectedFilter;
    const matchesRole = roleFilter === 'all' || p.role === roleFilter;
    return matchesSearch && matchesDay && matchesRole;
  });

  const availableToSend = filtered.filter(p => !p.email_sent);
  
  // Pagination Calculations
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const currentItems = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const sendAllEmails = async () => {
    if (availableToSend.length === 0) return alert("No pending emails to send.");
    if (!window.confirm(`Send emails to ${availableToSend.length} participants?`)) return;
    setSendingAll(true);
    emailjs.init(process.env.REACT_APP_EMAILJS_PUBLIC_KEY);
    for (const p of availableToSend) {
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
      } catch (err) { console.error("Failed for:", p.email); }
    }
    fetchParticipants();
    setSendingAll(false);
    alert("Bulk process completed.");
  };

  if (authLoading) return <div style={L.container}><p style={{color:'#fff'}}>Verifying Session...</p></div>;

  if (!user) return (
    <div style={L.container}>
      <div style={L.card}>
        <div style={L.iconBox}>DI</div>
        <h2 style={L.title}>Admin Access</h2>
        <p style={L.subtitle}>Secure login for NEMSU Data Insights</p>
        <div style={{ textAlign: 'left', width: '100%' }}>
          <label style={L.label}>Admin Email</label>
          <input 
            style={L.input} 
            type="email" 
            placeholder="" 
            value={emailLogin} 
            onChange={e => setEmailLogin(e.target.value)} 
          />
          <label style={L.label}>Password</label>
          <input 
            style={L.input} 
            type="password" 
            placeholder="••••••••"
            value={pw} 
            onChange={e => setPw(e.target.value)} 
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          />
          <button style={L.button} onClick={handleLogin}>Authenticate</button>
        </div>
        <div style={L.footerText}>Authorized Personnel Only</div>
      </div>
    </div>
  );

  return (
    <div style={S.page}>
      <header style={S.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={S.miniLogo}>DI</div>
          <h1 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 700, color: '#0f172a' }}>Data Insights 2026</h1>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button style={S.btnOutline} onClick={() => setShowConfigModal(true)}>Presentation Mode</button>
          <button style={{ ...S.btnOutline, color: '#ef4444' }} onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <main style={S.mainContent}>
        <div style={S.card}>
          <h3 style={S.cardTitle}>Add New Participant</h3>
          <div style={S.inputGrid}>
            <input style={S.input} placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} />
            <input style={S.input} placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} />
            <select style={S.input} value={trainingDay} onChange={e => setTrainingDay(e.target.value)}>
              <option value="">Select Day</option>
              {TRAINING_DAYS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
            <select style={S.input} value={role} onChange={e => setRole(e.target.value)}>
              <option>Student</option>
              <option>Speaker</option>
            </select>
            <button style={S.btnPrimary} onClick={handleAdd}>{adding ? 'Processing...' : 'Add Participant'}</button>
          </div>
        </div>

        <div style={S.card}>
          <div style={S.filterBar}>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <input style={{ ...S.input, width: '200px' }} placeholder="Search name..." value={search} onChange={e => {setSearch(e.target.value); setCurrentPage(1);}} />
                <select style={S.input} value={selectedFilter} onChange={e=>{setSelectedFilter(e.target.value); setCurrentPage(1);}}>
                    <option value="all">All Days</option>
                    {TRAINING_DAYS.map(d => <option key={d.value} value={d.value}>Day {d.value}</option>)}
                </select>
                <select style={S.input} value={roleFilter} onChange={e=>{setRoleFilter(e.target.value); setCurrentPage(1);}}>
                    <option value="all">All Roles</option>
                    <option value="Student">Students Only</option>
                    <option value="Speaker">Speakers Only</option>
                </select>
            </div>
            <button style={{ ...S.btnPrimary, backgroundColor: '#10b981' }} onClick={sendAllEmails} disabled={sendingAll}>
              {sendingAll ? 'Processing Bulk...' : `Send to ${availableToSend.length} Available`}
            </button>
          </div>

          <div style={S.statsRow}>
            <div style={S.statBadge}>Total: {filtered.length}</div>
            <div style={{ ...S.statBadge, background: '#f0fdf4', color: '#166534' }}>Students: {filtered.filter(p => p.role === 'Student').length}</div>
            <div style={{ ...S.statBadge, background: '#fdf2f8', color: '#9d174d' }}>Speakers: {filtered.filter(p => p.role === 'Speaker').length}</div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>#</th>
                  <th style={S.th}>Full Name</th>
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
                    <td style={{ ...S.td, fontWeight: '600', color: '#1e293b' }}>{p.name}</td>
                    <td style={S.td}><span style={{fontSize:'0.75rem', fontWeight:'bold', color: p.role==='Speaker'?'#b45309':'#64748b'}}>{p.role}</span></td>
                    <td style={S.td}>{p.email}</td>
                    <td style={S.td}>{DAY_LABEL[p.cert_date]}</td>
                    <td style={S.td}><span style={{fontSize:'0.7rem', fontWeight:'bold', color: p.email_sent?'#059669':'#d97706'}}>{p.email_sent?'SENT':'PENDING'}</span></td>
                    <td style={S.td}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button style={S.btnAction} onClick={() => sendIndividualEmail(p)}>{sendingStatus === p.id ? '...' : 'Send'}</button>
                        <button style={{ ...S.btnAction, color: '#ef4444' }} onClick={async () => { if (window.confirm("Delete?")) { await supabase.from('participants').delete().eq('id', p.id); fetchParticipants(); } }}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div style={S.pagination}>
            <button 
              style={{ ...S.btnOutline, visibility: currentPage === 1 ? 'hidden' : 'visible' }} 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            >
              Previous
            </button>
            <span style={{ fontSize: '0.9rem', color: '#64748b' }}>
              Page <strong>{currentPage}</strong> of {totalPages || 1}
            </span>
            <button 
              style={{ ...S.btnOutline, visibility: currentPage === totalPages || totalPages === 0 ? 'hidden' : 'visible' }} 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            >
              Next
            </button>
          </div>
        </div>
      </main>

      {showConfigModal && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <h3 style={{ marginTop: 0 }}>Presentation View</h3>
            <select style={{ ...S.input, width: '100%', marginBottom: '15px' }} value={presDay} onChange={e => setPresDay(e.target.value)}>
              {TRAINING_DAYS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
            <select style={{ ...S.input, width: '100%', marginBottom: '25px' }} value={presRole} onChange={e => setPresRole(e.target.value)}>
              <option value="All">All Roles</option>
              <option value="Speaker">Speakers Only</option>
              <option value="Student">Students Only</option>
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
  header: { padding: '0.8rem 2rem', backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 },
  miniLogo: { width: '32px', height: '32px', background: '#3b82f6', borderRadius: '8px', display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 'bold', fontSize: '0.8rem' },
  mainContent: { padding: '2rem', maxWidth: '1200px', margin: '0 auto' },
  card: { background: '#fff', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '2rem', border: '1px solid #e2e8f0' },
  cardTitle: { marginTop: 0, marginBottom: '1.2rem', fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase' },
  inputGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' },
  input: { padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', color: '#1e293b' },
  btnPrimary: { backgroundColor: '#3b82f6', color: 'white', padding: '0.6rem 1.2rem', borderRadius: '8px', border: 'none', fontWeight: '600', cursor: 'pointer' },
  btnOutline: { background: 'none', color: '#475569', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', cursor: 'pointer' },
  btnAction: { padding: '4px 10px', fontSize: '0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer' },
  filterBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '12px' },
  statsRow: { display: 'flex', gap: '10px', marginBottom: '1.5rem' },
  statBadge: { padding: '5px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', background: '#eff6ff', color: '#1d4ed8' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' },
  th: { padding: '12px', textAlign: 'left', borderBottom: '2px solid #f1f5f9', color: '#64748b' },
  td: { padding: '12px', borderBottom: '1px solid #f1f5f9', color: '#475569' },
  pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginTop: '20px', padding: '10px' },
  overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  modal: { background: '#fff', padding: '2rem', borderRadius: '20px', width: '340px' }
};

const L = {
  container: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' },
  card: { backgroundColor: '#1e293b', padding: '3rem', borderRadius: '24px', textAlign: 'center', width: '100%', maxWidth: '380px' },
  iconBox: { width: '60px', height: '60px', background: '#3b82f6', borderRadius: '16px', display: 'grid', placeItems: 'center', color: '#fff', fontSize: '1.5rem', fontWeight: '800', margin: '0 auto 20px' },
  title: { color: '#ffffff', fontSize: '24px', margin: '0 0 8px' },
  subtitle: { color: '#94a3b8', fontSize: '14px', marginBottom: '30px' },
  label: { color: '#94a3b8', fontSize: '0.8rem', display: 'block', marginBottom: '8px' },
  input: { width: '100%', padding: '14px', borderRadius: '12px', background: '#0f172a', border: '1px solid #334155', color: '#fff', marginBottom: '20px' },
  button: { width: '100%', padding: '14px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' },
  footerText: { marginTop: '25px', color: '#475569', fontSize: '0.7rem', textTransform: 'uppercase' }
};
