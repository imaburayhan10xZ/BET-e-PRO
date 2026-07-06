/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Trash2, Plus, RefreshCw, BadgePercent } from 'lucide-react';
import { Promotion } from '../../types';

interface PromotionsPanelProps {
  promotions: Promotion[];
  loading: boolean;
  onRefresh: () => void;
}

export default function PromotionsPanel({ promotions, loading, onRefresh }: PromotionsPanelProps) {
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
      className="space-y-6"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Promotion campaign codes list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider">Active Campaigns</h3>
            <button onClick={onRefresh} className="p-1 rounded text-slate-500 hover:text-slate-800 transition">
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loading && promotions.length === 0 ? (
              <p className="text-slate-400 text-xs py-10 col-span-2 text-center animate-pulse">Checking voucher campaigns...</p>
            ) : promotions.length === 0 ? (
              <p className="text-slate-400 text-xs py-10 col-span-2 text-center">No active promotion vouchers. Build one on the right!</p>
            ) : (
              promotions.map(p => (
                <div key={p.id} className="relative rounded-2xl border border-slate-200/80 bg-white p-4 space-y-2 hover:shadow-sm transition">
                  <div className="flex justify-between items-start">
                    <span className="inline-flex items-center space-x-1 rounded-lg bg-amber-50 border border-amber-100 px-2 py-0.5 text-[9px] font-black text-amber-600 uppercase">
                      Code: {p.code}
                    </span>
                    <button
                      onClick={() => handleDeletePromo(p.id)}
                      className="p-1 rounded text-red-500 hover:bg-red-50 transition"
                      title="Delete Campaign"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <h4 className="font-extrabold text-slate-800 text-xs">{p.title}</h4>
                  <p className="text-slate-500 text-[11px] leading-relaxed line-clamp-2">{p.description}</p>
                  <div className="flex items-center space-x-3 pt-1 border-t border-slate-100 text-[10px] text-slate-400 font-bold">
                    <span>Boost: <span className="text-[#1FA66A]">{p.bonusPercentage}%</span></span>
                    <span>Min Dep: <span className="text-slate-600">৳{p.minDeposit}</span></span>
                    <span className="uppercase text-[9px] text-[#FF9F00] bg-[#FF9F00]/5 px-1.5 py-0.5 rounded-md">{p.category}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Campaign voucher builder */}
        <div className="lg:col-span-1">
          <div className="bg-slate-50/50 border border-slate-200 p-5 rounded-2xl space-y-4 shadow-sm">
            <div className="border-b border-slate-200/80 pb-2.5 flex items-center space-x-2">
              <BadgePercent className="h-4.5 w-4.5 text-[#FF9F00]" />
              <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">Publish Promotion</h4>
            </div>

            <form onSubmit={handleCreatePromo} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Campaign Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Daily Reload Boost"
                  className="w-full rounded-xl bg-white border border-slate-200 p-2.5 text-slate-800 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Voucher Promo Code</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="RELOAD10"
                    className="w-full rounded-xl bg-white border border-slate-200 p-2 text-slate-800 uppercase focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Category</label>
                  <select
                    value={category}
                    onChange={(e: any) => setCategory(e.target.value)}
                    className="w-full rounded-xl bg-white border border-slate-200 p-2 text-slate-700"
                  >
                    <option value="welcome">Welcome Bonus</option>
                    <option value="sports">Sports Special</option>
                    <option value="slots">Casino Reload</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Bonus Match %</label>
                  <input
                    type="number"
                    required
                    value={percent}
                    onChange={(e) => setPercent(e.target.value)}
                    className="w-full rounded-xl bg-white border border-slate-200 p-2 text-slate-800 focus:outline-none font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Min Deposit (৳ BDT)</label>
                  <input
                    type="number"
                    required
                    value={minDeposit}
                    onChange={(e) => setMinDeposit(e.target.value)}
                    className="w-full rounded-xl bg-white border border-slate-200 p-2 text-slate-800 focus:outline-none font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Rollover Description</label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. 5x rollover requirements in football bets of minimum 1.50 odds..."
                  className="w-full rounded-xl bg-white border border-slate-200 p-2.5 text-slate-800 focus:outline-none resize-none"
                />
              </div>

              {feedback && (
                <p className={`text-[10px] font-bold text-center py-1.5 rounded-lg border ${
                  feedback.includes('published') ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-red-600 bg-red-50 border-red-100'
                }`}>
                  {feedback}
                </p>
              )}

              <button
                type="submit"
                disabled={createLoading}
                className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase text-[10px] tracking-widest transition"
              >
                {createLoading ? 'Publishing...' : 'Publish Voucher'}
              </button>
            </form>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
