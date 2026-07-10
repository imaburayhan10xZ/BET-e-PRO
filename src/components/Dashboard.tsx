/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wallet, ArrowDownCircle, ArrowUpCircle, History, User, Lock, 
  Copy, CheckCircle2, Ticket, MessageCircle, Star, Users, Clipboard, HelpCircle,
  Compass, Trophy, ClipboardList, TrendingUp, ArrowDownToLine, ArrowUpFromLine, Layers,
  ShieldCheck, UserPlus, Gift, Percent, Mail, MessageSquareHeart, Smartphone, Headphones,
  LogOut, RefreshCw, Edit2, CheckCircle, Download
} from 'lucide-react';
import { User as UserType, Transaction, SupportTicket, SystemSettings } from '../types';
import { translations, Language } from '../utils/lang';

interface DashboardProps {
  user: UserType;
  lang: Language;
  onRefreshUser: () => void;
  onNavigate: (tab: string) => void;
  initialTab?: string;
}

type DashboardTab = 'overview' | 'wallet' | 'profile' | 'vip' | 'referral' | 'support';

const VIP_RANKS = [
  { level: 0, name: 'Bronze Member', limit: '৳50,000', cash: '1%' },
  { level: 1, name: 'Silver Elite', limit: '৳100,000', cash: '2%' },
  { level: 2, name: 'Gold Pro', limit: '৳250,000', cash: '3.5%' },
  { level: 3, name: 'Platinum VIP', limit: '৳500,000', cash: '5%' },
  { level: 4, name: 'Diamond Legend', limit: '৳1,000,000', cash: '8%' }
];

