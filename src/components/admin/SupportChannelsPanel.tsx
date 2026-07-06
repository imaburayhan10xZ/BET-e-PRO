import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Phone, Send, MessageSquare, Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Loader2, Link2 } from 'lucide-react';
import { SupportChannel } from '../../types';

export default function SupportChannelsPanel() {
  const [channels, setChannels] = useState<SupportChannel[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Form State
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [link, setLink] = useState('');
  const [icon, setIcon] = useState('Phone');
  const [active, setActive] = useState(true);
  const [showForm, setShowForm] = useState(false);
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
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const handleResetForm = () => {
    setEditId(null);
    setName('');
    setLink('');
    setIcon('Phone');
    setActive(true);
    setShowForm(false);
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-900">Support Channels</h2>
          <p className="text-xs text-slate-500">Configure public support links like WhatsApp, Telegram, or Live Chat.</p>
        </div>
        {!showForm && (
          <button
            onClick={() => { setShowForm(true); setError(''); setSuccess(''); }}
            className="flex items-center space-x-1 bg-[#FF9F00] text-slate-950 px-3 py-1.5 rounded-lg text-xs font-black shadow-md shadow-[#FF9F00]/10 hover:opacity-90 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Add Channel</span>
          </button>
        )}
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

      {showForm && (
        <motion.form 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/60 space-y-4"
        >
          <div className="text-xs font-bold text-slate-700 pb-1 border-b border-slate-200">
            {editId ? 'Edit Support Channel' : 'Create New Support Channel'}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1 font-mono">Channel Name *</label>
              <input
                type="text"
                placeholder="e.g. WhatsApp Support"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-white text-xs border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#FF9F00]"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1 font-mono">Link URL *</label>
              <input
                type="text"
                placeholder="e.g. https://wa.me/8801700..."
                value={link}
                onChange={e => setLink(e.target.value)}
                className="w-full bg-white text-xs border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#FF9F00]"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1 font-mono">Icon Design</label>
              <select
                value={icon}
                onChange={e => setIcon(e.target.value)}
                className="w-full bg-white text-xs border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#FF9F00]"
              >
                <option value="Phone">WhatsApp (Phone)</option>
                <option value="Send">Telegram (Send)</option>
                <option value="MessageSquare">Live Chat (Message)</option>
              </select>
            </div>

            <div className="flex items-center space-x-2 pt-6">
              <input
                type="checkbox"
                id="channel_active"
                checked={active}
                onChange={e => setActive(e.target.checked)}
                className="rounded text-[#FF9F00] focus:ring-[#FF9F00]"
              />
              <label htmlFor="channel_active" className="text-xs font-bold text-slate-700">Display publicly to players</label>
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
              <span>{editId ? 'Save Changes' : 'Publish Channel'}</span>
            </button>
          </div>
        </motion.form>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-[#FF9F00]" />
        </div>
      ) : channels.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-xs">
          No support channels configured. Click "Add Channel" to create one.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {channels.map(c => (
            <div 
              key={c.id} 
              className={`p-4 rounded-xl border transition ${
                c.active ? 'bg-white border-slate-200/80 shadow-sm' : 'bg-slate-50/60 border-dashed border-slate-200 text-slate-400'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${c.active ? 'bg-slate-50' : 'bg-slate-100'}`}>
                    {renderIcon(c.icon)}
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900">{c.name}</h3>
                    <div className="flex items-center text-[10px] text-slate-500 font-mono mt-0.5 truncate max-w-[150px]">
                      <Link2 className="h-3 w-3 mr-0.5" />
                      <a href={c.link} target="_blank" rel="noreferrer" className="hover:underline">{c.link}</a>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleToggle(c.id)}
                    title={c.active ? 'Hide from players' : 'Show to players'}
                    className="p-1 text-slate-400 hover:text-slate-900 transition"
                  >
                    {c.active ? <ToggleRight className="h-5 w-5 text-emerald-500" /> : <ToggleLeft className="h-5 w-5 text-slate-300" />}
                  </button>
                  <button
                    onClick={() => handleEditClick(c)}
                    title="Edit channel details"
                    className="p-1 text-slate-400 hover:text-blue-600 transition"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    title="Delete channel"
                    className="p-1 text-slate-400 hover:text-red-600 transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
