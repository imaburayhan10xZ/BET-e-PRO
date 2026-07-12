/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, TrendingUp, Users, Wallet, Trophy, BadgePercent, 
  FileText, Settings, Activity, Headphones, Image as ImageIcon, ShieldCheck,
  ChevronRight, X, Sparkles, BellRing, BellOff, RefreshCw, LayoutGrid
} from 'lucide-react';
import { User, Transaction, Match, SupportTicket, SystemSettings, Promotion } from '../types';
import { requestNotificationPermission, playChimeSound } from '../utils/notifications';

import AnalyticsPanel from './admin/AnalyticsPanel';
import UsersPanel from './admin/UsersPanel';
import TransactionsPanel from './admin/TransactionsPanel';
import MatchesPanel from './admin/MatchesPanel';
import PromotionsPanel from './admin/PromotionsPanel';
import TicketsPanel from './admin/TicketsPanel';
import SettingsPanel from './admin/SettingsPanel';
import SupportChannelsPanel from './admin/SupportChannelsPanel';
import SlidersNoticesPanel from './admin/SlidersNoticesPanel';
import AdminManagementPanel from './admin/AdminManagementPanel';

interface AdminPanelProps {
  user: User;
  onRefreshUser: () => void;
}

type AdminTab = 'analytics' | 'users' | 'transactions' | 'matches' | 'promotions' | 'tickets' | 'support_channels' | 'sliders_notices' | 'settings' | 'admin_management';

