/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Users, TrendingUp, Wallet, Activity, Bell, Sliders, Volume2, RefreshCw } from 'lucide-react';

interface AnalyticsPanelProps {
  analytics: any;
  loading: boolean;
  onRefresh: () => void;
}

export default function AnalyticsPanel({ analytics, loading, onRefresh }: AnalyticsPanelProps) {
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastFeedback, setBroadcastFeedback] = useState('');
  const [broadcastLoading, setBroadcastLoading] = useState(false);

  const [tickFeedback, setTickFeedback] = useState('');
  const [tickLoading, setTickLoading] = useState(false);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMsg) return;
    try {
      setBroadcastLoading(true);
      setBroadcastFeedback('');
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title: broadcastTitle, message: broadcastMsg })
      });
      const data = await res.json();
      if (res.ok) {
        setBroadcastFeedback(data.message || 'Broadcast dispatched successfully!');
        setBroadcastTitle('');
        setBroadcastMsg('');
      } else {
        setBroadcastFeedback(data.error || 'Failed to dispatch broadcast.');
      }
    } catch (err) {
      setBroadcastFeedback('Network failure.');
    } finally {
      setBroadcastLoading(false);
    }
  };

  const handleTickScores = async () => {
    try {
      setTickLoading(true);
      setTickFeedback('');
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/matches/tick', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setTickFeedback('Live match scores updated and odds recalculated!');
        onRefresh();
      } else {
        setTickFeedback(data.error || 'Failed to trigger ticker.');
      }
    } catch (err) {
      setTickFeedback('Network error.');
    } finally {
      setTickLoading(false);
      setTimeout(() => setTickFeedback(''), 4000);
    }
  };

  if (loading && !analytics) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <RefreshCw className="h-8 w-8 text-[#FF9F00] animate-spin" />
        <p className="text-slate-400 font-medium text-xs">Assembling administrative telemetry...</p>
      </div>
    );
  }

  const metrics = analytics?.metrics || {
    totalUsers: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    activeBetsCount: 0,
    activeBetsVolume: 0,
    ggr: 0
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-50 border border-slate-200/85 p-4 rounded-2xl shadow-sm hover:shadow transition">
          <div className="flex justify-between items-start text-slate-400">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Players</span>
            <Users className="h-4 w-4 text-slate-400" />
          </div>
          <span className="text-xl font-black text-slate-900 block mt-1.5">{metrics.totalUsers}</span>
          <span className="text-[9px] text-slate-400 block mt-0.5">Active registration records</span>
        </div>

        <div className="bg-slate-50 border border-slate-200/85 p-4 rounded-2xl shadow-sm hover:shadow transition">
          <div className="flex justify-between items-start text-emerald-500">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Deposits</span>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </div>
          <span className="text-xl font-black text-emerald-600 block mt-1.5">৳{metrics.totalDeposits.toLocaleString()}</span>
          <span className="text-[9px] text-slate-400 block mt-0.5">Approved ledger cashflow</span>
        </div>

        <div className="bg-slate-50 border border-slate-200/85 p-4 rounded-2xl shadow-sm hover:shadow transition">
          <div className="flex justify-between items-start text-red-500">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Withdrawals</span>
            <Wallet className="h-4 w-4 text-red-400" />
          </div>
          <span className="text-xl font-black text-red-600 block mt-1.5">৳{metrics.totalWithdrawals.toLocaleString()}</span>
          <span className="text-[9px] text-slate-400 block mt-0.5">Approved payouts issued</span>
        </div>

        <div className="bg-slate-50 border border-slate-200/85 p-4 rounded-2xl shadow-sm hover:shadow transition">
          <div className="flex justify-between items-start text-[#FF9F00]">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">GGR Profit</span>
            <Activity className="h-4 w-4 text-[#FF9F00]" />
          </div>
          <span className="text-xl font-black text-[#FF9F00] block mt-1.5">৳{metrics.ggr.toLocaleString()}</span>
          <span className="text-[9px] text-slate-400 block mt-0.5">Gross Gaming Revenue margin</span>
        </div>
      </div>

      {/* SVG Line Chart */}
      {analytics?.chartData && (
        <div className="bg-slate-50/50 border border-slate-200/80 p-5 rounded-2xl space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider">Performance Trends (Past 5 Cycles)</h3>
            <button onClick={onRefresh} className="p-1 rounded bg-white border border-slate-200 text-slate-500 hover:text-slate-800 transition">
              <RefreshCw className="h-3 w-3" />
            </button>
          </div>
          
          <div className="h-36 w-full relative">
            <svg className="h-full w-full overflow-visible" viewBox="0 0 500 120" preserveAspectRatio="none">
              <line x1="0" y1="15" x2="500" y2="15" stroke="rgba(0,0,0,0.04)" strokeWidth="1" />
              <line x1="0" y1="60" x2="500" y2="60" stroke="rgba(0,0,0,0.04)" strokeWidth="1" />
              <line x1="0" y1="105" x2="500" y2="105" stroke="rgba(0,0,0,0.04)" strokeWidth="1" />

              {/* Deposits Path */}
              <path
                d="M 10,95 L 125,85 L 250,60 L 375,70 L 490,30"
                fill="none"
                stroke="#1FA66A"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              {/* Withdrawals Path */}
              <path
                d="M 10,105 L 125,95 L 250,80 L 375,85 L 490,65"
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="4 2"
              />
            </svg>
            <div className="flex justify-between text-[8px] text-slate-400 font-semibold px-2 mt-2">
              <span>Day -4</span>
              <span>Day -3</span>
              <span>Day -2</span>
              <span>Day -1</span>
              <span>Today</span>
            </div>
          </div>

          <div className="flex justify-center space-x-6 text-[10px] font-bold">
            <span className="flex items-center space-x-1">
              <span className="h-2 w-2 rounded-full bg-[#1FA66A]" />
              <span className="text-slate-500">Deposits (In-Flow)</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              <span className="text-slate-500">Withdrawals (Out-Flow)</span>
            </span>
          </div>
        </div>
      )}

      {/* Control Station (Dynamic Core Actions) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Score simulation block */}
        <div className="bg-slate-50/50 border border-slate-200/80 p-5 rounded-2xl space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
            <Sliders className="h-4 w-4 text-[#FF9F00]" />
            <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">Dynamic Score Simulator</h4>
          </div>
          <p className="text-slate-500 text-[11px] leading-relaxed">
            Advancing the match ticking engine simulates gameplay transitions, updating active scores and recalculating odds dynamically across all ongoing soccer, cricket, and esports fixtures in real time.
          </p>
          <div className="space-y-3 pt-1">
            <button
              onClick={handleTickScores}
              disabled={tickLoading}
              className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white text-xs font-bold transition shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${tickLoading ? 'animate-spin' : ''}`} />
              <span>{tickLoading ? 'Simulating Matches...' : 'Advance Live Fixtures Tick'}</span>
            </button>
            {tickFeedback && (
              <p className="text-[10px] font-bold text-center text-emerald-600 bg-emerald-50 border border-emerald-100 py-1.5 rounded-lg">
                ✨ {tickFeedback}
              </p>
            )}
          </div>
        </div>

        {/* Global Alert Dispatcher */}
        <div className="bg-slate-50/50 border border-slate-200/80 p-5 rounded-2xl space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
            <Bell className="h-4 w-4 text-[#FF9F00]" />
            <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">Global System Broadcast</h4>
          </div>
          <form onSubmit={handleBroadcast} className="space-y-3 text-xs">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase">Alert Title</label>
              <input
                type="text"
                required
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                placeholder="e.g., Scheduled Core Upgrades"
                className="w-full rounded-xl bg-white border border-slate-200 p-2 text-slate-800 focus:outline-none focus:border-[#FF9F00]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase">Broadcast Notice Message</label>
              <textarea
                required
                rows={2}
                value={broadcastMsg}
                onChange={(e) => setBroadcastMsg(e.target.value)}
                placeholder="Type notice message to broadcast to all player accounts..."
                className="w-full rounded-xl bg-white border border-slate-200 p-2 text-slate-800 focus:outline-none focus:border-[#FF9F00] resize-none"
              />
            </div>
            {broadcastFeedback && (
              <p className={`text-[10px] font-bold text-center py-1.5 rounded-lg border ${
                broadcastFeedback.includes('successfully') ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-red-600 bg-red-50 border-red-100'
              }`}>
                {broadcastFeedback}
              </p>
            )}
            <button
              type="submit"
              disabled={broadcastLoading}
              className="w-full py-2.5 rounded-xl bg-[#FF9F00] hover:bg-[#E08C00] text-slate-950 font-black uppercase tracking-wider text-[10px] transition shadow-md shadow-[#FF9F00]/10 disabled:opacity-50"
            >
              {broadcastLoading ? 'Dispatching Broadcast...' : 'Broadcast Notification to All Players'}
            </button>
          </form>
        </div>
      </div>
    </motion.div>
  );
}
