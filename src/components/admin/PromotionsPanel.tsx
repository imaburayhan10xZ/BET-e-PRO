/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Trash2, Plus, RefreshCw, BadgePercent, X, Award, ChevronRight, LayoutGrid } from 'lucide-react';
import { Promotion } from '../../types';

interface PromotionsPanelProps {
  promotions: Promotion[];
  loading: boolean;
  onRefresh: () => void;
}

export default function PromotionsPanel({ promotions, loading, onRefresh }: PromotionsPanelProps) {
  // Modal Trigger
  const [showFormModal, setShowFormModal] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [percent, setPercent] = useState('10');
  const [minDeposit, setMinDeposit] = useState('500');
  const [category, setCategory] = useState<'welcome' | 'sports' | 'slots'>('welcome');
  const [description, setDescription] = useState('');
  const [feedback, setFeedback] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !code || !percent || !minDeposit) {
      setFeedback('All fields are required.');
      return;
    }
    try {
      setCreateLoading(true);
      setFeedback('');
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/promotions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          code: code.toUpperCase(),
          bonusPercent: percent,
          minDeposit,
          category,
          description
        })
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback('Voucher code published and enabled sitewide!');
        setTitle('');
        setCode('');
        setPercent('10');
        setMinDeposit('500');
        setDescription('');
        onRefresh();
        setTimeout(() => {
          setShowFormModal(false);
          setFeedback('');
        }, 1500);
      } else {
        setFeedback(data.error || 'Failed to create campaign.');
      }
    } catch (err) {
      setFeedback('Network error.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeletePromo = async (id: string) => {
    if (!window.confirm('Wipe this promotion code from database?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/promotions/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 text-xs"
    >
      {/* Top action header bar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100">
        <div className="flex items-center space-x-2.5">
          <BadgePercent className="h-4.5 w-4.5 text-[#FF9F00]" />
          <div>
            <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider">Campaign Discount Vouchers</h3>
            <span className="text-[10px] text-slate-400 font-bold">Manage sitewide active referral and reload bonuses</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => { setShowFormModal(true); setFeedback(''); }}
            className="flex items-center space-x-1.5 bg-slate-900 hover:bg-[#FF9F00] text-white hover:text-slate-950 px-4 py-2.5 rounded-xl text-xs font-black transition tracking-wider uppercase shadow-xs cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Publish Campaign</span>
          </button>
          
          <button 
            onClick={onRefresh} 
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-800 transition cursor-pointer"
            title="Refresh database records"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Campaign List Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {loading && promotions.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white border border-slate-200 rounded-2xl">
            <RefreshCw className="h-5 w-5 text-[#FF9F00] animate-spin mx-auto mb-2.5" />
            <span className="font-semibold text-slate-500">Checking voucher campaigns...</span>
          </div>
        ) : promotions.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white border border-dashed border-slate-200 rounded-2xl text-slate-400">
            No active promotional campaigns. Click "Publish Campaign" to design one!
          </div>
        ) : (
          promotions.map(p => (
            <div 
              key={p.id} 
              className="relative rounded-2xl border border-slate-200/85 bg-white p-4.5 flex flex-col justify-between space-y-4 hover:border-[#FF9F00]/50 transition duration-150"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <span className="inline-flex items-center space-x-1 rounded-lg bg-amber-50 border border-amber-100 px-2 py-0.5 text-[9.5px] font-black text-[#FF9F00] uppercase font-mono">
                    Code: {p.code}
                  </span>
                  
                  <button
                    onClick={() => handleDeletePromo(p.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 transition bg-white border border-slate-100 hover:bg-slate-50"
                    title="Delete Campaign"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <h4 className="font-black text-slate-800 text-[12.5px] leading-snug">{p.title}</h4>
                <p className="text-slate-500 text-[11px] leading-relaxed line-clamp-3">{p.description}</p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-50 text-[10px] text-slate-400 font-bold font-mono">
                <span>Boost: <span className="text-[#1FA66A] font-extrabold text-[11px]">+{p.bonusPercentage}%</span></span>
                <span>Min Dep: <span className="text-slate-700 font-extrabold">৳{p.minDeposit}</span></span>
                <span className="uppercase text-[9px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-extrabold">{p.category}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* -------------------- POPUP: CAMPAIGN PUBLISHER MODAL -------------------- */}
      <AnimatePresence>
        {showFormModal && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFormModal(false)}
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
                    <BadgePercent className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 font-mono">Campaign designer</span>
                    <h4 className="text-[12.5px] font-black text-white">Publish Promo Voucher</h4>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition border border-white/10"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              <form onSubmit={handleCreatePromo} className="p-6 space-y-4 bg-slate-50/40 text-xs">
                
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Campaign Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Daily Reload Boost"
                    className="w-full rounded-xl bg-white border border-slate-200 p-2.5 text-slate-800 font-bold focus:outline-none focus:border-[#FF9F00]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase font-mono">Promo Code</label>
                    <input
                      type="text"
                      required
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="e.g. RELOAD10"
                      className="w-full rounded-xl bg-white border border-slate-200 p-2.5 text-slate-800 uppercase font-bold focus:outline-none focus:border-[#FF9F00]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Category</label>
                    <select
                      value={category}
                      onChange={(e: any) => setCategory(e.target.value)}
                      className="w-full rounded-xl bg-white border border-slate-200 p-2.5 text-slate-700 font-bold focus:outline-none focus:border-[#FF9F00]"
                    >
                      <option value="welcome">Welcome Bonus</option>
                      <option value="sports">Sports Special</option>
                      <option value="slots">Casino Reload</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Bonus Match %</label>
                    <input
                      type="number"
                      required
                      value={percent}
                      onChange={(e) => setPercent(e.target.value)}
                      className="w-full rounded-xl bg-white border border-slate-200 p-2.5 text-slate-800 font-mono font-bold focus:outline-none focus:border-[#FF9F00]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Min Deposit (৳ BDT)</label>
                    <input
                      type="number"
                      required
                      value={minDeposit}
                      onChange={(e) => setMinDeposit(e.target.value)}
                      className="w-full rounded-xl bg-white border border-slate-200 p-2.5 text-slate-800 font-mono font-bold focus:outline-none focus:border-[#FF9F00]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Rollover / Wagering Rules</label>
                  <textarea
                    required
                    rows={2.5}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. 5x rollover requirements in football..."
                    className="w-full rounded-xl bg-white border border-slate-200 p-2.5 text-slate-800 focus:outline-none resize-none focus:border-[#FF9F00]"
                  />
                </div>

                {feedback && (
                  <p className={`text-[10px] font-bold text-center py-2 rounded-xl border ${
                    feedback.includes('published') ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-red-600 bg-red-50 border-red-100'
                  }`}>
                    {feedback}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={createLoading}
                  className="w-full py-3 rounded-xl bg-slate-900 hover:bg-[#FF9F00] text-white hover:text-slate-950 font-black uppercase text-[10px] tracking-widest transition cursor-pointer"
                >
                  {createLoading ? 'Publishing...' : 'Publish Campaign'}
                </button>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
