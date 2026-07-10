/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, Trophy, Flame, User, Bell, ShieldCheck, Gift, Sparkles, Users,
  Wallet, LogIn, LogOut, Globe, MessageCircle, Menu, X, ArrowRight
} from 'lucide-react';
import { User as UserType, Notification, SystemSettings } from '../types';
import { translations, Language } from '../utils/lang';

interface NavigationProps {
  user: UserType | null;
  activeTab: string;
  onNavigate: (tab: string) => void;
  lang: Language;
  setLang: (lang: Language) => void;
  onLogout: () => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
  notifications: Notification[];
  onMarkNotificationsRead: () => void;
  systemSettings?: SystemSettings | null;
}

export default function Navigation({
  user,
  activeTab,
  onNavigate,
  lang,
  setLang,
  onLogout,
  onOpenAuth,
  notifications,
  onMarkNotificationsRead,
  systemSettings
}: NavigationProps) {
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [prevBalance, setPrevBalance] = useState(user?.balance || 0);
  const [balanceFlash, setBalanceFlash] = useState(false);

  const t = translations[lang];
  const unreadCount = notifications.filter(n => !n.read).length;

  // Flash balance on change to feel interactive
  useEffect(() => {
    if (user && user.balance !== prevBalance) {
      setBalanceFlash(true);
      const timer = setTimeout(() => setBalanceFlash(false), 1500);
      setPrevBalance(user.balance);
      return () => clearTimeout(timer);
    }
  }, [user?.balance, prevBalance]);

  const toggleLanguage = () => {
    setLang(lang === 'en' ? 'bn' : 'en');
  };

  const handleNotifClick = () => {
    setShowNotifDropdown(!showNotifDropdown);
    if (!showNotifDropdown && unreadCount > 0) {
      onMarkNotificationsRead();
    }
  };

  return (
    <>
      {/* STICKY HEADER */}
      <header className="sticky top-0 z-50 w-full border-b border-[#0e4b3c] bg-[#03211a] shadow-md shadow-black/10">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          
          {/* Logo */}
          <div 
            onClick={() => onNavigate('home')}
            className="flex cursor-pointer items-center space-x-2"
            id="app-header-logo"
          >
            {systemSettings?.siteLogo ? (
              <img 
                src={systemSettings.siteLogo} 
                alt={systemSettings.siteName || "Logo"} 
                className="h-10 w-auto object-contain rounded-lg"
                referrerPolicy="no-referrer"
              />
            ) : (
              <>
                <div className="flex md:hidden h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-amber-400 to-yellow-500 text-black font-black text-sm shadow-md">
                  BP
                </div>
                <div className="hidden md:flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-500 via-amber-500 to-emerald-600 text-black font-black text-xl shadow-lg shadow-emerald-500/10">
                  {systemSettings?.siteName ? systemSettings.siteName.charAt(0).toUpperCase() : 'B'}
                </div>
              </>
            )}
            <div>
              <span className="shiny-logo-text text-lg sm:text-2xl block tracking-wide">{systemSettings?.siteName || "BETEPRO.COM"}</span>
            </div>
          </div>

          {/* Desktop Navigation Link Menu */}
          <nav className="hidden md:flex items-center space-x-6 text-xs font-bold uppercase tracking-wider">
            <button 
              onClick={() => onNavigate('home')}
              className={`flex items-center space-x-1.5 transition ${activeTab === 'home' ? 'text-yellow-400 font-extrabold' : 'text-[#8daaa3] hover:text-white'}`}
            >
              <Home className="h-4 w-4" />
              <span>{t.home}</span>
            </button>
            <button 
              onClick={() => onNavigate('sports')}
              className={`flex items-center space-x-1.5 transition ${activeTab === 'sports' ? 'text-yellow-400 font-extrabold' : 'text-[#8daaa3] hover:text-white'}`}
            >
              <Trophy className="h-4 w-4" />
              <span>{t.sports}</span>
            </button>
            <button 
              onClick={() => onNavigate('games')}
              className={`flex items-center space-x-1.5 transition ${activeTab === 'games' ? 'text-yellow-400 font-extrabold' : 'text-[#8daaa3] hover:text-white'}`}
            >
              <Flame className="h-4 w-4" />
              <span>{t.games}</span>
            </button>

            <button 
              onClick={() => onNavigate('leaderboard')}
              className={`flex items-center space-x-1.5 transition ${activeTab === 'leaderboard' ? 'text-yellow-400 font-extrabold' : 'text-[#8daaa3] hover:text-white'}`}
            >
              <Trophy className="h-4 w-4 text-yellow-400" />
              <span className="text-yellow-400">{t.leaderboard}</span>
            </button>
            {/* Admin button removed as per security requirements */}
          </nav>

          {/* Right Controls Area */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Language Switcher Button */}
            <button 
              onClick={toggleLanguage}
              className="flex items-center space-x-1 rounded-lg bg-[#053d30] px-2.5 py-1.5 text-xs text-yellow-400 hover:bg-[#074c3d] hover:text-white border border-[#0e4b3c] transition font-bold"
            >
              <Globe className="h-3.5 w-3.5" />
              <span className="uppercase font-mono font-bold text-[10px]">{lang === 'en' ? 'বাংলা' : 'ENG'}</span>
            </button>

            {user ? (
              /* User Balance and Action Controls */
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <div 
                  onClick={() => onNavigate('wallet')}
                  className={`flex cursor-pointer items-center space-x-1.5 rounded-xl border border-[#0e4b3c] bg-[#053d30] px-3 py-1.5 transition hover:bg-[#074c3d] ${balanceFlash ? 'border-yellow-400 bg-yellow-400/10 scale-105' : ''}`}
                >
                  <Wallet className="h-4 w-4 text-yellow-400" />
                  <span className="text-xs font-bold text-[#8daaa3] hidden sm:inline">{t.balance}:</span>
                  <span className="text-xs sm:text-sm font-black text-yellow-400">৳{user.balance.toLocaleString()}</span>
                </div>

                {/* Notifications Bell */}
                <div className="relative">
                  <button 
                    onClick={handleNotifClick}
                    className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-[#053d30] text-[#8daaa3] hover:bg-[#074c3d] hover:text-white border border-[#0e4b3c] transition"
                  >
                    <Bell className="h-4.5 w-4.5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications Dropdown */}
                  <AnimatePresence>
                    {showNotifDropdown && (
                      <motion.div 
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 15 }}
                        className="absolute right-0 mt-3 w-80 rounded-2xl border border-[#0e4b3c] bg-[#053d30]/95 backdrop-blur-xl p-4 shadow-xl shadow-black/40 z-50"
                      >
                        <div className="mb-2 flex items-center justify-between border-b border-[#0e4b3c] pb-2">
                          <span className="text-xs font-bold text-white">{t.notifications}</span>
                          <span className="text-[10px] text-yellow-400 font-bold">{unreadCount} unread</span>
                        </div>
                        <div className="max-h-60 overflow-y-auto space-y-2.5 py-1">
                          {notifications.length === 0 ? (
                            <p className="text-center py-6 text-xs text-[#8daaa3]">No notifications yet.</p>
                          ) : (
                            notifications.map((n) => (
                              <div key={n.id} className={`rounded-lg p-2.5 text-xs transition ${n.read ? 'bg-[#03211a]/40 text-[#8daaa3]' : 'bg-yellow-400/10 border-l-2 border-yellow-400 text-white'}`}>
                                <h4 className="font-bold mb-0.5">{n.title}</h4>
                                <p className="leading-normal text-[11px] text-[#b3ceca]">{n.message}</p>
                                <span className="block text-[9px] text-[#668d83] mt-1 font-mono">{new Date(n.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Profile Avatar & Quick Link */}
                <button 
                  onClick={() => onNavigate('profile')}
                  className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${activeTab === 'profile' ? 'bg-yellow-400/20 border border-yellow-400' : 'bg-[#053d30] border border-[#0e4b3c] hover:bg-[#074c3d]'}`}
                >
                  <User className="h-4.5 w-4.5 text-yellow-400" />
                </button>

                {/* Desktop Logout Button */}
                <button 
                  onClick={onLogout}
                  className="hidden md:flex h-9 w-9 items-center justify-center rounded-xl bg-red-950/20 border border-red-900/40 text-red-400 hover:bg-red-900/40 transition"
                  title={t.logout}
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              /* Guests Auth Buttons */
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <button 
                  onClick={() => onOpenAuth('login')}
                  className="rounded-xl px-2.5 sm:px-3.5 py-1.5 text-xs font-bold text-white bg-[#053d30] border border-[#0e4b3c] hover:bg-[#074c3d] transition"
                >
                  {t.login}
                </button>
                <button 
                  onClick={() => onOpenAuth('register')}
                  className="rounded-xl bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 px-3.5 sm:px-4 py-1.5 text-xs font-extrabold text-black hover:brightness-110 active:scale-95 shadow-md shadow-yellow-500/10 transition"
                >
                  {t.register}
                </button>
              </div>
            )}

            {/* Mobile Nav Drawer toggle */}
            <button 
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="flex md:hidden h-9 w-9 items-center justify-center rounded-xl bg-[#053d30] text-[#8daaa3] border border-[#0e4b3c] hover:text-white"
            >
              {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

          </div>
        </div>
      </header>

      {/* MOBILE FULL-SCREEN DRAWER */}
      <AnimatePresence>
        {showMobileMenu && (
          <motion.div 
            initial={{ opacity: 0, x: 200 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 200 }}
            className="fixed inset-0 z-40 bg-[#03211a] pt-20 px-6 md:hidden flex flex-col justify-between pb-24 border-l border-[#0e4b3c]"
          >
            <div className="space-y-5">
              <div className="border-b border-[#0e4b3c] pb-4 mb-4 flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-yellow-400">{t.sports} & CASINO</span>
                {systemSettings?.siteLogo ? (
                  <img 
                    src={systemSettings.siteLogo} 
                    alt={systemSettings.siteName || "Logo"} 
                    className="h-8 w-auto object-contain rounded-lg"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="shiny-logo-text text-sm">{systemSettings?.siteName || "BETEPRO.COM"}</span>
                )}
              </div>
              <button 
                onClick={() => { onNavigate('home'); setShowMobileMenu(false); }}
                className={`flex w-full items-center justify-between text-lg font-bold ${activeTab === 'home' ? 'text-yellow-400' : 'text-[#8daaa3] hover:text-white'}`}
              >
                <span>{t.home}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              <button 
                onClick={() => { onNavigate('sports'); setShowMobileMenu(false); }}
                className={`flex w-full items-center justify-between text-lg font-bold ${activeTab === 'sports' ? 'text-yellow-400' : 'text-[#8daaa3] hover:text-white'}`}
              >
                <span>{t.sports}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              <button 
                onClick={() => { onNavigate('games'); setShowMobileMenu(false); }}
                className={`flex w-full items-center justify-between text-lg font-bold ${activeTab === 'games' ? 'text-yellow-400' : 'text-[#8daaa3] hover:text-white'}`}
              >
                <span>{t.games}</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <button 
                onClick={() => { onNavigate('leaderboard'); setShowMobileMenu(false); }}
                className={`flex w-full items-center justify-between text-lg font-bold ${activeTab === 'leaderboard' ? 'text-yellow-400' : 'text-[#8daaa3] hover:text-white'}`}
              >
                <span>{t.leaderboard}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              {/* Mobile admin button removed as per security requirements */}
            </div>

            <div className="space-y-4 border-t border-[#0e4b3c] pt-6">
              {user ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 bg-[#053d30] border border-[#0e4b3c] rounded-xl p-3">
                    <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-yellow-400/10">
                      <User className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{user.username}</h4>
                      <p className="text-[10px] text-[#8daaa3]">{user.email}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => { onLogout(); setShowMobileMenu(false); }}
                    className="flex w-full items-center justify-center space-x-2 rounded-xl bg-red-950/20 border border-red-900/40 py-3 text-red-400 font-bold hover:bg-red-900/40 transition"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>{t.logout}</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => { onOpenAuth('login'); setShowMobileMenu(false); }}
                    className="rounded-xl border border-[#0e4b3c] bg-[#053d30] py-3 text-sm font-bold text-[#8daaa3] hover:text-white"
                  >
                    {t.login}
                  </button>
                  <button 
                    onClick={() => { onOpenAuth('register'); setShowMobileMenu(false); }}
                    className="rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 py-3 text-sm font-black text-black"
                  >
                    {t.register}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MOBILE BOTTOM STICKY BAR */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#0e4b3c] bg-[#03211a]/95 py-2 px-1 backdrop-blur-md md:hidden shadow-xl">
        <div className="flex items-center justify-around">
          
          <button 
            onClick={() => onNavigate('home')}
            className={`flex flex-col items-center space-y-1 text-[10px] font-bold transition-all ${activeTab === 'home' ? 'text-yellow-400 scale-105' : 'text-[#668d83] hover:text-white'}`}
          >
            <Home className="h-5 w-5" />
            <span className="text-[9px] uppercase tracking-wider">{t.home}</span>
          </button>
          
          <button 
            onClick={() => onNavigate('games')}
            className={`flex flex-col items-center space-y-1 text-[10px] font-bold transition-all ${activeTab === 'games' ? 'text-yellow-400 scale-105' : 'text-[#668d83] hover:text-white'}`}
          >
            <Flame className="h-5 w-5" />
            <span className="text-[9px] uppercase tracking-wider">{t.games}</span>
          </button>

          {/* Elevated Center invite Button */}
          <button 
            onClick={() => onNavigate(user ? 'wallet' : 'login')}
            className="flex flex-col items-center justify-center -mt-5 h-12 w-12 rounded-full bg-gradient-to-tr from-yellow-400 via-amber-400 to-yellow-500 text-black shadow-lg shadow-yellow-500/20 border-4 border-[#03211a] hover:scale-110 active:scale-95 transition-all duration-300"
          >
            <Users className="h-5 w-5" />
          </button>

          <button 
            onClick={() => onNavigate('leaderboard')}
            className={`flex flex-col items-center space-y-1 text-[10px] font-bold transition-all ${activeTab === 'leaderboard' ? 'text-yellow-400 scale-105' : 'text-[#668d83] hover:text-white'}`}
          >
            <Trophy className="h-5 w-5" />
            <span className="text-[9px] uppercase tracking-wider">Leader</span>
          </button>

          {user ? (
            <button 
              onClick={() => onNavigate('profile')}
              className={`flex flex-col items-center space-y-1 text-[10px] font-bold transition-all ${activeTab === 'profile' || activeTab === 'wallet' ? 'text-yellow-400 scale-105' : 'text-[#668d83] hover:text-white'}`}
            >
              <User className="h-5 w-5" />
              <span className="text-[9px] uppercase tracking-wider">{t.profile}</span>
            </button>
          ) : (
            <button 
              onClick={() => onOpenAuth('login')}
              className="flex flex-col items-center space-y-1 text-[10px] font-bold text-[#668d83] hover:text-white"
            >
              <LogIn className="h-5 w-5" />
              <span className="text-[9px] uppercase tracking-wider">{t.login}</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
}
