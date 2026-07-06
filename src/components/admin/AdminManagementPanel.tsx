import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Plus, Trash2, Edit2, Loader2, ShieldAlert, Check, X, Lock, Key, Eye, EyeOff } from 'lucide-react';
import { User } from '../../types';

const POSSIBLE_TABS = [
  { id: 'analytics', name: 'Platform Metrics (Analytics)' },
  { id: 'users', name: 'Player Database (Users)' },
  { id: 'transactions', name: 'Gateway Ledgers (Transactions)' },
  { id: 'matches', name: 'Match Settle Panel (Sportsbook)' },
  { id: 'promotions', name: 'Campaign Creator (Promos)' },
  { id: 'tickets', name: 'Support Tickets (Inbox)' },
  { id: 'support_channels', name: 'Support Channels (WhatsApp/TG)' },
  { id: 'sliders_notices', name: 'Sliders & Notices (Marquee)' },
  { id: 'settings', name: 'Platform Config (Settings)' }
];

export default function AdminManagementPanel() {
  const [admins, setAdmins] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'mod'>('mod');
  const [selectedTabs, setSelectedTabs] = useState<string[]>([]);
  const [isBlocked, setIsBlocked] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);

  // Notifications
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/admin/admins', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setAdmins(data);
      } else {
        const err = await res.json();
        setError(err.error || 'Failed to load system staff.');
      }
    } catch (e) {
      setError('Connection error loading admin list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleTabToggle = (tabId: string) => {
    if (selectedTabs.includes(tabId)) {
      setSelectedTabs(selectedTabs.filter(id => id !== tabId));
    } else {
      setSelectedTabs([...selectedTabs, tabId]);
    }
  };

  const handleSelectAll = () => {
    setSelectedTabs(POSSIBLE_TABS.map(t => t.id));
  };

  const handleClearAll = () => {
    setSelectedTabs([]);
  };

  const handleEditClick = (staff: User) => {
    setEditId(staff.id);
    setFullName(staff.fullName || '');
    setUsername(staff.username);
    setEmail(staff.email);
    setPhone(staff.phone || '');
    setRole(staff.role as 'admin' | 'mod');
    setSelectedTabs(staff.allowedTabs || []);
    setIsBlocked(staff.isBlocked || false);
    setPassword(''); // leave blank for edits
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const handleResetForm = () => {
    setEditId(null);
    setFullName('');
    setUsername('');
    setEmail('');
    setPhone('');
    setPassword('');
    setRole('mod');
    setSelectedTabs([]);
    setIsBlocked(false);
    setShowForm(false);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!editId && !password) {
      setError('Password is required for creating a new account.');
      return;
    }

    try {
      setSubmitting(true);

      if (editId) {
        // Edit PUT
        const res = await fetch(`/api/admin/admins/${editId}`, {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify({
            allowedTabs: selectedTabs,
            role,
            isBlocked
          })
        });
        const data = await res.json();
        if (res.ok) {
          setSuccess(data.message || 'Permissions updated!');
          handleResetForm();
          fetchAdmins();
        } else {
          setError(data.error || 'Failed to update admin account.');
        }
      } else {
        // Create POST
        const res = await fetch('/api/admin/admins', {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({
            fullName,
            username,
            email,
            phone,
            password,
            role,
            allowedTabs: selectedTabs
          })
        });
        const data = await res.json();
        if (res.ok) {
          setSuccess(data.message || 'New admin account successfully added!');
          handleResetForm();
          fetchAdmins();
        } else {
          setError(data.error || 'Failed to create admin account.');
        }
      }
    } catch (err) {
      setError('Connection error updating staff record.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this administrator/moderator account?')) return;
    try {
      setError('');
      setSuccess('');
      const res = await fetch(`/api/admin/admins/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(data.message || 'Deleted successfully!');
        fetchAdmins();
      } else {
        setError(data.error || 'Failed to delete account.');
      }
    } catch (err) {
      setError('Connection error deleting account.');
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-900">Admin Staff Management</h2>
          <p className="text-xs text-slate-500">Add secondary admins/moderators and restrict their visual and backend API access limits.</p>
        </div>
        {!showForm && (
          <button
            onClick={() => { setShowForm(true); setError(''); setSuccess(''); }}
            className="flex items-center space-x-1 bg-[#FF9F00] text-slate-950 px-3 py-1.5 rounded-lg text-xs font-black shadow-md shadow-[#FF9F00]/10 hover:opacity-90 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Add Admin / Mod</span>
          </button>
        )}
      </div>

      {/* WARNING NOTIFICATION */}
      <div className="bg-yellow-50 text-yellow-800 border border-yellow-100 p-3.5 rounded-xl text-xs font-medium flex items-start space-x-2.5">
        <ShieldAlert className="h-4.5 w-4.5 text-[#FF9F00] shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <div className="font-bold">Security Constraint Enforced:</div>
          <p className="text-slate-600">The Primary Admin account (admin) can only be created or modified directly in Firebase/database. Newly created moderators and secondary admins have their tab access checked on both the client dashboard and the server APIs.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 border border-red-100 p-3 rounded-xl text-xs font-semibold">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 text-emerald-600 border border-emerald-100 p-3 rounded-xl text-xs font-semibold">
          {success}
        </div>
      )}

      {/* CREATE / EDIT FORM */}
      {showForm && (
        <motion.form 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="bg-slate-50/80 p-5 rounded-xl border border-slate-200/60 space-y-4"
        >
          <div className="text-xs font-black text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-200 flex items-center space-x-1.5 font-mono">
            <Lock className="h-4 w-4 text-[#FF9F00]" />
            <span>{editId ? 'Modify Staff Record' : 'Register New Staff Member'}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 font-mono">Full Name</label>
              <input
                type="text"
                placeholder="e.g. Al-Amin Chowdhury"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full bg-white text-xs border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#FF9F00]"
                disabled={!!editId}
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 font-mono">Username</label>
              <input
                type="text"
                placeholder="e.g. amin_mod"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full bg-white text-xs border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#FF9F00]"
                disabled={!!editId}
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 font-mono">Email Address</label>
              <input
                type="email"
                placeholder="e.g. amin@betepro.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-white text-xs border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#FF9F00]"
                disabled={!!editId}
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 font-mono">Staff Role</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value as 'admin' | 'mod')}
                className="w-full bg-white text-xs border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#FF9F00]"
              >
                <option value="mod">Moderator (Mod)</option>
                <option value="admin">Secondary Admin (Admin)</option>
              </select>
            </div>

            {!editId && (
              <div className="relative">
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 font-mono">Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Set account password..."
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-white text-xs border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#FF9F00] pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-7.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            )}

            {editId && (
              <div className="flex items-center space-x-2 pt-6">
                <input
                  type="checkbox"
                  id="staff_blocked"
                  checked={isBlocked}
                  onChange={e => setIsBlocked(e.target.checked)}
                  className="rounded text-red-600 focus:ring-red-500"
                />
                <label htmlFor="staff_blocked" className="text-xs font-bold text-red-600">Block account from logging in</label>
              </div>
            )}
          </div>

          {/* PERMISSIONS TABS MATRIX */}
          <div className="space-y-2 pt-2 bg-white p-4 rounded-xl border border-slate-200/60 shadow-xs">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] font-black text-slate-600 uppercase font-mono">Allowed Panel Sections</label>
              <div className="flex space-x-2 text-[10px] font-bold text-[#FF9F00]">
                <button type="button" onClick={handleSelectAll} className="hover:underline">Select All</button>
                <span>•</span>
                <button type="button" onClick={handleClearAll} className="hover:underline">Clear All</button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
              {POSSIBLE_TABS.map(tab => {
                const isSelected = selectedTabs.includes(tab.id);
                return (
                  <button
                    type="button"
                    key={tab.id}
                    onClick={() => handleTabToggle(tab.id)}
                    className={`flex items-center justify-between text-left p-2 rounded-lg text-xs border transition ${
                      isSelected 
                        ? 'bg-amber-50/50 border-[#FF9F00] text-amber-900 font-bold' 
                        : 'bg-slate-50/50 border-slate-200/80 text-slate-600 hover:bg-slate-100/50'
                    }`}
                  >
                    <span>{tab.name}</span>
                    <div className={`h-4.5 w-4.5 rounded-full border flex items-center justify-center shrink-0 ml-2 ${
                      isSelected ? 'border-[#FF9F00] bg-[#FF9F00] text-slate-950' : 'border-slate-300'
                    }`}>
                      {isSelected && <Check className="h-3 w-3 stroke-[3px]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex space-x-2 justify-end pt-2">
            <button
              type="button"
              onClick={handleResetForm}
              className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center space-x-1.5 bg-[#FF9F00] text-slate-950 px-4 py-1.5 rounded-lg text-xs font-black shadow-md shadow-[#FF9F00]/10"
            >
              {submitting && <Loader2 className="h-3 w-3 animate-spin" />}
              <span>{editId ? 'Save Configuration' : 'Register Staff Member'}</span>
            </button>
          </div>
        </motion.form>
      )}

      {/* STAFF DIRECTORY LIST */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-[#FF9F00]" />
        </div>
      ) : admins.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-xs bg-white rounded-2xl border border-slate-200/80">
          No secondary staff members registered yet. Use "Add Admin / Mod" to build your team.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center space-x-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest font-mono">Staff Accounts Directory</h3>
          </div>

          <div className="divide-y divide-slate-100">
            {admins.map(staff => (
              <div key={staff.id} className="p-4 hover:bg-slate-50/50 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-black text-slate-900">{staff.fullName || 'Staff Account'}</span>
                    <span className="text-[10px] font-mono text-slate-400">@{staff.username}</span>
                    <span className={`text-[9px] font-black font-mono tracking-wider px-2 py-0.5 rounded ${
                      staff.role === 'admin' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    }`}>
                      {staff.role === 'admin' ? 'Secondary Admin' : 'Moderator'}
                    </span>
                    {staff.isBlocked && (
                      <span className="text-[9px] font-black font-mono tracking-wider px-2 py-0.5 rounded bg-red-50 text-red-600 border border-red-100">
                        BLOCKED
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
                    <span>Email: <span className="text-slate-800 font-medium">{staff.email}</span></span>
                    {staff.phone && <span>Phone: <span className="text-slate-800 font-medium">{staff.phone}</span></span>}
                  </div>

                  {/* DISPLAY ALLOWED SECTIONS */}
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="text-[10px] font-bold text-slate-400 font-mono mr-1">Sections:</span>
                    {(staff.allowedTabs || []).length === 0 ? (
                      <span className="text-[10px] text-slate-400 italic">No access granted</span>
                    ) : (
                      (staff.allowedTabs || []).map(t => (
                        <span key={t} className="text-[9px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                          {POSSIBLE_TABS.find(p => p.id === t)?.name.split(' (')[0] || t}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 justify-end shrink-0">
                  <button
                    onClick={() => handleEditClick(staff)}
                    className="flex items-center space-x-1 text-xs font-black text-[#FF9F00] px-2.5 py-1.5 rounded-lg border border-amber-200/60 hover:bg-amber-50 transition"
                  >
                    <Edit2 className="h-3 w-3" />
                    <span>Edit Staff</span>
                  </button>
                  <button
                    onClick={() => handleDelete(staff.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 transition hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
