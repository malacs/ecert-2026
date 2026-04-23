import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function AdminPage() {
  const navigate = useNavigate();
  const [participants, setParticipants] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', day: '1', role: 'Student' });
  const [filters, setFilters] = useState({ name: '', day: 'All', role: 'All' });

  useEffect(() => {
    fetchParticipants();
  }, []);

  const fetchParticipants = async () => {
    const { data } = await supabase.from('participants').select('*');
    setParticipants(data || []);
  };

  const handleAdd = async () => {
    if (!form.name || !form.email) return alert("Fill all fields");
    const { error } = await supabase.from('participants').insert([{
      name: form.name, email: form.email, cert_date: form.day, role: form.role, status: 'Pending'
    }]);
    if (!error) { fetchParticipants(); setForm({...form, name: '', email: ''}); }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  // Filter Logic
  const filteredList = participants.filter(p => {
    const nameMatch = p.name.toLowerCase().includes(filters.name.toLowerCase());
    const dayMatch = filters.day === 'All' || String(p.cert_date) === filters.day;
    const roleMatch = filters.role === 'All' || p.role === filters.role;
    return nameMatch && dayMatch && roleMatch;
  });

  // Stats Logic
  const stats = {
    total: filteredList.length,
    students: filteredList.filter(p => p.role === 'Student').length,
    speakers: filteredList.filter(p => p.role === 'Speaker').length
  };

  return (
    <div style={{ padding: '30px', fontFamily: 'Arial' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h1>Admin Dashboard</h1>
        <button onClick={logout} style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '10px' }}>Logout</button>
      </div>

      {/* Stats Section */}
      <div style={{ display: 'flex', gap: '20px', margin: '20px 0', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <div>Total: <strong>{stats.total}</strong></div>
        <div>Students: <strong>{stats.students}</strong></div>
        <div>Speakers: <strong>{stats.speakers}</strong></div>
      </div>

      {/* Add Section */}
      <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd' }}>
        <h3>Add New Participant</h3>
        <input placeholder="Full Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
        <input placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
        <select value={form.day} onChange={e => setForm({...form, day: e.target.value})}>
          {[1,2,3,4,5].map(d => <option key={d} value={d}>Day {d}</option>)}
        </select>
        <select value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
          <option value="Student">Student</option>
          <option value="Speaker">Speaker</option>
        </select>
        <button onClick={handleAdd} style={{ backgroundColor: '#007bff', color: 'white' }}>Add</button>
      </div>

      {/* Filter Section */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
        <input placeholder="Filter by Name" value={filters.name} onChange={e => setFilters({...filters, name: e.target.value})} />
        <select onChange={e => setFilters({...filters, day: e.target.value})}>
          <option value="All">All Days</option>
          {[1,2,3,4,5].map(d => <option key={d} value={d}>Day {d}</option>)}
        </select>
        <select onChange={e => setFilters({...filters, role: e.target.value})}>
          <option value="All">All Roles</option>
          <option value="Student">Student</option>
          <option value="Speaker">Speaker</option>
        </select>
      </div>

      {/* Table */}
      <table border="1" width="100%" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#eee' }}>
            <th>Name</th><th>Email</th><th>Day</th><th>Role</th><th>Status</th><th>Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredList.map(p => (
            <tr key={p.id}>
              <td>{p.name}</td><td>{p.email}</td><td>{p.cert_date}</td><td>{p.role}</td>
              <td>{p.status}</td>
              <td>
                {p.status === 'Pending' && <button style={{ backgroundColor: '#17a2b8', color: 'white' }}>Send Email</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
