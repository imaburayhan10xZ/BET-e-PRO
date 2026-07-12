/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, Plus, Trash2, Check, X, RefreshCw, Sliders, 
  Calendar, Eye, Sparkles, SlidersHorizontal, Settings2, FileEdit
} from 'lucide-react';
import { Match } from '../../types';

interface MatchesPanelProps {
  matches: Match[];
  loading: boolean;
  onRefresh: () => void;
  onRefreshUser: () => void;
}

export default function MatchesPanel({ matches, loading, onRefresh, onRefreshUser }: MatchesPanelProps) {
  // Modal Triggers
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [settleMatch, setSettleMatch] = useState<Match | null>(null);

  // New Match States
  const [newSport, setNewSport] = useState('football');
  const [newLeague, setNewLeague] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newHomeTeam, setNewHomeTeam] = useState('');
  const [newAwayTeam, setNewAwayTeam] = useState('');
  const [newHomeOdds, setNewHomeOdds] = useState('1.85');
  const [newDrawOdds, setNewDrawOdds] = useState('3.40');
  const [newAwayOdds, setNewAwayOdds] = useState('2.80');
  const [matchAddFeedback, setMatchAddFeedback] = useState('');
  const [matchAddLoading, setMatchAddLoading] = useState(false);

  // Settle Match Winner State
  const [settleWinner, setSettleWinner] = useState<'home' | 'draw' | 'away'>('home');
  const [settleLoading, setSettleLoading] = useState(false);

  // Scoreboard manipulator state (Inside Edit Popup)
  const [editHomeScore, setEditHomeScore] = useState('0');
  const [editAwayScore, setEditAwayScore] = useState('0');
  const [editHomeOdds, setEditHomeOdds] = useState('1.85');
  const [editDrawOdds, setEditDrawOdds] = useState('3.40');
  const [editAwayOdds, setEditAwayOdds] = useState('2.80');
  const [editTime, setEditTime] = useState('');
  const [editStatus, setEditStatus] = useState<'live' | 'upcoming' | 'completed'>('upcoming');
  const [editFeedback, setEditFeedback] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeague || !newHomeTeam || !newAwayTeam || !newTime) {
      setMatchAddFeedback('All fields are required.');
      return;
    }
    try {
      setMatchAddLoading(true);
      setMatchAddFeedback('');
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/matches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sport: newSport,
          league: newLeague,
          time: newTime,
          homeTeamName: newHomeTeam,
          awayTeamName: newAwayTeam,
          homeOdds: newHomeOdds,
          drawOdds: newDrawOdds,
          awayOdds: newAwayOdds
        })
      });
      const data = await res.json();
      if (res.ok) {
        setMatchAddFeedback('New sports fixture created and odds calculated!');
        setNewLeague('');
        setNewTime('');
        setNewHomeTeam('');
        setNewAwayTeam('');
        onRefresh();
        setTimeout(() => {
          setShowCreateModal(false);
          setMatchAddFeedback('');
        }, 1500);
      } else {
        setMatchAddFeedback(data.error || 'Failed to create fixture.');
      }
    } catch (err) {
      setMatchAddFeedback('Network error.');
    } finally {
      setMatchAddLoading(false);
    }
  };

  const handleSettleMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settleMatch) return;
    try {
      setSettleLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/matches/${settleMatch.id}/settle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ winner: settleWinner })
      });
      if (res.ok) {
        setSettleMatch(null);
        onRefresh();
        onRefreshUser();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSettleLoading(false);
    }
  };

  const handleOpenEdit = (m: Match) => {
    setEditingMatch(m);
    setEditHomeScore(m.homeScore.toString());
    setEditAwayScore(m.awayScore.toString());
    setEditHomeOdds(m.odds.homeWin.toString());
    setEditDrawOdds((m.odds.draw || 0).toString());
    setEditAwayOdds(m.odds.awayWin.toString());
    setEditTime(m.time);
    setEditStatus(m.status);
    setEditFeedback('');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMatch) return;
    try {
      setEditLoading(true);
      setEditFeedback('');
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/matches/${editingMatch.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: editStatus,
          time: editTime,
          homeScore: editHomeScore,
          awayScore: editAwayScore,
          homeOdds: editHomeOdds,
          drawOdds: editDrawOdds,
          awayOdds: editAwayOdds
        })
      });
      if (res.ok) {
        setEditFeedback('Scoreboard modified successfully!');
        onRefresh();
        setTimeout(() => {
          setEditingMatch(null);
          setEditFeedback('');
        }, 1500);
      } else {
        const data = await res.json();
        setEditFeedback(data.error || 'Failed to modify fixture.');
      }
    } catch (err) {
      setEditFeedback('Network error.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteMatch = async (id: string) => {
    if (!window.confirm('Are you absolutely sure you want to delete this fixture? Pending predictions on this match will be canceled.')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/matches/${id}`, {
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
      {/* Search, Filter & Voucher trigger action top bar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100">
        <div className="flex items-center space-x-2.5">
          <Trophy className="h-4.5 w-4.5 text-[#FF9F00]" />
          <div>
            <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider">Scheduled Event Fixtures</h3>
            <span className="text-[10px] text-slate-400 font-bold">Total active matches and predictions</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => { setShowCreateModal(true); setMatchAddFeedback(''); }}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-[#FF9F00] text-white hover:text-slate-950 font-black flex items-center space-x-1.5 transition text-[11px] tracking-wider uppercase shadow-sm cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Publish New Event</span>
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

      {/* Main Fixtures list Table (Full Width Layout) */}
      <div className="space-y-3">
        {loading && matches.length === 0 ? (
          <div className="text-center py-12 bg-white border border-slate-200 rounded-2xl">
            <RefreshCw className="h-6 w-6 text-[#FF9F00] animate-spin mx-auto mb-2.5" />
            <span className="font-semibold text-slate-500">Gathering stadium schedules...</span>
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-12 bg-white border border-slate-200 border-dashed rounded-2xl text-slate-400">
            No games scheduled. Click "Publish New Event" above to add one!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matches.map(m => (
              <div 
                key={m.id} 
                className="rounded-2xl border border-slate-200 bg-white p-4.5 space-y-4 shadow-xs relative hover:border-[#FF9F00]/60 transition duration-150 flex flex-col justify-between"
              >
                {/* Top Sport / League metadata bar */}
                <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  <span>⚽ {m.sport} • {m.league}</span>
                  <span className={`px-2.5 py-0.5 rounded-full ${
                    m.status === 'live' ? 'bg-emerald-100 text-emerald-700 animate-pulse' : m.status === 'completed' ? 'bg-slate-100 text-slate-400' : 'bg-amber-100 text-amber-700'
                  }`}>
                    ● {m.status}
                  </span>
                </div>

                {/* Center score display */}
                <div className="flex items-center justify-between py-1 border-y border-slate-50">
                  <div className="flex-1 text-center font-extrabold text-[12.5px] text-slate-800 flex flex-col items-center gap-1.5">
                    <span className="text-[15px]">{m.homeTeam.logo}</span>
                    <span className="truncate max-w-[100px]">{m.homeTeam.name}</span>
                  </div>
                  
                  <div className="px-4.5 py-2 rounded-2xl bg-slate-900 text-white font-mono font-black text-sm tracking-widest text-center shadow-inner">
                    {m.homeScore} - {m.awayScore}
                  </div>

                  <div className="flex-1 text-center font-extrabold text-[12.5px] text-slate-800 flex flex-col items-center gap-1.5">
                    <span className="text-[15px]">{m.awayTeam.logo}</span>
                    <span className="truncate max-w-[100px]">{m.awayTeam.name}</span>
                  </div>
                </div>

                {/* Odds visualization */}
                <div className="grid grid-cols-3 gap-1 bg-slate-50 p-2 rounded-xl text-center font-mono text-[10.5px]">
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase font-black tracking-wide block">Home Win</span>
                    <strong className="text-slate-800">{m.odds.homeWin}</strong>
                  </div>
                  <div className="border-x border-slate-200/60">
                    <span className="text-[9px] text-slate-400 uppercase font-black tracking-wide block">Draw Game</span>
                    <strong className="text-slate-800">{m.odds.draw || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase font-black tracking-wide block">Away Win</span>
                    <strong className="text-slate-800">{m.odds.awayWin}</strong>
                  </div>
                </div>

                {/* Footer and controls bar */}
                <div className="flex justify-between items-center pt-2 border-t border-slate-100/80 text-[10.5px]">
                  <span className="font-bold text-slate-500 flex items-center space-x-1 font-mono">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span>{m.time}</span>
                  </span>

                  <div className="flex items-center space-x-1.5">
                    {m.status !== 'completed' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(m)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition flex items-center space-x-1"
                          title="Edit match settings & live scores"
                        >
                          <Settings2 className="h-3.5 w-3.5" />
                          <span>Edit</span>
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => setSettleMatch(m)}
                          className="bg-[#FF9F00] hover:bg-[#E08C00] text-slate-950 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition flex items-center space-x-1"
                        >
                          <Trophy className="h-3.5 w-3.5" />
                          <span>Settle Match</span>
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteMatch(m.id)}
                      className="bg-red-50 text-red-600 hover:bg-red-500 hover:text-white p-2 rounded-xl transition"
                      title="Delete fixture"
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

      {/* -------------------- POPUP 1: FIXTURE PUBLISHER MODAL -------------------- */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="bg-slate-950 text-white p-5 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-slate-900 rounded-xl text-emerald-400 border border-slate-800">
                    <Plus className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 font-mono">Platform Sportsbook</span>
                    <h4 className="text-[13px] font-black text-white">Publish Match Fixture</h4>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer border border-white/10"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleCreateMatch} className="p-6 space-y-4 bg-slate-50/40 text-xs">
                
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Sport Type</label>
                    <select
                      value={newSport}
                      onChange={(e) => setNewSport(e.target.value)}
                      className="w-full rounded-xl bg-white border border-slate-200 p-2.5 text-slate-800 font-bold focus:outline-none focus:border-[#FF9F00]"
                    >
                      <option value="football">Football ⚽</option>
                      <option value="cricket">Cricket 🏏</option>
                      <option value="tennis">Tennis 🎾</option>
                      <option value="basketball">Basketball 🏀</option>
                      <option value="esports">eSports 🎮</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">League Title</label>
                    <input
                      type="text"
                      required
                      value={newLeague}
                      onChange={(e) => setNewLeague(e.target.value)}
                      placeholder="e.g. La Liga"
                      className="w-full rounded-xl bg-white border border-slate-200 p-2.5 text-slate-800 font-bold focus:outline-none focus:border-[#FF9F00]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Home Team</label>
                    <input
                      type="text"
                      required
                      value={newHomeTeam}
                      onChange={(e) => setNewHomeTeam(e.target.value)}
                      placeholder="e.g. Barcelona"
                      className="w-full rounded-xl bg-white border border-slate-200 p-2.5 text-slate-800 font-bold focus:outline-none focus:border-[#FF9F00]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Away Team</label>
                    <input
                      type="text"
                      required
                      value={newAwayTeam}
                      onChange={(e) => setNewAwayTeam(e.target.value)}
                      placeholder="e.g. Real Madrid"
                      className="w-full rounded-xl bg-white border border-slate-200 p-2.5 text-slate-800 font-bold focus:outline-none focus:border-[#FF9F00]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-white p-3.5 rounded-2xl border border-slate-100 shadow-inner">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase text-center block">Home Win</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newHomeOdds}
                      onChange={(e) => setNewHomeOdds(e.target.value)}
                      className="w-full rounded-xl bg-slate-50 border border-slate-200 p-2 text-center font-bold font-mono focus:outline-none focus:bg-white focus:border-[#FF9F00]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase text-center block">Draw Odds</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newDrawOdds}
                      onChange={(e) => setNewDrawOdds(e.target.value)}
                      className="w-full rounded-xl bg-slate-50 border border-slate-200 p-2 text-center font-bold font-mono focus:outline-none focus:bg-white focus:border-[#FF9F00]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase text-center block">Away Win</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newAwayOdds}
                      onChange={(e) => setNewAwayOdds(e.target.value)}
                      className="w-full rounded-xl bg-slate-50 border border-slate-200 p-2 text-center font-bold font-mono focus:outline-none focus:bg-white focus:border-[#FF9F00]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Fixture Schedule Time</label>
                  <input
                    type="text"
                    required
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    placeholder="e.g., Live, Today 23:30, Tomorrow 16:00"
                    className="w-full rounded-xl bg-white border border-slate-200 p-2.5 text-slate-800 font-bold focus:outline-none focus:border-[#FF9F00]"
                  />
                </div>

                {matchAddFeedback && (
                  <p className={`text-[10px] font-bold text-center py-2.5 rounded-xl border ${
                    matchAddFeedback.includes('successfully') || matchAddFeedback.includes('created') ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-red-600 bg-red-50 border-red-100'
                  }`}>
                    {matchAddFeedback}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={matchAddLoading}
                  className="w-full py-3 rounded-xl bg-slate-900 hover:bg-[#1FA66A] text-white font-black uppercase text-[10.5px] tracking-widest transition cursor-pointer"
                >
                  {matchAddLoading ? 'Creating Fixture...' : 'Publish Event'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* -------------------- POPUP 2: MATCH EDIT/MANIPULATE MODAL -------------------- */}
      <AnimatePresence>
        {editingMatch && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingMatch(null)}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="bg-slate-950 text-white p-5 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-slate-900 rounded-xl text-[#FF9F00] border border-slate-800 animate-pulse">
                    <FileEdit className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 font-mono">Live Scoreboard Override</span>
                    <h4 className="text-[12.5px] font-black text-white">{editingMatch.homeTeam.name} vs {editingMatch.awayTeam.name}</h4>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingMatch(null)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer border border-white/10"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSaveEdit} className="p-6 space-y-4 bg-slate-50/40 text-xs">
                
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block text-center">Live Scoreboard and Odds Manipulator</span>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase text-center block">Home score</label>
                    <input
                      type="number"
                      value={editHomeScore}
                      onChange={(e) => setEditHomeScore(e.target.value)}
                      className="w-full rounded-xl bg-white border border-slate-200 p-2.5 text-center font-bold text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase text-center block">Away score</label>
                    <input
                      type="number"
                      value={editAwayScore}
                      onChange={(e) => setEditAwayScore(e.target.value)}
                      className="w-full rounded-xl bg-white border border-slate-200 p-2.5 text-center font-bold text-sm"
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Status</label>
                    <select
                      value={editStatus}
                      onChange={(e: any) => setEditStatus(e.target.value)}
                      className="w-full rounded-xl bg-white border border-slate-200 p-2 text-slate-700 font-bold"
                    >
                      <option value="upcoming">Upcoming</option>
                      <option value="live">Live</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Match Time Override</label>
                  <input
                    type="text"
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    className="w-full rounded-xl bg-white border border-slate-200 p-2.5 text-xs font-semibold"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 bg-white p-3.5 rounded-2xl border border-slate-100 shadow-inner">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase text-center block">Home Odds</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editHomeOdds}
                      onChange={(e) => setEditHomeOdds(e.target.value)}
                      className="w-full rounded-xl bg-slate-50 border border-slate-200 p-2 text-center font-mono font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase text-center block">Draw Odds</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editDrawOdds}
                      onChange={(e) => setEditDrawOdds(e.target.value)}
                      className="w-full rounded-xl bg-slate-50 border border-slate-200 p-2 text-center font-mono font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase text-center block">Away Odds</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editAwayOdds}
                      onChange={(e) => setEditAwayOdds(e.target.value)}
                      className="w-full rounded-xl bg-slate-50 border border-slate-200 p-2 text-center font-mono font-bold"
                    />
                  </div>
                </div>

                {editFeedback && (
                  <p className="text-[10px] text-center font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 p-2 rounded-xl">
                    {editFeedback}
                  </p>
                )}

                <div className="flex space-x-2.5 justify-end pt-1 border-t border-slate-150">
                  <button
                    type="button"
                    onClick={() => setEditingMatch(null)}
                    className="py-2.5 px-4 rounded-xl text-[10px] font-bold border border-slate-200 text-slate-500 hover:bg-slate-100 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="py-2.5 px-5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-slate-900 hover:bg-[#1FA66A] text-white transition cursor-pointer"
                  >
                    {editLoading ? 'Saving...' : 'Save Updates'}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* -------------------- POPUP 3: MATCH WINNER SETTLER MODAL -------------------- */}
      <AnimatePresence>
        {settleMatch && (
          <div className="fixed inset-0 z-[1100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSettleMatch(null)}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            />

            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl"
            >
              <div className="flex justify-between items-center border-b border-slate-150 pb-2.5">
                <div className="flex items-center space-x-2">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  <h4 className="text-[12.5px] font-black uppercase text-slate-800 tracking-wider">Settle Winner Result</h4>
                </div>
                <button onClick={() => setSettleMatch(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              <p className="text-[11px] text-slate-500 leading-normal">
                Pick the outcome for <span className="font-extrabold text-slate-700">{settleMatch.homeTeam.name} vs {settleMatch.awayTeam.name}</span>. Settle is non-reversible; winners will instantly receive payout multiples in their wallets!
              </p>

              <form onSubmit={handleSettleMatch} className="space-y-4 text-xs">
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSettleWinner('home')}
                    className={`py-2.5 rounded-xl font-black uppercase tracking-wider text-[10px] border transition ${
                      settleWinner === 'home' ? 'bg-[#1FA66A] text-white border-[#1FA66A] shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Home Win
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettleWinner('draw')}
                    className={`py-2.5 rounded-xl font-black uppercase tracking-wider text-[10px] border transition ${
                      settleWinner === 'draw' ? 'bg-[#1FA66A] text-white border-[#1FA66A] shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Draw Game
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettleWinner('away')}
                    className={`py-2.5 rounded-xl font-black uppercase tracking-wider text-[10px] border transition ${
                      settleWinner === 'away' ? 'bg-[#1FA66A] text-white border-[#1FA66A] shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Away Win
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={settleLoading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FF9F00] to-amber-500 text-slate-950 font-black uppercase tracking-wider transition shadow-md shadow-[#FF9F00]/15 hover:opacity-90 cursor-pointer"
                >
                  {settleLoading ? 'Settle & Crediting Players...' : 'Authorize Payout Disbursals'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
