/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, TrendingUp, Wallet, Activity, Bell, Sliders, Volume2, RefreshCw, ChevronRight, X, Sparkles, Send, ShieldAlert } from 'lucide-react';

interface AnalyticsPanelProps {
  analytics: any;
  loading: boolean;
  onRefresh: () => void;
}

export default function AnalyticsPanel({ analytics, loading, onRefresh }: AnalyticsPanelProps) {
  // Modal Triggers
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [showSimulatorModal, setShowSimulatorModal] = useState(false);

  // Broadcast States
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastFeedback, setBroadcastFeedback] = useState('');
  const [broadcastLoading, setBroadcastLoading] = useState(false);

  // Simulator States
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
        setTimeout(() => {
          setShowBroadcastModal(false);
          setBroadcastFeedback('');
        }, 1500);
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
        setTimeout(() => {
          setShowSimulatorModal(false);
          setTickFeedback('');
        }, 1500);
      } else {
        setTickFeedback(data.error || 'Failed to trigger ticker.');
      }
    } catch (err) {
      setTickFeedback('Network error.');
    } finally {
      setTickLoading(false);
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
      className="space-y-4 text-xs text-slate-700"
    >
      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/85 p-4 rounded-2xl shadow-xs hover:border-[#FF9F00]/50 transition duration-150">
          <div className="flex justify-between items-start text-slate-400">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider font-mono">Players</span>
            <Users className="h-4.5 w-4.5 text-slate-400" />
          </div>
          <span className="text-xl font-black text-slate-900 block mt-1.5 font-mono">{metrics.totalUsers}</span>
          <span className="text-[9px] text-slate-400 block mt-0.5">Active registration records</span>
        </div>

        <div className="bg-white border border-slate-200/85 p-4 rounded-2xl shadow-xs hover:border-[#FF9F00]/50 transition duration-150">
          <div className="flex justify-between items-start text-emerald-500">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider font-mono">Deposits</span>
            <TrendingUp className="h-4.5 w-4.5 text-emerald-500" />
          </div>
          <span className="text-xl font-black text-emerald-600 block mt-1.5 font-mono">৳{metrics.totalDeposits.toLocaleString()}</span>
          <span className="text-[9px] text-slate-400 block mt-0.5">Approved ledger cashflow</span>
        </div>

        <div className="bg-white border border-slate-200/85 p-4 rounded-2xl shadow-xs hover:border-[#FF9F00]/50 transition duration-150">
          <div className="flex justify-between items-start text-red-500">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider font-mono">Withdrawals</span>
            <Wallet className="h-4.5 w-4.5 text-red-400" />
          </div>
          <span className="text-xl font-black text-red-600 block mt-1.5 font-mono">৳{metrics.totalWithdrawals.toLocaleString()}</span>
          <span className="text-[9px] text-slate-400 block mt-0.5">Approved payouts issued</span>
        </div>

        <div className="bg-white border border-slate-200/85 p-4 rounded-2xl shadow-xs hover:border-[#FF9F00]/50 transition duration-150">
          <div className="flex justify-between items-start text-[#FF9F00]">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider font-mono">GGR Profit</span>
            <Activity className="h-4.5 w-4.5 text-[#FF9F00]" />
          </div>
          <span className="text-xl font-black text-[#FF9F00] block mt-1.5 font-mono">৳{metrics.ggr.toLocaleString()}</span>
          <span className="text-[9px] text-slate-400 block mt-0.5">Gross Gaming Revenue margin</span>
        </div>
      </div>

      {/* SVG Line Chart */}
      {analytics?.chartData && (
        <div className="bg-white border border-slate-200/80 p-5 rounded-3xl space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider">Performance Trends</h3>
              <span className="text-[9.5px] text-slate-400 font-bold">Past 5 Cycles of ledger cashflow tracking</span>
            </div>
            <button 
              onClick={onRefresh} 
              className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-800 transition cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
          
          <div className="h-36 w-full relative">
            <svg className="h-full w-full overflow-visible" viewBox="0 0 500 120" preserveAspectRatio="none">
              <line x1="0" y1="15" x2="500" y2="15" stroke="rgba(0,0,0,0.03)" strokeWidth="1" />
              <line x1="0" y1="60" x2="500" y2="60" stroke="rgba(0,0,0,0.03)" strokeWidth="1" />
              <line x1="0" y1="105" x2="500" y2="105" stroke="rgba(0,0,0,0.03)" strokeWidth="1" />

              {/* Deposits Path */}
              <path
                d="M 10,95 L 125,85 L 250,60 L 375,70 L 490,30"
                fill="none"
                stroke="#1FA66A"
                strokeWidth="3"
                strokeLinecap="round"
              />
              {/* Withdrawals Path */}
              <path
                d="M 10,105 L 125,95 L 250,80 L 375,85 L 490,65"
                fill="none"
                stroke="#ef4444"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray="4 2"
              />
            </svg>
            <div className="flex justify-between text-[8px] text-slate-400 font-black font-mono px-2 mt-2">
              <span>CYCLE -4</span>
              <span>CYCLE -3</span>
              <span>CYCLE -2</span>
              <span>CYCLE -1</span>
              <span>CURRENT CYCLE</span>
            </div>
          </div>

          <div className="flex justify-center space-x-6 text-[10px] font-black font-mono">
            <span className="flex items-center space-x-1.5">
              <span className="h-2 w-2 rounded-full bg-[#1FA66A]" />
              <span className="text-slate-500">Deposits (In-Flow)</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              <span className="text-slate-500">Withdrawals (Out-Flow)</span>
            </span>
          </div>
        </div>
      )}

      {/* Control Station (List style Option Blocks trigger Popups!) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Option Box 1: Score Simulator Trigger Card */}
        <div 
          onClick={() => { setShowSimulatorModal(true); setTickFeedback(''); }}
          className="group cursor-pointer bg-white border border-slate-200 p-5 rounded-2xl hover:border-[#FF9F00] transition flex flex-col justify-between space-y-4"
        >
          <div className="flex items-start justify-between">
            <div className="p-3 bg-amber-50 text-[#FF9F00] rounded-xl border border-amber-100">
              <Sliders className="h-5 w-5" />
            </div>
            <span className="text-[9px] font-black text-[#FF9F00] uppercase tracking-wider font-mono bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
              Live Control
            </span>
          </div>

          <div className="space-y-1">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide group-hover:text-[#FF9F00] transition">
              Dynamic Score Ticker Simulator
            </h4>
            <p className="text-[11px] text-slate-400 leading-normal">
              Simulate real-time match ticking to auto-update scores and recalculate active bet coupon odds.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-50 flex items-center justify-between text-[10px] font-bold text-slate-400 font-mono">
            <span>Advance sports leagues timeline</span>
            <span className="text-[#FF9F00] group-hover:underline flex items-center space-x-0.5">
              <span>Open Simulator</span>
              <ChevronRight className="h-3 w-3" />
            </span>
          </div>
        </div>

        {/* Option Box 2: Global System Broadcast Card */}
        <div 
          onClick={() => { setShowBroadcastModal(true); setBroadcastFeedback(''); }}
          className="group cursor-pointer bg-white border border-slate-200 p-5 rounded-2xl hover:border-[#FF9F00] transition flex flex-col justify-between space-y-4"
        >
          <div className="flex items-start justify-between">
            <div className="p-3 bg-blue-50 text-blue-500 rounded-xl border border-blue-100">
              <Bell className="h-5 w-5" />
            </div>
            <span className="text-[9px] font-black text-blue-600 uppercase tracking-wider font-mono bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
              Global Notice
            </span>
          </div>

          <div className="space-y-1">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide group-hover:text-[#FF9F00] transition">
              Global System Broadcast Notice
            </h4>
            <p className="text-[11px] text-slate-400 leading-normal">
              Publish urgent notices or promotional announcements directly to all user account screens.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-50 flex items-center justify-between text-[10px] font-bold text-slate-400 font-mono">
            <span>Dispatch real-time notification</span>
            <span className="text-[#FF9F00] group-hover:underline flex items-center space-x-0.5">
              <span>Open Broadcaster</span>
              <ChevronRight className="h-3 w-3" />
            </span>
          </div>
        </div>

      </div>

      {/* -------------------- POPUP: SCORE TICKER SIMULATOR MODAL -------------------- */}
      <AnimatePresence>
        {showSimulatorModal && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSimulatorModal(false)}
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
                  <div className="p-2.5 bg-slate-900 rounded-xl text-[#FF9F00] border border-slate-800">
                    <Sliders className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 font-mono">Sportsbook core controller</span>
                    <h4 className="text-[12.5px] font-black text-white">Fixture Score Simulator</h4>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSimulatorModal(false)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition border border-white/10"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              <div className="p-6 space-y-4 bg-slate-50/40 text-xs text-slate-600">
                <p className="leading-relaxed">
                  Advancing the match ticking engine simulates gameplay transitions, updating active scores and recalculating odds dynamically across all ongoing soccer, cricket, and esports fixtures in real time.
                </p>

                <div className="bg-amber-50 border border-amber-100 text-[#FF9F00] p-3.5 rounded-xl flex items-start space-x-2.5 font-medium leading-relaxed">
                  <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>Settle alerts and pending tickets will be re-evaluated on ticker progression. Do not interrupt during recalculations.</span>
                </div>

                {tickFeedback && (
                  <p className="text-[10px] font-bold text-center text-emerald-600 bg-emerald-50 border border-emerald-100 py-2 rounded-xl">
                    ✨ {tickFeedback}
                  </p>
                )}

                <button
                  onClick={handleTickScores}
                  disabled={tickLoading}
                  className="w-full flex items-center justify-center space-x-2 py-3.5 rounded-xl bg-slate-900 hover:bg-[#FF9F00] text-white hover:text-slate-950 font-black uppercase tracking-widest text-[10px] transition cursor-pointer shadow-sm"
                >
                  <RefreshCw className={`h-4.5 w-4.5 ${tickLoading ? 'animate-spin' : ''}`} />
                  <span>{tickLoading ? 'Simulating Matches...' : 'Advance Fixtures Tick'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* -------------------- POPUP: BROADCAST NOTICE MODAL -------------------- */}
      <AnimatePresence>
        {showBroadcastModal && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBroadcastModal(false)}
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
                  <div className="p-2.5 bg-slate-900 rounded-xl text-blue-400 border border-slate-800">
                    <Bell className="h-5 w-5 animate-bounce" />
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 font-mono">Siren alert broadcast</span>
                    <h4 className="text-[12.5px] font-black text-white">Global System Notice</h4>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition border border-white/10"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              <form onSubmit={handleBroadcast} className="p-6 space-y-4 bg-slate-50/40 text-xs">
                
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Alert Title</label>
                  <input
                    type="text"
                    required
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    placeholder="e.g. Core System Upgrades"
                    className="w-full rounded-xl bg-white border border-slate-200 p-2.5 text-slate-850 font-bold focus:outline-none focus:border-[#FF9F00]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Notice Content Message</label>
                  <textarea
                    required
                    rows={3}
                    value={broadcastMsg}
                    onChange={(e) => setBroadcastMsg(e.target.value)}
                    placeholder="Type details to transmit to all logged in player screens..."
                    className="w-full rounded-xl bg-white border border-slate-200 p-2.5 text-slate-850 focus:outline-none resize-none focus:border-[#FF9F00]"
                  />
                </div>

                {broadcastFeedback && (
                  <p className={`text-[10px] font-bold text-center py-2 rounded-xl border ${
                    broadcastFeedback.includes('successfully') ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-red-600 bg-red-50 border-red-100'
                  }`}>
                    {broadcastFeedback}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={broadcastLoading}
                  className="w-full py-3 rounded-xl bg-slate-900 hover:bg-[#FF9F00] text-white hover:text-slate-950 font-black uppercase tracking-widest text-[10px] transition cursor-pointer flex items-center justify-center space-x-1.5"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{broadcastLoading ? 'Dispatching Broadcast...' : 'Transmit Broadcast'}</span>
                </button>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
