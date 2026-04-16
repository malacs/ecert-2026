import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
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
  const navigate = useNavigate();
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState('');
  const [participants, setParticipants] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [trainingDay, setTrainingDay] = useState('');
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(null);
  const [sendingAll, setSendingAll] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all'); 
  const [showDayPicker, setShowDayPicker] = useState(false); // New State

  useEffect(() => { if (authed) fetchParticipants(); }, [authed]);

  const fetchParticipants = async () => {
    setLoading(true);
    const { data } = await supabase.from('participants').select('*').order('created_at', { ascending: false });
    if (data) setParticipants(data);
    setTimeout(() => setLoading(false), 800);
  };

  const handleLogin = () => {
    if (pw === ADMIN_PASSWORD) {
      setAuthed(true);
    } else {
      alert('Incorrect Password');
    }
  };

  const handleSendEmail = async (p) => {
    setSending(p.id);
    try {
      await emailjs.send(
        process.env.REACT_APP_EMAILJS_SERVICE_ID,
        process.env.REACT_APP_EMAILJS_TEMPLATE_ID,
        {
          to_name: p.name, 
          to_email: p.email,
          certificate_url: `${window.location.origin}/certificate/${encodeURIComponent(p.name)}/${p.cert_date}`,
        },
        process.env.REACT_APP_EMAILJS_PUBLIC_KEY
      );
      await supabase.from('participants').update({ email_sent: true }).eq('id', p.id);
      fetchParticipants();
    } catch (e) { console.error("Email Error:", e); }
    setSending(null);
  };

  const handleSendAll = async () => {
    if (selectedFilter === 'all') return alert("Please select a specific Day filter first.");
    const targets = filtered.filter(p => !p.email_sent);
    if (targets.length === 0) return alert("All emails sent for this view!");
    if (!window.confirm(`Send ${targets.length} certificates?`)) return;

    setSendingAll(true);
    for (const p of targets) {
      await handleSendEmail(p);
      await new Promise(res => setTimeout(res, 1200)); 
    }
    setSendingAll(false);
    alert('Finished sending batch.');
  };

  const handleAdd = async () => {
    if (!name.trim() || !email.trim() || !trainingDay) return alert("Fill all fields");
    setAdding(true);
    await supabase.from('participants').insert([{
      name: name.trim().toUpperCase(), 
      email: email.trim().toLowerCase(), 
      cert_date: trainingDay,
      email_sent: false
    }]);
    setName(''); setEmail(''); setTrainingDay('');
    fetchParticipants();
    setAdding(false);
  };

  const filtered = participants.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.email.toLowerCase().includes(search.toLowerCase());
    const matchesDay = selectedFilter === 'all' || String(p.cert_date) === String(selectedFilter);
    return matchesSearch && matchesDay;
  });

  // --- LOGIN UI ---
  if (!authed) return (
    <div style={S.loginPage}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        .glass-card { animation: fadeIn 0.6s ease-out; background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.1); }
      `}</style>
      <div className="glass-card" style={S.loginCard}>
        <div style={{ marginBottom: 30 }}>
          <h1 style={{ color: '#fff', fontSize: '24px', margin: '0 0 8px 0' }}>Admin Portal</h1>
          <p style={{ color: '#8f9bba', fontSize: '14px', margin: 0 }}>DATA INSIGHTS 2026</p>
        </div>
        <input 
          style={S.loginInput} 
          type="password" 
          placeholder="Enter Password" 
          value={pw} 
          onChange={e => setPw(e.target.value)} 
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
        />
        <button style={S.loginBtn} onClick={handleLogin}>Unlock Dashboard</button>
      </div>
    </div>
  );

  // --- DASHBOARD UI ---
  return (
    <div style={S.page}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal { background: white; padding: 30px; border-radius: 16px; width: 90%; max-width: 400px; text-align: center; }
      `}</style>

      {/* DAY PICKER MODAL */}
      {showDayPicker && (
        <div className="overlay">
          <div className="modal">
            <h2 style={{color: '#1a1060', marginBottom: '10px'}}>Select Presentation Day</h2>
            <p style={{color: '#666', fontSize: '14px', marginBottom: '20px'}}>Which day's participants do you want to show?</p>
            <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
              {TRAINING_DAYS.map(day => (
                <button 
                  key={day.value} 
                  style={S.modalBtn}
                  onClick={() => navigate(`/presentation?day=${day.value}`)}
                >
                  {day.label}
                </button>
              ))}
              <button style={S.cancelBtn} onClick={() => setShowDayPicker(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <header style={S.header}>
        <div style={S.headerInner}>
          <h1 style={S.headerTitle}>🎓 Admin Dashboard</h1>
          <div style={{display: 'flex', gap: 10}}>
             <button style={S.presBtnInline} onClick={() => setShowDayPicker(true)}>
               📺 Start Presentation
             </button>
             <button style={S.refreshBtn} onClick={fetchParticipants}>
               <span style={loading ? S.spinning : {}}>🔄</span> Refresh
             </button>
             <button style={S.sendAllBtn} onClick={handleSendAll} disabled={sendingAll}>
               {sendingAll ? '⏳ Sending...' : '📧 Send All'}
             </button>
          </div>
        </div>
      </header>

      <main style={S.main}>
        <div style={S.card}>
          <h3 style={{marginTop: 0, color: '#1a1060', fontSize: '15px'}}>Manual Entry</h3>
          <div style={S.formRow}>
            <input style={S.input} placeholder="NAME" value={name} onChange={e => setName(e.target.value)} />
            <input style={S.input} placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
            <select style={S.select} value={trainingDay} onChange={e => setTrainingDay(e.target.value)}>
              <option value="">Select Day</option>
              {TRAINING_DAYS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
            <button style={S.btnPrimary} onClick={handleAdd}>{adding ? '...' : 'Add'}</button>
          </div>
        </div>

        <div style={S.card}>
          <div style={S.listHeader}>
            <div style={S.filterBar}>
              <button style={selectedFilter === 'all' ? S.filterBtnActive : S.filterBtn} onClick={() => setSelectedFilter('all')}>All</button>
              {TRAINING_DAYS.map(day => (
                <button key={day.value} style={selectedFilter === day.value ? S.filterBtnActive : S.filterBtn} onClick={() => setSelectedFilter(day.value)}>Day {day.value}</button>
              ))}
            </div>
            <input style={{...S.input, maxWidth: 220}} placeholder="🔍 Search..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          <table style={S.table}>
            <thead>
              <tr style={S.thRow}>{['#','Name','Email','Training Date','Status','Actions'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr key={p.id} style={i % 2 === 0 ? S.trEven : S.trOdd}>
                  <td style={S.td}>{i + 1}</td>
                  <td style={S.td}><b>{p.name}</b></td>
                  <td style={S.td}>{p.email}</td>
                  <td style={S.td}>{DAY_LABEL[String(p.cert_date)] || p.cert_date}</td>
                  <td style={S.td}>
                    <span style={p.email_sent ? S.badgeSent : S.badgePending}>{p.email_sent ? 'Sent' : 'Pending'}</span>
                  </td>
                  <td style={S.td}>
                    <button style={S.btnSend} onClick={() => handleSendEmail(p)} disabled={sending === p.id}>{sending === p.id ? '...' : 'Email'}</button>
                    <button style={S.btnDelete} onClick={async () => {if(window.confirm('Delete?')){await supabase.from('participants').delete().eq('id', p.id); fetchParticipants();}}}>🗑</button>
                  </td>
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
  // Login Styles
  loginPage: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#0a0a1a' },
  loginCard: { width: '360px', padding: '40px', borderRadius: '24px', textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' },
  loginInput: { width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', marginBottom: '20px', outline: 'none', textAlign: 'center' },
  loginBtn: { width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: '#4f46e5', color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' },

  // Modal Styles
  modalBtn: { padding: '12px', borderRadius: '8px', border: '1px solid #e0e0e0', background: '#fff', cursor: 'pointer', textAlign: 'left', fontWeight: '500', transition: '0.2s', ':hover': {background: '#f0f2f5'} },
  cancelBtn: { padding: '10px', marginTop: '10px', background: 'transparent', border: 'none', color: '#ff4d4f', cursor: 'pointer', fontWeight: '600' },

  // Dashboard Styles
  page: { minHeight: '100vh', background: '#f4f7fe', fontFamily: 'Inter, system-ui, sans-serif' },
  header: { background: '#1a1060', padding: '15px 40px', color: 'white' },
  headerInner: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', margin: '0 auto' },
  headerTitle: { fontSize: '18px', margin: 0, fontWeight: '600' },
  presBtnInline: { background: '#ffffff25', border: '1px solid #ffffff44', color: 'white', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' },
  refreshBtn: { background: '#ffffff15', border: '1px solid #ffffff33', color: 'white', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' },
  sendAllBtn: { background: '#c9a84c', color: '#1a1060', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' },
  main: { padding: '30px', maxWidth: '1200px', margin: '0 auto' },
  card: { background: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', marginBottom: '25px' },
  formRow: { display: 'flex', gap: '10px' },
  input: { padding: '12px', borderRadius: '8px', border: '1px solid #e0e0e0', flex: 1, fontSize: '14px' },
  select: { padding: '12px', borderRadius: '8px', border: '1px solid #e0e0e0', background: '#fff', fontSize: '14px' },
  btnPrimary: { background: '#1a1060', color: 'white', border: 'none', padding: '0 25px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
  filterBar: { display: 'flex', gap: '6px' },
  filterBtn: { background: '#f0f2f5', border: 'none', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', fontSize: '13px' },
  filterBtnActive: { background: '#1a1060', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', fontSize: '13px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thRow: { borderBottom: '2px solid #f0f0f0' },
  th: { textAlign: 'left', padding: '15px 12px', color: '#666', fontSize: '12px' },
  td: { padding: '15px 12px', borderBottom: '1px solid #f8f8f8', fontSize: '14px' },
  trEven: { background: '#ffffff' },
  trOdd: { background: '#fafafa' },
  badgeSent: { background: '#e6ffed', color: '#22863a', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' },
  badgePending: { background: '#fff9e6', color: '#b08800', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' },
  btnSend: { background: '#1a1060', color: 'white', border: 'none', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' },
  btnDelete: { background: 'none', border: 'none', color: '#ff4d4f', cursor: 'pointer', fontSize: '16px', marginLeft: '8px' },
  spinning: { display: 'inline-block', animation: 'spin 1s linear infinite' },
  listHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }
};