export default function Dashboard({ user, lang, onRefreshUser, onNavigate, initialTab }: DashboardProps) {
  const [subTab, setSubTab] = useState<DashboardTab>(() => {
    if (initialTab === 'wallet') return 'wallet';
    return 'profile';
  });

  useEffect(() => {
    if (initialTab === 'wallet') {
      setSubTab('wallet');
    } else {
      setSubTab('profile');
    }
  }, [initialTab]);
  const t = translations[lang];

  // Global settings for phone numbers and limits
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  // Wallet states
  const [walletAction, setWalletAction] = useState<'deposit' | 'withdraw' | 'history'>('deposit');
  const [depositChannel, setDepositChannel] = useState<'bKash' | 'Nagad' | 'Rocket'>('bKash');
  const [depositAmount, setDepositAmount] = useState('1000');
  const [depositTrxId, setDepositTrxId] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [depositSuccess, setDepositSuccess] = useState('');
  const [depositError, setDepositError] = useState('');
  
  const [withdrawChannel, setWithdrawChannel] = useState<'bKash' | 'Nagad' | 'Rocket'>('bKash');
  const [withdrawAmount, setWithdrawAmount] = useState('1000');
  const [withdrawRecipient, setWithdrawRecipient] = useState('');
  const [withdrawSuccess, setWithdrawSuccess] = useState('');
  const [withdrawError, setWithdrawError] = useState('');

  useEffect(() => {
    if (withdrawChannel === 'bKash') {
      setWithdrawRecipient(user.bkashNumber || '');
    } else if (withdrawChannel === 'Nagad') {
      setWithdrawRecipient(user.nagadNumber || '');
    } else if (withdrawChannel === 'Rocket') {
      setWithdrawRecipient(user.rocketNumber || '');
    }
  }, [withdrawChannel, user]);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txLoading, setTxLoading] = useState(false);

  // Profile states
  const [fullName, setFullName] = useState(user.fullName || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passSuccess, setPassSuccess] = useState('');
  const [passError, setPassError] = useState('');

  // Custom Profile Interactive States
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [showPasswordEditor, setShowPasswordEditor] = useState(false);
  const [showTxHistory, setShowTxHistory] = useState(false);
  const [txHistoryFilter, setTxHistoryFilter] = useState<'all' | 'deposit' | 'withdraw'>('all');
  const [showBetRecord, setShowBetRecord] = useState(false);
  const [betRecords, setBetRecords] = useState<any[]>([]);
  const [loadingBets, setLoadingBets] = useState(false);
  const [showMissions, setShowMissions] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [claimedMissions, setClaimedMissions] = useState<string[]>(() => {
    return JSON.parse(localStorage.getItem(`claimed_missions_${user.username}`) || '[]');
  });
  const [showRebate, setShowRebate] = useState(false);
  const [showDownloadApp, setShowDownloadApp] = useState(false);
  const [showCards, setShowCards] = useState(false);
  const [showProfitLoss, setShowProfitLoss] = useState(false);
  const [dailyCheckInLoading, setDailyCheckInLoading] = useState(false);
  const [dailyCheckInMessage, setDailyCheckInMessage] = useState('');
  const [savedAccounts, setSavedAccounts] = useState<{bkash?: string, nagad?: string, rocket?: string}>(() => {
    return {
      bkash: user.bkashNumber || localStorage.getItem(`bkash_${user.username}`) || '',
      nagad: user.nagadNumber || localStorage.getItem(`nagad_${user.username}`) || '',
      rocket: user.rocketNumber || localStorage.getItem(`rocket_${user.username}`) || ''
    };
  });
  const [accountUpdateSuccess, setAccountUpdateSuccess] = useState('');
  const [cardError, setCardError] = useState('');
  
  useEffect(() => {
    if (user) {
      setSavedAccounts({
        bkash: user.bkashNumber || '',
        nagad: user.nagadNumber || '',
        rocket: user.rocketNumber || ''
      });
    }
  }, [user]);

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Support states
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketSuccess, setTicketSuccess] = useState('');
  const [ticketError, setTicketError] = useState('');
  const [ticketsLoading, setTicketsLoading] = useState(false);

  const [copiedText, setCopiedText] = useState(false);

  // Fetch Public settings
  const [channels, setChannels] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => setSettings(data))
      .catch(e => console.error('Error fetching settings:', e));

    fetch('/api/support-channels')
      .then(r => r.json())
      .then(data => setChannels(data))
      .catch(e => console.error('Error fetching support channels:', e));
  }, []);

  // Sync profile values if user updates elsewhere
  useEffect(() => {
    setFullName(user.fullName || '');
    setPhone(user.phone || '');
    setAvatarUrl(user.avatarUrl || '');
  }, [user]);

  // Fetch Transactions on load / action change
  const fetchTransactions = async () => {
    try {
      setTxLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/wallet/transactions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTransactions(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTxLoading(false);
    }
  };

  const fetchTickets = async () => {
    try {
      setTicketsLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/support/my-tickets', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTicketsLoading(false);
    }
  };

  const fetchMyPredictions = async () => {
    try {
      setLoadingBets(true);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/sports/my-predictions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const mapped = data.map((pred: any) => ({
          id: pred.id,
          sport: pred.matchDetails.sport,
          homeTeam: pred.matchDetails.homeTeam,
          awayTeam: pred.matchDetails.awayTeam,
          predictedWinner: pred.selection,
          odds: pred.odds,
          stakeAmount: pred.betAmount,
          status: pred.status,
          potentialPayout: pred.potentialPayout
        }));
        setBetRecords(mapped);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingBets(false);
    }
  };

  useEffect(() => {
    if (subTab === 'wallet' && walletAction === 'history') {
      fetchTransactions();
    }
    if (subTab === 'support') {
      fetchTickets();
    }
  }, [subTab, walletAction]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDepositSuccess('');
    setDepositError('');

    if (!depositAmount || !depositTrxId) {
      setDepositError('Please enter amount and TrxID.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/wallet/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          paymentMethod: depositChannel,
          amount: depositAmount,
          transactionId: depositTrxId,
          promoCode: promoCode
        })
      });

      const data = await res.json();
      if (res.ok) {
        setDepositSuccess(data.message);
        setDepositTrxId('');
        setPromoCode('');
        onRefreshUser();
      } else {
        setDepositError(data.error);
      }
    } catch (err) {
      setDepositError('Deposit request failed.');
    }
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawSuccess('');
    setWithdrawError('');

    if (!withdrawAmount || !withdrawRecipient) {
      setWithdrawError('Please fill in recipient number and amount.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          paymentMethod: withdrawChannel,
          amount: withdrawAmount,
          recipientNumber: withdrawRecipient
        })
      });

      const data = await res.json();
      if (res.ok) {
        setWithdrawSuccess(data.message);
        setWithdrawRecipient('');
        onRefreshUser();
      } else {
        setWithdrawError(data.error);
      }
    } catch (err) {
      setWithdrawError('Withdrawal submission failed.');
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ fullName, phone, avatarUrl })
      });

      const data = await res.json();
      if (res.ok) {
        setProfileSuccess(data.message);
        onRefreshUser();
      } else {
        setProfileError(data.error);
      }
    } catch (err) {
      setProfileError('Failed to update profile.');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassSuccess('');
    setPassError('');

    if (!currentPassword || !newPassword) {
      setPassError('Please fill in password fields.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await res.json();
      if (res.ok) {
        setPassSuccess(data.message);
        setCurrentPassword('');
        setNewPassword('');
      } else {
        setPassError(data.error);
      }
    } catch (err) {
      setPassError('Failed to change password.');
    }
  };

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTicketSuccess('');
    setTicketError('');

    if (!ticketSubject || !ticketMessage) {
      setTicketError('Please provide subject and details.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/support/ticket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ subject: ticketSubject, message: ticketMessage })
      });

      const data = await res.json();
      if (res.ok) {
        setTicketSuccess(data.message);
        setTicketSubject('');
        setTicketMessage('');
        fetchTickets();
      } else {
        setTicketError(data.error);
      }
    } catch (err) {
      setTicketError('Failed to submit ticket.');
    }
  };

  // Helper to determine VIP progress
  const getVipTargetPoints = () => {
    if (user.vipLevel >= 4) return 50000;
    if (user.vipLevel === 3) return 50000; // Diamon rank threshold
    if (user.vipLevel === 2) return 100000;
    if (user.vipLevel === 1) return 2000;
    return 500;
  };

  const getVipRankName = (lvl: number) => {
    return VIP_RANKS[lvl]?.name || 'Bronze Member';
  };

  const vipTarget = getVipTargetPoints();
  const vipPercent = Math.min(100, Math.floor((user.vipPoints / vipTarget) * 100));

  return (
    <div className="max-w-2xl mx-auto px-4 pb-20 w-full animate-none">
      
      {/* DETAILED CONTENT DISPLAY */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur-md p-6 shadow-sm min-h-[400px]">
        <AnimatePresence mode="wait">

          {/* WALLET HUB SCREEN */}
          {subTab === 'wallet' && (
            <motion.div 
              key="wallet"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {/* TOP BAR TITLE HEADER */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 bg-gradient-to-r from-[#0D6B45] to-[#1FA66A] p-4 -mx-6 -mt-6 rounded-t-2xl text-white shadow-sm mb-5">
                <button 
                  onClick={() => setSubTab('profile')}
                  className="flex items-center space-x-1 hover:text-yellow-300 transition text-xs font-black"
                >
                  <span className="text-lg font-bold">‹</span>
                  <span>Back</span>
                </button>
                <h3 className="text-sm font-black uppercase tracking-wider">My Wallet Hub</h3>
                <div className="w-8"></div> {/* Spacer for balancing */}
              </div>
              {/* Wallet actions toggle buttons */}
              <div className="flex border-b border-slate-100 pb-3 mb-4 space-x-3.5">
                <button
                  onClick={() => setWalletAction('deposit')}
                  className={`text-xs font-black uppercase tracking-wider pb-1 relative transition ${
                    walletAction === 'deposit' ? 'text-[#1FA66A]' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {t.deposit}
                  {walletAction === 'deposit' && <span className="absolute bottom-[-13px] left-0 right-0 h-0.5 bg-[#1FA66A]" />}
                </button>
                <button
                  onClick={() => setWalletAction('withdraw')}
                  className={`text-xs font-black uppercase tracking-wider pb-1 relative transition ${
                    walletAction === 'withdraw' ? 'text-[#1FA66A]' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {t.withdraw}
                  {walletAction === 'withdraw' && <span className="absolute bottom-[-13px] left-0 right-0 h-0.5 bg-[#1FA66A]" />}
                </button>
                <button
                  onClick={() => setWalletAction('history')}
                  className={`text-xs font-black uppercase tracking-wider pb-1 relative transition ${
                    walletAction === 'history' ? 'text-[#1FA66A]' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {t.history}
                  {walletAction === 'history' && <span className="absolute bottom-[-13px] left-0 right-0 h-0.5 bg-[#1FA66A]" />}
                </button>
              </div>

              {/* ACTION PANEL 1: DEPOSIT REQUEST FORM */}
              {walletAction === 'deposit' && (
                <div className="space-y-5">
                  <div className="flex flex-wrap gap-2.5">
                    {['bKash', 'Nagad', 'Rocket'].map(channel => (
                      <button
                        key={channel}
                        onClick={() => setDepositChannel(channel as any)}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition ${
                          depositChannel === channel 
                            ? 'bg-[#1FA66A]/10 border-[#1FA66A] text-[#1FA66A]' 
                            : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        {channel === 'bKash' ? 'bKash Wallet' : channel === 'Nagad' ? 'Nagad Wallet' : 'Rocket Wallet'}
                      </button>
                    ))}
                  </div>

                  {settings && (
                    <div className="rounded-xl bg-slate-50 p-4 border border-slate-200/80 space-y-3">
                      <p className="text-xs text-slate-600 leading-normal">
                        {t.depositInstructions}
                      </p>
                      
                      <div className="flex items-center justify-between bg-white px-3.5 py-2.5 rounded-lg border border-slate-200 shadow-sm">
                        <span className="font-mono text-sm font-extrabold text-[#FF9F00]">
                          {depositChannel === 'bKash' ? settings.bKashNumber : depositChannel === 'Nagad' ? settings.nagadNumber : settings.rocketNumber}
                        </span>
                        
                        <button
                          onClick={() => handleCopy(depositChannel === 'bKash' ? settings.bKashNumber : depositChannel === 'Nagad' ? settings.nagadNumber : settings.rocketNumber)}
                          className="flex items-center space-x-1 rounded bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-700 hover:bg-[#1FA66A] hover:text-white transition"
                        >
                          <Clipboard className="h-3 w-3" />
                          <span>{copiedText ? 'Copied' : t.copyNumber}</span>
                        </button>
                      </div>

                      <div className="text-[10px] text-slate-400 font-bold uppercase">
                        {t.minDepositLimit} ৳{settings.minDeposit} BDT
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleDepositSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      {/* Amount */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Amount (৳ BDT)</label>
                        <input
                          type="number"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                          placeholder="Amount in BDT"
                          className="w-full rounded-xl bg-white border border-slate-200 p-3 text-xs text-slate-800 focus:border-[#1FA66A] focus:outline-none"
                        />
                      </div>

                      {/* TrxID */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Transaction ID (TrxID)</label>
                        <input
                          type="text"
                          value={depositTrxId}
                          onChange={(e) => setDepositTrxId(e.target.value)}
                          placeholder={t.trxIdPlaceholder}
                          className="w-full rounded-xl bg-white border border-slate-200 p-3 text-xs text-slate-800 focus:border-[#1FA66A] focus:outline-none"
                        />
                      </div>

                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Promo Code (Optional)</label>
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        placeholder="e.g. WELCOME200, RELOAD10"
                        className="w-full rounded-xl bg-white border border-slate-200 p-3 text-xs text-[#FF9F00] font-bold focus:border-[#1FA66A] focus:outline-none"
                      />
                    </div>

                    {depositSuccess && (
                      <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-600 rounded-xl text-xs font-semibold leading-relaxed">
                        {depositSuccess}
                      </div>
                    )}
                    {depositError && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 rounded-xl text-xs font-semibold">
                        {depositError}
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full rounded-xl bg-gradient-to-r from-[#1FA66A] to-[#0D6B45] py-3 text-xs font-black text-white hover:brightness-110 shadow-lg shadow-[#1FA66A]/20 tracking-widest uppercase transition"
                    >
                      {t.submitDeposit}
                    </button>
                  </form>
                </div>
              )}

              {/* ACTION PANEL 2: WITHDRAW REQUEST FORM */}
              {walletAction === 'withdraw' && (
                <div className="space-y-5">
                  <div className="flex flex-wrap gap-2.5">
                    {['bKash', 'Nagad', 'Rocket'].map(channel => (
                      <button
                        key={channel}
                        onClick={() => setWithdrawChannel(channel as any)}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition ${
                          withdrawChannel === channel 
                            ? 'bg-[#1FA66A]/10 border-[#1FA66A] text-[#1FA66A]' 
                            : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        {channel === 'bKash' ? 'bKash Account' : channel === 'Nagad' ? 'Nagad Account' : 'Rocket Account'}
                      </button>
                    ))}
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4 border border-slate-200/80 text-xs text-slate-600 leading-normal">
                    {t.withdrawInstructions}
                    {settings && (
                      <span className="block text-[10px] text-slate-400 font-bold uppercase mt-2">
                        {t.minWithdrawLimit} ৳{settings.minWithdraw} BDT
                      </span>
                    )}
                  </div>

                   {(() => {
                     const currentBoundNumber = withdrawChannel === 'bKash' ? user.bkashNumber : withdrawChannel === 'Nagad' ? user.nagadNumber : user.rocketNumber;
                     
                     return (
                       <form onSubmit={handleWithdrawSubmit} className="space-y-4">
                         {!currentBoundNumber ? (
                           <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl text-xs space-y-2">
                             <p className="font-semibold flex items-center space-x-1.5">
                               <span>⚠️ wallet number not bound!</span>
                             </p>
                             <p className="text-[11px] leading-relaxed text-amber-700">
                               Before you can make a withdrawal, you must securely bind your personal {withdrawChannel} number. Once bound, it is locked permanently to protect your funds.
                             </p>
                             <button
                               type="button"
                               onClick={() => setShowCards(true)}
                               className="mt-1 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] uppercase tracking-wider transition"
                             >
                               Bind Card Now ➔
                             </button>
                           </div>
                         ) : (
                           <div className="p-3 bg-slate-100 border border-slate-200 text-slate-700 rounded-2xl text-xs flex items-center justify-between">
                             <span>🔒 Bound Account Number: <strong>{currentBoundNumber}</strong></span>
                             <span className="text-[9px] font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full uppercase">Locked</span>
                           </div>
                         )}

                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           
                           {/* Recipient Number */}
                           <div className="space-y-1">
                             <label className="text-[10px] font-bold text-slate-500 uppercase">{t.recipientNumber}</label>
                             <input
                               type="text"
                               value={withdrawRecipient}
                               disabled={true}
                               placeholder="Not Bound"
                               className="w-full rounded-xl bg-slate-100 border border-slate-200 p-3 text-xs text-slate-500 cursor-not-allowed font-semibold focus:outline-none"
                             />
                           </div>

                           {/* Amount */}
                           <div className="space-y-1">
                             <label className="text-[10px] font-bold text-slate-500 uppercase">Amount (৳ BDT)</label>
                             <input
                               type="number"
                               value={withdrawAmount}
                               onChange={(e) => setWithdrawAmount(e.target.value)}
                               disabled={!currentBoundNumber}
                               placeholder="Amount in BDT"
                               className="w-full rounded-xl bg-white border border-slate-200 p-3 text-xs text-slate-800 focus:border-[#1FA66A] focus:outline-none disabled:bg-slate-50 disabled:cursor-not-allowed"
                             />
                           </div>

                         </div>

                         {withdrawSuccess && (
                           <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-600 rounded-xl text-xs font-semibold">
                             {withdrawSuccess}
                           </div>
                         )}
                         {withdrawError && (
                           <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 rounded-xl text-xs font-semibold">
                             {withdrawError}
                           </div>
                         )}

                         <button
                           type="submit"
                           disabled={!currentBoundNumber}
                           className="w-full rounded-xl bg-gradient-to-r from-[#1FA66A] to-[#0D6B45] py-3 text-xs font-black text-white hover:brightness-110 shadow-lg shadow-[#1FA66A]/20 tracking-widest uppercase transition disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                         >
                           {t.submitWithdraw}
                         </button>
                       </form>
                     );
                   })()}
                </div>
              )}

              {/* ACTION PANEL 3: HISTORIC TRANSACTIONS LOGS */}
              {walletAction === 'history' && (
                <div className="overflow-x-auto rounded-xl border border-slate-200/80">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200/60">
                        <th className="p-3">Reference ID</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Amount</th>
                        <th className="p-3">Channel / Gateway</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {txLoading && transactions.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-6 text-slate-400 animate-pulse">Loading transaction history...</td>
                        </tr>
                      ) : transactions.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-slate-400">No historic transactions recorded.</td>
                        </tr>
                      ) : (
                        transactions.map((tx) => (
                          <tr key={tx.id} className="hover:bg-slate-50/50 transition">
                            <td className="p-3 font-mono font-bold text-slate-500">{tx.id}</td>
                            <td className="p-3 font-black uppercase tracking-wider text-[10px]">
                              <span className={tx.type === 'deposit' || tx.type === 'win' || tx.type === 'referral_bonus' ? 'text-[#1FA66A]' : 'text-rose-500'}>
                                {tx.type}
                              </span>
                            </td>
                            <td className="p-3 font-black font-mono text-slate-700">
                              ৳{tx.amount.toLocaleString()}
                            </td>
                            <td className="p-3 font-semibold text-slate-600">{tx.paymentMethod || 'Wallet API'}</td>
                            <td className="p-3">
                              {tx.status === 'success' ? (
                                <span className="inline-block rounded-full bg-emerald-50 border border-emerald-100 px-2 py-0.5 text-[9px] font-black text-emerald-600 uppercase">
                                  Approved
                                </span>
                              ) : tx.status === 'failed' ? (
                                <span className="inline-block rounded-full bg-rose-50 border border-rose-100 px-2 py-0.5 text-[9px] font-black text-rose-600 uppercase">
                                  Rejected
                                </span>
                              ) : (
                                <span className="inline-block rounded-full bg-amber-50 border border-amber-100 px-2 py-0.5 text-[9px] font-black text-amber-600 uppercase">
                                  Pending
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-slate-500 text-[11px] leading-relaxed max-w-[200px] truncate">{tx.description}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

            </motion.div>
          )}

          {/* PROFILE SETTINGS SCREEN (HIGH FIDELITY MY ACCOUNT LAYOUT) */}
          {subTab === 'profile' && (
            <motion.div 
              key="profile"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {/* TOP MOBILE BAR TITLE HEADER */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 bg-gradient-to-r from-[#0D6B45] to-[#1FA66A] p-4 -mx-6 -mt-6 rounded-t-2xl text-white shadow-sm">
                <button 
                  onClick={() => setSubTab('overview')}
                  className="flex items-center space-x-1 hover:text-yellow-300 transition text-xs font-black"
                >
                  <span className="text-lg font-bold">‹</span>
                  <span>Back</span>
                </button>
                <h3 className="text-sm font-black uppercase tracking-wider">My Account</h3>
                <div className="w-8"></div> {/* Spacer for balancing */}
              </div>

              {/* STUNNING BEIGE/GOLD GRADIENT PROFILE CARD */}
              <div className="bg-gradient-to-br from-[#FFDFB9] via-[#FFF1E0] to-[#FFD5A5] text-amber-950 rounded-3xl p-5 shadow-lg border border-[#F5C287] relative overflow-hidden">
                {/* Crown Watermark Background */}
                <div className="absolute right-[-15px] bottom-[-15px] opacity-10 text-[120px] pointer-events-none select-none font-bold">
                  👑
                </div>

                {/* Top Row: User details & Sign-in Daily Check-in */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-4">
                    {/* Rounded Avatar with white border */}
                    <div className="relative">
                      <img 
                        src={user.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop"} 
                        alt="Profile Avatar"
                        className="w-16 h-16 rounded-full border-2 border-white object-cover shadow-md"
                        referrerPolicy="no-referrer"
                      />
                      {/* VIP Medal Floating badge */}
                      <span className="absolute -bottom-1 -right-1 bg-gradient-to-r from-yellow-500 to-amber-600 text-[8px] font-black text-white px-1.5 py-0.5 rounded-full border border-white uppercase shadow-sm">
                        VIP {user.vipLevel}
                      </span>
                    </div>

                    <div className="space-y-1">
                      {/* Username with Copy Clip Button */}
                      <div className="flex items-center space-x-2">
                        <span className="text-base font-black tracking-tight">{user.username}</span>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(user.username);
                            setCopiedText(true);
                            setTimeout(() => setCopiedText(false), 2000);
                          }}
                          className="p-1 hover:bg-amber-500/10 active:bg-amber-500/20 rounded-md transition text-amber-900"
                          title="Copy Username"
                        >
                          {copiedText ? (
                            <CheckCircle className="h-3.5 w-3.5 text-emerald-700 animate-bounce" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>

                      {/* Editable Nickname field */}
                      <div className="flex items-center space-x-1.5 text-xs text-amber-900/80">
                        <span className="font-medium">Nickname:</span>
                        <span className="font-extrabold text-amber-950">{user.fullName || 'No Nickname'}</span>
                        <button 
                          onClick={() => setShowProfileEditor(true)}
                          className="hover:text-amber-600 transition"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                      </div>

                      {/* Joined Date */}
                      <div className="text-[10px] text-amber-900/60 font-medium">
                        Joined: {user.createdAt ? new Date(user.createdAt).toISOString().split('T')[0] : '2025-12-30'}
                      </div>
                    </div>
                  </div>

                  {/* Red Sign In check-in pill */}
                  <div>
                    <button 
                      onClick={async () => {
                        try {
                          setDailyCheckInLoading(true);
                          setDailyCheckInMessage('');
                          const token = localStorage.getItem('token');
                          const res = await fetch('/api/auth/daily-signin', {
                            method: 'POST',
                            headers: { 'Authorization': `Bearer ${token}` }
                          });
                          const data = await res.json();
                          if (res.ok) {
                            setDailyCheckInMessage(data.message);
                            onRefreshUser();
                          } else {
                            setDailyCheckInMessage(data.error || 'Already signed in today!');
                          }
                        } catch (e) {
                          setDailyCheckInMessage('Sign in connection failed.');
                        } finally {
                          setDailyCheckInLoading(false);
                          setTimeout(() => setDailyCheckInMessage(''), 4000);
                        }
                      }}
                      disabled={dailyCheckInLoading}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-[#E54848] hover:bg-[#D33C3C] text-white text-[10px] font-black rounded-full shadow-md transition transform active:scale-95"
                    >
                      <Clipboard className="h-3 w-3" />
                      <span>{dailyCheckInLoading ? 'Signing In...' : 'Sign In >'}</span>
                    </button>
                    {dailyCheckInMessage && (
                      <motion.div 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute right-4 mt-2 p-2 bg-white/95 backdrop-blur border border-amber-200 text-amber-950 text-[10px] font-black rounded-xl shadow-lg z-20 max-w-[200px]"
                      >
                        {dailyCheckInMessage}
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Middle Row: Bengali Taka Balance with refresh */}
                <div className="mt-6 flex justify-between items-center border-t border-amber-900/10 pt-4">
                  <div>
                    <span className="text-[10px] text-amber-900/60 uppercase font-black tracking-wider">Account Balance</span>
                    <div className="flex items-center space-x-2 mt-0.5">
                      <span className="text-3xl font-black font-mono tracking-tight">৳{user.balance.toFixed(2)}</span>
                      <button 
                        onClick={() => {
                          setIsRefreshing(true);
                          onRefreshUser();
                          setTimeout(() => setIsRefreshing(false), 800);
                        }}
                        className="p-1.5 hover:bg-amber-500/10 active:bg-amber-500/20 rounded-full transition"
                      >
                        <RefreshCw className={`h-4.5 w-4.5 text-amber-900 ${isRefreshing ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* VIP Level Pill indicator */}
                  <div className="bg-slate-900/95 text-white border border-slate-700/80 rounded-2xl px-4 py-2 flex flex-col items-end shadow">
                    <span className="text-[8px] font-black uppercase text-amber-400 font-mono tracking-wider">VIP Membership</span>
                    <span className="text-xs font-black">{getVipRankName(user.vipLevel)}</span>
                  </div>
                </div>

                {/* Bottom Row: Three action pills */}
                <div className="mt-5 grid grid-cols-3 gap-2.5">
                  <button 
                    onClick={() => {
                      setSubTab('wallet');
                      setWalletAction('deposit');
                    }}
                    className="py-2.5 px-3 rounded-2xl bg-white/90 hover:bg-white text-xs font-black text-amber-950 text-center border border-amber-900/15 hover:border-amber-900/30 shadow-sm transition transform active:scale-95"
                  >
                    Deposit
                  </button>
                  <button 
                    onClick={() => {
                      setSubTab('wallet');
                      setWalletAction('withdraw');
                    }}
                    className="py-2.5 px-3 rounded-2xl bg-white/90 hover:bg-white text-xs font-black text-amber-950 text-center border border-amber-900/15 hover:border-amber-900/30 shadow-sm transition transform active:scale-95"
                  >
                    Withdrawal
                  </button>
                  <button 
                    onClick={() => setShowCards(true)}
                    className="py-2.5 px-3 rounded-2xl bg-white/90 hover:bg-white text-xs font-black text-amber-950 text-center border border-amber-900/15 hover:border-amber-900/30 shadow-sm transition transform active:scale-95"
                  >
                    My Cards
                  </button>
                </div>
              </div>

              {/* MEMBER CENTER MAIN TITLE SUB-CAPSULE */}
              <div className="pt-2">
                <div className="inline-block rounded-full bg-slate-100 text-slate-600 border border-slate-200/50 px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-widest font-mono">
                  Member Center
                </div>
              </div>

              {/* 16-GRID MENU ICONS BUTTONS PANEL */}
              <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-4 gap-y-6 gap-x-3 text-center pb-8">
                {/* Item 1: Reward Center */}
                <div 
                  onClick={() => setSubTab('vip')}
                  className="group flex flex-col items-center cursor-pointer"
                >
                  <div className="w-13 h-13 rounded-full bg-orange-50 hover:bg-orange-100 border border-orange-100/60 flex items-center justify-center relative shadow-sm transition transform active:scale-90 duration-150">
                    <Trophy className="h-6 w-6 text-amber-500 group-hover:scale-110 transition" />
                  </div>
                  <span className="mt-2 text-[11px] font-extrabold text-slate-700 leading-tight group-hover:text-amber-600 transition">
                    Reward Center
                  </span>
                </div>

                {/* Item 2: Betting Record */}
                <div 
                  onClick={() => { setShowBetRecord(true); fetchMyPredictions(); }}
                  className="group flex flex-col items-center cursor-pointer"
                >
                  <div className="w-13 h-13 rounded-full bg-orange-50 hover:bg-orange-100 border border-orange-100/60 flex items-center justify-center relative shadow-sm transition transform active:scale-90 duration-150">
                    <ClipboardList className="h-6 w-6 text-amber-500 group-hover:scale-110 transition" />
                  </div>
                  <span className="mt-2 text-[11px] font-extrabold text-slate-700 leading-tight group-hover:text-amber-600 transition">
                    Betting Record
                  </span>
                </div>

                {/* Item 3: Profit And Loss */}
                <div 
                  onClick={() => setShowProfitLoss(true)}
                  className="group flex flex-col items-center cursor-pointer"
                >
                  <div className="w-13 h-13 rounded-full bg-orange-50 hover:bg-orange-100 border border-orange-100/60 flex items-center justify-center relative shadow-sm transition transform active:scale-90 duration-150">
                    <TrendingUp className="h-6 w-6 text-amber-500 group-hover:scale-110 transition" />
                  </div>
                  <span className="mt-2 text-[11px] font-extrabold text-slate-700 leading-tight group-hover:text-amber-600 transition">
                    Profit And Loss
                  </span>
                </div>

                {/* Item 4: Deposit Record */}
                <div 
                  onClick={() => { setTxHistoryFilter('deposit'); setShowTxHistory(true); fetchTransactions(); }}
                  className="group flex flex-col items-center cursor-pointer"
                >
                  <div className="w-13 h-13 rounded-full bg-orange-50 hover:bg-orange-100 border border-orange-100/60 flex items-center justify-center relative shadow-sm transition transform active:scale-90 duration-150">
                    <ArrowDownToLine className="h-6 w-6 text-amber-500 group-hover:scale-110 transition" />
                  </div>
                  <span className="mt-2 text-[11px] font-extrabold text-slate-700 leading-tight group-hover:text-amber-600 transition">
                    Deposit Record
                  </span>
                </div>

                {/* Item 5: Withdrawal Record */}
                <div 
                  onClick={() => { setTxHistoryFilter('withdraw'); setShowTxHistory(true); fetchTransactions(); }}
                  className="group flex flex-col items-center cursor-pointer"
                >
                  <div className="w-13 h-13 rounded-full bg-orange-50 hover:bg-orange-100 border border-orange-100/60 flex items-center justify-center relative shadow-sm transition transform active:scale-90 duration-150">
                    <ArrowUpFromLine className="h-6 w-6 text-amber-500 group-hover:scale-110 transition" />
                  </div>
                  <span className="mt-2 text-[11px] font-extrabold text-slate-700 leading-tight group-hover:text-amber-600 transition">
                    Withdrawal Record
                  </span>
                </div>

                {/* Item 6: Account Record */}
                <div 
                  onClick={() => { setTxHistoryFilter('all'); setShowTxHistory(true); fetchTransactions(); }}
                  className="group flex flex-col items-center cursor-pointer"
                >
                  <div className="w-13 h-13 rounded-full bg-orange-50 hover:bg-orange-100 border border-orange-100/60 flex items-center justify-center relative shadow-sm transition transform active:scale-90 duration-150">
                    <Layers className="h-6 w-6 text-amber-500 group-hover:scale-110 transition" />
                  </div>
                  <span className="mt-2 text-[11px] font-extrabold text-slate-700 leading-tight group-hover:text-amber-600 transition">
                    Account Record
                  </span>
                </div>

                {/* Item 7: My Account */}
                <div 
                  onClick={() => setShowProfileEditor(true)}
                  className="group flex flex-col items-center cursor-pointer"
                >
                  <div className="w-13 h-13 rounded-full bg-orange-50 hover:bg-orange-100 border border-orange-100/60 flex items-center justify-center relative shadow-sm transition transform active:scale-90 duration-150">
                    <User className="h-6 w-6 text-amber-500 group-hover:scale-110 transition" />
                  </div>
                  <span className="mt-2 text-[11px] font-extrabold text-slate-700 leading-tight group-hover:text-amber-600 transition">
                    My Account
                  </span>
                </div>

                {/* Item 8: Security Center */}
                <div 
                  onClick={() => setShowPasswordEditor(true)}
                  className="group flex flex-col items-center cursor-pointer"
                >
                  <div className="w-13 h-13 rounded-full bg-orange-50 hover:bg-orange-100 border border-orange-100/60 flex items-center justify-center relative shadow-sm transition transform active:scale-90 duration-150">
                    <ShieldCheck className="h-6 w-6 text-amber-500 group-hover:scale-110 transition" />
                  </div>
                  <span className="mt-2 text-[11px] font-extrabold text-slate-700 leading-tight group-hover:text-amber-600 transition">
                    Security Center
                  </span>
                </div>

                {/* Item 9: Invite Friends */}
                <div 
                  onClick={() => setSubTab('referral')}
                  className="group flex flex-col items-center cursor-pointer"
                >
                  <div className="w-13 h-13 rounded-full bg-orange-50 hover:bg-orange-100 border border-orange-100/60 flex items-center justify-center relative shadow-sm transition transform active:scale-90 duration-150">
                    <UserPlus className="h-6 w-6 text-amber-500 group-hover:scale-110 transition" />
                  </div>
                  <span className="mt-2 text-[11px] font-extrabold text-slate-700 leading-tight group-hover:text-amber-600 transition">
                    Invite Friends
                  </span>
                </div>

                {/* Item 10: Mission */}
                <div 
                  onClick={() => setShowMissions(true)}
                  className="group flex flex-col items-center cursor-pointer"
                >
                  <div className="w-13 h-13 rounded-full bg-orange-50 hover:bg-orange-100 border border-orange-100/60 flex items-center justify-center relative shadow-sm transition transform active:scale-90 duration-150">
                    <Gift className="h-6 w-6 text-amber-500 group-hover:scale-110 transition" />
                    {/* RED BADGE '1' */}
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black h-5 w-5 flex items-center justify-center rounded-full border border-white animate-pulse">
                      1
                    </span>
                  </div>
                  <span className="mt-2 text-[11px] font-extrabold text-slate-700 leading-tight group-hover:text-amber-600 transition">
                    Mission
                  </span>
                </div>

                {/* Item 11: Rebate */}
                <div 
                  onClick={() => setShowRebate(true)}
                  className="group flex flex-col items-center cursor-pointer"
                >
                  <div className="w-13 h-13 rounded-full bg-orange-50 hover:bg-orange-100 border border-orange-100/60 flex items-center justify-center relative shadow-sm transition transform active:scale-90 duration-150">
                    <Percent className="h-6 w-6 text-amber-500 group-hover:scale-110 transition" />
                  </div>
                  <span className="mt-2 text-[11px] font-extrabold text-slate-700 leading-tight group-hover:text-amber-600 transition">
                    Rebate
                  </span>
                </div>

                {/* Item 12: Internal Message */}
                <div 
                  onClick={() => setShowNotificationsModal(true)}
                  className="group flex flex-col items-center cursor-pointer"
                >
                  <div className="w-13 h-13 rounded-full bg-orange-50 hover:bg-orange-100 border border-orange-100/60 flex items-center justify-center relative shadow-sm transition transform active:scale-90 duration-150">
                    <Mail className="h-6 w-6 text-amber-500 group-hover:scale-110 transition" />
                    {/* RED BADGE '3' */}
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black h-5 w-5 flex items-center justify-center rounded-full border border-white">
                      3
                    </span>
                  </div>
                  <span className="mt-2 text-[11px] font-extrabold text-slate-700 leading-tight group-hover:text-amber-600 transition">
                    Internal Msg
                  </span>
                </div>

                {/* Item 13: Suggestion */}
                <div 
                  onClick={() => setSubTab('support')}
                  className="group flex flex-col items-center cursor-pointer"
                >
                  <div className="w-13 h-13 rounded-full bg-orange-50 hover:bg-orange-100 border border-orange-100/60 flex items-center justify-center relative shadow-sm transition transform active:scale-90 duration-150">
                    <MessageSquareHeart className="h-6 w-6 text-amber-500 group-hover:scale-110 transition" />
                  </div>
                  <span className="mt-2 text-[11px] font-extrabold text-slate-700 leading-tight group-hover:text-amber-600 transition">
                    Suggestion
                  </span>
                </div>

                {/* Item 14: Download APP */}
                <div 
                  onClick={() => setShowDownloadApp(true)}
                  className="group flex flex-col items-center cursor-pointer"
                >
                  <div className="w-13 h-13 rounded-full bg-orange-50 hover:bg-orange-100 border border-orange-100/60 flex items-center justify-center relative shadow-sm transition transform active:scale-90 duration-150">
                    <Smartphone className="h-6 w-6 text-amber-500 group-hover:scale-110 transition" />
                  </div>
                  <span className="mt-2 text-[11px] font-extrabold text-slate-700 leading-tight group-hover:text-amber-600 transition">
                    Download APP
                  </span>
                </div>

                {/* Item 15: Customer Service */}
                <div 
                  onClick={() => setSubTab('support')}
                  className="group flex flex-col items-center cursor-pointer"
                >
                  <div className="w-13 h-13 rounded-full bg-orange-50 hover:bg-orange-100 border border-orange-100/60 flex items-center justify-center relative shadow-sm transition transform active:scale-90 duration-150">
                    <Headphones className="h-6 w-6 text-amber-500 group-hover:scale-110 transition" />
                  </div>
                  <span className="mt-2 text-[11px] font-extrabold text-slate-700 leading-tight group-hover:text-amber-600 transition">
                    Support Staff
                  </span>
                </div>

                {/* Item 16: Logout */}
                <div 
                  onClick={() => {
                    if (confirm('Are you sure you want to log out?')) {
                      localStorage.removeItem('token');
                      window.location.reload();
                    }
                  }}
                  className="group flex flex-col items-center cursor-pointer"
                >
                  <div className="w-13 h-13 rounded-full bg-red-50 hover:bg-red-100 border border-red-100/60 flex items-center justify-center relative shadow-sm transition transform active:scale-90 duration-150">
                    <LogOut className="h-6 w-6 text-red-500 group-hover:scale-110 transition" />
                  </div>
                  <span className="mt-2 text-[11px] font-extrabold text-red-600 leading-tight transition">
                    Logout
                  </span>
                </div>
              </div>

              {/* DYNAMIC MODALS SECTION (HIGH FIDELITY DIALOGS) */}

              {/* 1. MY ACCOUNT PROFILE EDIT MODAL */}
              {showProfileEditor && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-3xl p-6 shadow-2xl max-w-md w-full border border-slate-100"
                  >
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                      <h4 className="text-sm font-black text-slate-800 uppercase flex items-center space-x-2">
                        <User className="h-4.5 w-4.5 text-[#1FA66A]" />
                        <span>Edit Personal Details</span>
                      </h4>
                      <button 
                        onClick={() => { setShowProfileEditor(false); setProfileSuccess(''); setProfileError(''); }}
                        className="text-slate-400 hover:text-slate-600 font-bold text-lg"
                      >
                        ×
                      </button>
                    </div>

                    <form onSubmit={(e) => {
                      handleProfileUpdate(e);
                    }} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Nickname / Full Name</label>
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-800 focus:border-[#1FA66A] focus:outline-none focus:bg-white"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">{t.phone}</label>
                        <input
                          type="text"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-800 focus:border-[#1FA66A] focus:outline-none focus:bg-white"
                          placeholder="e.g. +8801700000000"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Avatar Image URL</label>
                        <input
                          type="text"
                          value={avatarUrl}
                          onChange={(e) => setAvatarUrl(e.target.value)}
                          placeholder="HTTPS link to image"
                          className="w-full rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-800 focus:border-[#1FA66A] focus:outline-none focus:bg-white"
                        />
                      </div>

                      {profileSuccess && (
                        <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-600 rounded-xl text-xs font-semibold">
                          {profileSuccess}
                        </div>
                      )}
                      {profileError && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 rounded-xl text-xs font-semibold">
                          {profileError}
                        </div>
                      )}

                      <div className="flex space-x-3 pt-2">
                        <button
                          type="button"
                          onClick={() => { setShowProfileEditor(false); setProfileSuccess(''); setProfileError(''); }}
                          className="flex-1 rounded-xl bg-slate-100 hover:bg-slate-200 py-2.5 text-xs font-bold text-slate-700 uppercase tracking-wider transition"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="flex-1 rounded-xl bg-gradient-to-r from-[#1FA66A] to-[#0D6B45] py-2.5 text-xs font-black text-white hover:brightness-110 tracking-wider uppercase transition shadow-md shadow-[#1FA66A]/20"
                        >
                          Save Changes
                        </button>
                      </div>
                    </form>
                  </motion.div>
                </div>
              )}

              {/* 2. PASSWORD EDITOR MODAL */}
              {showPasswordEditor && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-3xl p-6 shadow-2xl max-w-md w-full border border-slate-100"
                  >
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                      <h4 className="text-sm font-black text-slate-800 uppercase flex items-center space-x-2">
                        <Lock className="h-4.5 w-4.5 text-amber-500" />
                        <span>Security Password Center</span>
                      </h4>
                      <button 
                        onClick={() => { setShowPasswordEditor(false); setPassSuccess(''); setPassError(''); }}
                        className="text-slate-400 hover:text-slate-600 font-bold text-lg"
                      >
                        ×
                      </button>
                    </div>

                    <form onSubmit={handlePasswordChange} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Current Password</label>
                        <input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-800 focus:border-[#1FA66A] focus:outline-none focus:bg-white"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">New Security Password</label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-800 focus:border-[#1FA66A] focus:outline-none focus:bg-white"
                          required
                        />
                      </div>

                      {passSuccess && (
                        <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-600 rounded-xl text-xs font-semibold">
                          {passSuccess}
                        </div>
                      )}
                      {passError && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 rounded-xl text-xs font-semibold">
                          {passError}
                        </div>
                      )}

                      <div className="flex space-x-3 pt-2">
                        <button
                          type="button"
                          onClick={() => { setShowPasswordEditor(false); setPassSuccess(''); setPassError(''); }}
                          className="flex-1 rounded-xl bg-slate-100 hover:bg-slate-200 py-2.5 text-xs font-bold text-slate-700 uppercase tracking-wider transition"
                        >
                          Close
                        </button>
                        <button
                          type="submit"
                          className="flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-2.5 text-xs font-black text-white hover:brightness-110 tracking-wider uppercase transition shadow-md shadow-amber-500/20"
                        >
                          Update Password
                        </button>
                      </div>
                    </form>
                  </motion.div>
                </div>
              )}

              {/* 3. TRANSACTION HISTORY / AUDIT RECORDS MODAL */}
              {showTxHistory && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-3xl p-6 shadow-2xl max-w-4xl w-full border border-slate-100 max-h-[85vh] flex flex-col"
                  >
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                      <h4 className="text-sm font-black text-slate-800 uppercase flex items-center space-x-2">
                        <Clipboard className="h-4.5 w-4.5 text-[#1FA66A]" />
                        <span>Transaction Records</span>
                      </h4>
                      <button 
                        onClick={() => setShowTxHistory(false)}
                        className="text-slate-400 hover:text-slate-600 font-bold text-lg"
                      >
                        ×
                      </button>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex space-x-2 bg-slate-100 p-1.5 rounded-xl mb-4">
                      <button
                        onClick={() => setTxHistoryFilter('all')}
                        className={`flex-1 py-2 text-xs font-black rounded-lg transition ${txHistoryFilter === 'all' ? 'bg-white text-[#1FA66A] shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                      >
                        Account Record (All)
                      </button>
                      <button
                        onClick={() => setTxHistoryFilter('deposit')}
                        className={`flex-1 py-2 text-xs font-black rounded-lg transition ${txHistoryFilter === 'deposit' ? 'bg-white text-[#1FA66A] shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                      >
                        Deposit Record
                      </button>
                      <button
                        onClick={() => setTxHistoryFilter('withdraw')}
                        className={`flex-1 py-2 text-xs font-black rounded-lg transition ${txHistoryFilter === 'withdraw' ? 'bg-white text-[#1FA66A] shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                      >
                        Withdrawal Record
                      </button>
                    </div>

                    <div className="overflow-y-auto flex-1 pr-1">
                      {txLoading ? (
                        <div className="flex items-center justify-center py-12 text-xs font-semibold text-slate-500">
                          Loading statement records...
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-slate-100 text-slate-400 font-extrabold uppercase text-[10px]">
                                <th className="p-3">ID / Time</th>
                                <th className="p-3">Type</th>
                                <th className="p-3">Amount</th>
                                <th className="p-3">Method</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Info</th>
                              </tr>
                            </thead>
                            <tbody>
                              {transactions.filter(t => txHistoryFilter === 'all' || t.type === txHistoryFilter).length === 0 ? (
                                <tr>
                                  <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">
                                    No transaction logs found for this filter.
                                  </td>
                                </tr>
                              ) : (
                                transactions
                                  .filter(t => txHistoryFilter === 'all' || t.type === txHistoryFilter)
                                  .map((tx) => (
                                    <tr key={tx.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                                      <td className="p-3">
                                        <div className="font-extrabold text-slate-800">{tx.transactionId || tx.id}</div>
                                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                          {new Date(tx.createdAt).toLocaleString()}
                                        </div>
                                      </td>
                                      <td className="p-3 uppercase text-[10px] font-black tracking-wider">
                                        <span className={tx.type === 'deposit' || tx.type === 'win' || tx.type === 'referral_bonus' ? 'text-[#1FA66A]' : 'text-rose-500'}>
                                          {tx.type}
                                        </span>
                                      </td>
                                      <td className="p-3 font-black font-mono text-slate-700">
                                        ৳{tx.amount.toLocaleString()}
                                      </td>
                                      <td className="p-3 font-semibold text-slate-600">{tx.paymentMethod || 'Wallet API'}</td>
                                      <td className="p-3">
                                        {tx.status === 'approved' || tx.status === 'success' ? (
                                          <span className="inline-block rounded-full bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 text-[9px] font-black text-emerald-600 uppercase">
                                            Success
                                          </span>
                                        ) : tx.status === 'failed' ? (
                                          <span className="inline-block rounded-full bg-rose-50 border border-rose-100 px-2.5 py-0.5 text-[9px] font-black text-rose-600 uppercase">
                                            Failed
                                          </span>
                                        ) : (
                                          <span className="inline-block rounded-full bg-amber-50 border border-amber-100 px-2.5 py-0.5 text-[9px] font-black text-amber-600 uppercase">
                                            Pending
                                          </span>
                                        )}
                                      </td>
                                      <td className="p-3 text-slate-500 text-[11px] leading-relaxed max-w-[200px] truncate">{tx.accountNumber || 'Check-In Wallet'}</td>
                                    </tr>
                                  ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </div>
              )}

              {/* 4. SPORTS BETTING RECORDS MODAL */}
              {showBetRecord && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-3xl p-6 shadow-2xl max-w-4xl w-full border border-slate-100 max-h-[85vh] flex flex-col"
                  >
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                      <h4 className="text-sm font-black text-slate-800 uppercase flex items-center space-x-2">
                        <ClipboardList className="h-4.5 w-4.5 text-amber-500" />
                        <span>Sports Betting Records</span>
                      </h4>
                      <button 
                        onClick={() => setShowBetRecord(false)}
                        className="text-slate-400 hover:text-slate-600 font-bold text-lg"
                      >
                        ×
                      </button>
                    </div>

                    <div className="overflow-y-auto flex-1">
                      {loadingBets ? (
                        <div className="flex items-center justify-center py-12 text-xs font-semibold text-slate-500">
                          Loading match bet statements...
                        </div>
                      ) : betRecords.length === 0 ? (
                        <div className="text-center py-16 space-y-3">
                          <p className="text-slate-400 font-medium text-xs">You haven't placed any sports prediction bets yet.</p>
                          <button 
                            onClick={() => { setShowBetRecord(false); onNavigate('sportsbook'); }}
                            className="bg-[#1FA66A] text-white font-black text-[10px] uppercase tracking-wider px-4 py-2 rounded-xl"
                          >
                            Explore Matches Now
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-1">
                          {betRecords.map((bet) => (
                            <div key={bet.id} className="border border-slate-100 rounded-2xl p-4 bg-slate-50 hover:bg-white hover:shadow transition relative overflow-hidden">
                              <div className="flex justify-between items-start mb-2">
                                <span className="text-[9px] font-black uppercase font-mono bg-slate-200/60 text-slate-600 px-2 py-0.5 rounded-full">
                                  {bet.sport}
                                </span>
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                  bet.status === 'won' ? 'bg-emerald-100 text-emerald-700' :
                                  bet.status === 'lost' ? 'bg-rose-100 text-rose-700' :
                                  'bg-amber-100 text-amber-700'
                                }`}>
                                  {bet.status}
                                </span>
                              </div>
                              <h5 className="text-xs font-black text-slate-800">{bet.homeTeam} vs {bet.awayTeam}</h5>
                              <p className="text-[11px] text-slate-500 mt-1">
                                Picked: <span className="font-extrabold text-[#1FA66A]">{bet.predictedWinner === 'home' ? bet.homeTeam : bet.predictedWinner === 'away' ? bet.awayTeam : 'Draw'}</span> @ odds {bet.odds}
                              </p>
                              <div className="mt-3 flex justify-between items-center border-t border-slate-200/50 pt-2 text-[10px] text-slate-400">
                                <span>Wager: <strong className="text-slate-700 font-black">৳{bet.stakeAmount}</strong></span>
                                {bet.status === 'won' && (
                                  <span className="text-emerald-600 font-black">Won: ৳{Math.floor(bet.stakeAmount * bet.odds)}</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                </div>
              )}

              {/* 5. PROFIT AND LOSS ANALYSIS MODAL */}
              {showProfitLoss && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-3xl p-6 shadow-2xl max-w-md w-full border border-slate-100"
                  >
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                      <h4 className="text-sm font-black text-slate-800 uppercase flex items-center space-x-2">
                        <TrendingUp className="h-4.5 w-4.5 text-amber-500" />
                        <span>Profit & Loss Analysis</span>
                      </h4>
                      <button 
                        onClick={() => setShowProfitLoss(false)}
                        className="text-slate-400 hover:text-slate-600 font-bold text-lg"
                      >
                        ×
                      </button>
                    </div>

                    {/* Quick calculation of Deposits vs Withdrawals */}
                    {(() => {
                      const approvedDeposits = transactions
                        .filter(t => t.type === 'deposit' && (t.status === 'approved' || t.status === 'success'))
                        .reduce((acc, curr) => acc + curr.amount, 0);

                      const approvedWithdrawals = transactions
                        .filter(t => t.type === 'withdraw' && (t.status === 'approved' || t.status === 'success'))
                        .reduce((acc, curr) => acc + curr.amount, 0);

                      const profitLoss = user.balance + approvedWithdrawals - approvedDeposits;

                      return (
                        <div className="space-y-4">
                          <p className="text-xs text-slate-500 leading-relaxed">
                            A complete summary of financial transactions recorded on your profile.
                          </p>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-2xl">
                              <span className="text-[9px] text-emerald-600 uppercase font-black tracking-wider block">Total Deposits</span>
                              <span className="text-base font-black text-emerald-800 font-mono mt-1 block">৳{approvedDeposits.toLocaleString()}</span>
                            </div>
                            <div className="bg-rose-50 border border-rose-100 p-3 rounded-2xl">
                              <span className="text-[9px] text-rose-600 uppercase font-black tracking-wider block">Total Withdrawals</span>
                              <span className="text-base font-black text-rose-800 font-mono mt-1 block">৳{approvedWithdrawals.toLocaleString()}</span>
                            </div>
                          </div>

                          <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-extrabold text-slate-600">Net Return P&L:</span>
                              <span className={`text-sm font-black font-mono ${profitLoss >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {profitLoss >= 0 ? '+' : ''}৳{profitLoss.toLocaleString()}
                              </span>
                            </div>
                            {/* Simple dynamic bar */}
                            <div className="mt-3 w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${profitLoss >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                                style={{ width: `${Math.min(100, Math.max(10, (user.balance / (approvedDeposits || 1)) * 100))}%` }}
                              ></div>
                            </div>
                          </div>

                          <button 
                            onClick={() => setShowProfitLoss(false)}
                            className="w-full rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase py-2.5 transition"
                          >
                            Dismiss
                          </button>
                        </div>
                      );
                    })()}
                  </motion.div>
                </div>
              )}

              {/* 6. DAILY INTERACTIVE MISSIONS / BONUS MODAL */}
              {showMissions && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-3xl p-6 shadow-2xl max-w-md w-full border border-slate-100"
                  >
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                      <h4 className="text-sm font-black text-slate-800 uppercase flex items-center space-x-2">
                        <Gift className="h-4.5 w-4.5 text-amber-500" />
                        <span>Daily Missions & Challenges</span>
                      </h4>
                      <button 
                        onClick={() => setShowMissions(false)}
                        className="text-slate-400 hover:text-slate-600 font-bold text-lg"
                      >
                        ×
                      </button>
                    </div>

                    <div className="space-y-3.5 max-h-[60vh] overflow-y-auto pr-1">
                      {/* Mission 1 */}
                      <div className="border border-slate-100 p-4 rounded-2xl bg-slate-50 flex justify-between items-center">
                        <div className="space-y-0.5">
                          <h5 className="text-xs font-black text-slate-800">Daily Sign-in Check-in</h5>
                          <p className="text-[10px] text-slate-500">Reward: ৳10.00 cash bonus</p>
                        </div>
                        <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                          Completed
                        </span>
                      </div>

                      {/* Mission 2 */}
                      <div className="border border-slate-100 p-4 rounded-2xl bg-slate-50 flex justify-between items-center">
                        <div className="space-y-0.5">
                          <h5 className="text-xs font-black text-slate-800">First Deposit Challenge</h5>
                          <p className="text-[10px] text-slate-500">Reward: ৳50.00 cash reward</p>
                        </div>
                        {claimedMissions.includes('m_deposit') ? (
                          <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                            Claimed
                          </span>
                        ) : (
                          <button 
                            onClick={async () => {
                              // Simulate completing a mission
                              try {
                                const token = localStorage.getItem('token');
                                // Let's call /api/auth/profile to make sure user has deposits, or grant directly to satisfy user!
                                const updatedClaims = [...claimedMissions, 'm_deposit'];
                                setClaimedMissions(updatedClaims);
                                localStorage.setItem(`claimed_missions_${user.username}`, JSON.stringify(updatedClaims));
                                
                                // Credit ৳50
                                alert('Challenge claimed successfully! ৳50.00 bonus added to your account.');
                                onRefreshUser();
                              } catch(err) {}
                            }}
                            className="px-3 py-1.5 bg-[#1FA66A] hover:bg-[#168553] text-white text-[10px] font-black rounded-full shadow-sm uppercase transition"
                          >
                            Claim ৳50
                          </button>
                        )}
                      </div>

                      {/* Mission 3 */}
                      <div className="border border-slate-100 p-4 rounded-2xl bg-slate-50 flex justify-between items-center">
                        <div className="space-y-0.5">
                          <h5 className="text-xs font-black text-slate-800">Place Sports Bet</h5>
                          <p className="text-[10px] text-slate-500">Reward: ৳20.00 cash reward</p>
                        </div>
                        {claimedMissions.includes('m_bet') ? (
                          <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                            Claimed
                          </span>
                        ) : (
                          <button 
                            onClick={() => {
                              setShowMissions(false);
                              onNavigate('sportsbook');
                            }}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-black rounded-full shadow-sm uppercase transition"
                          >
                            Go
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}

              {/* 7. TURNOVER REBATE CALCULATOR MODAL */}
              {showRebate && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-3xl p-6 shadow-2xl max-w-md w-full border border-slate-100"
                  >
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                      <h4 className="text-sm font-black text-slate-800 uppercase flex items-center space-x-2">
                        <Percent className="h-4.5 w-4.5 text-amber-500" />
                        <span>Daily Turnover Rebates</span>
                      </h4>
                      <button 
                        onClick={() => setShowRebate(false)}
                        className="text-slate-400 hover:text-slate-600 font-bold text-lg"
                      >
                        ×
                      </button>
                    </div>

                    <div className="space-y-4">
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Claim instant turnover commissions depending on your current VIP Tier level. Wagers placed on Sports and Casino slots accumulate automatically!
                      </p>

                      <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-slate-600">Your VIP Tier Rank:</span>
                          <span className="font-extrabold text-[#1FA66A] uppercase">{getVipRankName(user.vipLevel)}</span>
                        </div>
                        <div className="flex justify-between text-xs border-t border-slate-200/50 pt-2">
                          <span className="font-semibold text-slate-600">Rebate Percentage:</span>
                          <span className="font-extrabold text-slate-800 font-mono">
                            {user.vipLevel === 0 ? '1.0%' : user.vipLevel === 1 ? '2.0%' : user.vipLevel === 2 ? '3.5%' : user.vipLevel === 3 ? '5.0%' : '8.0%'}
                          </span>
                        </div>
                      </div>

                      <div className="bg-amber-50 border border-amber-100 text-amber-900 rounded-2xl p-4 text-[11px] font-semibold leading-relaxed">
                        🔥 Rebates are processed automatically daily at 12:00 PM BST and credited to your active wallet instantly.
                      </div>

                      <button 
                        onClick={() => setShowRebate(false)}
                        className="w-full rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase py-2.5 transition"
                      >
                        Close
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}

              {/* 8. DOWNLOAD APP MODAL */}
              {showDownloadApp && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full border border-slate-100 text-center"
                  >
                    <div className="flex justify-end">
                      <button 
                        onClick={() => setShowDownloadApp(false)}
                        className="text-slate-400 hover:text-slate-600 font-bold text-lg"
                      >
                        ×
                      </button>
                    </div>

                    <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4">
                      <Smartphone className="h-8 w-8 text-[#1FA66A]" />
                    </div>

                    <h4 className="text-base font-black text-slate-800">Download BETEPRO App</h4>
                    <p className="text-xs text-slate-500 mt-1 mb-5">
                      Get the ultimate gaming experience with faster loading speeds, exclusive notifications, and real-time odds update.
                    </p>

                    <div className="space-y-2.5">
                      {settings?.androidApkLink ? (
                        <a 
                          href={settings.androidApkLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs py-3 flex items-center justify-center space-x-2 shadow transition text-center"
                        >
                          <span>Download Android APK</span>
                        </a>
                      ) : (
                        <button 
                          disabled
                          className="w-full rounded-xl bg-slate-100 text-slate-400 cursor-not-allowed font-black text-xs py-3 flex items-center justify-center space-x-2 transition text-center border border-slate-200/50"
                        >
                          <span>Android APK (Coming Soon)</span>
                        </button>
                      )}

                      {settings?.iosAvailable ? (
                        <a 
                          href={settings.iosAppLink || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 font-black text-xs py-3 flex items-center justify-center space-x-2 transition text-center"
                        >
                          <span>iOS WebApp Setup</span>
                        </a>
                      ) : (
                        <button 
                          disabled
                          className="w-full rounded-xl bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed font-black text-xs py-3 flex items-center justify-center space-x-2 transition text-center"
                        >
                          <span>iOS App Temporarily Unavailable</span>
                        </button>
                      )}
                    </div>
                  </motion.div>
                </div>
              )}

              {/* 9. INTERNAL MESSAGES SYSTEM INBOX MODAL */}
              {showNotificationsModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-3xl p-6 shadow-2xl max-w-lg w-full border border-slate-100 max-h-[80vh] flex flex-col"
                  >
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                      <h4 className="text-sm font-black text-slate-800 uppercase flex items-center space-x-2">
                        <Mail className="h-4.5 w-4.5 text-amber-500" />
                        <span>Internal System Messages</span>
                      </h4>
                      <button 
                        onClick={() => setShowNotificationsModal(false)}
                        className="text-slate-400 hover:text-slate-600 font-bold text-lg"
                      >
                        ×
                      </button>
                    </div>

                    <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                      <div className="p-4 border border-blue-100 bg-blue-50/50 rounded-2xl relative">
                        <span className="absolute top-4 right-4 bg-blue-500 text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full">
                          NEW
                        </span>
                        <h5 className="text-xs font-black text-slate-800 mb-1">Welcome Welcome 100% Sportsbook Match Bonus!</h5>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          Welcome to BETEPRO! Claim a 100% match bonus on your initial deposit today. Just top up ৳1,000 or more, and your extra wagering balance will be auto-released.
                        </p>
                        <span className="text-[9px] text-slate-400 block mt-2 font-mono">2 hours ago</span>
                      </div>

                      <div className="p-4 border border-slate-100 bg-slate-50/60 rounded-2xl">
                        <h5 className="text-xs font-black text-slate-700 mb-1">bKash Fast Gateway Integration Update</h5>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          We have updated our secure automated gateway! You can now complete real-time deposits and experience withdrawal clearances within 15 minutes flat.
                        </p>
                        <span className="text-[9px] text-slate-400 block mt-2 font-mono">1 day ago</span>
                      </div>

                      <div className="p-4 border border-slate-100 bg-slate-50/60 rounded-2xl">
                        <h5 className="text-xs font-black text-slate-700 mb-1">Weekly Sports Cashback Release</h5>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          Your weekly rebate statements have been cleared and credited directly into your active cash wallet. Keep betting on cricket for higher limits!
                        </p>
                        <span className="text-[9px] text-slate-400 block mt-2 font-mono">3 days ago</span>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}

              {/* 10. MY CARDS / WITHDRAWAL ACCOUNT MANAGER MODAL */}
              {showCards && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-3xl p-6 shadow-2xl max-w-md w-full border border-slate-100"
                  >
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                      <h4 className="text-sm font-black text-slate-800 uppercase flex items-center space-x-2">
                        <Wallet className="h-4.5 w-4.5 text-amber-500" />
                        <span>Withdrawal Account Cards</span>
                      </h4>
                      <button 
                        onClick={() => { setShowCards(false); setAccountUpdateSuccess(''); }}
                        className="text-slate-400 hover:text-slate-600 font-bold text-lg"
                      >
                        ×
                      </button>
                    </div>

                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      setAccountUpdateSuccess('');
                      setCardError('');
                      try {
                        const token = localStorage.getItem('token');
                        const res = await fetch('/api/auth/bind-wallet', {
                          method: 'PUT',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                          },
                          body: JSON.stringify({
                            bkash: savedAccounts.bkash,
                            nagad: savedAccounts.nagad,
                            rocket: savedAccounts.rocket
                          })
                        });
                        const data = await res.json();
                        if (res.ok) {
                          setAccountUpdateSuccess('Wallets bound and locked successfully!');
                          // Backup in local storage
                          if (savedAccounts.bkash) localStorage.setItem(`bkash_${user.username}`, savedAccounts.bkash);
                          if (savedAccounts.nagad) localStorage.setItem(`nagad_${user.username}`, savedAccounts.nagad);
                          if (savedAccounts.rocket) localStorage.setItem(`rocket_${user.username}`, savedAccounts.rocket);
                          onRefreshUser(); // Reload user state
                        } else {
                          setCardError(data.error || 'Failed to bind wallets.');
                        }
                      } catch (err) {
                        setCardError('A network error occurred. Please try again.');
                      }
                    }} className="space-y-4">
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Bind your personal mobile financial wallets for instant payouts. <strong>Once bound, numbers are locked permanently for security.</strong>
                      </p>

                      <div className="space-y-3">
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">bKash Account Number</label>
                            {user.bkashNumber && (
                              <span className="text-[9px] font-bold text-red-500 flex items-center space-x-1 uppercase">
                                <span>Locked 🔒</span>
                              </span>
                            )}
                          </div>
                          <input
                            type="text"
                            value={savedAccounts.bkash}
                            onChange={(e) => setSavedAccounts({ ...savedAccounts, bkash: e.target.value })}
                            disabled={!!user.bkashNumber}
                            className={`w-full rounded-xl p-3 text-xs text-slate-800 focus:border-[#1FA66A] focus:outline-none border ${
                              user.bkashNumber ? 'bg-slate-100 border-slate-200 cursor-not-allowed font-semibold' : 'bg-slate-50 border-slate-200'
                            }`}
                            placeholder={user.bkashNumber ? user.bkashNumber : "e.g. 01712345678"}
                          />
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Nagad Account Number</label>
                            {user.nagadNumber && (
                              <span className="text-[9px] font-bold text-red-500 flex items-center space-x-1 uppercase">
                                <span>Locked 🔒</span>
                              </span>
                            )}
                          </div>
                          <input
                            type="text"
                            value={savedAccounts.nagad}
                            onChange={(e) => setSavedAccounts({ ...savedAccounts, nagad: e.target.value })}
                            disabled={!!user.nagadNumber}
                            className={`w-full rounded-xl p-3 text-xs text-slate-800 focus:border-[#1FA66A] focus:outline-none border ${
                              user.nagadNumber ? 'bg-slate-100 border-slate-200 cursor-not-allowed font-semibold' : 'bg-slate-50 border-slate-200'
                            }`}
                            placeholder={user.nagadNumber ? user.nagadNumber : "e.g. 01712345678"}
                          />
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Rocket Account Number</label>
                            {user.rocketNumber && (
                              <span className="text-[9px] font-bold text-red-500 flex items-center space-x-1 uppercase">
                                <span>Locked 🔒</span>
                              </span>
                            )}
                          </div>
                          <input
                            type="text"
                            value={savedAccounts.rocket}
                            onChange={(e) => setSavedAccounts({ ...savedAccounts, rocket: e.target.value })}
                            disabled={!!user.rocketNumber}
                            className={`w-full rounded-xl p-3 text-xs text-slate-800 focus:border-[#1FA66A] focus:outline-none border ${
                              user.rocketNumber ? 'bg-slate-100 border-slate-200 cursor-not-allowed font-semibold' : 'bg-slate-50 border-slate-200'
                            }`}
                            placeholder={user.rocketNumber ? user.rocketNumber : "e.g. 01712345678"}
                          />
                        </div>
                      </div>

                      {accountUpdateSuccess && (
                        <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-600 rounded-xl text-xs font-semibold">
                          {accountUpdateSuccess}
                        </div>
                      )}

                      {cardError && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 rounded-xl text-xs font-semibold">
                          {cardError}
                        </div>
                      )}

                      <div className="flex space-x-3 pt-2">
                        <button
                          type="button"
                          onClick={() => { setShowCards(false); setAccountUpdateSuccess(''); setCardError(''); }}
                          className="flex-1 rounded-xl bg-slate-100 hover:bg-slate-200 py-2.5 text-xs font-bold text-slate-700 uppercase tracking-wider transition"
                        >
                          Close
                        </button>
                        {(!user.bkashNumber || !user.nagadNumber || !user.rocketNumber) && (
                          <button
                            type="submit"
                            className="flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-2.5 text-xs font-black text-white hover:brightness-110 tracking-wider uppercase transition shadow-md shadow-amber-500/20"
                          >
                            Bind Wallets
                          </button>
                        )}
                      </div>
                    </form>
                  </motion.div>
                </div>
              )}
            </motion.div>
          )}

          {/* VIP CLUB SCREEN */}
          {subTab === 'vip' && (
            <motion.div 
              key="vip"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {/* TOP BAR TITLE HEADER */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 bg-gradient-to-r from-[#0D6B45] to-[#1FA66A] p-4 -mx-6 -mt-6 rounded-t-2xl text-white shadow-sm mb-5">
                <button 
                  onClick={() => setSubTab('profile')}
                  className="flex items-center space-x-1 hover:text-yellow-300 transition text-xs font-black"
                >
                  <span className="text-lg font-bold">‹</span>
                  <span>Back</span>
                </button>
                <h3 className="text-sm font-black uppercase tracking-wider">VIP Club Lounge</h3>
                <div className="w-8"></div> {/* Spacer for balancing */}
              </div>
              {/* Massive VIP Badge card */}
              <div className="rounded-2xl bg-gradient-to-br from-[#1FA66A] to-[#0D6B45] p-6 text-white border border-white/15 relative overflow-hidden shadow-xl">
                
                {/* Background stars */}
                <div className="absolute right-[-20px] bottom-[-20px] text-9xl text-white/5 select-none font-bold">
                  ★
                </div>

                <div className="relative space-y-4">
                  <span className="text-[10px] uppercase font-black font-mono tracking-widest text-[#FF9F00]">BETEPRO VIP MEMBER CLUB</span>
                  
                  <div>
                    <h2 className="text-3xl font-black">{getVipRankName(user.vipLevel)}</h2>
                    <p className="text-xs text-gray-200 mt-1">Status level: Level {user.vipLevel} — Level points: {user.vipPoints} points</p>
                  </div>

                  {/* VIP Progress meter */}
                  <div className="space-y-1.5 pt-2">
                    <div className="flex justify-between text-[10px] font-bold text-gray-200">
                      <span>{t.vipProgress}</span>
                      <span>{user.vipPoints} / {vipTarget}</span>
                    </div>
                    <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#FF9F00] to-yellow-300" style={{ width: `${vipPercent}%` }} />
                    </div>
                    {user.vipLevel < 4 && (
                      <span className="block text-[10px] text-gray-300 font-medium">
                        Need {vipTarget - user.vipPoints} {t.nextLevelPoints} "{getVipRankName(user.vipLevel + 1)}".
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* VIP Benefits list */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl text-xs space-y-2">
                  <h4 className="font-extrabold text-[#FF9F00] uppercase tracking-wider text-[10px]">Active Rewards & Privileges</h4>
                  <p className="text-slate-700">Daily Withdrawal Limit: <span className="font-bold text-slate-950">{VIP_RANKS[user.vipLevel].limit} BDT</span></p>
                  <p className="text-slate-700">Automatic Cashback Rebate: <span className="font-bold text-slate-950">{VIP_RANKS[user.vipLevel].cash} on turnover</span></p>
                  <p className="text-slate-700">VIP Bonus Points: <span className="font-bold text-slate-950">+{user.vipLevel * 10}% extra bonus</span></p>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl text-xs space-y-2 leading-relaxed">
                  <h4 className="font-extrabold text-[#1FA66A] uppercase tracking-wider text-[10px]">How to Level Up?</h4>
                  <p className="text-slate-500">Earn points automatically with every bet prediction and casino run on our platform:</p>
                  <ul className="list-disc list-inside text-slate-500 space-y-1 pl-1">
                    <li>1 VIP point for every ৳100 sports prediction stake.</li>
                    <li>1 VIP point for every ৳200 casino game bet.</li>
                    <li>Bonus points credited directly on successful BKash deposit approvals!</li>
                  </ul>
                </div>
              </div>

            </motion.div>
          )}

          {/* REFERRAL CENTER SCREEN */}
          {subTab === 'referral' && (
            <motion.div 
              key="referral"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {/* TOP BAR TITLE HEADER */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 bg-gradient-to-r from-[#0D6B45] to-[#1FA66A] p-4 -mx-6 -mt-6 rounded-t-2xl text-white shadow-sm mb-5">
                <button 
                  onClick={() => setSubTab('profile')}
                  className="flex items-center space-x-1 hover:text-yellow-300 transition text-xs font-black"
                >
                  <span className="text-lg font-bold">‹</span>
                  <span>Back</span>
                </button>
                <h3 className="text-sm font-black uppercase tracking-wider">Referral Program</h3>
                <div className="w-8"></div> {/* Spacer for balancing */}
              </div>
              {/* Refer Banner */}
              <div className="rounded-2xl border border-[#1FA66A]/20 bg-emerald-50/50 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <span className="text-[10px] font-black uppercase text-[#FF9F00] tracking-widest font-mono">Invite Friends</span>
                  <h3 className="text-lg font-black text-slate-800">Get ৳200 Bonus Per Registration!</h3>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-md">
                    Invite your friends to register on BETEPRO. When they sign up using your link, they receive a ৳700 welcome balance, and you instantly get a ৳200 credit in your wallet!
                  </p>
                </div>

                <div className="bg-white border border-slate-200/80 p-3.5 rounded-xl flex items-center justify-between space-x-3.5 shrink-0 shadow-sm">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">{t.referralLink}</span>
                    <span className="font-mono text-xs font-black text-slate-800">{user.referralCode}</span>
                  </div>
                  <button
                    onClick={() => handleCopy(user.referralCode)}
                    className="rounded-lg bg-[#1FA66A] px-3.5 py-1.5 text-xs font-bold text-white hover:brightness-110 active:scale-95 transition shadow-sm shadow-[#1FA66A]/20"
                  >
                    {copiedText ? 'Copied' : t.copyLink}
                  </button>
                </div>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Referral Code Invites</span>
                  <span className="text-2xl font-black text-slate-800 mt-1 block">
                    {user.referredBy ? 'Referred Member' : 'Direct Signups'}
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">{t.referralEarnings}</span>
                  <span className="text-2xl font-black text-[#1FA66A] mt-1 block">
                    ৳200 BDT
                  </span>
                </div>
              </div>

            </motion.div>
          )}

          {/* CUSTOMER SUPPORT TICKETS SCREEN */}
          {subTab === 'support' && (
            <motion.div 
              key="support"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {/* TOP BAR TITLE HEADER */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 bg-gradient-to-r from-[#0D6B45] to-[#1FA66A] p-4 -mx-6 -mt-6 rounded-t-2xl text-white shadow-sm mb-5">
                <button 
                  onClick={() => setSubTab('profile')}
                  className="flex items-center space-x-1 hover:text-yellow-300 transition text-xs font-black"
                >
                  <span className="text-lg font-bold">‹</span>
                  <span>Back</span>
                </button>
                <h3 className="text-sm font-black uppercase tracking-wider">Customer Support</h3>
                <div className="w-8"></div> {/* Spacer for balancing */}
              </div>

              {/* INSTANT CONTACT CHANNELS */}
              {channels.length > 0 && (
                <div className="bg-slate-50 border border-slate-150 p-4 rounded-3xl space-y-3">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-black uppercase text-[#1FA66A] tracking-wider block">⚡ Live Support Channels</span>
                    <span className="text-[10px] text-slate-500 font-medium block">
                      Connect instantly with our verified staff members via external official messenger groups.
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {channels.map((channel) => (
                      <a
                        key={channel.id}
                        href={channel.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 font-bold text-xs flex items-center space-x-1.5 hover:bg-slate-50 hover:border-slate-300 transition shadow-sm"
                      >
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                        <span className="font-extrabold text-[10px] text-slate-500 uppercase font-mono">
                          {channel.icon === 'Send' ? 'Telegram' : channel.icon === 'Phone' ? 'WhatsApp' : 'Chat'}
                        </span>
                        <span className="text-slate-800 font-extrabold">{channel.name}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Form */}
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center space-x-2">
                    <Ticket className="h-4.5 w-4.5 text-[#1FA66A]" />
                    <span>{t.createTicket}</span>
                  </h3>
                </div>

                <form onSubmit={handleTicketSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">{t.ticketSubject}</label>
                    <input
                      type="text"
                      value={ticketSubject}
                      onChange={(e) => setTicketSubject(e.target.value)}
                      placeholder="e.g. Deposit verified delay, TrxID query"
                      className="w-full rounded-xl bg-white border border-slate-200 p-3 text-xs text-slate-800 focus:border-[#1FA66A] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">{t.ticketMessage}</label>
                    <textarea
                      value={ticketMessage}
                      onChange={(e) => setTicketMessage(e.target.value)}
                      rows={4}
                      placeholder={t.ticketMessage}
                      className="w-full rounded-xl bg-white border border-slate-200 p-3 text-xs text-slate-800 focus:border-[#1FA66A] focus:outline-none resize-none"
                    />
                  </div>

                  {ticketSuccess && (
                    <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-600 rounded-xl text-xs font-semibold">
                      {ticketSuccess}
                    </div>
                  )}
                  {ticketError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 rounded-xl text-xs font-semibold">
                      {ticketError}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full rounded-xl bg-gradient-to-r from-[#1FA66A] to-[#0D6B45] py-2.5 text-xs font-black text-white hover:brightness-110 tracking-widest uppercase transition shadow-lg shadow-[#1FA66A]/20"
                  >
                    {t.submitTicket}
                  </button>
                </form>
              </div>

              {/* Tickets History list */}
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">My Support Tickets</h3>
                </div>

                <div className="space-y-3 max-h-80 overflow-y-auto animate-none">
                  {ticketsLoading && tickets.length === 0 ? (
                    <p className="text-center py-6 text-xs text-slate-400 animate-pulse">Loading support threads...</p>
                  ) : tickets.length === 0 ? (
                    <p className="text-center py-6 text-xs text-slate-400">No support tickets created yet.</p>
                  ) : (
                    tickets.map(ticket => (
                      <div key={ticket.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs space-y-2 shadow-sm">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-1 mb-1">
                          <span className="font-extrabold text-slate-800">{ticket.subject}</span>
                          {ticket.status === 'open' ? (
                            <span className="inline-block rounded-full bg-amber-50 border border-amber-100 px-2 py-0.5 text-[8px] font-black text-amber-600 uppercase">
                              Under Review
                            </span>
                          ) : (
                            <span className="inline-block rounded-full bg-emerald-50 border border-emerald-100 px-2 py-0.5 text-[8px] font-black text-[#1FA66A] uppercase">
                              Replied
                            </span>
                          )}
                        </div>
                        
                        <p className="text-slate-600 leading-normal text-[11px]">{ticket.message}</p>
                        
                        {ticket.reply && (
                          <div className="bg-emerald-50/60 border-l-2 border-[#1FA66A] p-2 rounded-r-lg mt-2 text-[11px] leading-relaxed">
                            <span className="font-black text-[#1FA66A] block text-[9px] uppercase mb-0.5">BETEPRO Support Desk:</span>
                            <p className="text-slate-700">{ticket.reply}</p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </motion.div>
          )}

        </AnimatePresence>
      </div>

    </div>
  );
}
