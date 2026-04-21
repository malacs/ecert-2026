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

    setName('');
    setEmail('');
    setTrainingDay('');
    setRole('Student');

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

      setParticipants(prev =>
        prev.map(item => item.id === p.id ? { ...item, email_sent: true } : item)
      );

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

        await new Promise(res => setTimeout(res, 400)); // prevent rate limit

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

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedFilter, roleFilter]);

  if (!authed) return (
    <div style={S.loginPage}>
      <div style={S.loginCard}>
        <h2 style={{color:'#fff'}}>Admin Portal</h2>
        <input style={S.loginInput} type="password" value={pw} onChange={e=>setPw(e.target.value)} />
        <button style={S.loginBtn} onClick={handleLogin}>ENTER</button>
      </div>
    </div>
  );

  return (
    <div style={S.page}>
      <header style={S.header}>
        <h1>Admin Dashboard</h1>
        <div>
          <button onClick={() => setShowConfigModal(true)}>Presentation</button>
          <button onClick={() => {localStorage.clear(); window.location.reload();}}>Logout</button>
        </div>
      </header>

      <div style={S.card}>
        <input style={S.input} placeholder="Name" value={name} onChange={e=>setName(e.target.value)} />
        <input style={S.input} placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />

        <select value={trainingDay} onChange={e=>setTrainingDay(e.target.value)}>
          <option value="">Select Day</option>
          {TRAINING_DAYS.map(d=> <option key={d.value} value={d.value}>{d.label}</option>)}
        </select>

        <select value={role} onChange={e=>setRole(e.target.value)}>
          <option>Student</option>
          <option>Speaker</option>
        </select>

        <button onClick={handleAdd}>{adding ? '...' : 'Add'}</button>
      </div>

      <div style={S.card}>
        {/* STATS */}
        <div style={S.stats}>
          <span>Total: {filtered.length}</span>
          <span>Speakers: {filtered.filter(p=>p.role==='Speaker').length}</span>
          <span>Students: {filtered.filter(p=>p.role==='Student').length}</span>

          <button onClick={sendAllEmails} disabled={sendingAll}>
            {sendingAll ? 'Sending...' : 'Send All Emails'}
          </button>
        </div>

        <table style={S.table}>
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Role</th>
              <th>Email</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {currentItems.map((p,i)=>(
              <tr key={p.id}>
                <td>{((currentPage-1)*ITEMS_PER_PAGE)+i+1}</td>

                {editingId===p.id ? (
                  <>
                    <td><input value={editForm.name} onChange={e=>setEditForm({...editForm,name:e.target.value})} /></td>
                    <td>
                      <select value={editForm.role} onChange={e=>setEditForm({...editForm,role:e.target.value})}>
                        <option>Student</option>
                        <option>Speaker</option>
                      </select>
                    </td>
                    <td><input value={editForm.email} onChange={e=>setEditForm({...editForm,email:e.target.value})} /></td>
                    <td>
                      <select value={editForm.cert_date} onChange={e=>setEditForm({...editForm,cert_date:e.target.value})}>
                        {TRAINING_DAYS.map(d=><option key={d.value} value={d.value}>{d.label}</option>)}
                      </select>
                    </td>
                    <td>—</td>
                    <td><button onClick={()=>handleUpdate(p.id)}>Save</button></td>
                  </>
                ):(
                  <>
                    <td>{p.name}</td>
                    <td>{p.role}</td>
                    <td>{p.email}</td>
                    <td>{DAY_LABEL[p.cert_date]}</td>
                    <td>{p.email_sent?'Sent':'Pending'}</td>
                    <td>
                      <button onClick={()=>sendIndividualEmail(p)}>
                        {sendingStatus===p.id?'...':'Send'}
                      </button>
                      <button onClick={()=>{setEditingId(p.id);setEditForm(p);}}>Edit</button>
                      <button onClick={async()=>{if(window.confirm("Delete?")){await supabase.from('participants').delete().eq('id',p.id);fetchParticipants();}}}>Delete</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {/* PAGINATION */}
        <div style={S.pagination}>
          <button disabled={currentPage===1} onClick={()=>setCurrentPage(p=>p-1)}>Prev</button>
          <span>Page {currentPage}</span>
          <button disabled={currentPage>=Math.ceil(filtered.length/ITEMS_PER_PAGE)} onClick={()=>setCurrentPage(p=>p+1)}>Next</button>
        </div>
      </div>

      {/* PRESENTATION MODAL */}
      {showConfigModal && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <h3>Presentation Settings</h3>

            <select value={presDay} onChange={e=>setPresDay(e.target.value)}>
              {TRAINING_DAYS.map(d=><option key={d.value} value={d.value}>{d.label}</option>)}
            </select>

            <select value={presRole} onChange={e=>setPresRole(e.target.value)}>
              <option value="All">Everyone</option>
              <option value="Speaker">Speakers</option>
              <option value="Student">Students</option>
            </select>

            <button onClick={()=>navigate(`/presentation?day=${presDay}&role=${presRole}`)}>
              START
            </button>

            <button onClick={()=>setShowConfigModal(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

const S = {
  page:{padding:20},
  header:{display:'flex',justifyContent:'space-between'},
  card:{background:'#fff',padding:20,marginTop:20},
  input:{margin:5,padding:8},
  table:{width:'100%',marginTop:20},
  stats:{display:'flex',gap:15,alignItems:'center'},
  pagination:{marginTop:20,display:'flex',gap:10,justifyContent:'center'},
  overlay:{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.6)',display:'flex',justifyContent:'center',alignItems:'center'},
  modal:{background:'#fff',padding:20}
};
