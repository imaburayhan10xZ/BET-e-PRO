/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, TrendingUp, Users, Wallet, Trophy, BadgePercent, 
  FileText, Settings, Activity, Headphones, Image as ImageIcon, ShieldCheck,
  ChevronLeft, ChevronRight 
} from 'lucide-react';
import { User, Transaction, Match, SupportTicket, SystemSettings, Promotion } from '../types';

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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('admin_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const newVal = !prev;
      try {
        localStorage.setItem('admin_sidebar_collapsed', String(newVal));
      } catch {}
      return newVal;
    });
  };

  const hasAccess = (tabId: AdminTab) => {
    if (user.role === 'primary_admin') return true;
    if (tabId === 'admin_management') return false; // restricted to primary admin only
    const allowed = user.allowedTabs || [];
    return allowed.includes(tabId);
  };

  const getInitialTab = (): AdminTab => {
    if (user.role === 'primary_admin') return 'analytics';
    const possible: AdminTab[] = ['analytics', 'users', 'transactions', 'matches', 'promotions', 'tickets', 'support_channels', 'sliders_notices', 'settings'];
    for (const tab of possible) {
      if (user.allowedTabs && user.allowedTabs.includes(tab)) return tab;
    }
    return 'analytics';
  };

  const [activeTab, setActiveTab] = useState<AdminTab>(getInitialTab());
  
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

  // Run on tab mount
  useEffect(() => {
    if (activeTab === 'analytics') fetchAnalytics();
    if (activeTab === 'users') {
      fetchUsers();
    }
    if (activeTab === 'transactions') {
      fetchTransactions();
      fetchUsers(); // Required for dropdown in manual transactions
    }
    if (activeTab === 'matches') fetchMatches();
    if (activeTab === 'promotions') fetchPromotions();
    if (activeTab === 'tickets') fetchTickets();
    if (activeTab === 'settings') fetchSettings();
  }, [activeTab]);

  return (
    <div className="flex flex-col lg:flex-row gap-6 px-4 pb-20 items-start w-full">
      
      {/* ADMIN SIDEBAR NAVIGATION */}
      <div 
        className={`w-full shrink-0 transition-all duration-300 bg-white/85 backdrop-blur-md p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col ${
          isSidebarCollapsed ? 'lg:w-[76px]' : 'lg:w-72'
        }`}
      >
        <div className="border-b border-slate-100 pb-2.5 mb-3 flex items-center justify-between">
          <div className="flex items-center space-x-2 overflow-hidden">
            <ShieldAlert className="h-4.5 w-4.5 text-[#FF9F00] shrink-0" />
            {!isSidebarCollapsed && (
              <span className="text-[10px] font-black uppercase tracking-widest text-[#FF9F00] font-mono whitespace-nowrap">
                Admin Control
              </span>
            )}
          </div>
          
          {/* Collapse Toggle Button - Visible on Desktop */}
          <button
            onClick={toggleSidebar}
            className="hidden lg:flex items-center justify-center h-6 w-6 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition shadow-sm bg-white shrink-0"
            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="h-3.5 w-3.5" />
            ) : (
              <ChevronLeft className="h-3.5 w-3.5" />
            )}
          </button>
        </div>

        <div className="space-y-1.5">
          {([
            { id: 'analytics', label: 'Platform Metrics', icon: Activity },
            { id: 'users', label: 'Player Database', icon: Users },
            { id: 'transactions', label: 'Gateway Ledgers', icon: Wallet },
            { id: 'matches', label: 'Match Settle Panel', icon: Trophy },
            { id: 'promotions', label: 'Campaign Creator', icon: BadgePercent },
            { id: 'tickets', label: 'Support Tickets', icon: FileText },
            { id: 'support_channels', label: 'Support Channels', icon: Headphones },
            { id: 'sliders_notices', label: 'Sliders & Notices', icon: ImageIcon },
            { id: 'settings', label: 'Platform Config', icon: Settings },
            { id: 'admin_management', label: 'Admin Management', icon: ShieldCheck }
          ] as const).filter(t => hasAccess(t.id)).map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                title={isSidebarCollapsed ? tab.label : undefined}
                className={`w-full flex items-center rounded-xl py-3 text-xs font-black transition relative group ${
                  isSidebarCollapsed ? 'justify-center px-1' : 'justify-start px-4 space-x-2.5'
                } ${
                  activeTab === tab.id 
                    ? 'bg-[#FF9F00] text-slate-950 shadow-md shadow-[#FF9F00]/10' 
                    : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!isSidebarCollapsed && (
                  <span className="truncate whitespace-nowrap">{tab.label}</span>
                )}
                
                {/* Hover tooltip for collapsed state */}
                {isSidebarCollapsed && (
                  <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-950 text-white text-[10px] font-black rounded-lg shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                    {tab.label}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* RENDER ACTIVE TAB COMPONENT */}
      <div className="flex-1 w-full bg-white/85 backdrop-blur-md p-6 rounded-2xl border border-slate-200/80 shadow-sm min-h-[450px] overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'analytics' && (
            <motion.div key="analytics" className="w-full">
              <AnalyticsPanel
                analytics={analytics}
                loading={analyticsLoading}
                onRefresh={fetchAnalytics}
              />
            </motion.div>
          )}

          {activeTab === 'users' && (
            <motion.div key="users" className="w-full">
              <UsersPanel
                users={users}
                loading={usersLoading}
                onRefresh={fetchUsers}
                onRefreshUser={onRefreshUser}
              />
            </motion.div>
          )}

          {activeTab === 'transactions' && (
            <motion.div key="transactions" className="w-full">
              <TransactionsPanel
                transactions={transactions}
                users={users}
                loading={txsLoading}
                onRefresh={fetchTransactions}
                onRefreshUser={onRefreshUser}
              />
            </motion.div>
          )}

          {activeTab === 'matches' && (
            <motion.div key="matches" className="w-full">
              <MatchesPanel
                matches={matches}
                loading={matchesLoading}
                onRefresh={fetchMatches}
                onRefreshUser={onRefreshUser}
              />
            </motion.div>
          )}

          {activeTab === 'promotions' && (
            <motion.div key="promotions" className="w-full">
              <PromotionsPanel
                promotions={promotions}
                loading={promotionsLoading}
                onRefresh={fetchPromotions}
              />
            </motion.div>
          )}

          {activeTab === 'tickets' && (
            <motion.div key="tickets" className="w-full">
              <TicketsPanel
                tickets={tickets}
                loading={ticketsLoading}
                onRefresh={fetchTickets}
              />
            </motion.div>
          )}

          {activeTab === 'support_channels' && (
            <motion.div key="support_channels" className="w-full">
              <SupportChannelsPanel />
            </motion.div>
          )}

          {activeTab === 'sliders_notices' && (
            <motion.div key="sliders_notices" className="w-full">
              <SlidersNoticesPanel />
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div key="settings" className="w-full">
              <SettingsPanel
                settings={sysSettings}
                loading={settingsLoading}
                onRefresh={fetchSettings}
              />
            </motion.div>
          )}

          {activeTab === 'admin_management' && (
            <motion.div key="admin_management" className="w-full">
              <AdminManagementPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
