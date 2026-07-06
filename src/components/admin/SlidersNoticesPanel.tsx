import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Image as ImageIcon, Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Loader2, Megaphone, Check, AlertCircle } from 'lucide-react';
import { BannerSlider, SystemSettings } from '../../types';

export default function SlidersNoticesPanel() {
  const [banners, setBanners] = useState<BannerSlider[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [bannerSaving, setBannerSaving] = useState(false);

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
  const [showForm, setShowForm] = useState(false);

  // Status logs
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
    setShowForm(true);
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
    setShowForm(false);
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
      } else {
        setError(data.error || 'Failed to delete banner.');
      }
    } catch (err) {
      setError('Connection error deleting banner.');
    }
  };

  return (
    <div className="space-y-8">
      {/* HEADER SECTION */}
      <div>
        <h2 className="text-lg font-black text-slate-900">Banners & Notices</h2>
        <p className="text-xs text-slate-500">Manage the dynamic marquee notice boards and promotional sliders displayed on the user dashboard.</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 border border-red-100 p-3 rounded-xl text-xs font-semibold flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 text-emerald-600 border border-emerald-100 p-3 rounded-xl text-xs font-semibold flex items-center space-x-2">
          <Check className="h-4 w-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* MARQUEE NOTICE BOX */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 pb-2.5 border-b border-slate-100">
          <Megaphone className="h-4.5 w-4.5 text-[#FF9F00]" />
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider font-mono">Platform Marquee Notice</h3>
        </div>

        <form onSubmit={handleSaveNotice} className="space-y-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1 font-mono uppercase">Bangla Banner Notice Text</label>
            <textarea
              rows={3}
              placeholder="e.g. 🎁 BETEPRO-তে স্বাগতম! নগদের মাধ্যমে..."
              value={marqueeNotice}
              onChange={e => setMarqueeNotice(e.target.value)}
              className="w-full bg-slate-50 text-xs border border-slate-200 rounded-xl p-3 outline-none focus:border-[#FF9F00] focus:bg-white transition"
              required
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={settingsSaving}
              className="flex items-center space-x-1.5 bg-[#FF9F00] text-slate-950 px-4 py-2 rounded-lg text-xs font-black shadow-md shadow-[#FF9F00]/10 hover:opacity-90 transition"
            >
              {settingsSaving && <Loader2 className="h-3 w-3 animate-spin" />}
              <span>Update Marquee Notice</span>
            </button>
          </div>
        </form>
      </div>

      {/* BANNER SLIDERS LIST */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <ImageIcon className="h-4.5 w-4.5 text-[#FF9F00]" />
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider font-mono">Dynamic Image Banners</h3>
          </div>
          {!showForm && (
            <button
              onClick={() => { setShowForm(true); setError(''); setSuccess(''); }}
              className="flex items-center space-x-1 bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-800 transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Slide</span>
            </button>
          )}
        </div>

        {showForm && (
          <motion.form 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSaveBanner}
            className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/60 space-y-4"
          >
            <div className="text-xs font-bold text-slate-700 pb-1 border-b border-slate-200">
              {editId ? 'Modify Carousel Slide' : 'Add Promotional Slide'}
            </div>

            {/* Banner type option selector */}
            <div className="p-3 bg-slate-100 rounded-xl border border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="space-y-0.5">
                <span className="text-xs font-black text-slate-800 font-mono uppercase">Banner Slide Format</span>
                <p className="text-[10px] text-slate-500">Choose between overlaying promotional text or showing a pure design banner image link.</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => { setIsImageOnly(false); setError(''); }}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase font-mono tracking-wider transition ${
                    !isImageOnly ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-200/60 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Text Promo
                </button>
                <button
                  type="button"
                  onClick={() => { setIsImageOnly(true); setError(''); }}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase font-mono tracking-wider transition ${
                    isImageOnly ? 'bg-[#FF9F00] text-slate-950 shadow-xs' : 'bg-slate-200/60 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Image Only URL
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {!isImageOnly && (
                <>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1 font-mono">Title Heading *</label>
                    <input
                      type="text"
                      placeholder="e.g. নগদ ওয়ালেট টপ-আপে অতিরিক্ত +১.৫% বোনাস!"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      className="w-full bg-white text-xs border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#FF9F00]"
                      required={!isImageOnly}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1 font-mono">Subtitle Tag (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. MASSIVE NAGAD REWARD"
                      value={subtitle}
                      onChange={e => setSubtitle(e.target.value)}
                      className="w-full bg-white text-xs border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#FF9F00]"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1 font-mono">Description / Body text *</label>
                    <textarea
                      rows={2}
                      placeholder="Detailed promotion rules description..."
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      className="w-full bg-white text-xs border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#FF9F00]"
                      required={!isImageOnly}
                    />
                  </div>
                </>
              )}

              <div className={isImageOnly ? "md:col-span-2" : ""}>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1 font-mono">
                  {isImageOnly ? "Banner Image Link URL *" : "Image URL (Optional)"}
                </label>
                <input
                  type="text"
                  placeholder="e.g. https://domain.com/banner_image.png"
                  value={image}
                  onChange={e => setImage(e.target.value)}
                  className="w-full bg-white text-xs border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#FF9F00]"
                  required={isImageOnly}
                />
                {isImageOnly && (
                  <p className="text-[10px] text-amber-600 font-mono mt-1">
                    * Make sure to provide a direct image link (JPEG/PNG/WebP/GIF). On the home screen carousel, it will fill the slide completely with no overlapping titles or descriptions.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1 font-mono">Redirect Tab Target</label>
                <select
                  value={linkTab}
                  onChange={e => setLinkTab(e.target.value)}
                  className="w-full bg-white text-xs border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#FF9F00]"
                >
                  <option value="dashboard">Home / Dashboard</option>
                  <option value="games">Demo Casino Games</option>
                  <option value="wallet">Deposit / Wallet</option>
                  <option value="sports">Live Sportsbook</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1 font-mono">Action Button Text</label>
                <input
                  type="text"
                  placeholder="e.g. টপ-আপ করুন"
                  value={buttonText}
                  onChange={e => setButtonText(e.target.value)}
                  className="w-full bg-white text-xs border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#FF9F00]"
                />
              </div>

              <div className="flex items-center space-x-2 pt-6">
                <input
                  type="checkbox"
                  id="banner_active"
                  checked={active}
                  onChange={e => setActive(e.target.checked)}
                  className="rounded text-[#FF9F00] focus:ring-[#FF9F00]"
                />
                <label htmlFor="banner_active" className="text-xs font-bold text-slate-700">Display in carousel</label>
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
                disabled={bannerSaving}
                className="flex items-center space-x-1.5 bg-[#FF9F00] text-slate-950 px-4 py-1.5 rounded-lg text-xs font-black shadow-md shadow-[#FF9F00]/10"
              >
                {bannerSaving && <Loader2 className="h-3 w-3 animate-spin" />}
                <span>{editId ? 'Save Banner' : 'Create Banner'}</span>
              </button>
            </div>
          </motion.form>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-[#FF9F00]" />
          </div>
        ) : banners.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            No image sliders configured. Click "Create Slide" to get started.
          </div>
        ) : (
          <div className="space-y-3">
            {banners.map(b => (
              <div 
                key={b.id}
                className={`p-4 rounded-xl border transition ${
                  b.active ? 'bg-slate-50/50 border-slate-200/80 shadow-sm' : 'bg-slate-50/20 border-dashed border-slate-200 text-slate-400'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      {b.isImageOnly ? (
                        <span className="text-[10px] font-black tracking-wider uppercase font-mono px-2 py-0.5 rounded bg-amber-500 text-slate-950">
                          IMAGE ONLY BANNER
                        </span>
                      ) : (
                        <span className="text-[10px] font-black tracking-wider uppercase font-mono px-2 py-0.5 rounded bg-slate-900 text-white">
                          {b.subtitle || 'PROMO'}
                        </span>
                      )}
                      <span className="text-slate-400 text-[10px] font-mono">Redirects to: {b.linkTab}</span>
                    </div>
                    <h4 className="text-xs font-black text-slate-800">{b.isImageOnly ? 'IMAGE ONLY BANNER SLIDE' : b.title}</h4>
                    <p className="text-[11px] text-slate-500 max-w-xl">{b.isImageOnly ? 'Shows pure design banner on the home page with no overlay text. Fully clickable.' : b.description}</p>
                    {b.image && (
                      <div className="text-[10px] text-indigo-500 font-mono mt-1 underline">
                        Image link: <a href={b.image} target="_blank" rel="noreferrer" className="break-all">{b.image}</a>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-1.5 shrink-0 ml-4">
                    <button
                      onClick={() => handleToggleBanner(b.id)}
                      title={b.active ? 'Hide from carousel' : 'Show in carousel'}
                      className="p-1 text-slate-400 hover:text-slate-950 transition"
                    >
                      {b.active ? <ToggleRight className="h-5 w-5 text-emerald-500" /> : <ToggleLeft className="h-5 w-5 text-slate-300" />}
                    </button>
                    <button
                      onClick={() => handleEditBanner(b)}
                      title="Edit banner details"
                      className="p-1.5 text-slate-400 hover:text-blue-600 transition bg-white border border-slate-200 rounded-lg shadow-xs"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
