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
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => authListener.subscription.unsubscribe();
  }, []);

  useEffect(() => { if (user) fetchParticipants(); }, [user]);

  const fetchParticipants = async () => {
    setLoading(true);
    const { data } = await supabase.from('participants').select('*').order('created_at', { ascending: false });
    if (data) setParticipants(data);
    setLoading(false);
  };

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email: emailLogin, password: pw });
    if (error) alert(error.message);
  };

  const handleLogout = async () => { await supabase.auth.signOut(); navigate('/'); };

  const handleSave = async () => {
    if (!name || !email || !trainingDay) return alert("Fill all fields");
    setAdding(true);
    
    // Normalize: Remove double spaces and force UPPERCASE
    const cleanName = name.trim().replace(/\s+/g, ' ').toUpperCase();
    const cleanEmail = email.trim().toLowerCase();

    const payload = { name: cleanName, email: cleanEmail, cert_date: trainingDay, role };

    if (editingId) {
      await supabase.from('participants').update(payload).eq('id', editingId);
      setEditingId(null);
    } else {
      await supabase.from('participants').insert([{ ...payload, email_sent: false }]);
    }

    setName(''); setEmail(''); setTrainingDay('');
    fetchParticipants();
    setAdding(false);
    notify("Saved!");
  };

  const sendIndividualEmail = async (p) => {
    setSendingStatus(p.id);
    try {
      emailjs.init(process.env.REACT_APP_EMAILJS_PUBLIC_KEY);
      const safeName = encodeURIComponent(p.name);
      await emailjs.send(
        process.env.REACT_APP_EMAILJS_SERVICE_ID,
        process.env.REACT_APP_EMAILJS_TEMPLATE_ID,
        {
          to_name: p.name,
          to_email: p.email,
          certificate_url: `${window.location.origin}/certificate/${safeName}/${p.cert_date}`
        }
      );
      await supabase.from('participants').update({ email_sent: true }).eq('id', p.id);
      notify("Sent!");
      fetchParticipants();
    } catch { notify("Failed", "error"); }
    setSendingStatus(null);
  };

  // ... (Keep your existing filtered/pagination logic and styles from the previous AdminPage code)
  // [Render logic same as before, just ensure handleSave and sendIndividualEmail are updated]
  return (
    // ... (Your Admin UI code)
    <div style={S.page}>
        {/* Full UI goes here */}
        <p>Admin is ready with normalized data handling.</p>
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

  modal: { background: '#fff', padding: '2rem', borderRadius: '20px', width: '340px' },

  toast: { position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', padding: '12px 24px', borderRadius: '8px', color: '#fff', fontWeight: 'bold', zIndex: 1000 }

};



const L = {

  container: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' },

  card: { backgroundColor: '#1e293b', padding: '3rem', borderRadius: '24px', textAlign: 'center', width: '100%', maxWidth: '380px' },

  iconBox: { width: '60px', height: '60px', background: '#3b82f6', borderRadius: '16px', display: 'grid', placeItems: 'center', color: '#fff', fontSize: '1.5rem', fontWeight: '800', margin: '0 auto 20px' },

  title: { color: '#ffffff', fontSize: '24px', margin: '0 0 8px' },

  subtitle: { color: '#94a3b8', fontSize: '14px', marginBottom: '30px' },

  label: { color: '#94a3b8', fontSize: '0.8rem', display: 'block', marginBottom: '8px' },

  input: { width: '100%', padding: '14px', borderRadius: '12px', background: '#0f172a', border: '1px solid #334155', color: '#fff', marginBottom: '20px' },

  button: { width: '100%', padding: '14px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }

};
