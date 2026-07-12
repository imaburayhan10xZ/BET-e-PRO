/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Plus, Trash2, Edit2, Loader2, ShieldAlert, Check, X, Lock, Key, Eye, EyeOff, Users, ChevronRight } from 'lucide-react';
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

  // Popup Trigger
  const [showFormModal, setShowFormModal] = useState(false);

  // Form State
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
    setShowFormModal(true);
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
    setShowFormModal(false);
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
          setTimeout(() => setSuccess(''), 1500);
        } else {
          setError(data.error || 'Failed to update admin account.');
        }
      } else {
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
          setTimeout(() => setSuccess(''), 1500);
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
        setTimeout(() => setSuccess(''), 1500);
      } else {
        setError(data.error || 'Failed to delete account.');
      }
    } catch (err) {
      setError('Connection error deleting account.');
    }
  };

  return (
    <div className="space-y-4 text-xs">
      {/* HEADER ACTION BAR */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100">
        <div className="flex items-center space-x-2.5">
          <Users className="h-4.5 w-4.5 text-[#FF9F00]" />
          <div>
            <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider">Admin Staff Management</h3>
            <span className="text-[10px] text-slate-400 font-bold">Restrict backend API access and visual tabs</span>
          </div>
        </div>

        <button
          onClick={() => { handleResetForm(); setShowFormModal(true); }}
          className="flex items-center space-x-1.5 bg-slate-900 hover:bg-[#FF9F00] text-white hover:text-slate-950 px-4 py-2.5 rounded-xl text-xs font-black transition tracking-wider uppercase shadow-xs cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Add Admin / Mod</span>
        </button>
      </div>

      {/* SECURITY CONSTRAINTS INFO HEADER */}
      <div className="bg-amber-50 text-amber-800 border border-amber-100/60 p-4 rounded-2xl font-medium flex items-start space-x-3">
        <ShieldAlert className="h-4.5 w-4.5 text-[#FF9F00] shrink-0 mt-0.5 animate-pulse" />
        <div className="space-y-0.5">
          <div className="font-extrabold text-[11px] uppercase tracking-wider">Access Security Constraint Enforced</div>
          <p className="text-slate-600 leading-relaxed text-[10.5px]">The primary administrative node (admin) has locked authorizations. Newly registered secondary admin and moderator channels have their individual tab access restrictions checked on both dashboard visual blocks and secure API routes.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 border border-red-100 p-3 rounded-xl font-semibold">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 text-emerald-600 border border-emerald-100 p-3 rounded-xl font-semibold">
          {success}
        </div>
      )}

      {/* STAFF CARDS DIRECTORY */}
      {loading ? (
        <div className="flex justify-center items-center py-12 bg-white rounded-2xl border border-slate-100">
          <Loader2 className="h-6 w-6 animate-spin text-[#FF9F00]" />
        </div>
      ) : admins.length === 0 ? (
        <div className="text-center py-12 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
          No secondary staff members registered yet. Use "Add Admin / Mod" to build your team.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {admins.map(staff => (
            <div 
              key={staff.id} 
              onClick={() => handleEditClick(staff)}
              className="cursor-pointer group bg-white rounded-2xl border border-slate-200/80 p-4.5 flex flex-col justify-between space-y-3.5 hover:border-[#FF9F00] transition duration-150"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-black text-slate-900">{staff.fullName || 'Staff Account'}</span>
                      <span className="text-[10px] font-mono text-slate-400">@{staff.username}</span>
                    </div>
                    <span className={`inline-block text-[9px] font-black font-mono tracking-wider px-2 py-0.5 rounded ${
                      staff.role === 'admin' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    }`}>
                      {staff.role === 'admin' ? 'Secondary Admin' : 'Moderator'}
                    </span>
                    {staff.isBlocked && (
                      <span className="inline-block ml-1.5 text-[9px] font-black font-mono tracking-wider px-2 py-0.5 rounded bg-red-50 text-red-600 border border-red-100">
                        BLOCKED
                      </span>
                    )}
                  </div>

                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(staff.id); }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 transition bg-white border border-slate-100 hover:bg-slate-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500 font-medium pt-1 border-t border-slate-50">
                  <span>Email: <strong className="text-slate-700 font-semibold">{staff.email}</strong></span>
                  {staff.phone && <span>Phone: <strong className="text-slate-700 font-semibold">{staff.phone}</strong></span>}
                </div>

                {/* DISPLAY ALLOWED SECTIONS */}
                <div className="flex flex-wrap items-center gap-1 pt-1">
                  <span className="text-[9.5px] font-bold text-slate-400 font-mono mr-1">Allowed Tabs:</span>
                  {(staff.allowedTabs || []).length === 0 ? (
                    <span className="text-[10px] text-slate-400 italic">No access granted</span>
                  ) : (
                    (staff.allowedTabs || []).map(t => (
                      <span key={t} className="text-[9px] font-black bg-slate-50 text-slate-500 border border-slate-200/40 px-1.5 py-0.5 rounded">
                        {POSSIBLE_TABS.find(p => p.id === t)?.name.split(' (')[0] || t}
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end items-center text-[10px] font-bold text-slate-400 font-mono">
                <span className="text-[#FF9F00] group-hover:underline flex items-center space-x-0.5">
                  <span>Manage Permissions</span>
                  <ChevronRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* -------------------- POPUP: STAFF REGISTER/MODIFY MODAL -------------------- */}
      <AnimatePresence>
        {showFormModal && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleResetForm}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="bg-slate-950 text-white p-5 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-slate-900 rounded-xl text-[#FF9F00] border border-slate-800 animate-pulse">
                    <Lock className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 font-mono">Staff Authority Panel</span>
                    <h4 className="text-[12.5px] font-black text-white">
                      {editId ? 'Modify Staff Record & Allowed Tabs' : 'Register New Staff Member'}
                    </h4>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition border border-white/10"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 bg-slate-50/40 text-xs">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[9.5px] font-bold text-slate-400 uppercase mb-1 font-mono">Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Al-Amin Chowdhury"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      className="w-full bg-white text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-[#FF9F00]"
                      disabled={!!editId}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[9.5px] font-bold text-slate-400 uppercase mb-1 font-mono">Username</label>
                    <input
                      type="text"
                      placeholder="e.g. amin_mod"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      className="w-full bg-white text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-[#FF9F00]"
                      disabled={!!editId}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[9.5px] font-bold text-slate-400 uppercase mb-1 font-mono">Email Address</label>
                    <input
                      type="email"
                      placeholder="e.g. amin@betepro.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full bg-white text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-[#FF9F00]"
                      disabled={!!editId}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[9.5px] font-bold text-slate-400 uppercase mb-1 font-mono">Staff Role</label>
                    <select
                      value={role}
                      onChange={e => setRole(e.target.value as 'admin' | 'mod')}
                      className="w-full bg-white text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-[#FF9F00] font-semibold"
                    >
                      <option value="mod">Moderator (Mod)</option>
                      <option value="admin">Secondary Admin (Admin)</option>
                    </select>
                  </div>

                  {!editId && (
                    <div className="relative">
                      <label className="block text-[9.5px] font-bold text-slate-400 uppercase mb-1 font-mono">Password</label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Set account password..."
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full bg-white text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-[#FF9F00] pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-7.5 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  )}

                  {editId && (
                    <div className="flex items-center space-x-2 pt-6">
                      <input
                        type="checkbox"
                        id="staff_blocked_popup"
                        checked={isBlocked}
                        onChange={e => setIsBlocked(e.target.checked)}
                        className="rounded text-red-600 focus:ring-red-500 h-4 w-4 border-slate-300"
                      />
                      <label htmlFor="staff_blocked_popup" className="text-xs font-extrabold text-red-600 uppercase">Suspend Login Access</label>
                    </div>
                  )}
                </div>

                {/* PERMISSIONS TABS MATRIX */}
                <div className="space-y-2 pt-2 bg-white p-4 rounded-2xl border border-slate-200/60 shadow-xs">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                    <label className="block text-[10px] font-black text-slate-600 uppercase font-mono">Allowed Panel Sections</label>
                    <div className="flex space-x-2 text-[10px] font-bold text-[#FF9F00]">
                      <button type="button" onClick={handleSelectAll} className="hover:underline">Select All</button>
                      <span>•</span>
                      <button type="button" onClick={handleClearAll} className="hover:underline">Clear All</button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {POSSIBLE_TABS.map(tab => {
                      const isSelected = selectedTabs.includes(tab.id);
                      return (
                        <button
                          type="button"
                          key={tab.id}
                          onClick={() => handleTabToggle(tab.id)}
                          className={`flex items-center justify-between text-left p-2 rounded-xl text-xs border transition ${
                            isSelected 
                              ? 'bg-amber-50/50 border-[#FF9F00] text-amber-900 font-bold' 
                              : 'bg-slate-50/50 border-slate-200/80 text-slate-600 hover:bg-slate-100/50'
                          }`}
                        >
                          <span>{tab.name.split(' (')[0]}</span>
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

                <div className="flex space-x-2 justify-end pt-3 border-t border-slate-150">
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="py-2.5 px-4 rounded-xl text-[10px] font-bold border border-slate-200 text-slate-500 hover:bg-slate-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="py-2.5 px-5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-slate-900 hover:bg-[#FF9F00] text-white hover:text-slate-950 transition flex items-center space-x-1.5"
                  >
                    {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    <span>{editId ? 'Save Configuration' : 'Register Staff Member'}</span>
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
