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

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

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
        await new Promise(res => setTimeout(res, 400));
      } catch (err) {
        console.error("Failed:", p.email);
      }
    }
    fetchParticipants();
    setSendingAll(false);
    alert("All emails sent!");
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

  const filtered = participants.filter(p => {
    return (
      p.name.toLowerCase().includes(search.toLowerCase()) &&
      (selectedFilter === 'all' || String(p.cert_date) === selectedFilter) &&
      (roleFilter === 'all' || p.role === roleFilter)
    );
  });

  const currentItems = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => { setCurrentPage(1); }, [search, selectedFilter, roleFilter]);

  if (!authed) return (
    <div style={S.loginPage}>
      <div style={S.loginCard}>
        <h2 style={{ color: '#fff', marginBottom: '1.5rem' }}>Admin Portal</h2>
        <input 
          style={{ ...S.input, width: '100%', marginBottom: '1rem', textAlign: 'center' }} 
          type="password" 
          placeholder="Enter Password"
          value={pw} 
          onChange={e => setPw(e.target.value)} 
        />
        <button style={{ ...S.btnPrimary, width: '100%' }} onClick={handleLogin}>ENTER SYSTEM</button>
      </div>
    </div>
  );

  return (
    <div style={S.page}>
      <header style={S.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: 35, height: 35, background: '#3b82f6', borderRadius: 8, display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 'bold' }}>DI</div>
          <h1 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 700, color: '#0f172a' }}>Data Insights 2026</h1>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button style={S.btnOutline} onClick={() => setShowConfigModal(true)}>📺 Presentation Mode</button>
          <button style={{ ...S.btnOutline, color: '#ef4444', borderColor: '#fee2e2' }} onClick={() => { localStorage.clear(); window.location.reload(); }}>Logout</button>
        </div>
      </header>

      <main style={S.mainContent}>
        {/* ADD PARTICIPANT SECTION */}
        <div style={S.card}>
          <h3 style={{ marginTop: 0, marginBottom: '1.2rem', fontSize: '0.9rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quick Add Participant</h3>
          <div style={S.inputGroup}>
            <input style={S.input} placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} />
            <input style={S.input} placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} />
            <select style={S.input} value={trainingDay} onChange={e => setTrainingDay(e.target.value)}>
              <option value="">Select Training Day</option>
              {TRAINING_DAYS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
            <select style={S.input} value={role} onChange={e => setRole(e.target.value)}>
              <option>Student</option>
              <option>Speaker</option>
            </select>
            <button style={S.btnPrimary} onClick={handleAdd}>{adding ? '...' : '➕ Add Now'}</button>
          </div>
        </div>

        {/* LIST & FILTERS */}
        <div style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
                <input 
                    style={{ ...S.input, width: '280px' }} 
                    placeholder="🔍 Search participants..." 
                    value={search} 
                    onChange={e => setSearch(e.target.value)} 
                />
                <select style={S.input} value={selectedFilter} onChange={e=>setSelectedFilter(e.target.value)}>
                    <option value="all">All Days</option>
                    {TRAINING_DAYS.map(d => <option key={d.value} value={d.value}>Day {d.value}</option>)}
                </select>
            </div>
            <button style={{ ...S.btnPrimary, backgroundColor: '#10b981' }} onClick={sendAllEmails} disabled={sendingAll}>
              {sendingAll ? '⏳ Sending Bulk...' : '📧 Send All Filtered'}
            </button>
          </div>

          <div style={S.statsRow}>
            <div style={S.statBadge}>👥 Total: {filtered.length}</div>
            <div style={{ ...S.statBadge, backgroundColor: '#fdf2f8', color: '#be185d', borderColor: '#fce7f3' }}>🎤 Speakers: {filtered.filter(p => p.role === 'Speaker').length}</div>
            <div style={{ ...S.statBadge, backgroundColor: '#f0fdf4', color: '#15803d', borderColor: '#dcfce7' }}>🎓 Students: {filtered.filter(p => p.role === 'Student').length}</div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>#</th>
                  <th style={S.th}>Participant Name</th>
                  <th style={S.th}>Role</th>
                  <th style={S.th}>Email Address</th>
                  <th style={S.th}>Training Date</th>
                  <th style={S.th}>Email Status</th>
                  <th style={S.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((p, i) => (
                  <tr key={p.id}>
                    <td style={S.td}>{((currentPage - 1) * ITEMS_PER_PAGE) + i + 1}</td>
                    <td style={{ ...S.td, fontWeight: '600', color: '#1e293b' }}>{p.name}</td>
                    <td style={S.td}>
                        <span style={{ fontSize: '0.8rem', padding: '2px 8px', borderRadius: '4px', background: p.role === 'Speaker' ? '#fef3c7' : '#f1f5f9', color: p.role === 'Speaker' ? '#92400e' : '#475569' }}>
                            {p.role}
                        </span>
                    </td>
                    <td style={{ ...S.td, color: '#64748b' }}>{p.email}</td>
                    <td style={S.td}>{DAY_LABEL[p.cert_date]}</td>
                    <td style={S.td}>
                      <span style={p.email_sent ? S.statusSent : S.statusPending}>
                        {p.email_sent ? 'SENT' : 'PENDING'}
                      </span>
                    </td>
                    <td style={S.td}>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button title="Send Email" style={S.btnOutline} onClick={() => sendIndividualEmail(p)}>
                          {sendingStatus === p.id ? '...' : '📩'}
                        </button>
                        <button title="Edit" style={S.btnOutline} onClick={() => { setEditingId(p.id); setEditForm(p); }}>✏️</button>
                        <button title="Delete" style={{ ...S.btnOutline, color: '#ef4444' }} onClick={async () => { if (window.confirm("Delete participant?")) { await supabase.from('participants').delete().eq('id', p.id); fetchParticipants(); } }}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={S.pagination}>
            <button style={S.btnOutline} disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Prev</button>
            <span style={{ alignSelf: 'center', fontSize: '0.9rem', color: '#64748b' }}>Page {currentPage} of {Math.ceil(filtered.length / ITEMS_PER_PAGE)}</span>
            <button style={S.btnOutline} disabled={currentPage >= Math.ceil(filtered.length / ITEMS_PER_PAGE)} onClick={() => setCurrentPage(p => p + 1)}>Next</button>
          </div>
        </div>
      </main>

      {showConfigModal && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <h3 style={{ marginTop: 0 }}>Presentation Settings</h3>
            <p style={{ fontSize: '0.9rem', color: '#64748b' }}>Select parameters for the presentation view.</p>
            
            <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '5px', fontWeight: 'bold' }}>Training Day</label>
            <select style={{ ...S.input, width: '100%', marginBottom: '15px' }} value={presDay} onChange={e => setPresDay(e.target.value)}>
              {TRAINING_DAYS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>

            <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '5px', fontWeight: 'bold' }}>Role Filter</label>
            <select style={{ ...S.input, width: '100%', marginBottom: '20px' }} value={presRole} onChange={e => setPresRole(e.target.value)}>
              <option value="All">Everyone</option>
              <option value="Speaker">Speakers Only</option>
              <option value="Student">Students Only</option>
            </select>

            <div style={{ display: 'flex', gap: '10px' }}>
                <button style={{ ...S.btnPrimary, flex: 1 }} onClick={() => navigate(`/presentation?day=${presDay}&role=${presRole}`)}>START</button>
                <button style={{ ...S.btnOutline, flex: 1 }} onClick={() => setShowConfigModal(false)}>CANCEL</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const S = {
  page: { minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif', display: 'flex', flexDirection: 'column' },
  header: { padding: '1rem 2rem', backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  mainContent: { padding: '2rem', maxWidth: '1200px', margin: '0 auto', width: '100%' },
  card: { background: '#ffffff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '2rem', border: '1px solid #e2e8f0' },
  inputGroup: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' },
  input: { padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', background: '#fff' },
  btnPrimary: { backgroundColor: '#3b82f6', color: 'white', padding: '0.6rem 1rem', borderRadius: '8px', border: 'none', fontWeight: '600', cursor: 'pointer' },
  btnOutline: { backgroundColor: 'transparent', color: '#64748b', padding: '0.5rem 0.8rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontWeight: '500', cursor: 'pointer', fontSize: '0.85rem' },
  statsRow: { display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' },
  statBadge: { padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600', backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #dbeafe' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' },
  th: { padding: '12px', borderBottom: '2px solid #f1f5f9', color: '#64748b', fontWeight: '600' },
  td: { padding: '12px', borderBottom: '1px solid #f1f5f9' },
  statusSent: { color: '#059669', backgroundColor: '#ecfdf5', padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 'bold' },
  statusPending: { color: '#d97706', backgroundColor: '#fffbeb', padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 'bold' },
  pagination: { marginTop: '1.5rem', display: 'flex', gap: '15px', justifyContent: 'center' },
  overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  modal: { background: '#fff', padding: '2rem', borderRadius: '16px', width: '90%', maxWidth: '400px' },
  loginPage: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' },
  loginCard: { backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '2.5rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', width: '350px' }
};
