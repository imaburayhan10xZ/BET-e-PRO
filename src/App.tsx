/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, Flame, Bell, Globe, Sparkles, Star, Users, Phone, ShieldCheck, 
  HelpCircle, ChevronDown, CheckCircle2, AlertCircle, Play, ArrowRight, Wallet, Info, Mail, X, Loader2
} from 'lucide-react';
import { User, Notification, Match, Promotion } from './types';
import { translations, Language } from './utils/lang';
import { auth as firebaseAuth } from './lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail, 
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';

// Subcomponents
import Navigation from './components/Navigation';
import SportsBook from './components/SportsBook';
import GamesHub from './components/GamesHub';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';

// Static seed data for display on homepage
const WINNERS_FEED = [
  { username: 'shakib_99', game: 'Slots Bonanza', amount: 4850, emoji: '🎰' },
  { username: 'arif_bet77', game: 'Crash Flight', amount: 12500, emoji: '🚀' },
  { username: 'tamim_crick', game: 'Live Cricket', amount: 3200, emoji: '🏏' },
  { username: 'mushfiq_vip', game: 'Mini Roulette', amount: 7500, emoji: '🎡' },
  { username: 'rabbi_winner', game: 'Dice Roller', amount: 1500, emoji: '🎲' }
];

const FAQS = [
  { q_en: 'How do I deposit funds on BETEPRO?', q_bn: 'BETEPRO-এ কিভাবে টাকা জমা (ডেপোজিট) করব?', a_en: 'Go to your Wallet Hub dashboard, select your preferred channel (bKash, Nagad, or Rocket), copy our official agent number, send the money, paste your Transaction ID (TrxID) and submit.', a_bn: 'আপনার ওয়ালেট হাব ড্যাশবোর্ডে যান, বিকাশ, নগদ বা রকেট নির্বাচন করুন, আমাদের অফিসিয়াল এজেন্ট নম্বরটি কপি করে ক্যাশ ইন করুন এবং ট্রানজেকশন আইডি (TrxID) বসিয়ে সাবমিট করুন।' },
  { q_en: 'What is the minimum deposit and withdrawal limit?', q_bn: 'সর্বনিম্ন ডেপোজিট এবং উইথড্র সীমা কত?', a_en: 'The minimum deposit limit is ৳500 BDT, and the minimum withdrawal limit is ৳1,000 BDT. All processed instantly.', a_bn: 'সর্বনিম্ন ডেপোজিট সীমা ৫০০ টাকা এবং সর্বনিম্ন উইথড্র সীমা ১,০০০ টাকা। সকল লেনদেন তাত্ক্ষণিক সম্পন্ন করা হয়।' },
  { q_en: 'Is there an invite referral bonus?', q_bn: 'কোনো আমন্ত্রণ বা রেফারেল বোনাস আছে কি?', a_en: 'Yes! Invite your friends using your referral link. When they register, they receive a ৳700 welcome bonus, and you instantly receive ৳200 credited to your wallet balance!', a_bn: 'হ্যাঁ! আপনার রেফারেল কোড দিয়ে বন্ধুদের আমন্ত্রণ জানান। তারা সাইনআপ করলে তাৎক্ষণিক ৭০০ টাকা ওয়েলকাম ব্যালেন্স পাবে এবং আপনি পাবেন ২০০ টাকা বোনাস।' },
  { q_en: 'Are the casino games played with real cash?', q_bn: 'ক্যাসিনো গেমগুলো কি আসল টাকা দিয়ে খেলা হয়?', a_en: 'No, all casino games (Crash, Dice, Slots, Wheel, Roulette) are for simulation and entertainment purposes only. No real money gambling is supported.', a_bn: 'না, আমাদের সকল গেম শুধুমাত্র বিনোদন এবং সিমুলেশনের জন্য। কোনো আসল টাকা জুয়া খেলার সুযোগ নেই।' }
];

