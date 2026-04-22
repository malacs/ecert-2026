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

  const handleLogin = async () => {
    setAuthLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: emailLogin, password: pw });
    if (error) { alert(error.message); setAuthLoading(false); }
  };

  const handleSave = async () => {
    if (!name || !email || !trainingDay) return alert("Fill all fields");
    setAdding(true);
    
    // Normalization logic: Clean spaces and force uppercase/lowercase
    const cleanName = name.trim().replace(/\s+/g, ' ').toUpperCase();
    const cleanEmail = email.trim().toLowerCase();

    const payload = { name: cleanName, email: cleanEmail, cert_date: trainingDay, role };

    if (editingId) {
      await supabase.from('participants').update(payload).eq('id', editingId);
      setEditingId(null);
      notify("Updated!");
    } else {
      await supabase.from('participants').insert([{ ...payload, email_sent: false }]);
      notify("Added!");
    }

    setName(''); setEmail(''); setTrainingDay(''); setRole('Student');
    fetchParticipants();
    setAdding(false);
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

  const sendAllEmails = async () => {
    const toSend = participants.filter(p => !p.email_sent);
    if (toSend.length === 0) return alert("None to send.");
    setSendingAll(true);
    for (const p of toSend) {
      try {
        await emailjs.send(process.env.REACT_APP_EMAILJS_SERVICE_ID, process.env.REACT_APP_EMAILJS_TEMPLATE_ID, {
          to_name: p.name, to_email: p.email,
          certificate_url: `${window.location.origin}/certificate/${encodeURIComponent(p.name)}/${p.cert_date}`
        });
        await supabase.from('participants').update({ email_sent: true }).eq('id', p.id);
      } catch (err) {}
    }
    setSendingAll(false);
    fetchParticipants();
    notify("Bulk send complete");
  };

  const filtered = participants.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesDay = selectedFilter === 'all' || String(p.cert_date) === selectedFilter;
    const matchesRole = roleFilter === 'all' || p.role === roleFilter;
    return matchesSearch && matchesDay && matchesRole;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const currentItems = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  if (authLoading) return <div style={L.container}>Loading...</div>;
  if (!user) return (
    <div style={L.container}>
      <div style={L.card}>
        <h2 style={L.title}>Admin Access</h2>
        <input style={L.input} placeholder="Email" value={emailLogin} onChange={e => setEmailLogin(e.target.value)} />
        <input style={L.input} type="password" placeholder="Password" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key==='Enter' && handleLogin()}/>
        <button style={L.button} onClick={handleLogin}>Login</button>
      </div>
    </div>
  );

  return (
    <div style={S.page}>
      {notification && <div style={{...S.toast, background: notification.type==='error'?'#ef4444':'#10b981'}}>{notification.msg}</div>}
      <header style={S.header}>
        <h1 style={{fontSize:'1.1rem'}}>Data Insights 2026</h1>
        <div style={{display:'flex', gap:'10px'}}>
           <button style={S.btnOutline} onClick={()=>setShowConfigModal(true)}>Presentation Mode</button>
           <button style={{...S.btnOutline, color:'red'}} onClick={()=>supabase.auth.signOut()}>Logout</button>
        </div>
      </header>

      <main style={S.mainContent}>
        <div style={S.card}>
          <h3>{editingId ? 'Edit' : 'Add'} Participant</h3>
          <div style={S.inputGrid}>
            <input style={S.input} placeholder="Full Name" value={name} onChange={e=>setName(e.target.value)} />
            <input style={S.input} placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
            <select style={S.input} value={trainingDay} onChange={e=>setTrainingDay(e.target.value)}>
              <option value="">Select Day</option>
              {TRAINING_DAYS.map(d=><option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
            <select style={S.input} value={role} onChange={e=>setRole(e.target.value)}>
              <option>Student</option><option>Speaker</option>
            </select>
            <button style={S.btnPrimary} onClick={handleSave}>{adding ? '...' : 'Save'}</button>
          </div>
        </div>

        <div style={S.card}>
          <div style={S.filterBar}>
             <input style={S.input} placeholder="Search names..." value={search} onChange={e=>setSearch(e.target.value)} />
             <button style={{...S.btnPrimary, background:'#10b981'}} onClick={sendAllEmails} disabled={sendingAll}>
                {sendingAll ? 'Sending...' : `Send All Emails`}
             </button>
          </div>
          <table style={S.table}>
            <thead>
              <tr><th style={S.th}>Name</th><th style={S.th}>Role</th><th style={S.th}>Status</th><th style={S.th}>Action</th></tr>
            </thead>
            <tbody>
              {currentItems.map(p=>(
                <tr key={p.id}>
                  <td style={S.td}>{p.name}</td>
                  <td style={S.td}>{p.role}</td>
                  <td style={S.td}>{p.email_sent ? '✅' : '⏳'}</td>
                  <td style={S.td}>
                    <button style={S.btnAction} onClick={()=> { setEditingId(p.id); setName(p.name); setEmail(p.email); setTrainingDay(String(p.cert_date)); setRole(p.role); }}>Edit</button>
                    <button style={S.btnAction} onClick={()=>sendIndividualEmail(p)}>Email</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={S.pagination}>
             <button onClick={()=>setCurrentPage(p=>Math.max(p-1, 1))}>Prev</button>
             <span>Page {currentPage} of {totalPages}</span>
             <button onClick={()=>setCurrentPage(p=>Math.min(p+1, totalPages))}>Next</button>
          </div>
        </div>
      </main>

      {showConfigModal && (
        <div style={S.overlay}>
           <div style={S.modal}>
              <h3>Start Presentation</h3>
              <select style={{width:'100%', marginBottom:'10px'}} value={presDay} onChange={e=>setPresDay(e.target.value)}>
                {TRAINING_DAYS.map(d=><option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
              <button style={{width:'100%'}} onClick={()=>navigate(`/presentation?day=${presDay}&role=${presRole}`)}>Launch</button>
              <button style={{width:'100%', marginTop:'5px'}} onClick={()=>setShowConfigModal(false)}>Cancel</button>
           </div>
        </div>
      )}
    </div>
  );
}

const S = {
  page: { minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'system-ui' },
  header: { padding: '1rem 2rem', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  mainContent: { padding: '2rem', maxWidth: '1200px', margin: '0 auto' },
  card: { background: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' },
  inputGrid: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
  input: { padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' },
  btnPrimary: { background: '#3b82f6', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' },
  btnOutline: { background: 'none', border: '1px solid #e2e8f0', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '12px', borderBottom: '2px solid #f1f5f9' },
  td: { padding: '12px', borderBottom: '1px solid #f1f5f9' },
  btnAction: { marginRight: '5px', padding: '5px 10px', borderRadius: '5px', border: '1px solid #e2e8f0', background: '#fff' },
  pagination: { display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  modal: { background: '#fff', padding: '20px', borderRadius: '12px', width: '300px' },
  toast: { position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', padding: '10px 20px', borderRadius: '8px', color: '#fff' }
};

const L = {
  container: { height: '100vh', background: '#0f172a', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  card: { background: '#1e293b', padding: '40px', borderRadius: '20px', textAlign: 'center', color: '#fff' },
  title: { marginBottom: '20px' },
  input: { width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '8px', border: 'none' },
  button: { width: '100%', padding: '12px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }
};
