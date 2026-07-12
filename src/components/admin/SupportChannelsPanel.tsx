/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Phone, Send, MessageSquare, Plus, Edit2, Trash2, ToggleLeft, ToggleRight, 
  Loader2, Link2, X, AlertCircle, Check, ChevronRight, HelpCircle
} from 'lucide-react';
import { SupportChannel } from '../../types';

export default function SupportChannelsPanel() {
  const [channels, setChannels] = useState<SupportChannel[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Popup Trigger
  const [showFormModal, setShowFormModal] = useState(false);

  // Form State
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [link, setLink] = useState('');
  const [icon, setIcon] = useState('Phone');
  const [active, setActive] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const fetchChannels = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/support-channels', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setChannels(data);
      } else {
        const err = await res.json();
        setError(err.error || 'Failed to fetch channels.');
      }
    } catch (e) {
      setError('Connection error fetching channels.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChannels();
  }, []);

  const handleEditClick = (c: SupportChannel) => {
    setEditId(c.id);
    setName(c.name);
    setLink(c.link);
    setIcon(c.icon);
    setActive(c.active);
    setShowFormModal(true);
    setError('');
    setSuccess('');
  };

  const handleResetForm = () => {
    setEditId(null);
    setName('');
    setLink('');
    setIcon('Phone');
    setActive(true);
    setShowFormModal(false);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !link.trim()) {
      setError('Name and Link are required.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      const body = editId 
        ? { id: editId, name, link, icon, active }
        : { name, link, icon, active };

      const res = await fetch('/api/admin/support-channels', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(data.message);
        handleResetForm();
        fetchChannels();
        setTimeout(() => {
          setSuccess('');
        }, 1500);
      } else {
        setError(data.error || 'Failed to save channel.');
      }
    } catch (err) {
      setError('Connection error saving support channel.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      setError('');
      setSuccess('');
      const res = await fetch(`/api/admin/support-channels/${id}/toggle`, {
        method: 'PUT',
        headers: getHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(data.message);
        fetchChannels();
        setTimeout(() => {
          setSuccess('');
        }, 1500);
      } else {
        setError(data.error || 'Failed to toggle status.');
      }
    } catch (err) {
      setError('Connection error toggling status.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this support channel?')) return;
    try {
      setError('');
      setSuccess('');
      const res = await fetch(`/api/admin/support-channels/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(data.message);
        fetchChannels();
        setTimeout(() => {
          setSuccess('');
        }, 1500);
      } else {
        setError(data.error || 'Failed to delete channel.');
      }
    } catch (err) {
      setError('Connection error deleting channel.');
    }
  };

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'Phone': return <Phone className="h-5 w-5 text-emerald-500" />;
      case 'Send': return <Send className="h-5 w-5 text-sky-500" />;
      case 'MessageSquare': return <MessageSquare className="h-5 w-5 text-indigo-500" />;
      default: return <Phone className="h-5 w-5 text-emerald-500" />;
    }
  };

  return (
    <div className="space-y-4 text-xs">
      
      {/* Top action header bar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100">
        <div className="flex items-center space-x-2.5">
          <HelpCircle className="h-4.5 w-4.5 text-[#FF9F00]" />
          <div>
            <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider">Gateway Support Nodes</h3>
            <span className="text-[10px] text-slate-400 font-bold">Configure client help desk hotlines</span>
          </div>
        </div>

        <button
          onClick={() => { handleResetForm(); setShowFormModal(true); }}
          className="flex items-center space-x-1.5 bg-slate-900 hover:bg-[#FF9F00] text-white hover:text-slate-950 px-4 py-2.5 rounded-xl text-xs font-black transition tracking-wider uppercase shadow-xs cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Add Support Helpline</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 border border-red-100 p-3 rounded-xl font-semibold flex items-center space-x-2">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 text-emerald-600 border border-emerald-100 p-3 rounded-xl font-semibold flex items-center space-x-2">
          <Check className="h-4 w-4" />
          <span>{success}</span>
        </div>
      )}

      {/* Main List Layout */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-[#FF9F00]" />
        </div>
      ) : channels.length === 0 ? (
        <div className="text-center py-12 bg-white border border-dashed border-slate-200 rounded-2xl text-slate-400">
          No support channels configured. Click "Add Support Helpline" to build one.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {channels.map(c => (
            <div 
              key={c.id} 
              onClick={() => handleEditClick(c)}
              className={`cursor-pointer group p-4.5 rounded-2xl border transition hover:border-[#FF9F00] flex flex-col justify-between space-y-3.5 ${
                c.active ? 'bg-white border-slate-200/80 shadow-xs' : 'bg-slate-50/60 border-dashed border-slate-200 text-slate-400'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2.5 rounded-xl ${c.active ? 'bg-slate-50 border border-slate-100' : 'bg-slate-100'}`}>
                    {renderIcon(c.icon)}
                  </div>
                  <div>
                    <h3 className="text-[12px] font-black text-slate-900 group-hover:text-[#FF9F00] transition">{c.name}</h3>
                    <div className="flex items-center text-[10px] text-slate-400 font-mono mt-1 max-w-[150px] truncate">
                      <Link2 className="h-3 w-3 mr-0.5 text-slate-300" />
                      <span className="truncate">{c.link}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-1" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => handleToggle(c.id)}
                    title={c.active ? 'Hide from players' : 'Show to players'}
                    className="p-1 text-slate-400 hover:text-slate-900 transition"
                  >
                    {c.active ? <ToggleRight className="h-5 w-5 text-emerald-500" /> : <ToggleLeft className="h-5 w-5 text-slate-300" />}
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    title="Delete channel"
                    className="p-1.5 text-slate-400 hover:text-red-600 transition bg-white border border-slate-200 rounded-lg shadow-xs"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end items-center text-[10px] font-bold text-slate-400 font-mono">
                <span className="text-[#FF9F00] group-hover:underline flex items-center space-x-0.5">
                  <span>Manage Helpline</span>
                  <ChevronRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* -------------------- POPUP: HELPLINE BUILDER MODAL -------------------- */}
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
              className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col"
            >
              <div className="bg-slate-950 text-white p-5 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-slate-900 rounded-xl text-[#FF9F00] border border-slate-800 animate-pulse">
                    <Plus className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 font-mono font-bold">Helpline system</span>
                    <h4 className="text-[12.5px] font-black text-white">
                      {editId ? 'Modify Support Helpline' : 'Publish Support Helpline'}
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

              <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-slate-50/40 text-xs">
                
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase">Channel Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. WhatsApp Support"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-white text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-[#FF9F00]"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase">Link URL *</label>
                  <input
                    type="text"
                    placeholder="e.g. https://wa.me/8801700..."
                    value={link}
                    onChange={e => setLink(e.target.value)}
                    className="w-full bg-white text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-[#FF9F00]"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase">Icon Design</label>
                    <select
                      value={icon}
                      onChange={e => setIcon(e.target.value)}
                      className="w-full bg-white text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-[#FF9F00]"
                    >
                      <option value="Phone">WhatsApp (Phone)</option>
                      <option value="Send">Telegram (Send)</option>
                      <option value="MessageSquare">Live Chat (Message)</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-2 pt-5">
                    <input
                      type="checkbox"
                      id="channel_active_popup"
                      checked={active}
                      onChange={e => setActive(e.target.checked)}
                      className="rounded text-[#FF9F00] h-4 w-4 border-slate-300 focus:ring-[#FF9F00]"
                    />
                    <label htmlFor="channel_active_popup" className="text-[11px] font-bold text-slate-600">Display Live</label>
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
                    <span>{editId ? 'Save Changes' : 'Publish Helpline'}</span>
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
