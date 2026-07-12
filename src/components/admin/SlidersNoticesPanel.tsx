/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Image as ImageIcon, Plus, Edit2, Trash2, ToggleLeft, ToggleRight, 
  Loader2, Megaphone, Check, AlertCircle, X, ChevronRight, LayoutGrid, FileEdit
} from 'lucide-react';
import { BannerSlider, SystemSettings } from '../../types';

export default function SlidersNoticesPanel() {
  const [banners, setBanners] = useState<BannerSlider[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [bannerSaving, setBannerSaving] = useState(false);

  // Popup Triggers
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [showBannerFormModal, setShowBannerFormModal] = useState(false);

  // Notice Form State
  const [marqueeNotice, setMarqueeNotice] = useState('');

  // Banner Form State
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [linkTab, setLinkTab] = useState('dashboard');
  const [buttonText, setButtonText] = useState('Explore');
  const [active, setActive] = useState(true);
  const [isImageOnly, setIsImageOnly] = useState(false);

  // Status logs
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('File size too large. Maximum 10MB allowed.');
      return;
    }

    const reader = new FileReader();
    reader.onloadstart = () => {
      setIsUploading(true);
      setError('');
      setSuccess('');
    };
    reader.onload = async () => {
      try {
        const base64Str = reader.result as string;
        const token = localStorage.getItem('token');
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ image: base64Str })
        });
        const data = await res.json();
        if (res.ok) {
          setImage(data.imageUrl);
          setSuccess('Image uploaded to Cloudinary successfully!');
        } else {
          setError(data.error || 'Failed to upload image to Cloudinary.');
        }
      } catch (err: any) {
        console.error('[UPLOAD_ERROR]', err);
        setError('Network error uploading image.');
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch settings
      const settingsRes = await fetch('/api/settings');
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setSettings(settingsData);
        setMarqueeNotice(settingsData.marqueeNotice || '');
      }

      // Fetch banners
      const bannersRes = await fetch('/api/admin/banners', { headers: getHeaders() });
      if (bannersRes.ok) {
        const bannersData = await bannersRes.json();
        setBanners(bannersData);
      }
    } catch (e) {
      setError('Connection error loading banner data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSettingsSaving(true);
      setError('');
      setSuccess('');

      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ marqueeNotice })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess('Marquee announcement notice updated successfully!');
        if (data.settings) {
          setSettings(data.settings);
        }
        setTimeout(() => {
          setShowNoticeModal(false);
          setSuccess('');
        }, 1200);
      } else {
        setError(data.error || 'Failed to update notice.');
      }
    } catch (err) {
      setError('Connection error saving marquee notice.');
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleEditBanner = (b: BannerSlider) => {
    setEditId(b.id);
    setTitle(b.title || '');
    setSubtitle(b.subtitle || '');
    setDescription(b.description || '');
    setImage(b.image || '');
    setLinkTab(b.linkTab || 'dashboard');
    setButtonText(b.buttonText || 'Explore');
    setActive(b.active);
    setIsImageOnly(!!b.isImageOnly);
    setShowBannerFormModal(true);
    setError('');
    setSuccess('');
  };

  const handleResetForm = () => {
    setEditId(null);
    setTitle('');
    setSubtitle('');
    setDescription('');
    setImage('');
    setLinkTab('dashboard');
    setButtonText('Explore');
    setActive(true);
    setIsImageOnly(false);
    setShowBannerFormModal(false);
    setError('');
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isImageOnly) {
      if (!image.trim()) {
        setError('Image URL is required for image-only slides.');
        return;
      }
    } else {
      if (!title.trim() || !description.trim()) {
        setError('Title and Description are required for text-based promotional slides.');
        return;
      }
    }
    try {
      setBannerSaving(true);
      setError('');
      setSuccess('');

      const body = editId 
        ? { id: editId, title, subtitle, description, image, linkTab, buttonText, active, isImageOnly }
        : { title, subtitle, description, image, linkTab, buttonText, active, isImageOnly };

      const res = await fetch('/api/admin/banners', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(data.message);
        handleResetForm();
        loadData();
        setTimeout(() => {
          setSuccess('');
        }, 1500);
      } else {
        setError(data.error || 'Failed to save banner.');
      }
    } catch (err) {
      setError('Connection error saving banner slide.');
    } finally {
      setBannerSaving(false);
    }
  };

  const handleToggleBanner = async (id: string) => {
    try {
      setError('');
      setSuccess('');
      const res = await fetch(`/api/admin/banners/${id}/toggle`, {
        method: 'PUT',
        headers: getHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(data.message);
        loadData();
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

  const handleDeleteBanner = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this banner slide?')) return;
    try {
      setError('');
      setSuccess('');
      const res = await fetch(`/api/admin/banners/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(data.message);
        loadData();
        setTimeout(() => {
          setSuccess('');
        }, 1500);
      } else {
        setError(data.error || 'Failed to delete banner.');
      }
    } catch (err) {
      setError('Connection error deleting banner.');
    }
  };

  return (
    <div className="space-y-6 text-xs">
      
      {/* Dynamic Feedback Toasters */}
      {error && (
        <div className="bg-red-50 text-red-600 border border-red-100 p-3 rounded-xl font-semibold flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 text-emerald-600 border border-emerald-100 p-3 rounded-xl font-semibold flex items-center space-x-2">
          <Check className="h-4 w-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Grid Launcher menu of system options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Launch Button Option 1: Marquee */}
        <div 
          onClick={() => { setShowNoticeModal(true); setError(''); setSuccess(''); }}
          className="cursor-pointer bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs hover:border-[#FF9F00] transition duration-150 flex items-center justify-between"
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-amber-50 rounded-xl text-[#FF9F00] border border-amber-100/40">
              <Megaphone className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 font-mono">Live ticker</span>
              <h4 className="text-[12px] font-black text-slate-800">Update Announcement Board</h4>
              <p className="text-[10px] text-slate-400 truncate max-w-[200px] mt-0.5">
                {settings?.marqueeNotice || 'Welcome to Betepro! Play live...'}
              </p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-400 shrink-0 ml-4" />
        </div>

        {/* Launch Button Option 2: Add slide */}
        <div 
          onClick={() => { handleResetForm(); setShowBannerFormModal(true); }}
          className="cursor-pointer bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs hover:border-[#FF9F00] transition duration-150 flex items-center justify-between"
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-slate-100 rounded-xl text-slate-800 border border-slate-200/40">
              <ImageIcon className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 font-mono">Carousel slide</span>
              <h4 className="text-[12px] font-black text-slate-800">Add Carousel Banner Slide</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Configure text overlays or design slides.</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-400 shrink-0 ml-4" />
        </div>

      </div>

      {/* CAROUSEL BANNERS LISTING */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 pb-2.5 border-b border-slate-100">
          <LayoutGrid className="h-4.5 w-4.5 text-[#FF9F00]" />
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider font-mono">Carousel Sliders Gallery</h3>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-[#FF9F00]" />
          </div>
        ) : banners.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            No image sliders configured. Click "Add Carousel Banner Slide" to publish your first one.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {banners.map(b => (
              <div 
                key={b.id}
                onClick={() => handleEditBanner(b)}
                className={`cursor-pointer group p-4.5 rounded-2xl border transition hover:border-[#FF9F00] flex flex-col justify-between space-y-3 ${
                  b.active ? 'bg-slate-50/50 border-slate-200/80 shadow-xs' : 'bg-slate-50/20 border-dashed border-slate-200 text-slate-400'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    {b.isImageOnly ? (
                      <span className="text-[9px] font-black tracking-wider uppercase font-mono px-2 py-0.5 rounded bg-amber-500 text-slate-950">
                        IMAGE ONLY BANNER
                      </span>
                    ) : (
                      <span className="text-[9px] font-black tracking-wider uppercase font-mono px-2 py-0.5 rounded bg-slate-900 text-white">
                        {b.subtitle || 'PROMO'}
                      </span>
                    )}
                    
                    <div className="flex items-center space-x-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleToggleBanner(b.id)}
                        title={b.active ? 'Hide from carousel' : 'Show in carousel'}
                        className="p-1 text-slate-400 hover:text-slate-950 transition"
                      >
                        {b.active ? <ToggleRight className="h-5 w-5 text-emerald-500" /> : <ToggleLeft className="h-5 w-5 text-slate-300" />}
                      </button>
                      <button
                        onClick={() => handleDeleteBanner(b.id)}
                        title="Delete banner"
                        className="p-1.5 text-slate-400 hover:text-red-600 transition bg-white border border-slate-200 rounded-lg shadow-xs"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <h4 className="text-[12px] font-black text-slate-800 group-hover:text-[#FF9F00] transition">
                    {b.isImageOnly ? 'IMAGE ONLY BANNER SLIDE' : b.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                    {b.isImageOnly ? 'Displays design asset without overlapping text.' : b.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[10px] font-semibold text-slate-400 font-mono">
                  <span>Redirects: {b.linkTab}</span>
                  <span className="text-[#FF9F00] font-black group-hover:underline flex items-center space-x-0.5">
                    <span>Manage Details</span>
                    <ChevronRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* -------------------- POPUP 1: UPDATE MARQUEE ANNOUNCEMENT MODAL -------------------- */}
      <AnimatePresence>
        {showNoticeModal && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNoticeModal(false)}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col"
            >
              <div className="bg-slate-950 text-white p-5 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-slate-900 rounded-xl text-[#FF9F00] border border-slate-800">
                    <Megaphone className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 font-mono">Marquee Board</span>
                    <h4 className="text-[13px] font-black text-white">Live Announcement Board</h4>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNoticeModal(false)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition border border-white/10"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              <form onSubmit={handleSaveNotice} className="p-6 space-y-4 bg-slate-50/40 text-xs">
                <p className="text-slate-500 text-[11px] leading-relaxed pb-2 border-b border-slate-100">
                  Update the global sliding marquee ticker text. Supports Bangla and customized announcement tags.
                </p>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Ticker Notice Text</label>
                  <textarea
                    rows={4}
                    placeholder="e.g. 🎁 BETEPRO-তে স্বাগতম! নগদের মাধ্যমে..."
                    value={marqueeNotice}
                    onChange={e => setMarqueeNotice(e.target.value)}
                    className="w-full bg-white text-xs border border-slate-200 rounded-xl p-3 outline-none focus:border-[#FF9F00]"
                    required
                  />
                </div>

                <div className="flex space-x-2 justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => setShowNoticeModal(false)}
                    className="py-2.5 px-4 rounded-xl text-[10px] font-bold border border-slate-200 text-slate-500 hover:bg-slate-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={settingsSaving}
                    className="py-2.5 px-5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-slate-900 hover:bg-[#FF9F00] text-white hover:text-slate-950 transition flex items-center space-x-1.5"
                  >
                    {settingsSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    <span>Update Ticker Board</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* -------------------- POPUP 2: CAROUSEL BANNER FORM MODAL -------------------- */}
      <AnimatePresence>
        {showBannerFormModal && (
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
                  <div className="p-2.5 bg-slate-900 rounded-xl text-amber-400 border border-slate-800 animate-pulse">
                    <ImageIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 font-mono">Slide Designer</span>
                    <h4 className="text-[12.5px] font-black text-white">
                      {editId ? 'Modify Carousel Slide' : 'Publish Carousel Slide'}
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

              <form onSubmit={handleSaveBanner} className="p-6 overflow-y-auto space-y-4 bg-slate-50/40 text-xs">
                
                {/* Format selection */}
                <div className="p-3 bg-slate-100 rounded-xl border border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-black text-slate-800 font-mono uppercase">Banner Slide Format</span>
                    <p className="text-[9.5px] text-slate-400">Pure visual designs vs Overlaying text promotions.</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => { setIsImageOnly(false); setError(''); }}
                      className={`px-3 py-1.5 rounded-lg text-[9.5px] font-black uppercase font-mono tracking-wider transition ${
                        !isImageOnly ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-200/60 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Text Promo
                    </button>
                    <button
                      type="button"
                      onClick={() => { setIsImageOnly(true); setError(''); }}
                      className={`px-3 py-1.5 rounded-lg text-[9.5px] font-black uppercase font-mono tracking-wider transition ${
                        isImageOnly ? 'bg-[#FF9F00] text-slate-950 shadow-xs' : 'bg-slate-200/60 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Image Only URL
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {!isImageOnly && (
                    <>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1 font-mono">Title Heading *</label>
                        <input
                          type="text"
                          placeholder="e.g. নগদ বোনাস!"
                          value={title}
                          onChange={e => setTitle(e.target.value)}
                          className="w-full bg-white text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-[#FF9F00]"
                          required={!isImageOnly}
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1 font-mono">Subtitle Tag (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. MASSIVE REWARD"
                          value={subtitle}
                          onChange={e => setSubtitle(e.target.value)}
                          className="w-full bg-white text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-[#FF9F00]"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1 font-mono">Description / Body text *</label>
                        <textarea
                          rows={2}
                          placeholder="Detailed promotion rules description..."
                          value={description}
                          onChange={e => setDescription(e.target.value)}
                          className="w-full bg-white text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-[#FF9F00]"
                          required={!isImageOnly}
                        />
                      </div>
                    </>
                  )}

                  <div className={isImageOnly ? "md:col-span-2" : ""}>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1 font-mono">
                      {isImageOnly ? "Banner Image Link URL *" : "Image URL (Optional)"}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. https://domain.com/banner.png"
                        value={image}
                        onChange={e => setImage(e.target.value)}
                        className="flex-1 bg-white text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-[#FF9F00]"
                        required={isImageOnly}
                      />
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          disabled={isUploading}
                        />
                        <button
                          type="button"
                          disabled={isUploading}
                          className="px-3 bg-slate-900 text-white text-[10px] font-bold rounded-xl hover:bg-slate-800 transition flex items-center gap-1 font-mono h-full shrink-0 uppercase"
                        >
                          {isUploading ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin text-[#FF9F00]" />
                              UPLOADING
                            </>
                          ) : (
                            'UPLOAD'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1 font-mono">Redirect Tab Target</label>
                    <select
                      value={linkTab}
                      onChange={e => setLinkTab(e.target.value)}
                      className="w-full bg-white text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-[#FF9F00]"
                    >
                      <option value="dashboard">Home / Dashboard</option>
                      <option value="games">Demo Casino Games</option>
                      <option value="wallet">Deposit / Wallet</option>
                      <option value="sports">Live Sportsbook</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1 font-mono">Action Button Text</label>
                    <input
                      type="text"
                      placeholder="e.g. টপ-আপ করুন"
                      value={buttonText}
                      onChange={e => setButtonText(e.target.value)}
                      className="w-full bg-white text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-[#FF9F00]"
                    />
                  </div>

                  <div className="flex items-center space-x-2 pt-4">
                    <input
                      type="checkbox"
                      id="banner_active_popup"
                      checked={active}
                      onChange={e => setActive(e.target.checked)}
                      className="rounded text-[#FF9F00] focus:ring-[#FF9F00] h-4 w-4 border-slate-300"
                    />
                    <label htmlFor="banner_active_popup" className="text-[11px] font-bold text-slate-600">Display Carousel Card</label>
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
                    disabled={bannerSaving}
                    className="py-2.5 px-5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-slate-900 hover:bg-[#FF9F00] text-white hover:text-slate-950 transition flex items-center space-x-1.5"
                  >
                    {bannerSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    <span>{editId ? 'Save Slide' : 'Publish Slide'}</span>
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
