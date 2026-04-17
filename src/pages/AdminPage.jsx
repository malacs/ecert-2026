import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import emailjs from '@emailjs/browser';

const ADMIN_PASSWORD = process.env.REACT_APP_ADMIN_PASSWORD || 'admindatamining2026!';
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
  const [authed, setAuthed] = useState(() => localStorage.getItem('isAdminAuthenticated') === 'true');
  const [pw, setPw] = useState('');
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all'); 
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [trainingDay, setTrainingDay] = useState('');
  const [role, setRole] = useState('Student'); 
  const [adding, setAdding] = useState(false);
  const [sendingAll, setSendingAll] = useState(false);

  // Presentation Config
  const [presDay, setPresDay] = useState('1');
  const [presRole, setPresRole] = useState('All');

  // Edit State
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', cert_date: '', role: '' });

  useEffect(() => { if (authed) fetchParticipants(); }, [authed]);

  // AUTO-SET SPEAKER FOR SESSIONS 3, 4, 5
  useEffect(() => {
    if (['3', '4', '5'].includes(presDay)) {
      setPresRole('Speaker');
    } else {
      setPresRole('All');
    }
  }, [presDay]);

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
    const cleanName = name.trim().toUpperCase();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanName || !cleanEmail || !trainingDay) return alert("Fill all fields");
    setAdding(true);
    await supabase.from('participants').insert([{ name: cleanName, email: cleanEmail, cert_date: trainingDay, role, email_sent: false }]);
    setName(''); setEmail(''); setRole('Student');
    fetchParticipants();
    setAdding(false);
  };

  const handleUpdate = async (id) => {
    await supabase.from('participants').update({
      name: editForm.name.toUpperCase(),
      email: editForm.email.toLowerCase(),
      cert_date: editForm.cert_date,
      role: editForm.role
    }).eq('id', id);
    setEditingId(null);
    fetchParticipants();
  };

  const handleSendAll = async () => {
    const targets = filtered.filter(p => !p.email_sent);
    if (targets.length === 0) return alert("No pending emails.");
    setSendingAll(true);
    for (const p of targets) {
      try {
        await emailjs.send(
          process.env.REACT_APP_EMAILJS_SERVICE_ID,
          process.env.REACT_APP_EMAILJS_TEMPLATE_ID,
          { to_name: p.name, to_email: p.email, certificate_url: `${window.location.origin}/certificate/${encodeURIComponent(p.name)}/${p.cert_date}` },
          process.env.REACT_APP_EMAILJS_PUBLIC_KEY
        );
        await supabase.from('participants').update({ email_sent: true }).eq('id', p.id);
      } catch (e) { console.error(e); }
      await new Promise(res => setTimeout(res, 1000)); 
    }
    setSendingAll(false);
    fetchParticipants();
    alert('Batch Sent.');
  };

  const filtered = participants.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesDay = selectedFilter === 'all' || String(p.cert_date) === String(selectedFilter);
    return matchesSearch && matchesDay;
  });

  const currentItems = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  if (!authed) return (
    <div style={S.loginPage}>
      <div style={S.loginCard}>
        <h2 style={{color: '#fff'}}>Admin Portal</h2>
        <input style={S.loginInput} type="password" placeholder="Password" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
        <button style={S.loginBtn} onClick={handleLogin}>ENTER</button>
      </div>
    </div>
  );

  return (
    <div style={S.page}>
      <header style={S.header}>
        <div style={S.headerInner}>
          <h1 style={S.headerTitle}>🎓 Admin Dashboard</h1>
          <div style={{display: 'flex', gap: 10}}>
             <button style={S.presBtn} onClick={() => setShowConfigModal(true)}>📺 Presentation</button>
             <button style={S.sendAllBtn} onClick={handleSendAll} disabled={sendingAll}>{sendingAll ? '...' : '📧 Send All'}</button>
             <button style={S.logoutBtn} onClick={() => {localStorage.clear(); window.location.reload();}}>Logout</button>
          </div>
        </div>
      </header>

      {showConfigModal && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <h3 style={{marginBottom: '15px'}}>Presentation Settings</h3>
            <label style={S.modalLabel}>Select Session</label>
            <select style={S.modalSelect} value={presDay} onChange={e => setPresDay(e.target.value)}>
              {TRAINING_DAYS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
            <label style={S.modalLabel}>Who to Display?</label>
            <select style={S.modalSelect} value={presRole} onChange={e => setPresRole(e.target.value)}>
              <option value="All">Everyone</option>
              <option value="Speaker">Speakers Only</option>
              <option value="Student">Students Only</option>
            </select>
            <div style={{display: 'flex', gap: 10, marginTop: '20px'}}>
              <button style={S.btnPrimary} onClick={() => navigate(`/presentation?day=${presDay}&role=${presRole}`)}>START</button>
              <button style={S.cancelBtn} onClick={() => setShowConfigModal(false)}>CANCEL</button>
            </div>
          </div>
        </div>
      )}

      <main style={S.main}>
        <div style={S.card}>
          <div style={S.formRow}>
            <input style={S.input} placeholder="NAME" value={name} onChange={e => setName(e.target.value)} />
            <input style={S.input} placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
            <select style={S.select} value={trainingDay} onChange={e => setTrainingDay(e.target.value)}>
              <option value="">Select Day</option>
              {TRAINING_DAYS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
            <select style={S.select} value={role} onChange={e => setRole(e.target.value)}>
              <option value="Student">Student</option>
              <option value="Speaker">Speaker</option>
            </select>
            <button style={S.btnPrimary} onClick={handleAdd}>ADD</button>
          </div>
        </div>

        <div style={S.card}>
          <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '15px'}}>
            <input style={{...S.input, maxWidth: 300}} placeholder="Search participants..." value={search} onChange={e => setSearch(e.target.value)} />
            <select style={S.select} value={selectedFilter} onChange={e => setSelectedFilter(e.target.value)}>
               <option value="all">All Days</option>
               {TRAINING_DAYS.map(d => <option key={d.value} value={d.value}>Day {d.value}</option>)}
            </select>
          </div>
          <table style={S.table}>
            <thead><tr style={S.thRow}>{['#','Name','Role','Email','Date','Actions'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>
              {currentItems.map((p, i) => (
                <tr key={p.id} style={S.tr}>
                  <td style={S.td}>{i+1}</td>
                  {editingId === p.id ? (
                    <>
                      <td style={S.td}><input style={S.editInput} value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} /></td>
                      <td style={S.td}>
                        <select value={editForm.role} onChange={e => setEditForm({...editForm, role: e.target.value})}>
                          <option value="Student">Student</option>
                          <option value="Speaker">Speaker</option>
                        </select>
                      </td>
                      <td style={S.td}><input style={S.editInput} value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} /></td>
                      <td style={S.td}>
                        <select value={editForm.cert_date} onChange={e => setEditForm({...editForm, cert_date: e.target.value})}>
                          {TRAINING_DAYS.map(d => <option key={d.value} value={d.value}>Day {d.value}</option>)}
                        </select>
                      </td>
                      <td style={S.td}><button style={S.btnSave} onClick={() => handleUpdate(p.id)}>Save</button></td>
                    </>
                  ) : (
                    <>
                      <td style={S.td}><b>{p.name}</b></td>
                      <td style={S.td}>{p.role}</td>
                      <td style={S.td}>{p.email}</td>
                      <td style={S.td}>{DAY_LABEL[p.cert_date]}</td>
                      <td style={S.td}>
                         <button style={S.btnEdit} onClick={() => { setEditingId(p.id); setEditForm(p); }}>Edit</button>
                         <button style={S.btnDelete} onClick={async () => { if(window.confirm("Delete?")) { await supabase.from('participants').delete().eq('id',p.id); fetchParticipants(); } }}>🗑</button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

const S = {
  loginPage: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#04050a' },
  loginCard: { padding: '40px', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', textAlign: 'center' },
  loginInput: { padding: '12px', borderRadius: '8px', border: 'none', width: '250px', display: 'block', margin: '10px auto', background: '#fff' },
  loginBtn: { padding: '12px 30px', borderRadius: '8px', background: '#4f46e5', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold' },
  page: { minHeight: '100vh', background: '#f4f7fe', fontFamily: 'sans-serif' },
  header: { background: '#1a1060', padding: '15px 40px', color: 'white' },
  headerInner: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', margin: '0 auto' },
  headerTitle: { fontSize: '18px', margin: 0 },
  presBtn: { background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer' },
  sendAllBtn: { background: '#c9a84c', border: 'none', color: '#000', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },
  logoutBtn: { background: '#ff4d4f', border: 'none', color: '#fff', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer' },
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  modal: { background: 'white', padding: '30px', borderRadius: '20px', width: '350px', textAlign: 'left' },
  modalLabel: { fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '5px', marginTop: '15px', color: '#666' },
  modalSelect: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' },
  main: { padding: '20px', maxWidth: '1200px', margin: '0 auto' },
  card: { background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginBottom: '20px' },
  formRow: { display: 'flex', gap: '10px' },
  input: { padding: '10px', borderRadius: '8px', border: '1px solid #ddd', flex: 1 },
  select: { padding: '10px', borderRadius: '8px', border: '1px solid #ddd' },
  btnPrimary: { background: '#1a1060', color: 'white', border: 'none', padding: '10px 25px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
  cancelBtn: { background: '#eee', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '12px', fontSize: '12px', color: '#888', borderBottom: '2px solid #eee' },
  td: { padding: '12px', borderBottom: '1px solid #f5f5f5', fontSize: '14px' },
  editInput: { padding: '5px', width: '90%' },
  btnEdit: { background: '#f0f2f5', border: 'none', padding: '5px 10px', borderRadius: '5px', marginRight: '5px' },
  btnSave: { background: '#22863a', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px' },
  btnDelete: { background: 'transparent', border: 'none', color: '#ff4d4f' }
};
