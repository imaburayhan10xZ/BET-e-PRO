/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Trophy, Plus, Trash2, Check, X, RefreshCw, Sliders, Calendar } from 'lucide-react';
import { Match } from '../../types';

interface MatchesPanelProps {
  matches: Match[];
  loading: boolean;
  onRefresh: () => void;
  onRefreshUser: () => void;
}

export default function MatchesPanel({ matches, loading, onRefresh, onRefreshUser }: MatchesPanelProps) {
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

  // Settle Match States
  const [settleMatch, setSettleMatch] = useState<Match | null>(null);
  const [settleWinner, setSettleWinner] = useState<'home' | 'draw' | 'away'>('home');
  const [settleLoading, setSettleLoading] = useState(false);

  // Scoreboard manipulator state (Advanced Control)
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
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
    setEditingMatchId(m.id);
    setEditHomeScore(m.homeScore.toString());
    setEditAwayScore(m.awayScore.toString());
    setEditHomeOdds(m.odds.homeWin.toString());
    setEditDrawOdds((m.odds.draw || 0).toString());
    setEditAwayOdds(m.odds.awayWin.toString());
    setEditTime(m.time);
    setEditStatus(m.status);
    setEditFeedback('');
  };

  const handleSaveEdit = async (id: string) => {
    try {
      setEditLoading(true);
      setEditFeedback('');
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/matches/${id}`, {
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
        setTimeout(() => {
          setEditingMatchId(null);
          onRefresh();
        }, 1000);
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
      className="space-y-6"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Active Fixtures list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider">Scheduled Event Fixtures</h3>
            <button onClick={onRefresh} className="p-1 rounded text-slate-500 hover:text-slate-800 transition">
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {loading && matches.length === 0 ? (
              <p className="text-center py-10 text-slate-400 animate-pulse">Gathering stadium schedules...</p>
            ) : matches.length === 0 ? (
              <p className="text-center py-10 text-slate-400 font-medium">No games scheduled. Add one below!</p>
            ) : (
              matches.map(m => (
                <div key={m.id} className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-3 shadow-sm hover:shadow-md transition">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                        {m.sport} • {m.league}
                      </span>
                      <h4 className="font-extrabold text-slate-900 text-xs mt-1">
                        {m.homeTeam.logo} {m.homeTeam.name} <span className="text-[#FF9F00] font-mono px-1">{m.homeScore} - {m.awayScore}</span> {m.awayTeam.name} {m.awayTeam.logo}
                      </h4>
                      <div className="flex items-center space-x-2 mt-1.5 text-[10px] text-slate-500 font-bold">
                        <span className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          <span>{m.time}</span>
                        </span>
                        <span>•</span>
                        <span className={`uppercase font-black text-[9px] ${
                          m.status === 'live' ? 'text-emerald-600' : m.status === 'completed' ? 'text-slate-400' : 'text-amber-500'
                        }`}>
                          {m.status}
                        </span>
                      </div>
                    </div>

                    <div className="flex space-x-1.5">
                      {m.status !== 'completed' && (
                        <>
                          <button
                            onClick={() => handleOpenEdit(m)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-1.5 rounded-lg text-[10px] font-black transition"
                            title="Edit scores and odds"
                          >
                            <Sliders className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setSettleMatch(m)}
                            className="bg-[#FF9F00] hover:bg-[#E08C00] text-slate-950 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition"
                          >
                            Settle Game
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDeleteMatch(m.id)}
                        className="bg-red-50 text-red-600 hover:bg-red-500 hover:text-white p-1.5 rounded-lg transition"
                        title="Delete fixture"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Inline Score/Odds edit block */}
                  {editingMatchId === m.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="bg-white border border-slate-200/85 p-4 rounded-xl mt-3 space-y-3 text-xs shadow-inner"
                    >
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Live Scoreboard and Odds Manipulator</span>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Home score</label>
                          <input
                            type="number"
                            value={editHomeScore}
                            onChange={(e) => setEditHomeScore(e.target.value)}
                            className="w-full rounded-lg bg-slate-50 border border-slate-200 p-1.5 text-center font-bold"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Away score</label>
                          <input
                            type="number"
                            value={editAwayScore}
                            onChange={(e) => setEditAwayScore(e.target.value)}
                            className="w-full rounded-lg bg-slate-50 border border-slate-200 p-1.5 text-center font-bold"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Match Time</label>
                          <input
                            type="text"
                            value={editTime}
                            onChange={(e) => setEditTime(e.target.value)}
                            className="w-full rounded-lg bg-slate-50 border border-slate-200 p-1.5"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Status</label>
                          <select
                            value={editStatus}
                            onChange={(e: any) => setEditStatus(e.target.value)}
                            className="w-full rounded-lg bg-slate-50 border border-slate-200 p-1 text-slate-700"
                          >
                            <option value="upcoming">Upcoming</option>
                            <option value="live">Live</option>
                            <option value="completed">Completed</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase text-center block">Home Odds</label>
                          <input
                            type="number"
                            step="0.01"
                            value={editHomeOdds}
                            onChange={(e) => setEditHomeOdds(e.target.value)}
                            className="w-full rounded-lg bg-slate-50 border border-slate-200 p-1.5 text-center font-mono font-bold"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase text-center block">Draw Odds</label>
                          <input
                            type="number"
                            step="0.01"
                            value={editDrawOdds}
                            onChange={(e) => setEditDrawOdds(e.target.value)}
                            className="w-full rounded-lg bg-slate-50 border border-slate-200 p-1.5 text-center font-mono font-bold"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase text-center block">Away Odds</label>
                          <input
                            type="number"
                            step="0.01"
                            value={editAwayOdds}
                            onChange={(e) => setEditAwayOdds(e.target.value)}
                            className="w-full rounded-lg bg-slate-50 border border-slate-200 p-1.5 text-center font-mono font-bold"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => setEditingMatchId(null)}
                          className="py-1.5 px-3 rounded-lg text-[10px] font-bold border border-slate-200 text-slate-500 hover:bg-slate-50 transition"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveEdit(m.id)}
                          disabled={editLoading}
                          className="py-1.5 px-4 rounded-lg text-[10px] font-bold bg-[#1FA66A] hover:bg-[#157D4F] text-white transition"
                        >
                          {editLoading ? 'Saving...' : 'Save Updates'}
                        </button>
                      </div>

                      {editFeedback && (
                        <p className="text-[10px] text-center font-bold text-slate-600">{editFeedback}</p>
                      )}
                    </motion.div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Fixture Builder form */}
        <div className="lg:col-span-1">
          <div className="bg-slate-50/50 border border-slate-200 p-5 rounded-2xl space-y-4 shadow-sm">
            <div className="border-b border-slate-200/80 pb-2.5 flex items-center space-x-2">
              <Plus className="h-4.5 w-4.5 text-[#FF9F00]" />
              <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">Schedule Event</h4>
            </div>

            <form onSubmit={handleCreateMatch} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Sport Type</label>
                  <select
                    value={newSport}
                    onChange={(e) => setNewSport(e.target.value)}
                    className="w-full rounded-xl bg-white border border-slate-200 p-2.5 text-slate-800"
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
                    className="w-full rounded-xl bg-white border border-slate-200 p-2.5 text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Home Team</label>
                  <input
                    type="text"
                    required
                    value={newHomeTeam}
                    onChange={(e) => setNewHomeTeam(e.target.value)}
                    placeholder="e.g. Barcelona"
                    className="w-full rounded-xl bg-white border border-slate-200 p-2.5 text-slate-800 focus:outline-none"
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
                    className="w-full rounded-xl bg-white border border-slate-200 p-2.5 text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase text-center block">Home Win</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newHomeOdds}
                    onChange={(e) => setNewHomeOdds(e.target.value)}
                    className="w-full rounded-xl bg-white border border-slate-200 p-2 text-center font-bold font-mono focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase text-center block">Draw Odds</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newDrawOdds}
                    onChange={(e) => setNewDrawOdds(e.target.value)}
                    className="w-full rounded-xl bg-white border border-slate-200 p-2 text-center font-bold font-mono focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase text-center block">Away Win</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newAwayOdds}
                    onChange={(e) => setNewAwayOdds(e.target.value)}
                    className="w-full rounded-xl bg-white border border-slate-200 p-2 text-center font-bold font-mono focus:outline-none"
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
                  className="w-full rounded-xl bg-white border border-slate-200 p-2.5 text-slate-800 focus:outline-none"
                />
              </div>

              {matchAddFeedback && (
                <p className={`text-[10px] font-bold text-center py-1.5 rounded-lg border ${
                  matchAddFeedback.includes('successfully') ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-red-600 bg-red-50 border-red-100'
                }`}>
                  {matchAddFeedback}
                </p>
              )}

              <button
                type="submit"
                disabled={matchAddLoading}
                className="w-full py-3 rounded-xl bg-[#1FA66A] hover:bg-[#157D4F] text-white font-black uppercase text-[10px] tracking-widest transition"
              >
                {matchAddLoading ? 'Creating Fixture...' : 'Publish Event'}
              </button>
            </form>
          </div>
        </div>

      </div>

      {/* Settle Modal overlay */}
      {settleMatch && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">Settle Winner Result</h4>
              <button onClick={() => setSettleMatch(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-[11px] text-slate-500 leading-normal">
              Pick the outcome for <span className="font-bold text-slate-700">{settleMatch.homeTeam.name} vs {settleMatch.awayTeam.name}</span>. Settle is non-reversible; winners will instantly receive payout multiples in their wallets!
            </p>

            <form onSubmit={handleSettleMatch} className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSettleWinner('home')}
                  className={`py-2 rounded-lg font-bold border transition ${
                    settleWinner === 'home' ? 'bg-[#1FA66A] text-white border-[#1FA66A]' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  Home Win
                </button>
                <button
                  type="button"
                  onClick={() => setSettleWinner('draw')}
                  className={`py-2 rounded-lg font-bold border transition ${
                    settleWinner === 'draw' ? 'bg-[#1FA66A] text-white border-[#1FA66A]' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  Draw Game
                </button>
                <button
                  type="button"
                  onClick={() => setSettleWinner('away')}
                  className={`py-2 rounded-lg font-bold border transition ${
                    settleWinner === 'away' ? 'bg-[#1FA66A] text-white border-[#1FA66A]' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  Away Win
                </button>
              </div>

              <button
                type="submit"
                disabled={settleLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FF9F00] to-amber-500 text-slate-950 font-black uppercase tracking-wider transition shadow-lg shadow-[#FF9F00]/15"
              >
                {settleLoading ? 'Settle & Crediting Players...' : 'Authorize Payout Disbursals'}
              </button>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
}
