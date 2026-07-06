/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, Search, ShieldAlert, CircleDollarSign, 
  Sparkles, CheckCircle2, Clock, Calendar, Check, X,
  Bookmark, BookmarkCheck
} from 'lucide-react';
import { Match, Prediction, User, SportType } from '../types';
import { translations, Language } from '../utils/lang';

interface SportsBookProps {
  user: User | null;
  lang: Language;
  onRefreshUser: () => void;
  onAuthTrigger: () => void;
}

const SPORTS_CATS: { id: SportType; label: string; icon: string }[] = [
  { id: 'football', label: 'Football', icon: '⚽' },
  { id: 'cricket', label: 'Cricket', icon: '🏏' },
  { id: 'tennis', label: 'Tennis', icon: '🎾' },
  { id: 'basketball', label: 'Basketball', icon: '🏀' },
  { id: 'esports', label: 'eSports', icon: '🎮' }
];

export default function SportsBook({ user, lang, onRefreshUser, onAuthTrigger }: SportsBookProps) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedSport, setSelectedSport] = useState<SportType>('football');
  const [filterType, setFilterType] = useState<'live' | 'upcoming'>('live');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Bet Slip state (Single bet prediction model)
  const [betSlipMatch, setBetSlipMatch] = useState<Match | null>(null);
  const [betSlipSelection, setBetSlipSelection] = useState<'home' | 'draw' | 'away' | null>(null);
  const [betAmount, setBetAmount] = useState<string>('500');
  const [submittingBet, setSubmittingBet] = useState(false);
  const [betFeedback, setBetFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Active user predictions state
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [predictionsLoading, setPredictionsLoading] = useState(false);

  const t = translations[lang];

  // Fetch matches from REST API
  const fetchMatches = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/sports/matches?status=${filterType}&sport=${selectedSport}`);
      if (res.ok) {
        const data = await res.json();
        setMatches(data);
      }
    } catch (err) {
      console.error('Error fetching matches:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch current user predictions
  const fetchMyPredictions = async () => {
    if (!user) return;
    try {
      setPredictionsLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/sports/my-predictions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPredictions(data);
      }
    } catch (err) {
      console.error('Error fetching predictions:', err);
    } finally {
      setPredictionsLoading(false);
    }
  };

  // Poll matches list and user predictions every 10 seconds to keep live feeds fresh
  useEffect(() => {
    fetchMatches();
  }, [selectedSport, filterType]);

  useEffect(() => {
    fetchMyPredictions();
  }, [user]);

  // Live polling ticks
  useEffect(() => {
    const timer = setInterval(() => {
      // Re-fetch matches silently to simulate live ticker odds changes
      const fetchSilent = async () => {
        try {
          const res = await fetch(`/api/sports/matches?status=${filterType}&sport=${selectedSport}`);
          if (res.ok) {
            const data = await res.json();
            setMatches(data);
          }
        } catch (e) {}
      };
      fetchSilent();
    }, 8000);
    return () => clearInterval(timer);
  }, [selectedSport, filterType]);

  const handleSelectOdds = (match: Match, selection: 'home' | 'draw' | 'away') => {
    if (!user) {
      onAuthTrigger();
      return;
    }
    setBetSlipMatch(match);
    setBetSlipSelection(selection);
    setBetFeedback(null);
  };

  const handlePlacePrediction = async () => {
    if (!user || !betSlipMatch || !betSlipSelection) return;
    
    const amt = parseFloat(betAmount);
    if (isNaN(amt) || amt < 50) {
      setBetFeedback({ type: 'error', message: 'Minimum prediction amount is ৳50.' });
      return;
    }

    if (user.balance < amt) {
      setBetFeedback({ type: 'error', message: 'Insufficient wallet balance.' });
      return;
    }

    try {
      setSubmittingBet(true);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/sports/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          matchId: betSlipMatch.id,
          selection: betSlipSelection,
          betAmount: amt
        })
      });

      const data = await res.json();
      if (res.ok) {
        setBetFeedback({ 
          type: 'success', 
          message: `Prediction placed successfully! (Gained +${data.gainedVipPoints} VIP points)` 
        });
        onRefreshUser();
        fetchMyPredictions();
        // Clear bet slip after 2 seconds
        setTimeout(() => {
          setBetSlipMatch(null);
          setBetSlipSelection(null);
          setBetFeedback(null);
        }, 3000);
      } else {
        setBetFeedback({ type: 'error', message: data.error || 'Prediction failed.' });
      }
    } catch (err) {
      setBetFeedback({ type: 'error', message: 'Network connection failed.' });
    } finally {
      setSubmittingBet(false);
    }
  };

  // Determine current odds on the slip
  const getSelectedOddsValue = () => {
    if (!betSlipMatch || !betSlipSelection) return 0;
    if (betSlipSelection === 'home') return betSlipMatch.odds.homeWin;
    if (betSlipSelection === 'draw') return betSlipMatch.odds.draw;
    if (betSlipSelection === 'away') return betSlipMatch.odds.awayWin;
    return 0;
  };

  const currentOdds = getSelectedOddsValue();
  const potentialPayout = +(parseFloat(betAmount || '0') * currentOdds).toFixed(2);

  const filteredMatches = matches.filter(m => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.league.toLowerCase().includes(q) ||
      m.homeTeam.name.toLowerCase().includes(q) ||
      m.awayTeam.name.toLowerCase().includes(q)
    );
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-4">
      
      {/* LEFT COLUMN: SPORTSBOOK FEED */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Category Carousel Slider */}
        <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-hide">
          {SPORTS_CATS.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedSport(cat.id)}
              className={`flex items-center space-x-2 rounded-2xl px-5 py-3.5 text-sm font-bold transition shrink-0 border ${
                selectedSport === cat.id 
                  ? 'bg-gradient-to-r from-[#1FA66A] to-[#0D6B45] text-white border-[#1FA66A] shadow-md shadow-[#1FA66A]/20 scale-[1.02]' 
                  : 'bg-white/70 backdrop-blur-md text-slate-600 hover:text-slate-900 border-slate-200/60 hover:border-slate-300 shadow-sm'
              }`}
            >
              <span className="text-lg">{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Live vs Upcoming Selector and Search */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white/70 backdrop-blur-md p-3 rounded-2xl border border-slate-200/60 shadow-sm">
          <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl w-fit">
            <button
              onClick={() => setFilterType('live')}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-black transition uppercase ${
                filterType === 'live' 
                  ? 'bg-[#1FA66A] text-white shadow' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <span>{t.liveMatches}</span>
            </button>
            <button
              onClick={() => setFilterType('upcoming')}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-black transition uppercase ${
                filterType === 'upcoming' 
                  ? 'bg-white border border-slate-200 shadow-sm text-slate-800' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Calendar className="h-3 w-3 text-[#FF9F00]" />
              <span>{t.upcomingMatches}</span>
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchLeague}
              className="w-full sm:w-60 rounded-xl bg-white border border-slate-200 py-2 pl-10 pr-4 text-xs text-slate-800 focus:border-[#1FA66A] focus:outline-none focus:ring-1 focus:ring-[#1FA66A] shadow-sm"
            />
          </div>
        </div>

        {/* Matches Feed Cards */}
        <div className="space-y-3.5">
          {loading ? (
            /* Loading skeletons */
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 rounded-2xl bg-slate-100 animate-pulse border border-slate-200/60" />
              ))}
            </div>
          ) : filteredMatches.length === 0 ? (
            <div className="rounded-2xl border border-slate-200/60 bg-white/70 backdrop-blur-md py-14 text-center shadow-sm">
              <Trophy className="mx-auto h-12 w-12 text-slate-400 mb-3" />
              <p className="text-sm font-semibold text-slate-700">{t.noMatches}</p>
              <p className="text-xs text-slate-500 mt-1">Please try choosing another category or filter.</p>
            </div>
          ) : (
            filteredMatches.map(match => (
              <motion.div
                key={match.id}
                layoutId={`match_${match.id}`}
                className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white/70 backdrop-blur-md hover:border-[#1FA66A]/40 hover:bg-white hover:shadow-md transition-all duration-300 shadow-sm"
              >
                {/* League Header */}
                <div className="flex items-center justify-between bg-slate-50/80 px-4 py-2 text-[11px] font-bold text-slate-500 border-b border-slate-100">
                  <span className="tracking-wide">{match.league}</span>
                  {match.status === 'live' ? (
                    <span className="flex items-center space-x-1.5 rounded-full bg-[#1FA66A]/10 border border-[#1FA66A]/30 px-2 py-0.5 text-[9px] font-black text-[#1FA66A] uppercase tracking-wider animate-pulse">
                      <span>LIVE</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-1 text-slate-400">
                      <Clock className="h-3 w-3 text-[#FF9F00]" />
                      <span>{match.time}</span>
                    </span>
                  )}
                </div>

                <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Teams Score Layout */}
                  <div className="flex-1 grid grid-cols-7 items-center gap-2">
                    <div className="col-span-3 text-right">
                      <h4 className="text-sm font-extrabold text-slate-900">{match.homeTeam.name}</h4>
                      <span className="text-xs text-slate-500">{match.homeTeam.logo} Host</span>
                    </div>

                    <div className="col-span-1 text-center bg-slate-50 py-2.5 rounded-xl border border-slate-200/60 shadow-inner">
                      <span className="block text-lg font-black text-[#FF9F00] font-mono leading-none">
                        {match.status === 'live' ? match.homeScore : '-'}
                      </span>
                      <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block mt-1">VS</span>
                      <span className="block text-lg font-black text-[#FF9F00] font-mono leading-none">
                        {match.status === 'live' ? match.awayScore : '-'}
                      </span>
                    </div>

                    <div className="col-span-3 text-left">
                      <h4 className="text-sm font-extrabold text-slate-900">{match.awayTeam.name}</h4>
                      <span className="text-xs text-slate-500">{match.awayTeam.logo} Guest</span>
                    </div>
                  </div>

                  {/* Odds Betting Buttons Column */}
                  <div className="flex flex-row md:flex-col lg:flex-row gap-2 self-center w-full md:w-auto">
                    {/* Home Odds */}
                    <button
                      onClick={() => handleSelectOdds(match, 'home')}
                      className={`flex-1 md:w-28 flex flex-col items-center justify-center rounded-xl py-2 px-3 transition border text-xs font-bold ${
                        betSlipMatch?.id === match.id && betSlipSelection === 'home'
                          ? 'bg-[#1FA66A] border-[#1FA66A] text-white shadow-lg'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200 hover:border-[#1FA66A]/30 text-slate-800'
                      }`}
                    >
                      <span className="text-[10px] text-slate-500 mb-0.5 uppercase tracking-wider">Home</span>
                      <span className="text-sm font-black font-mono text-[#FF9F00]">{match.odds.homeWin.toFixed(2)}</span>
                    </button>

                    {/* Draw Odds (if exist) */}
                    {match.odds.draw > 0 && (
                      <button
                        onClick={() => handleSelectOdds(match, 'draw')}
                        className={`flex-1 md:w-24 flex flex-col items-center justify-center rounded-xl py-2 px-3 transition border text-xs font-bold ${
                          betSlipMatch?.id === match.id && betSlipSelection === 'draw'
                            ? 'bg-[#1FA66A] border-[#1FA66A] text-white shadow-lg'
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200 hover:border-[#1FA66A]/30 text-slate-800'
                        }`}
                      >
                        <span className="text-[10px] text-slate-500 mb-0.5 uppercase tracking-wider">Draw</span>
                        <span className="text-sm font-black font-mono text-slate-800">{match.odds.draw.toFixed(2)}</span>
                      </button>
                    )}

                    {/* Away Odds */}
                    <button
                      onClick={() => handleSelectOdds(match, 'away')}
                      className={`flex-1 md:w-28 flex flex-col items-center justify-center rounded-xl py-2 px-3 transition border text-xs font-bold ${
                        betSlipMatch?.id === match.id && betSlipSelection === 'away'
                          ? 'bg-[#1FA66A] border-[#1FA66A] text-white shadow-lg'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200 hover:border-[#1FA66A]/30 text-slate-800'
                      }`}
                    >
                      <span className="text-[10px] text-slate-500 mb-0.5 uppercase tracking-wider">Away</span>
                      <span className="text-sm font-black font-mono text-[#FF9F00]">{match.odds.awayWin.toFixed(2)}</span>
                    </button>
                  </div>

                </div>

                {/* Live Match Stats Placeholder (Football Only) */}
                {match.status === 'live' && match.stats && (
                  <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-2 flex items-center justify-around text-[10px] font-bold text-slate-500 font-mono">
                    <span>Possession: {match.stats.possession?.[0]}% - {match.stats.possession?.[1]}%</span>
                    <span>Corners: {match.stats.corners?.[0]} - {match.stats.corners?.[1]}</span>
                    <span>Shots on target: {match.stats.shotsOnTarget?.[0]} - {match.stats.shotsOnTarget?.[1]}</span>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>

      </div>

      {/* RIGHT COLUMN: BET SLIP & PREDICTION TICKETS */}
      <div className="space-y-6">
        
        {/* BET SLIP PANEL */}
        <div className="rounded-2xl border border-slate-200/60 bg-white/70 backdrop-blur-md p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <h3 className="text-sm font-black tracking-wider text-slate-800 uppercase flex items-center space-x-2">
              <Bookmark className="h-4.5 w-4.5 text-[#1FA66A]" />
              <span>{t.betSlip}</span>
            </h3>
            {betSlipMatch && (
              <button 
                onClick={() => { setBetSlipMatch(null); setBetSlipSelection(null); }}
                className="text-xs text-slate-400 hover:text-slate-800"
              >
                Clear
              </button>
            )}
          </div>

          {betSlipMatch && betSlipSelection ? (
            <div className="space-y-4">
              
              {/* Slip Card Details */}
              <div className="rounded-xl bg-slate-50/80 p-3 border border-slate-200 text-xs shadow-inner">
                <div className="flex justify-between font-bold text-slate-400 text-[10px] uppercase tracking-wide mb-1">
                  <span>{betSlipMatch.league}</span>
                  <span className="text-red-500">{betSlipMatch.time}</span>
                </div>
                <h4 className="font-extrabold text-slate-900 mb-2">{betSlipMatch.homeTeam.name} vs {betSlipMatch.awayTeam.name}</h4>
                
                <div className="flex justify-between items-center bg-[#1FA66A]/10 border border-[#1FA66A]/20 rounded-lg p-2 mt-2">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-semibold">My Prediction Choice</span>
                    <span className="font-extrabold text-[#1FA66A] uppercase text-xs">
                      {betSlipSelection === 'home' ? betSlipMatch.homeTeam.name : betSlipSelection === 'away' ? betSlipMatch.awayTeam.name : 'Draw Game'}
                    </span>
                  </div>
                  <span className="text-base font-black font-mono text-[#FF9F00]">@{currentOdds.toFixed(2)}</span>
                </div>
              </div>

              {/* Stake Amount Form */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-500 font-semibold">
                  <span>{t.stakeAmount} (৳ BDT)</span>
                  {user && <span>Max: ৳{user.balance.toLocaleString()}</span>}
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-extrabold text-slate-400">৳</span>
                  <input
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    min="50"
                    className="w-full rounded-xl bg-white border border-slate-200 py-2.5 pl-8 pr-12 text-sm font-black font-mono text-slate-800 focus:border-[#1FA66A] focus:ring-1 focus:ring-[#1FA66A] focus:outline-none focus:bg-white"
                  />
                  <span className="absolute right-3.5 top-3 text-[10px] font-bold text-[#FF9F00]">BDT</span>
                </div>

                {/* Quick stake selectors */}
                <div className="grid grid-cols-4 gap-1.5 mt-2">
                  {['200', '500', '1000', '5000'].map(val => (
                    <button
                      key={val}
                      onClick={() => setBetAmount(val)}
                      className={`py-1 rounded-lg text-[10px] font-black border transition ${
                        betAmount === val 
                          ? 'bg-[#1FA66A]/10 border-[#1FA66A] text-[#1FA66A]' 
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-500'
                      }`}
                    >
                      +৳{val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Potential Payout */}
              <div className="rounded-xl bg-slate-50 p-3 flex justify-between items-center text-xs border border-slate-200 shadow-inner leading-none">
                <span className="text-slate-500 font-bold">{t.potentialPayout}</span>
                <span className="text-lg font-black text-[#FF9F00] font-mono">৳{potentialPayout.toLocaleString()}</span>
              </div>

              {/* Feedback messages */}
              {betFeedback && (
                <div className={`p-3 rounded-xl text-xs leading-relaxed font-semibold border ${
                  betFeedback.type === 'success' 
                    ? 'bg-green-50 border-green-200 text-green-600' 
                    : 'bg-red-50 border-red-200 text-red-600'
                }`}>
                  {betFeedback.message}
                </div>
              )}

              {/* Place prediction CTA */}
              <button
                onClick={handlePlacePrediction}
                disabled={submittingBet}
                className="w-full rounded-xl bg-gradient-to-r from-[#1FA66A] to-[#0D6B45] py-3 text-xs font-black text-white hover:brightness-110 shadow-lg shadow-[#1FA66A]/20 transition disabled:opacity-50"
              >
                {submittingBet ? 'Placing Prediction...' : t.placeBet}
              </button>

            </div>
          ) : (
            <div className="text-center py-10 text-slate-400">
              <BookmarkCheck className="mx-auto h-12 w-12 text-slate-300 mb-3" />
              <p className="text-xs font-bold">{t.selectOdd}</p>
            </div>
          )}
        </div>

        {/* MY PLACED BETS PREDICTIONS */}
        {user && (
          <div className="rounded-2xl border border-slate-200/60 bg-white/70 backdrop-blur-md p-5 shadow-sm">
            <h3 className="text-xs font-black tracking-wider text-slate-800 uppercase border-b border-slate-100 pb-3 mb-4 flex items-center space-x-2">
              <CircleDollarSign className="h-4.5 w-4.5 text-[#FF9F00]" />
              <span>{t.placedPredictions}</span>
            </h3>

            <div className="space-y-3 max-h-80 overflow-y-auto">
              {predictionsLoading && predictions.length === 0 ? (
                <p className="text-center py-6 text-xs text-slate-400 animate-pulse">Loading tickets...</p>
              ) : predictions.length === 0 ? (
                <p className="text-center py-6 text-xs text-slate-400">No active tickets.</p>
              ) : (
                predictions.map(pred => (
                  <div key={pred.id} className="rounded-xl border border-slate-200/60 bg-white p-3 text-xs space-y-1 shadow-sm">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 font-mono">
                      <span>{pred.matchDetails.league}</span>
                      <span>{new Date(pred.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h4 className="font-bold text-slate-800 text-[11px]">{pred.matchDetails.homeTeam} vs {pred.matchDetails.awayTeam}</h4>
                    
                    <div className="flex justify-between items-center pt-1.5 mt-1 border-t border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold uppercase leading-none mb-0.5">Selection</span>
                        <span className="font-extrabold text-slate-900 uppercase text-[10px] leading-none">
                          {pred.selection === 'home' ? pred.matchDetails.homeTeam : pred.selection === 'away' ? pred.matchDetails.awayTeam : 'Draw'} 
                          <span className="text-[#FF9F00] font-mono ml-1">@{pred.odds.toFixed(2)}</span>
                        </span>
                      </div>
                      
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-semibold leading-none mb-0.5">Stake: ৳{pred.betAmount}</span>
                        {pred.status === 'pending' ? (
                          <span className="inline-block rounded-full bg-amber-50 border border-amber-100 px-2 py-0.5 text-[9px] font-black text-amber-600 uppercase font-mono">
                            Pending
                          </span>
                        ) : pred.status === 'won' ? (
                          <span className="inline-block rounded-full bg-green-50 border border-green-100 px-2 py-0.5 text-[9px] font-black text-green-600 uppercase font-mono">
                            WON +৳{pred.potentialPayout}
                          </span>
                        ) : (
                          <span className="inline-block rounded-full bg-red-50 border border-red-100 px-2 py-0.5 text-[9px] font-black text-red-600 uppercase font-mono">
                            LOST
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