export default function AdminPanel({ user, onRefreshUser }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('analytics');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );
  
  // Shared States
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txsLoading, setTxsLoading] = useState(false);

  const [matches, setMatches] = useState<Match[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);

  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [promotionsLoading, setPromotionsLoading] = useState(false);

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);

  const [sysSettings, setSysSettings] = useState<SystemSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);

  // Auth helper
  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const hasAccess = (tabId: AdminTab) => {
    if (user.role === 'primary_admin') return true;
    if (tabId === 'admin_management') return false; // restricted to primary admin only
    const allowed = user.allowedTabs || [];
    return allowed.includes(tabId);
  };

  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const res = await fetch('/api/admin/analytics', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const res = await fetch('/api/admin/users', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      setTxsLoading(true);
      const res = await fetch('/api/admin/transactions', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setTransactions(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTxsLoading(false);
    }
  };

  const fetchMatches = async () => {
    try {
      setMatchesLoading(true);
      const res = await fetch('/api/sports/matches');
      if (res.ok) {
        const data = await res.json();
        setMatches(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setMatchesLoading(false);
    }
  };

  const fetchPromotions = async () => {
    try {
      setPromotionsLoading(true);
      const res = await fetch('/api/admin/promotions', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setPromotions(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPromotionsLoading(false);
    }
  };

  const fetchTickets = async () => {
    try {
      setTicketsLoading(true);
      const res = await fetch('/api/admin/tickets', { headers: getHeaders() });
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

  const fetchSettings = async () => {
    try {
      setSettingsLoading(true);
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSysSettings(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSettingsLoading(false);
    }
  };

  // Pre-load key statistics for the dashboard on mount
  useEffect(() => {
    fetchAnalytics();
    fetchTransactions();
    fetchUsers();
    fetchMatches();
    fetchTickets();
    fetchSettings();
  }, []);

  // Handle opening a specific admin section
  const handleOpenSection = (tabId: AdminTab) => {
    setActiveTab(tabId);
    setIsModalOpen(true);

    // Dynamic refetches to ensure absolutely up-to-date states
    if (tabId === 'analytics') fetchAnalytics();
    if (tabId === 'users') fetchUsers();
    if (tabId === 'transactions') {
      fetchTransactions();
      fetchUsers();
    }
    if (tabId === 'matches') fetchMatches();
    if (tabId === 'promotions') fetchPromotions();
    if (tabId === 'tickets') fetchTickets();
    if (tabId === 'settings') fetchSettings();
  };

  // Derived metrics for display badges on the main page boxes
  const pendingDepositsCount = transactions.filter(t => t.type === 'deposit' && t.status === 'pending').length;
  const pendingWithdrawalsCount = transactions.filter(t => t.type === 'withdraw' && t.status === 'pending').length;
  const activeMatchesCount = matches.filter(m => !m.isCompleted).length;
  const activeTicketsCount = tickets.filter(t => t.status === 'open' || t.status === 'pending').length;
  const totalPlayersCount = users.length;

  // Box definitions matching the exact list in the requested design
  const launcherBoxes = [
    {
      id: 'analytics' as const,
      label: 'Platform Metrics',
      labelBn: 'প্ল্যাটফর্ম পরিসংখ্যান',
      desc: 'Profit-loss analytics, daily deposit/withdraw volumes & volume graphs.',
      icon: Activity,
      color: 'bg-amber-50 text-amber-600 border-amber-100 hover:border-amber-300 hover:bg-amber-100/50',
      badge: analytics ? `৳${analytics.netProfit?.toLocaleString() || '0'} Profit` : 'Live Stats'
    },
    {
      id: 'users' as const,
      label: 'Player Database',
      labelBn: 'প্লেয়ার ডাটাবেজ',
      desc: 'View users, modify wallet balances, update VIP levels & suspend accounts.',
      icon: Users,
      color: 'bg-sky-50 text-sky-600 border-sky-100 hover:border-sky-300 hover:bg-sky-100/50',
      badge: totalPlayersCount > 0 ? `${totalPlayersCount} Players Registered` : '0 Registered'
    },
    {
      id: 'transactions' as const,
      label: 'Gateway Ledgers',
      labelBn: 'লেনদেন গেটওয়ে',
      desc: 'Approve or reject bKash/Nagad/Rocket deposits and withdrawals.',
      icon: Wallet,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:border-emerald-300 hover:bg-emerald-100/50',
      badge: (pendingDepositsCount > 0 || pendingWithdrawalsCount > 0) 
        ? `🚨 Dep: ${pendingDepositsCount} | With: ${pendingWithdrawalsCount} Pending`
        : '🟢 Ledgers Clean'
    },
    {
      id: 'matches' as const,
      label: 'Match Settle Panel',
      labelBn: 'ম্যাচ রেজাল্ট সেটেল',
      desc: 'Settle live cricket/football match bets or create new matches.',
      icon: Trophy,
      color: 'bg-[#FF9F00]/5 text-[#FF9F00] border-[#FF9F00]/20 hover:border-[#FF9F00]/40 hover:bg-[#FF9F00]/10',
      badge: activeMatchesCount > 0 ? `${activeMatchesCount} Matches Active` : '0 Active Matches'
    },
    {
      id: 'promotions' as const,
      label: 'Campaign Creator',
      labelBn: 'প্রমোশন ক্যাম্পেইন',
      desc: 'Manage promotional banners, offers, and registration incentives.',
      icon: BadgePercent,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:border-indigo-300 hover:bg-indigo-100/50',
      badge: 'Active campaigns'
    },
    {
      id: 'tickets' as const,
      label: 'Support Tickets',
      labelBn: 'হেল্প টিকেট মেসেজ',
      desc: 'Review support messages, live chat with players & resolve issues.',
      icon: FileText,
      color: 'bg-rose-50 text-rose-600 border-rose-100 hover:border-rose-300 hover:bg-rose-100/50',
      badge: activeTicketsCount > 0 ? `🔥 ${activeTicketsCount} Open Tickets` : 'No open issues'
    },
    {
      id: 'support_channels' as const,
      label: 'Support Channels',
      labelBn: 'কাস্টমার সাপোর্ট লিংক',
      desc: 'Update Telegram link, WhatsApp support, or live agent settings.',
      icon: Headphones,
      color: 'bg-teal-50 text-teal-600 border-teal-100 hover:border-teal-300 hover:bg-teal-100/50',
      badge: 'Support Gateways'
    },
    {
      id: 'sliders_notices' as const,
      label: 'Sliders & Notices',
      labelBn: 'ব্যানার ও নোটিশ',
      desc: 'Add home carousel banners or change scrolling marque notices.',
      icon: ImageIcon,
      color: 'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-100 hover:border-fuchsia-300 hover:bg-fuchsia-100/50',
      badge: 'Banners & Marquee'
    },
    {
      id: 'settings' as const,
      label: 'Platform Config',
      labelBn: 'সাইট মেইন কনফিগ',
      desc: 'Change site name, upload logo/favicon, update transaction limits.',
      icon: Settings,
      color: 'bg-purple-50 text-purple-600 border-purple-100 hover:border-purple-300 hover:bg-purple-100/50',
      badge: sysSettings ? `${sysSettings.siteName || 'BetePro BDT'}` : 'Site Parameters'
    },
    {
      id: 'admin_management' as const,
      label: 'Admin Management',
      labelBn: 'সাব-অ্যাডমিন রোলস',
      desc: 'Configure sub-admins, permissions, and security parameters.',
      icon: ShieldCheck,
      color: 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-400 hover:bg-slate-150/50',
      badge: user.role === 'primary_admin' ? 'Primary Root Access' : 'Restricted Tab'
    }
  ];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 text-xs text-slate-700">
      
      {/* -------------------- ADMIN HEADER BAR -------------------- */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center space-x-4 text-center md:text-left">
          <div className="p-3 bg-[#FF9F00] text-slate-950 rounded-2xl shadow-lg shrink-0">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center justify-center md:justify-start space-x-2">
              <h2 className="text-base font-black tracking-wider uppercase text-[#FF9F00] font-mono">Admin Control Panel</h2>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" title="System Live connected" />
            </div>
            <p className="text-[11px] text-slate-300 mt-1 max-w-lg leading-normal">
              Secure console gateway to manage ledger ledgers, payout risks, player databases, support queries and platform branding.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3.5">
          {/* Quick Refresh Status info */}
          <button
            onClick={() => {
              fetchAnalytics();
              fetchTransactions();
              fetchUsers();
              fetchMatches();
              fetchTickets();
              fetchSettings();
              alert('সকল তথ্য রিয়েল-টাইম ডাটাবেজ থেকে সিঙ্ক করা হয়েছে!');
            }}
            className="px-4.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 transition flex items-center space-x-2 text-slate-200 hover:text-white font-extrabold text-[10px] uppercase tracking-wider cursor-pointer active:scale-95"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Sync Live DB</span>
          </button>
        </div>
      </div>

      {/* -------------------- NOTIFICATION PERMISSION BANNER -------------------- */}
      {notifPermission !== 'granted' && (
        <div className="p-4.5 rounded-2xl bg-amber-50 border border-amber-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5 text-center sm:text-left">
            <span className="flex h-3.5 w-3.5 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500"></span>
            </span>
            <div>
              <h4 className="text-xs font-black text-amber-950 uppercase tracking-wider flex items-center justify-center sm:justify-start space-x-1.5">
                <span>Enable Admin Push Alerts</span>
                <span className="text-[10px] text-amber-800 font-bold">(অ্যাডমিন রিয়েল-টাইম নোটিফিকেশন)</span>
              </h4>
              <p className="text-[10.5px] text-amber-900/80 font-medium leading-relaxed mt-0.5">
                বিকাশ/নগদ ডিপোজিট বা উইথড্র রিকোয়েস্ট আসার সাথে সাথে পিসি/মোবাইলে সাথে সাথে নোটিফিকেশন পেতে এটি চালু করুন।
              </p>
            </div>
          </div>
          <button
            onClick={async () => {
              const permission = await requestNotificationPermission();
              setNotifPermission(permission);
              if (permission === 'granted') {
                playChimeSound('success');
                alert('সফল হয়েছে! নোটিফিকেশন চালু করা হয়েছে। (Success! Live Alerts activated.)');
              } else if (permission === 'denied') {
                alert('নোটিফিকেশন অনুমতি ব্লক করা আছে। ব্রাউজার সেটিংসে গিয়ে অনুমতি দিন। (Please allow in browser settings.)');
              }
            }}
            className="shrink-0 px-4.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-black transition-all shadow-sm flex items-center space-x-1.5 cursor-pointer"
          >
            <BellRing className="h-3.5 w-3.5" />
            <span>Live Alerts চালু করুন</span>
          </button>
        </div>
      )}

      {/* -------------------- MAIN GRID OF BOX LAUNCHERS -------------------- */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-slate-800">
            <LayoutGrid className="h-4.5 w-4.5 text-slate-500" />
            <h3 className="text-xs font-black uppercase tracking-wider">Control Console Sections</h3>
          </div>
          <span className="text-[10px] font-bold text-slate-400">Select any module to open management popup</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {launcherBoxes.filter(box => hasAccess(box.id)).map((box) => {
            const BoxIcon = box.icon;
            return (
              <motion.div
                key={box.id}
                whileHover={{ scale: 1.015, y: -2 }}
                whileTap={{ scale: 0.985 }}
                onClick={() => handleOpenSection(box.id)}
                className={`p-5 bg-white border border-slate-200/80 rounded-2xl cursor-pointer transition-all hover:shadow-lg flex flex-col justify-between space-y-4 relative overflow-hidden group`}
              >
                {/* Background decorative shine effect */}
                <div className="absolute right-0 top-0 h-24 w-24 bg-slate-50/20 rounded-bl-full pointer-events-none group-hover:bg-slate-100/10 transition-colors" />

                <div className="flex items-start justify-between relative z-10">
                  <div className={`p-3.5 rounded-2xl border transition-colors ${box.color.split(' ')[0]} ${box.color.split(' ')[1]} ${box.color.split(' ')[2]} ${box.color.split(' ')[3]} shrink-0`}>
                    <BoxIcon className="h-5.5 w-5.5" />
                  </div>
                  
                  <span className="text-[9.5px] font-black px-3 py-1 rounded-full bg-slate-50 text-slate-500 border border-slate-200/60 font-mono">
                    {box.badge}
                  </span>
                </div>
                
                <div className="space-y-1 relative z-10">
                  <h4 className="text-[12.5px] font-black text-slate-800 uppercase tracking-wide flex items-center space-x-1.5">
                    <span>{box.label}</span>
                    <span className="text-[10px] text-slate-400 font-bold">({box.labelBn})</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 font-medium leading-relaxed">{box.desc}</p>
                </div>

                <div className="pt-3 border-t border-dashed border-slate-100 flex items-center justify-between text-[10px] font-black text-indigo-600 uppercase tracking-wider relative z-10">
                  <span>Manage Parameter & Control</span>
                  <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* -------------------- UNIFIED IMMERSIVE POPUP MODAL CONTAINER -------------------- */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            
            {/* Backdrop Blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />

            {/* Immersive Window Frame */}
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 30 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-100/80 overflow-hidden flex flex-col max-h-[92vh] z-10"
            >
              
              {/* Modal Dynamic Header */}
              {(() => {
                const currentBox = launcherBoxes.find(b => b.id === activeTab);
                if (!currentBox) return null;
                const HeaderIcon = currentBox.icon;
                return (
                  <div className="bg-slate-950 text-white p-5 flex items-center justify-between border-b border-slate-800">
                    <div className="flex items-center space-x-3.5">
                      <div className="p-3 bg-slate-900 rounded-2xl border border-slate-850 text-amber-400">
                        <HeaderIcon className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-sm font-black uppercase tracking-wider text-amber-300">
                            {currentBox.label}
                          </h3>
                          <span className="text-[10px] text-slate-400 font-bold bg-slate-900 px-2.5 py-0.5 rounded-lg border border-slate-800">
                            {currentBox.labelBn}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-medium leading-normal">{currentBox.desc}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition duration-200 cursor-pointer border border-white/10"
                      title="Close Section"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                );
              })()}

              {/* Modal Scrollable Interactive Area */}
              <div className="p-6 overflow-y-auto max-h-[72vh] bg-slate-50/40 relative">
                
                {activeTab === 'analytics' && (
                  <AnalyticsPanel
                    analytics={analytics}
                    loading={analyticsLoading}
                    onRefresh={fetchAnalytics}
                  />
                )}

                {activeTab === 'users' && (
                  <UsersPanel
                    users={users}
                    loading={usersLoading}
                    onRefresh={fetchUsers}
                    onRefreshUser={onRefreshUser}
                  />
                )}

                {activeTab === 'transactions' && (
                  <TransactionsPanel
                    transactions={transactions}
                    users={users}
                    loading={txsLoading}
                    onRefresh={fetchTransactions}
                    onRefreshUser={onRefreshUser}
                  />
                )}

                {activeTab === 'matches' && (
                  <MatchesPanel
                    matches={matches}
                    loading={matchesLoading}
                    onRefresh={fetchMatches}
                    onRefreshUser={onRefreshUser}
                  />
                )}

                {activeTab === 'promotions' && (
                  <PromotionsPanel
                    promotions={promotions}
                    loading={promotionsLoading}
                    onRefresh={fetchPromotions}
                  />
                )}

                {activeTab === 'tickets' && (
                  <TicketsPanel
                    tickets={tickets}
                    loading={ticketsLoading}
                    onRefresh={fetchTickets}
                  />
                )}

                {activeTab === 'support_channels' && (
                  <SupportChannelsPanel />
                )}

                {activeTab === 'sliders_notices' && (
                  <SlidersNoticesPanel />
                )}

                {activeTab === 'settings' && (
                  <SettingsPanel
                    settings={sysSettings}
                    loading={settingsLoading}
                    onRefresh={fetchSettings}
                  />
                )}

                {activeTab === 'admin_management' && (
                  <AdminManagementPanel />
                )}

              </div>

              {/* Modal Uniform Footer */}
              <div className="bg-slate-50 border-t border-slate-100 p-4.5 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                <div className="flex items-center space-x-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                  <span>Real-time Secure Connection Active</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-wider text-[9px] rounded-xl transition cursor-pointer"
                >
                  Close Panel (বন্ধ করুন)
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