export default function App() {
  const [lang, setLang] = useState<Language>('en');
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  
  // Auth state
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot' | null>(null);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Slider state
  const [activeSlide, setActiveSlide] = useState(0);
  const [banners, setBanners] = useState<any[]>([]);
  const [marqueeNotice, setMarqueeNotice] = useState('🎁🎁🎁 BETEPRO-তে স্বাগতম! নগদের মাধ্যমে প্রতিটি ডিপোজিটে ১.৫% বোনাস সরাসরি ওয়ালেট ব্যালেন্সে ইনস্ট্যান্ট যুক্ত হচ্ছে! এছাড়া রেফার করুন এবং প্রতি রেফারে ২০০ টাকা ফ্রি বোনাস লুফে নিন! 🎁🎁🎁');

  // Live winners tick
  const [winnerList, setWinnerList] = useState(WINNERS_FEED);

  // FAQ accordion tracking
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const t = translations[lang];

  // Autoplay hero slider
  useEffect(() => {
    const timer = setInterval(() => {
      const limit = banners.length > 0 ? banners.length : 3;
      setActiveSlide(prev => (prev >= limit - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, [banners]);

  // Simulate active winner feed tickers
  useEffect(() => {
    const timer = setInterval(() => {
      const luckyGames = ['Slots Bonanza', 'Crash Flight', 'Live Cricket', 'Dice Roller', 'Mini Roulette'];
      const emojis = ['🎰', '🚀', '🏏', '🎲', '🎡'];
      const players = ['shajib_bet', 'rakib_vlog', 'nipun_99', 'reza_boss', 'momin_cr', 'sohel_winner'];
      
      const newWin = {
        username: players[Math.floor(Math.random() * players.length)],
        game: luckyGames[Math.floor(Math.random() * luckyGames.length)],
        amount: Math.floor(500 + Math.random() * 8000),
        emoji: emojis[Math.floor(Math.random() * emojis.length)]
      };

      setWinnerList(prev => [newWin, ...prev.slice(0, 4)]);
    }, 4500);

    return () => clearInterval(timer);
  }, []);

  const fetchSettingsAndBanners = async () => {
    try {
      const resSettings = await fetch('/api/settings');
      if (resSettings.ok) {
        const data = await resSettings.json();
        if (data && data.marqueeNotice) {
          setMarqueeNotice(data.marqueeNotice);
        }
      }

      const resBanners = await fetch('/api/banners');
      if (resBanners.ok) {
        const bannersData = await resBanners.json();
        setBanners(bannersData);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch Auth details on mount
  const fetchUserProfile = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch('/api/auth/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setNotifications(data.notifications || []);
      } else {
        localStorage.removeItem('token');
        setUser(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPromotions = async () => {
    try {
      const res = await fetch('/api/promotions');
      if (res.ok) {
        const data = await res.json();
        setPromotions(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Support manual URL change, page refreshes and browser history events for /cockpit
  useEffect(() => {
    const handleLocationChange = () => {
      if (window.location.pathname === '/cockpit') {
        setCurrentTab('cockpit');
      } else if (currentTab === 'cockpit') {
        setCurrentTab('home');
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    handleLocationChange(); // run immediately on load

    fetchUserProfile();
    fetchPromotions();
    fetchSettingsAndBanners();

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  const navigateTo = (tab: string) => {
    if (tab === 'cockpit') {
      window.history.pushState({}, '', '/cockpit');
    } else {
      window.history.pushState({}, '', '/');
    }
    setCurrentTab(tab);
  };

  const handleLogout = async () => {
    try {
      await signOut(firebaseAuth);
    } catch (e) {
      console.error('Firebase sign out error:', e);
    }
    localStorage.removeItem('token');
    setUser(null);
    setCurrentTab('home');
    window.history.pushState({}, '', '/');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    setIsAuthLoading(true);

    try {
      let res;
      try {
        // 1. Authenticate with Firebase Auth
        const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
        const fbUser = userCredential.user;

        // 2. Sync with backend & obtain server JWT
        res = await fetch('/api/auth/firebase-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: fbUser.email, uid: fbUser.uid })
        });
      } catch (fbErr: any) {
        console.log('[AUTH] Firebase Auth failed, trying local DB authentication fallback:', fbErr.message);
        // Fallback: Authenticate directly with local database (e.g. for admins/mods created via panel)
        res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: email, password })
        });
      }

      let data: any = {};
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const textResponse = await res.text();
        console.error('[AUTH] Received non-JSON response during login:', textResponse);
        let errorSnippet = textResponse.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 150);
        if (textResponse.includes('FUNCTION_INVOCATION_FAILED')) {
          errorSnippet = 'Vercel Serverless Function Invocation Failed (please check server/db setup or logs).';
        }
        throw new Error(`Server connection issue (Status ${res.status}): ${errorSnippet || 'Please try again in 10 seconds.'}`);
      }

      if (res.ok) {
        localStorage.setItem('token', data.token);
        setUser(data.user);
        setNotifications(data.notifications || []);
        setAuthMode(null);
        setEmail('');
        setPassword('');
        alert(`Welcome back, ${data.user.username}!`);
      } else {
        setAuthError(data.error || 'Invalid credentials or access denied.');
        await signOut(firebaseAuth).catch(() => {});
      }
    } catch (err: any) {
      console.error(err);
      setAuthError(err.message || 'Authentication failed.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    setIsAuthLoading(true);

    try {
      let res;
      let fbUser: any = null;
      try {
        // 1. Register with Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
        fbUser = userCredential.user;

        // 2. Sync with backend to build profile
        res = await fetch('/api/auth/firebase-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: fbUser.email,
            uid: fbUser.uid,
            username,
            referralCode
          })
        });
      } catch (fbErr: any) {
        console.log('[AUTH] Firebase Register failed, trying local DB fallback registration:', fbErr.message);
        // Fallback: Register directly with our backend's secure registration API
        res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username,
            email,
            password,
            referralCode
          })
        });
      }

      let data: any = {};
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const textResponse = await res.text();
        console.error('[AUTH] Received non-JSON response during registration:', textResponse);
        let errorSnippet = textResponse.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 150);
        if (textResponse.includes('FUNCTION_INVOCATION_FAILED')) {
          errorSnippet = 'Vercel Serverless Function Invocation Failed (please check server/db setup or logs).';
        }
        throw new Error(`Server connection issue (Status ${res.status}): ${errorSnippet || 'Please try again in 10 seconds.'}`);
      }

      if (res.ok) {
        localStorage.setItem('token', data.token);
        setUser(data.user);
        setNotifications(data.notifications || []);
        setAuthSuccess('Registration completed and logged in!');
        setAuthMode(null);
        setUsername('');
        setEmail('');
        setPassword('');
        setReferralCode('');
      } else {
        setAuthError(data.error || 'Failed to register account.');
        if (fbUser) {
          // Clean up firebase user if backend sync fails
          await fbUser.delete().catch(() => {});
        }
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setAuthError('Email address already registered.');
      } else if (err.code === 'auth/weak-password') {
        setAuthError('Password must be at least 6 characters.');
      } else {
        setAuthError(err.message || 'Failed to register account.');
      }
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    setIsAuthLoading(true);

    try {
      await sendPasswordResetEmail(firebaseAuth, email);
      setAuthSuccess('Secure reset link has been sent to your email address!');
    } catch (err: any) {
      console.error(err);
      setAuthError(err.message || 'Failed to send recovery email.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError('');
    setAuthSuccess('');
    setIsAuthLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(firebaseAuth, provider);
      const fbUser = userCredential.user;

      const res = await fetch('/api/auth/firebase-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: fbUser.email,
          uid: fbUser.uid,
          username: fbUser.displayName || undefined
        })
      });

      let data: any = {};
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const textResponse = await res.text();
        console.error('[AUTH] Received non-JSON response during Google Sign-In sync:', textResponse);
        let errorSnippet = textResponse.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 150);
        if (textResponse.includes('FUNCTION_INVOCATION_FAILED')) {
          errorSnippet = 'Vercel Serverless Function Invocation Failed (please check server/db setup or logs).';
        }
        throw new Error(`Server connection issue (Status ${res.status}): ${errorSnippet || 'Please try again in 10 seconds.'}`);
      }

      if (res.ok) {
        localStorage.setItem('token', data.token);
        setUser(data.user);
        setNotifications(data.notifications || []);
        setAuthMode(null);
        alert(`Welcome back, ${data.user.username}!`);
      } else {
        setAuthError(data.error);
        await signOut(firebaseAuth);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/popup-blocked') {
        setAuthError('Sign-in popup was blocked. Please allow popups or open the app in a new tab.');
      } else {
        setAuthError(err.message || 'Google Auth failed.');
      }
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleMarkNotificationsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-[#03211a] text-slate-100 flex flex-col justify-between selection:bg-yellow-400 selection:text-black">
      
      {/* NAVIGATION HEADER BAR */}
      <Navigation
        user={user}
        activeTab={currentTab}
        onNavigate={(tab) => navigateTo(tab)}
        lang={lang}
        setLang={(l) => setLang(l)}
        onLogout={handleLogout}
        onOpenAuth={(mode) => { setAuthMode(mode); setAuthError(''); setAuthSuccess(''); }}
        notifications={notifications}
        onMarkNotificationsRead={handleMarkNotificationsRead}
      />

      {/* CORE PAGES SWITCH ROUTER CONTENT */}
      <main className="flex-1 max-w-7xl w-full mx-auto py-6">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: HOMEPAGE */}
          {currentTab === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-10"
            >
              {/* HERO CAROUSEL AD BANNERS */}
              <div className="px-4">
                <div className="h-60 sm:h-72 w-full rounded-3xl border border-[#0e4b3c] bg-gradient-to-br from-[#053d30] via-[#03211a] to-emerald-950 relative overflow-hidden shadow-2xl">
                  
                  {(() => {
                    const slidesToRender = banners.length > 0 ? banners : [
                      {
                        id: 'default_1',
                        title: 'নগদ ওয়ালেট টপ-আপে সাথে সাথে অতিরিক্ত +১.৫% রিওয়ার্ড বোনাস!',
                        subtitle: '🔥 MASSIVE 1.5% NAGAD REWARD',
                        description: 'BETEPRO-তে স্বাগতম! নগদের মাধ্যমে প্রতিটি ডিপোজিট করার সাথে সাথে সরাসরি ওয়ালেট ব্যালেন্সে ইনস্ট্যান্ট যুক্ত হচ্ছে অতিরিক্ত ১.৫% রিয়েল বোনাস।',
                        buttonText: 'টপ-আপ করুন',
                        linkTab: 'wallet',
                        image: ''
                      },
                      {
                        id: 'default_2',
                        title: 'Reach Platinum Club for 8% Turnover Cashback!',
                        subtitle: '🌟 PLATINUM VIP TIER',
                        description: 'Gain automatic VIP loyalty points on sports wagers and casino slots dice loops to unlock premium daily cash payouts.',
                        buttonText: 'Access VIP Lounge',
                        linkTab: 'dashboard',
                        image: ''
                      },
                      {
                        id: 'default_3',
                        title: 'Fly High on Aviator Simulator & Cashout!',
                        subtitle: '⚡ LIVE MULTIPLIER CRASH',
                        description: 'Place a virtual bet, watch the lucky flight vector rise exponentially, and click Cashout in real-time before the plane crashes!',
                        buttonText: 'Play Crash Game',
                        linkTab: 'games',
                        image: ''
                      }
                    ];

                    const currentSlide = slidesToRender[activeSlide] || slidesToRender[0];
                    if (!currentSlide) return null;

                    const handleSlideAction = () => {
                      const tab = currentSlide.linkTab || 'dashboard';
                      if (tab === 'dashboard' && !user) {
                        setAuthMode('login');
                      } else {
                        setCurrentTab(tab);
                      }
                    };

                    return (
                      <>
                        <AnimatePresence mode="wait">
                          {currentSlide.isImageOnly ? (
                            <motion.div 
                              key={currentSlide.id || activeSlide}
                              initial={{ opacity: 0, x: 50 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -50 }}
                              transition={{ duration: 0.35 }}
                              onClick={handleSlideAction}
                              className="absolute inset-0 cursor-pointer z-10 hover:scale-[1.01] transition-transform duration-500"
                              style={{ 
                                backgroundImage: `url(${currentSlide.image})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center'
                              }}
                              title={`Go to ${currentSlide.linkTab}`}
                            />
                          ) : (
                            <motion.div 
                              key={currentSlide.id || activeSlide}
                              initial={{ opacity: 0, x: 50 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -50 }}
                              transition={{ duration: 0.35 }}
                              className="absolute inset-0 p-6 sm:p-10 flex flex-col justify-center space-y-3 sm:space-y-4 bg-gradient-to-r from-[#03211a] via-[#03211a]/95 to-transparent z-10"
                              style={currentSlide.image ? { 
                                backgroundImage: `linear-gradient(to right, rgba(3,33,26,0.98) 25%, rgba(3,33,26,0.55) 65%, rgba(3,33,26,0.1) 100%), url(${currentSlide.image})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'right'
                              } : {}}
                            >
                              {currentSlide.subtitle && (
                                <span className="text-[10px] sm:text-xs font-black uppercase text-yellow-400 tracking-widest font-mono">
                                  {currentSlide.subtitle}
                                </span>
                              )}
                              <h1 className="text-xl sm:text-3xl font-black text-white max-w-lg leading-tight">
                                {currentSlide.title}
                              </h1>
                              <p className="text-xs text-[#8daaa3] max-w-md hidden sm:block leading-relaxed">
                                {currentSlide.description}
                              </p>
                              <button 
                                onClick={handleSlideAction}
                                className="w-fit flex items-center space-x-1.5 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 px-5 py-2.5 text-xs font-black text-black hover:brightness-110 shadow-lg shadow-yellow-500/10 active:scale-95 transition-all duration-200"
                              >
                                <span>{currentSlide.buttonText || 'Explore'}</span>
                                <ArrowRight className="h-3.5 w-3.5 text-black" />
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Bullet indicator markers */}
                        <div className="absolute right-6 bottom-6 flex space-x-2 z-20 bg-slate-950/50 backdrop-blur-md px-2.5 py-1.5 rounded-full shadow-md border border-white/5">
                          {slidesToRender.map((_, num) => (
                            <button
                              key={num}
                              onClick={() => setActiveSlide(num)}
                              className={`h-2 rounded-full transition-all duration-300 ${activeSlide === num ? 'w-5 bg-yellow-400' : 'w-2 bg-white/40 hover:bg-white/60'}`}
                            />
                          ))}
                        </div>
                      </>
                    );
                  })()}

                </div>
              </div>

              {/* MEGAPHONE NEWS MARQUEE */}
              <div className="mx-4 px-4 py-2.5 bg-[#053d30]/60 border border-[#0e4b3c] rounded-2xl flex items-center space-x-3 overflow-hidden text-xs text-yellow-400 font-bold shadow-lg">
                <span className="text-lg shrink-0">📢</span>
                <div className="flex-1 overflow-hidden relative">
                  <div className="animate-marquee inline-block whitespace-nowrap">
                    {marqueeNotice}
                  </div>
                </div>
              </div>

              {/* HORIZONTAL CATEGORY SELECTOR TABS */}
              <div className="px-4">
                <div className="flex items-center space-x-2.5 overflow-x-auto pb-1 no-scrollbar">
                  <button 
                    onClick={() => setCurrentTab('home')}
                    className={`flex items-center space-x-2 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider shrink-0 transition ${currentTab === 'home' ? 'bg-[#053d30] text-yellow-400 border border-[#0e4b3c]' : 'bg-[#053d30]/30 text-[#8daaa3] hover:text-white border border-transparent'}`}
                  >
                    <span>🔥</span>
                    <span>HOT GAMES</span>
                  </button>
                  <button 
                    onClick={() => setCurrentTab('sports')}
                    className="flex items-center space-x-2 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider shrink-0 transition bg-[#053d30]/30 text-[#8daaa3] hover:text-white border border-transparent"
                  >
                    <span>🏏</span>
                    <span>SPORTSBOOK</span>
                  </button>
                  <button 
                    onClick={() => setCurrentTab('games')}
                    className="flex items-center space-x-2 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider shrink-0 transition bg-[#053d30]/30 text-[#8daaa3] hover:text-white border border-transparent"
                  >
                    <span>🎰</span>
                    <span>SLOTS ARENA</span>
                  </button>
                  <button 
                    onClick={() => { if (user) { setCurrentTab('wallet'); } else { setAuthMode('login'); } }}
                    className="flex items-center space-x-2 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider shrink-0 transition bg-[#053d30]/30 text-[#8daaa3] hover:text-white border border-transparent"
                  >
                    <span>👑</span>
                    <span>VIP LOUNGE</span>
                  </button>
                </div>
              </div>

              {/* QUICK CATEGORY SHORTCUTS BENTO GRID */}
              <div className="px-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  
                  <div 
                    onClick={() => setCurrentTab('sports')}
                    className="group cursor-pointer rounded-2xl border border-[#0e4b3c] bg-[#053d30]/50 hover:bg-[#053d30] p-5 transition-all duration-300 flex items-center justify-between shadow-lg"
                  >
                    <div>
                      <h3 className="text-sm font-black text-white group-hover:text-yellow-400 transition">Sportsbook</h3>
                      <span className="text-[10px] text-[#8daaa3] font-bold block mt-1">Cricket, Football</span>
                    </div>
                    <span className="text-2xl">🏏</span>
                  </div>

                  <div 
                    onClick={() => setCurrentTab('games')}
                    className="group cursor-pointer rounded-2xl border border-[#0e4b3c] bg-[#053d30]/50 hover:bg-[#053d30] p-5 transition-all duration-300 flex items-center justify-between shadow-lg"
                  >
                    <div>
                      <h3 className="text-sm font-black text-white group-hover:text-yellow-400 transition">Crash Arena</h3>
                      <span className="text-[10px] text-[#8daaa3] font-bold block mt-1">Aviator Simulator</span>
                    </div>
                    <span className="text-2xl">🚀</span>
                  </div>

                  <div 
                    onClick={() => setCurrentTab('games')}
                    className="group cursor-pointer rounded-2xl border border-[#0e4b3c] bg-[#053d30]/50 hover:bg-[#053d30] p-5 transition-all duration-300 flex items-center justify-between shadow-lg"
                  >
                    <div>
                      <h3 className="text-sm font-black text-white group-hover:text-yellow-400 transition">Slots & Wheel</h3>
                      <span className="text-[10px] text-[#8daaa3] font-bold block mt-1">Premium Slots Demo</span>
                    </div>
                    <span className="text-2xl">🎰</span>
                  </div>

                  <div 
                    onClick={() => { if (user) { setCurrentTab('dashboard'); } else { setAuthMode('login'); } }}
                    className="group cursor-pointer rounded-2xl border border-[#0e4b3c] bg-[#053d30]/50 hover:bg-[#053d30] p-5 transition-all duration-300 flex items-center justify-between shadow-lg"
                  >
                    <div>
                      <h3 className="text-sm font-black text-white group-hover:text-yellow-400 transition">VIP Loyalty</h3>
                      <span className="text-[10px] text-[#8daaa3] font-bold block mt-1">Cashback lounge</span>
                    </div>
                    <span className="text-2xl">👑</span>
                  </div>

                </div>
              </div>

              {/* LIVE BETTING ODDS TICKER PREVIEW */}
              <div className="px-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xs font-black uppercase tracking-wider flex items-center space-x-2 text-white">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse inline-block" />
                    <span>In-Play Hot Fixtures</span>
                  </h2>
                  <button 
                    onClick={() => setCurrentTab('sports')}
                    className="text-xs font-bold text-yellow-400 flex items-center space-x-1 hover:underline"
                  >
                    <span>View Sportsbook</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-[#0e4b3c] bg-[#053d30]/40 backdrop-blur-md p-4 flex justify-between items-center shadow-lg">
                    <div>
                      <span className="text-[9px] font-mono font-bold text-yellow-400/80 block">⚽ ENGLISH PREMIER LEAGUE • LIVE</span>
                      <h4 className="font-extrabold text-white text-xs mt-1">Arsenal vs Chelsea</h4>
                      <span className="text-sm font-black text-emerald-400 mt-1 block">Score: 2 - 1 (68')</span>
                    </div>
                    <button 
                      onClick={() => setCurrentTab('sports')}
                      className="rounded-xl bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 font-bold text-xs px-3.5 py-2 hover:bg-yellow-400 hover:text-black transition duration-200"
                    >
                      Stake Predictions
                    </button>
                  </div>

                  <div className="rounded-2xl border border-[#0e4b3c] bg-[#053d30]/40 backdrop-blur-md p-4 flex justify-between items-center shadow-lg">
                    <div>
                      <span className="text-[9px] font-mono font-bold text-yellow-400/80 block">🏏 T20 WORLD CUP • IN-PLAY</span>
                      <h4 className="font-extrabold text-white text-xs mt-1">Bangladesh vs India</h4>
                      <span className="text-sm font-black text-emerald-400 mt-1 block">Runs: 145/4 (16.2 Ov)</span>
                    </div>
                    <button 
                      onClick={() => setCurrentTab('sports')}
                      className="rounded-xl bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 font-bold text-xs px-3.5 py-2 hover:bg-yellow-400 hover:text-black transition duration-200"
                    >
                      Stake Predictions
                    </button>
                  </div>
                </div>
              </div>

              {/* REFERRAL REWARDS SECTION CARD */}
              <div className="px-4">
                <div className="rounded-3xl border border-[#0e4b3c] bg-gradient-to-br from-[#053d30] via-[#03211a] to-[#011410] p-6 sm:p-8 flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl">
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-yellow-400 font-mono">🌟 SHARING BONANZA</span>
                    <h2 className="text-xl sm:text-2xl font-black text-white">Give ৳700, Get ৳200 Free!</h2>
                    <p className="text-xs text-[#8daaa3] max-w-lg leading-relaxed">
                      Copy your referral link inside dashboard center, send to your friends. They instantly unlock a ৳700 starter welcome balance on approved registration, and you get ৳200 credited directly to your wallet!
                    </p>
                  </div>
                  <button 
                    onClick={() => { if (user) { setCurrentTab('dashboard'); } else { setAuthMode('login'); } }}
                    className="rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 px-5 py-3 text-xs font-black text-black hover:brightness-110 shadow-lg tracking-wider uppercase transition shrink-0"
                  >
                    Generate Invite Link
                  </button>
                </div>
              </div>

              {/* LIVE WINNERS FEED ACCORDION */}
              <div className="px-4 space-y-4">
                <h2 className="text-xs font-black uppercase text-[#8daaa3] tracking-wider">Live Platform Payouts</h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                  {winnerList.map((win, idx) => (
                    <motion.div 
                      key={idx}
                      layout
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="rounded-xl border border-[#0e4b3c] bg-[#053d30]/30 backdrop-blur-md p-3 text-center space-y-1.5 shadow-md"
                    >
                      <span className="text-2xl block">{win.emoji}</span>
                      <h4 className="text-[11px] font-extrabold text-white font-mono">{win.username}</h4>
                      <p className="text-[9px] text-[#8daaa3] font-bold uppercase">{win.game}</p>
                      <span className="inline-block px-2.5 py-0.5 rounded bg-yellow-400/10 text-yellow-400 font-black font-mono text-[10px]">
                        +৳{win.amount} BDT
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* FREQUENTLY ASKED QUESTIONS (FAQ) */}
              <div className="px-4 space-y-4">
                <h2 className="text-xs font-black uppercase text-[#8daaa3] tracking-wider">Frequently Asked Questions</h2>
                
                <div className="space-y-2 max-w-3xl">
                  {FAQS.map((faq, index) => (
                    <div 
                      key={index} 
                      className="rounded-xl border border-[#0e4b3c] bg-[#053d30]/30 backdrop-blur-md overflow-hidden shadow-md"
                    >
                      <button
                        onClick={() => setOpenFaq(openFaq === index ? null : index)}
                        className="w-full text-left p-4 flex justify-between items-center text-xs font-bold text-white hover:bg-[#053d30]/40 transition"
                      >
                        <span>{lang === 'en' ? faq.q_en : faq.q_bn}</span>
                        <ChevronDown className={`h-4.5 w-4.5 text-yellow-400 transition-transform ${openFaq === index ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {openFaq === index && (
                        <div className="p-4 pt-0 border-t border-[#0e4b3c] text-xs text-[#8daaa3] leading-normal bg-[#031e17]/40">
                          {lang === 'en' ? faq.a_en : faq.a_bn}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

            </motion.div>
          )}

          {/* TAB 2: SPORTSBOOK */}
          {currentTab === 'sports' && (
            <motion.div
              key="sports"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
            >
              <SportsBook 
                user={user}
                lang={lang}
                onRefreshUser={fetchUserProfile}
                onAuthTrigger={() => { setAuthMode('login'); setAuthError(''); }}
              />
            </motion.div>
          )}

          {/* TAB 3: CASINO GAMES ARENA */}
          {currentTab === 'games' && (
            <motion.div
              key="games"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
            >
              <GamesHub 
                user={user}
                lang={lang}
                onRefreshUser={fetchUserProfile}
                onAuthTrigger={() => { setAuthMode('login'); setAuthError(''); }}
              />
            </motion.div>
          )}

          {/* TAB 4: PROMOTIONS */}
          {currentTab === 'promotions' && (
            <motion.div
              key="promotions"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="px-4 space-y-6"
            >
              <div className="text-center space-y-2 mb-4">
                <span className="text-xs font-mono font-black text-[#FF9F00] uppercase tracking-widest">Active Promotions</span>
                <h1 className="text-2xl font-black text-slate-900">Unlock Voucher Benefits</h1>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {promotions.map((promo) => (
                  <div key={promo.id} className="rounded-2xl border border-slate-200/60 bg-white/70 backdrop-blur-md p-5 flex flex-col justify-between space-y-4 shadow-sm">
                    <div className="space-y-2">
                      <span className="inline-block rounded-full bg-[#1FA66A]/15 border border-[#1FA66A]/20 px-3 py-1 text-[9px] font-black text-[#1FA66A] uppercase font-mono">
                        {promo.category.toUpperCase()} • MATCH {promo.bonusPercentage}%
                      </span>
                      <h3 className="font-black text-slate-900 text-base leading-tight">{promo.title}</h3>
                      <p className="text-xs text-slate-600 leading-normal">{promo.description}</p>
                    </div>

                    <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Min Deposit Limit</span>
                        <span className="font-mono text-xs font-black text-[#FF9F00]">৳{promo.minDeposit} BDT</span>
                      </div>
                      <div className="bg-slate-100/80 px-3 py-1.5 rounded-xl border border-slate-200/60 font-mono text-xs font-black text-slate-800">
                        CODE: {promo.code}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* TAB 5: LEADERBOARD */}
          {currentTab === 'leaderboard' && (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="px-4 space-y-6 max-w-2xl mx-auto"
            >
              <div className="text-center space-y-2 mb-2">
                <span className="text-xs font-mono font-black text-[#FF9F00] uppercase tracking-widest">Weekly Leaderboard Champion Lounge</span>
                <h1 className="text-2xl font-black text-slate-900">Hall of Glory Winners</h1>
              </div>

              <div className="rounded-2xl border border-slate-200/60 bg-white/70 backdrop-blur-md overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/80 text-slate-600 font-bold">
                      <th className="p-3.5">Rank</th>
                      <th className="p-3.5">Member Name</th>
                      <th className="p-3.5">VIP Tier</th>
                      <th className="p-3.5">Total Predictions Gain</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50/55 transition font-black">
                      <td className="p-3.5 text-[#FF9F00]">👑 Rank 1</td>
                      <td className="p-3.5 text-slate-900">shakib_bet7</td>
                      <td className="p-3.5 text-[#FF9F00]">Diamond Legend</td>
                      <td className="p-3.5 text-[#1FA66A]">৳4,50,000 BDT</td>
                    </tr>
                    <tr className="hover:bg-slate-50/55 transition font-bold">
                      <td className="p-3.5 text-slate-400">🥈 Rank 2</td>
                      <td className="p-3.5 text-slate-800">mushfiq_pro</td>
                      <td className="p-3.5 text-slate-600">Platinum VIP</td>
                      <td className="p-3.5 text-[#1FA66A]">৳2,80,000 BDT</td>
                    </tr>
                    <tr className="hover:bg-slate-50/55 transition font-bold">
                      <td className="p-3.5 text-orange-500">🥉 Rank 3</td>
                      <td className="p-3.5 text-slate-800">tamim_opener</td>
                      <td className="p-3.5 text-slate-600">Gold Pro</td>
                      <td className="p-3.5 text-[#1FA66A]">৳1,95,000 BDT</td>
                    </tr>
                    <tr className="hover:bg-slate-50/55 transition">
                      <td className="p-3.5 text-slate-500">4th Place</td>
                      <td className="p-3.5 text-slate-700">riyad_bets</td>
                      <td className="p-3.5 text-slate-500">Silver Elite</td>
                      <td className="p-3.5 text-[#1FA66A]">৳1,20,000 BDT</td>
                    </tr>
                    <tr className="hover:bg-slate-50/55 transition">
                      <td className="p-3.5 text-slate-500">5th Place</td>
                      <td className="p-3.5 text-slate-700">taskin_pace</td>
                      <td className="p-3.5 text-slate-500">Silver Elite</td>
                      <td className="p-3.5 text-[#1FA66A]">৳85,000 BDT</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* TAB 6: USER WALLET / PROFILE DASHBOARD */}
          {user && (currentTab === 'wallet' || currentTab === 'profile') && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
            >
              <Dashboard 
                user={user}
                lang={lang}
                onRefreshUser={fetchUserProfile}
                onNavigate={(tab) => navigateTo(tab)}
                initialTab={currentTab}
              />
            </motion.div>
          )}

          {/* TAB 7: ADMIN COCKPIT AT /cockpit */}
          {currentTab === 'cockpit' && (
            <motion.div
              key="cockpit"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="px-4"
            >
              {user && (user.role === 'admin' || user.role === 'mod' || user.role === 'primary_admin') ? (
                <AdminPanel 
                  user={user}
                  onRefreshUser={fetchUserProfile}
                />
              ) : (
                <div className="max-w-md mx-auto my-12 p-8 rounded-3xl border border-slate-200/60 bg-white/90 backdrop-blur-md shadow-xl space-y-6">
                  <div className="text-center space-y-2">
                    <div className="mx-auto w-12 h-12 rounded-2xl bg-[#1FA66A]/15 text-[#1FA66A] flex items-center justify-center">
                      <ShieldCheck className="h-6 w-6" />
                    </div>
                    <h2 className="text-xl font-black text-slate-900">Cockpit Administration</h2>
                    <p className="text-xs text-slate-500 font-medium">Authorized system administrators only</p>
                  </div>

                  {user ? (
                    /* Logged in but not an admin */
                    <div className="space-y-4 text-center">
                      <div className="p-4 rounded-2xl bg-amber-50 text-amber-800 border border-amber-100 text-xs font-semibold flex items-start space-x-2.5 text-left">
                        <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-extrabold">Access Restricted</p>
                          <p className="text-amber-700/95 mt-1 font-medium leading-relaxed">
                            Your account ({user.email}) does not have administrative privileges required to access the cockpit.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full py-3 rounded-xl border border-slate-200 hover:bg-slate-100 font-extrabold text-xs text-slate-700 transition"
                      >
                        Sign Out & Switch Account
                      </button>
                    </div>
                  ) : (
                    /* Not logged in, show elegant Firebase Admin Login */
                    <form 
                      onSubmit={async (e) => {
                        e.preventDefault();
                        setAuthError('');
                        setAuthSuccess('');
                        try {
                          // Authenticate using Firebase
                          const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
                          const fbUser = userCredential.user;

                          // Sync profile with database
                          const res = await fetch('/api/auth/firebase-sync', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email: fbUser.email, uid: fbUser.uid })
                          });

                          const data = await res.json();
                          if (res.ok) {
                            if (data.user.role === 'admin' || data.user.role === 'mod' || data.user.role === 'primary_admin') {
                              localStorage.setItem('token', data.token);
                              setUser(data.user);
                              setNotifications(data.notifications || []);
                              setAuthMode(null);
                              setEmail('');
                              setPassword('');
                              alert('Admin authorization successful! Welcome to the Cockpit.');
                            } else {
                              setUser(data.user);
                              setAuthError('Access denied. This profile does not have admin permissions.');
                            }
                          } else {
                            setAuthError(data.error);
                            await signOut(firebaseAuth);
                          }
                        } catch (err: any) {
                          console.error(err);
                          if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                            setAuthError('Invalid admin email or password.');
                          } else {
                            setAuthError(err.message || 'Verification failed.');
                          }
                        }
                      }} 
                      className="space-y-4 text-xs"
                    >
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Admin Email</label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="e.g. admin@betepro.com"
                          className="w-full rounded-xl bg-slate-50 border border-slate-200/80 p-3 text-slate-950 focus:border-[#1FA66A] focus:bg-white focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Passkey</label>
                        <input
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full rounded-xl bg-slate-50 border border-slate-200/80 p-3 text-slate-950 focus:border-[#1FA66A] focus:bg-white focus:outline-none"
                        />
                      </div>

                      {authError && (
                        <div className="p-3 rounded-xl bg-red-50 text-red-600 border border-red-100 font-bold leading-normal">
                          {authError}
                        </div>
                      )}

                      <button
                        type="submit"
                        className="w-full rounded-xl bg-gradient-to-r from-[#1FA66A] to-[#0D6B45] py-3 text-xs font-black uppercase text-white hover:brightness-110 shadow-lg shadow-[#1FA66A]/10 transition tracking-wider"
                      >
                        Authorize Cockpit Access
                      </button>
                    </form>
                  )}
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* FOOTER LAYOUT COMPLIANCE BAR */}
      {currentTab === 'home' && (
        <footer className="border-t border-[#0e4b3c] bg-[#031e17] py-10 px-4 mt-16 text-xs text-[#8daaa3] shadow-inner">
          <div className="max-w-7xl w-full mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
            
            <div className="space-y-3.5">
              <div className="flex items-center space-x-2">
                <span className="shiny-logo-text text-xl">BETEPRO.COM</span>
              </div>
              <p className="leading-relaxed text-[#8daaa3]">
                Premium simulated sports predictions and slots gaming platform designed for ultimate performance and fast local loading in Bangladesh.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-extrabold text-white uppercase text-[10px] tracking-wider">Compliance Disclosures</h4>
              <ul className="space-y-1.5 leading-relaxed text-[#8daaa3]">
                <li>• Entertainment simulation node.</li>
                <li>• Simulated wagering algorithms.</li>
                <li>• Secure virtual ledger accounts.</li>
                <li>• Certified RNG outcomes.</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-extrabold text-white uppercase text-[10px] tracking-wider">Customer Care Support</h4>
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2"><Mail className="h-4 w-4 text-yellow-400" /> <span className="text-white">support@betepro.com</span></div>
                <div className="flex items-center space-x-2"><Phone className="h-4 w-4 text-yellow-400" /> <span className="text-white">+880 171-BETEPRO</span></div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-extrabold text-white uppercase text-[10px] tracking-wider">License & Security</h4>
              <p className="leading-normal text-[#8daaa3]">
                BETEPRO processes transfers via secure simulated bKash Nagad gateways. Currencies mapped 1:1 with BDT virtual credits.
              </p>
            </div>

          </div>

          <div className="max-w-7xl w-full mx-auto border-t border-[#0e4b3c] pt-6 mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center">
            <p>© 2026 BETEPRO Systems Inc. All simulated rights reserved.</p>
            <div className="flex space-x-4 text-[#8daaa3]">
              <a href="#terms" onClick={(e) => { e.preventDefault(); alert('Terms of Service: This simulated betting web-app uses demo virtual credit points. No real physical currencies can be deposited or gained.'); }} className="hover:text-white transition">Terms & Conditions</a>
              <span>•</span>
              <a href="#privacy" onClick={(e) => { e.preventDefault(); alert('Privacy Policy: All player account info and transaction ledger data are secured server-side. No tracking cookies used.'); }} className="hover:text-white transition">Privacy Guidelines</a>
            </div>
          </div>
        </footer>
      )}

      {/* MASTER AUTH MODAL POPUPS */}
      <AnimatePresence>
        {authMode && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#03211a] border border-[#0e4b3c] rounded-3xl max-w-sm w-full p-6 space-y-4 relative shadow-2xl text-white max-h-[90vh] overflow-y-auto"
            >
              <button 
                type="button"
                onClick={() => setAuthMode(null)} 
                className="absolute top-4 right-4 z-50 p-2 text-[#8daaa3] hover:text-white hover:bg-[#053d30] rounded-full transition-all cursor-pointer"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>

              {authMode === 'login' && (
                <>
                  <div className="text-center space-y-1">
                    <span className="shiny-logo-text text-lg block italic">BETEPRO.COM</span>
                    <h3 className="text-md font-black text-white">Welcome Back Player</h3>
                    <p className="text-[11px] text-[#8daaa3]">Access your sports predictions portfolio</p>
                  </div>

                  <div className="space-y-3.5">
                    {/* Primary Login Option: Google Auth */}
                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={isAuthLoading}
                      className="w-full flex items-center justify-center space-x-2.5 rounded-xl bg-white text-black py-2.5 text-xs font-black hover:bg-slate-100 active:scale-95 transition duration-200 disabled:opacity-50"
                    >
                      <svg className="h-4 w-4 bg-white rounded-full p-0.5" viewBox="0 0 24 24" fill="none">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                      </svg>
                      <span>Continue with Google</span>
                    </button>

                    <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-900/40 text-[10px] leading-relaxed text-[#8daaa3] text-center font-medium">
                      <span className="font-extrabold text-emerald-400">✨ Recommended Instant Sign-in:</span>
                      <p className="mt-0.5">Click the white Google button above to log in or register instantly with your Google account. Zero passwords required!</p>
                    </div>

                    <div className="relative my-2 flex items-center justify-center">
                      <div className="absolute inset-y-1/2 left-0 right-0 border-t border-[#0e4b3c]"></div>
                      <span className="relative bg-[#03211a] px-2.5 text-[8px] font-black text-[#8daaa3] uppercase tracking-widest">or email login</span>
                    </div>
                  </div>

                  <form onSubmit={handleLoginSubmit} className="space-y-3.5 text-xs text-slate-200">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#8daaa3] uppercase">Email or Username</label>
                      <input
                        type="text"
                        required
                        disabled={isAuthLoading}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="yourname@gmail.com or username"
                        className="w-full rounded-xl bg-[#053d30] border border-[#0e4b3c] p-3 text-white placeholder-slate-400/50 focus:border-yellow-400 focus:bg-[#074c3d] focus:outline-none transition duration-200 disabled:opacity-50"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-[#8daaa3] uppercase">Secure Password</label>
                        <button type="button" disabled={isAuthLoading} onClick={() => setAuthMode('forgot')} className="text-[9px] font-black text-yellow-400 uppercase hover:underline disabled:opacity-50">Forgot?</button>
                      </div>
                      <input
                        type="password"
                        required
                        disabled={isAuthLoading}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-xl bg-[#053d30] border border-[#0e4b3c] p-3 text-white placeholder-slate-400/50 focus:border-yellow-400 focus:bg-[#074c3d] focus:outline-none transition duration-200 disabled:opacity-50"
                      />
                    </div>

                    {authError && (
                      <div className="p-2.5 rounded-lg bg-red-950/40 text-red-400 border border-red-900/40 font-semibold text-[11px] leading-normal">
                        {authError.includes('operation-not-allowed') ? (
                          <span>
                            ⚠️ <strong>Email login disabled</strong><br />
                            Please use the <strong>Continue with Google</strong> button above. Standard email login is deactivated by owner permissions in this environment.
                          </span>
                        ) : authError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isAuthLoading}
                      className="w-full rounded-xl bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 py-2.5 text-[11px] font-black uppercase tracking-wider text-black hover:brightness-110 active:scale-95 transition flex items-center justify-center space-x-2 disabled:opacity-75"
                    >
                      {isAuthLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin text-black" />
                          <span>Authenticating...</span>
                        </>
                      ) : (
                        <span>Authenticate Account</span>
                      )}
                    </button>

                    <p className="text-center text-[#8daaa3] text-[11px]">
                      Don't have a profile?{' '}
                      <button type="button" disabled={isAuthLoading} onClick={() => setAuthMode('register')} className="text-yellow-400 font-extrabold hover:underline disabled:opacity-50">Register Free</button>
                    </p>
                  </form>
                </>
              )}

              {authMode === 'register' && (
                <>
                  <div className="text-center space-y-1">
                    <span className="shiny-logo-text text-lg block italic">BETEPRO.COM</span>
                    <h3 className="text-md font-black text-white">Create Member Account</h3>
                    <p className="text-[11px] text-[#8daaa3]">Unlock ৳700 welcome gift balance free</p>
                  </div>

                  <div className="space-y-3.5">
                    {/* Primary Register Option: Google Auth */}
                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={isAuthLoading}
                      className="w-full flex items-center justify-center space-x-2.5 rounded-xl bg-white text-black py-2.5 text-xs font-black hover:bg-slate-100 active:scale-95 transition duration-200 disabled:opacity-50"
                    >
                      <svg className="h-4 w-4 bg-white rounded-full p-0.5" viewBox="0 0 24 24" fill="none">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                      </svg>
                      <span>Continue with Google</span>
                    </button>

                    <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-900/40 text-[10px] leading-relaxed text-[#8daaa3] text-center font-medium">
                      <span className="font-extrabold text-emerald-400">✨ Recommended Instant Registration:</span>
                      <p className="mt-0.5">Click the white Google button above to log in or register instantly with your Google account. Zero passwords required!</p>
                    </div>

                    <div className="relative my-2 flex items-center justify-center">
                      <div className="absolute inset-y-1/2 left-0 right-0 border-t border-[#0e4b3c]"></div>
                      <span className="relative bg-[#03211a] px-2.5 text-[8px] font-black text-[#8daaa3] uppercase tracking-widest">or email registration</span>
                    </div>
                  </div>

                  <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs text-slate-200">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#8daaa3] uppercase">Username Handle</label>
                      <input
                        type="text"
                        required
                        disabled={isAuthLoading}
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="e.g. sakib_boss"
                        className="w-full rounded-xl bg-[#053d30] border border-[#0e4b3c] p-3 text-white placeholder-slate-400/50 focus:border-yellow-400 focus:bg-[#074c3d] focus:outline-none transition duration-200 disabled:opacity-50"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#8daaa3] uppercase">Email Address</label>
                      <input
                        type="email"
                        required
                        disabled={isAuthLoading}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="sakib@gmail.com"
                        className="w-full rounded-xl bg-[#053d30] border border-[#0e4b3c] p-3 text-white placeholder-slate-400/50 focus:border-yellow-400 focus:bg-[#074c3d] focus:outline-none transition duration-200 disabled:opacity-50"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#8daaa3] uppercase">Password</label>
                      <input
                        type="password"
                        required
                        disabled={isAuthLoading}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-xl bg-[#053d30] border border-[#0e4b3c] p-3 text-white placeholder-slate-400/50 focus:border-yellow-400 focus:bg-[#074c3d] focus:outline-none transition duration-200 disabled:opacity-50"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#8daaa3] uppercase">Referral Code (Recommended)</label>
                      <input
                        type="text"
                        disabled={isAuthLoading}
                        value={referralCode}
                        onChange={(e) => setReferralCode(e.target.value)}
                        placeholder="Paste code to get welcome gift"
                        className="w-full rounded-xl bg-[#053d30] border border-[#0e4b3c] p-3 text-yellow-400 font-bold uppercase placeholder-slate-400/50 focus:border-yellow-400 focus:bg-[#074c3d] focus:outline-none transition duration-200 disabled:opacity-50"
                      />
                    </div>

                    {authError && (
                      <div className="p-2.5 rounded-lg bg-red-950/40 text-red-400 border border-red-900/40 font-semibold text-[11px] leading-normal">
                        {authError.includes('operation-not-allowed') ? (
                          <span>
                            ⚠️ <strong>Email registration disabled</strong><br />
                            Please use the <strong>Continue with Google</strong> button above. Standard registration is deactivated by owner permissions in this environment.
                          </span>
                        ) : authError}
                      </div>
                    )}
                    {authSuccess && <div className="p-2.5 rounded-lg bg-emerald-950/40 text-emerald-400 border border-emerald-900/40 font-semibold">{authSuccess}</div>}

                    <button
                      type="submit"
                      disabled={isAuthLoading}
                      className="w-full rounded-xl bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 py-2.5 text-[11px] font-black uppercase tracking-wider text-black hover:brightness-110 active:scale-95 transition flex items-center justify-center space-x-2 disabled:opacity-75"
                    >
                      {isAuthLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin text-black" />
                          <span>Registering...</span>
                        </>
                      ) : (
                        <span>Authorize Registration</span>
                      )}
                    </button>

                    <p className="text-center text-[#8daaa3] text-[11px] mt-4">
                      Already have an account?{' '}
                      <button type="button" disabled={isAuthLoading} onClick={() => setAuthMode('login')} className="text-yellow-400 font-extrabold hover:underline disabled:opacity-50">Log In</button>
                    </p>
                  </form>
                </>
              )}

              {authMode === 'forgot' && (
                <>
                  <div className="text-center space-y-1">
                    <span className="shiny-logo-text text-lg block italic">BETEPRO.COM</span>
                    <h3 className="text-md font-black text-white">Reset Account Key</h3>
                    <p className="text-[11px] text-[#8daaa3]">Input email to recover your credentials</p>
                  </div>

                  <form onSubmit={handleForgotSubmit} className="space-y-4 text-xs text-slate-200">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#8daaa3] uppercase">Email Address</label>
                      <input
                        type="email"
                        required
                        disabled={isAuthLoading}
                        placeholder="yourname@gmail.com"
                        className="w-full rounded-xl bg-[#053d30] border border-[#0e4b3c] p-3 text-white placeholder-slate-400/50 focus:border-yellow-400 focus:bg-[#074c3d] focus:outline-none transition duration-200 disabled:opacity-50"
                      />
                    </div>

                    {authSuccess && <div className="p-2.5 rounded-lg bg-emerald-950/40 text-emerald-400 border border-emerald-900/40 font-semibold">{authSuccess}</div>}

                    <button
                      type="submit"
                      disabled={isAuthLoading}
                      className="w-full rounded-xl bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 py-2.5 text-[11px] font-black uppercase tracking-wider text-black hover:brightness-110 active:scale-95 transition flex items-center justify-center space-x-2 disabled:opacity-75"
                    >
                      {isAuthLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin text-black" />
                          <span>Sending link...</span>
                        </>
                      ) : (
                        <span>Send Password Key</span>
                      )}
                    </button>

                    <button type="button" disabled={isAuthLoading} onClick={() => setAuthMode('login')} className="w-full text-center text-[#8daaa3] text-[11px] font-extrabold hover:underline mt-2 disabled:opacity-50">Back to login</button>
                  </form>
                </>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FLOATING SUPPORT CONTACTS */}
      {currentTab === 'home' && (
        <div className="fixed right-4 bottom-24 z-50 flex flex-col items-center space-y-3">
          {/* WhatsApp */}
          <a 
            href="https://wa.me/880171000000" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="h-11 w-11 flex items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-[#25D366]/20 hover:scale-110 active:scale-95 transition-all duration-300"
            title="WhatsApp Support"
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.713-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.725 1.45 5.515 0 9.961-4.447 9.964-9.964.003-2.672-1.033-5.184-2.918-7.07C16.53 1.684 14.02.643 11.352.643 5.834.643 1.388 5.09 1.385 10.61c-.001 1.64.442 3.238 1.282 4.652l-.997 3.637 3.733-.98c1.433.824 2.914 1.235 4.244 1.235zM17.9 14.86c-.322-.16-1.902-.938-2.2-.1.297-.156-.322-.444-.356-.51-.1-.19-.1-.322-.05-.444.05-.122.322-.444.444-.577.122-.133.16-.22.25-.37.08-.15.04-.282-.02-.37-.056-.09-.5-1.21-.685-1.656-.18-.444-.36-.383-.49-.39l-.422-.01c-.145 0-.383.054-.585.27-.2.22-.767.747-.767 1.82 0 1.07.784 2.112.893 2.26.11.147 1.543 2.355 3.738 3.3.523.225.93.36 1.247.46.525.167 1 .143 1.378.087.42-.06.1.9-.176.84-.27-.056-.464-.322-.61-.63z" />
            </svg>
          </a>

          {/* Facebook */}
          <a 
            href="https://facebook.com" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="h-11 w-11 flex items-center justify-center rounded-full bg-[#1877F2] text-white shadow-lg shadow-[#1877F2]/20 hover:scale-110 active:scale-95 transition-all duration-300"
            title="Facebook Community"
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </a>

          {/* Telegram */}
          <a 
            href="https://t.me" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="h-11 w-11 flex items-center justify-center rounded-full bg-[#0088cc] text-white shadow-lg shadow-[#0088cc]/20 hover:scale-110 active:scale-95 transition-all duration-300"
            title="Telegram Channel"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161l-1.896 8.93c-.143.64-.523.8-.1.543l-2.894-2.133-1.396 1.343c-.154.154-.285.285-.585.285l.206-2.93 5.34-4.823c.232-.206-.05-.32-.36-.115L9.617 11.96l-2.842-.888c-.618-.193-.63-.618.129-.914l11.094-4.28c.513-.186.962.12.764.914z" />
            </svg>
          </a>

          {/* Live Support */}
          <button 
            onClick={() => alert('💬 Live Customer Service Support is available 24/7! Type your message in our secure portal.')}
            className="h-11 w-11 flex items-center justify-center rounded-full bg-gradient-to-tr from-sky-400 to-blue-600 text-white shadow-lg shadow-sky-500/20 hover:scale-110 active:scale-95 transition-all duration-300"
            title="Live Support"
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </button>
        </div>
      )}

    </div>
  );
}
