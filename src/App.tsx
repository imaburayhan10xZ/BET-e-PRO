/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, Flame, Bell, Globe, Sparkles, Star, Users, Phone, ShieldCheck, 
  HelpCircle, ChevronDown, CheckCircle2, AlertCircle, Play, ArrowRight, Wallet, Info, Mail, X, Loader2,
  Send, MessageSquare
} from 'lucide-react';
import { User, Notification, Match, Promotion, SupportChannel, SystemSettings } from './types';
import { translations, Language } from './utils/lang';
import { auth as firebaseAuth } from './lib/firebase';
import { triggerSystemNotification, playChimeSound, requestNotificationPermission } from './utils/notifications';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail, 
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged
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

  // Custom Animated Toast Notification State
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'info' | 'error' | 'warning' }[]>([]);

  const addToast = (message: string, type: 'success' | 'info' | 'error' | 'warning' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  // Intercept window.alert globally to route to custom toasts
  useEffect(() => {
    window.alert = (message: any) => {
      const msgStr = String(message);
      let type: 'success' | 'info' | 'error' | 'warning' = 'info';
      
      const msgLower = msgStr.toLowerCase();
      if (
        msgLower.includes('successful') || 
        msgLower.includes('welcome') || 
        msgLower.includes('added') || 
        msgLower.includes('claimed') || 
        msgLower.includes('success') || 
        msgLower.includes('active')
      ) {
        type = 'success';
      } else if (
        msgLower.includes('insufficient') || 
        msgLower.includes('failed') || 
        msgLower.includes('error') || 
        msgLower.includes('rejected') || 
        msgLower.includes('invalid') || 
        msgLower.includes('minimum') || 
        msgLower.includes('denied') || 
        msgLower.includes('not have') ||
        msgLower.includes('পর্যাপ্ত') ||
        msgLower.includes('অপর্যাপ্ত')
      ) {
        type = 'error';
      } else if (
        msgLower.includes('wait') || 
        msgLower.includes('warning') || 
        msgLower.includes('caution') || 
        msgLower.includes('complete')
      ) {
        type = 'warning';
      }
      
      addToast(msgStr, type);
    };
  }, []);

  // Tracking refs for Notifications and Admin Alerts
  const prevNotificationsRef = useRef<Notification[]>([]);
  const prevAdminTxIdsRef = useRef<Set<string>>(new Set());
  const prevAdminTicketIdsRef = useRef<Set<string>>(new Set());
  const hasInitializedAdminRefs = useRef<boolean>(false);

  // Synchronize and notify users on new incoming player notifications
  useEffect(() => {
    if (!user) {
      prevNotificationsRef.current = [];
      return;
    }
    
    // If the previous list was empty, initialize it with the current notifications to prevent historical alert spam
    if (prevNotificationsRef.current.length === 0 && notifications.length > 0) {
      prevNotificationsRef.current = notifications;
      return;
    }

    // Check for any new unread notifications
    const previousIds = new Set(prevNotificationsRef.current.map(n => n.id));
    const newUnreadNotifs = notifications.filter(n => !previousIds.has(n.id) && !n.read);

    if (newUnreadNotifs.length > 0) {
      newUnreadNotifs.forEach((notif) => {
        // Trigger native browser push notification
        triggerSystemNotification(notif.title, notif.message, () => {
          setCurrentTab('profile');
        });
        // Display custom animated Toast
        addToast(`${notif.title}: ${notif.message}`, 'success');
        // Play the chime audio alert
        playChimeSound('success');
      });
    }

    // Always update the ref with the latest list
    prevNotificationsRef.current = notifications;
  }, [notifications, user?.id]);

  // Background poller for administrative staff to catch pending transactions & support tickets in real-time
  useEffect(() => {
    if (!user) {
      prevAdminTxIdsRef.current.clear();
      prevAdminTicketIdsRef.current.clear();
      hasInitializedAdminRefs.current = false;
      return;
    }

    const isStaff = user.role === 'admin' || user.role === 'mod' || user.role === 'primary_admin';
    if (!isStaff) return;

    const pollAdminEndpoints = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      const headers = { 'Authorization': `Bearer ${token}` };

      try {
        // 1. Fetch Transactions
        const txRes = await fetch('/api/admin/transactions', { headers });
        if (txRes.ok) {
          const transactionsList: any[] = await txRes.json();
          const pendingTxs = transactionsList.filter(tx => tx.status === 'pending');

          if (!hasInitializedAdminRefs.current) {
            // First run: just seed the existing transactions
            pendingTxs.forEach(tx => prevAdminTxIdsRef.current.add(tx.id));
          } else {
            // Subsequent runs: check if there is a NEW pending transaction that wasn't in our set
            const newPendingTxs = pendingTxs.filter(tx => !prevAdminTxIdsRef.current.has(tx.id));
            if (newPendingTxs.length > 0) {
              newPendingTxs.forEach((tx) => {
                const label = tx.type === 'deposit' ? '💳 New Deposit Request' : '📤 New Withdraw Request';
                const message = `Amount: ৳${tx.amount} BDT from user ${tx.username} (${tx.paymentMethod})`;
                
                // Trigger native push notification
                triggerSystemNotification(label, message, () => {
                  setCurrentTab('cockpit');
                });
                
                // Trigger app toast
                addToast(`${label}: ৳${tx.amount} by ${tx.username}`, 'warning');
                
                // Play high-attention alert sound
                playChimeSound('alert');

                // Add to tracked pending transactions
                prevAdminTxIdsRef.current.add(tx.id);
              });
            }

            // Remove any transactions from our tracking set that are no longer pending
            const currentPendingIds = new Set(pendingTxs.map(tx => tx.id));
            prevAdminTxIdsRef.current.forEach((id) => {
              if (!currentPendingIds.has(id)) {
                prevAdminTxIdsRef.current.delete(id);
              }
            });
          }
        }

        // 2. Fetch Support Tickets
        const ticketRes = await fetch('/api/admin/tickets', { headers });
        if (ticketRes.ok) {
          const tickets: any[] = await ticketRes.json();
          const openTickets = tickets.filter(t => t.status === 'open');

          if (!hasInitializedAdminRefs.current) {
            // First run: seed existing open ticket IDs
            openTickets.forEach(t => prevAdminTicketIdsRef.current.add(t.id));
          } else {
            // Subsequent runs: alert for new open support tickets
            const newOpenTickets = openTickets.filter(t => !prevAdminTicketIdsRef.current.has(t.id));
            if (newOpenTickets.length > 0) {
              newOpenTickets.forEach((t) => {
                const label = '💬 New Support Ticket';
                const message = `User ${t.username} opened a ticket: "${t.subject}"`;
                
                // Trigger native push notification
                triggerSystemNotification(label, message, () => {
                  setCurrentTab('cockpit');
                });
                
                // Trigger app toast
                addToast(`${label}: ${t.subject} by ${t.username}`, 'info');
                
                // Play alert sound
                playChimeSound('info');

                // Track the ticket ID
                prevAdminTicketIdsRef.current.add(t.id);
              });
            }

            // Remove solved or replied tickets from our tracking set
            const currentOpenIds = new Set(openTickets.map(t => t.id));
            prevAdminTicketIdsRef.current.forEach((id) => {
              if (!currentOpenIds.has(id)) {
                prevAdminTicketIdsRef.current.delete(id);
              }
            });
          }
        }

        // Mark admin refs initialized after first success
        hasInitializedAdminRefs.current = true;

      } catch (err) {
        console.error('[BETEPRO] Admin background poller error:', err);
      }
    };

    // Run poll immediately on mount/role change
    pollAdminEndpoints();

    // Set polling interval every 8 seconds
    const interval = setInterval(() => {
      pollAdminEndpoints();
    }, 8000);

    return () => {
      clearInterval(interval);
    };
  }, [user?.id, user?.role]);
  
  // Auth state
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot' | null>(null);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [usernameOrPhone, setUsernameOrPhone] = useState('');
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
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  
  // Support channels state
  const [supportChannels, setSupportChannels] = useState<SupportChannel[]>([]);

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
        setSystemSettings(data);
        if (data && data.marqueeNotice) {
          setMarqueeNotice(data.marqueeNotice);
        }
      }

      const resBanners = await fetch('/api/banners');
      if (resBanners.ok) {
        const bannersData = await resBanners.json();
        setBanners(bannersData);
      }

      const resChannels = await fetch('/api/support-channels');
      if (resChannels.ok) {
        const channelsData = await resChannels.json();
        setSupportChannels(channelsData);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Dynamic Page Title and Favicon custom sync
  useEffect(() => {
    if (systemSettings) {
      if (systemSettings.siteName) {
        document.title = systemSettings.siteName;
      }
      if (systemSettings.siteFavicon) {
        let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.getElementsByTagName('head')[0].appendChild(link);
        }
        link.href = systemSettings.siteFavicon;
      }
    }
  }, [systemSettings]);

  // Fetch Auth details on mount
  const fetchUserProfile = async () => {
    // Legacy support: fetch if token exists on demand
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

  // Support referral link parsing: exampledomain.com/ref?id=BET-XYZ or /?ref=BET-XYZ
  useEffect(() => {
    if (user) return;
    
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref') || params.get('id') || params.get('code');
    
    // Check path as well, in case they did /ref/XYZ or similar
    let pathRef = '';
    if (window.location.pathname.startsWith('/ref/')) {
      pathRef = window.location.pathname.substring(5);
    }
    
    const finalRefCode = ref || pathRef;

    if (finalRefCode) {
      setReferralCode(finalRefCode);
      setAuthMode('register');
      // Clean up URL to look neat
      window.history.replaceState({}, '', '/');
    }
  }, [user]);

  // Background real-time profile sync for all users (updates roles, permissions, balance instantly)
  useEffect(() => {
    if (!user) return;
    
    // Always refresh once on tab switches/changes
    fetchUserProfile();

    const interval = setInterval(() => {
      fetchUserProfile();
    }, 5000); // Polling every 5 seconds

    return () => clearInterval(interval);
  }, [user?.id, currentTab]);

  // Support manual URL change, page refreshes and browser history events for /cockpit
  useEffect(() => {
    const handleLocationChange = () => {
      if (window.location.pathname === '/cockpit') {
        setCurrentTab('cockpit');
      } else {
        if (currentTab === 'cockpit') {
          setCurrentTab('home');
        }
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    handleLocationChange(); // run immediately on load

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, [currentTab]);

  // Synchronize client state with native Firebase Auth SDK (Subscribed ONCE on mount)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (fbUser) => {
      if (fbUser) {
        try {
          // Use cached token if valid (forceRefresh = false) to prevent auth/quota-exceeded
          const token = await fbUser.getIdToken(false);
          localStorage.setItem('token', token);
          
          const res = await fetch('/api/auth/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setUser(data.user);
            setNotifications(data.notifications || []);
          } else {
            console.warn('[AUTH] Client profile load failed or blocked.');
            localStorage.removeItem('token');
            setUser(null);
          }
        } catch (e) {
          console.error('[AUTH] Sync error:', e);
          localStorage.removeItem('token');
          setUser(null);
        }
      } else {
        localStorage.removeItem('token');
        setUser(null);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []); // Run EXACTLY ONCE on mount to completely avoid infinite re-registration and token request loops!

  // Fetch static settings, banners, and promotions once on mount
  useEffect(() => {
    fetchPromotions();
    fetchSettingsAndBanners();
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
    if (currentTab === 'cockpit' || window.location.pathname === '/cockpit') {
      setCurrentTab('cockpit');
      window.history.pushState({}, '', '/cockpit');
    } else {
      setCurrentTab('home');
      window.history.pushState({}, '', '/');
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    setIsAuthLoading(true);

    try {
      if (!email || !password) {
        throw new Error('Please fill in all fields.');
      }

      // 1. Sign in natively via Google Firebase Client SDK
      const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
      const idToken = await userCredential.user.getIdToken(true);

      // 2. Log in on our backend with verified Firebase token
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
      });

      let data: any = {};
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        throw new Error('Non-JSON response from server.');
      }

      if (res.ok) {
        localStorage.setItem('token', idToken);
        setUser(data.user);
        setNotifications(data.notifications || []);
        setAuthMode(null);
        setEmail('');
        setPassword('');
        alert(`Welcome back, ${data.user.username || data.user.email}!`);
      } else {
        // If profile creation/block checks failed, sign out immediately
        await signOut(firebaseAuth);
        throw new Error(data.error || 'Login verification failed.');
      }
    } catch (err: any) {
      console.error('[AUTH] Login Error:', err);
      let errorMsg = err.message || 'Authentication failed.';
      if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        errorMsg = 'Invalid email or password.';
      } else if (err.code === 'auth/invalid-credential') {
        errorMsg = 'Invalid credentials. Please verify your password.';
      }
      setAuthError(errorMsg);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    setIsAuthLoading(true);

    let createdFbUser: any = null;

    try {
      if (!fullName || !email || !password) {
        throw new Error('Please fill in all required fields.');
      }

      const cleanEmail = email.trim().toLowerCase();
      const derivedUsername = cleanEmail.split('@')[0];

      // 1. Create Native Auth Account via Client SDK
      const userCredential = await createUserWithEmailAndPassword(firebaseAuth, cleanEmail, password);
      createdFbUser = userCredential.user;
      const idToken = await createdFbUser.getIdToken(true);

      // 2. Send token to backend to write local profile
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken,
          fullName,
          username: derivedUsername,
          referralCode
        })
      });

      let data: any = {};
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        throw new Error('Non-JSON response from registration backend.');
      }

      if (res.ok) {
        localStorage.setItem('token', idToken);
        setUser(data.user);
        setNotifications([]);
        setAuthSuccess('Registration completed and logged in!');
        setAuthMode(null);
        setFullName('');
        setEmail('');
        setPassword('');
        setReferralCode('');
      } else {
        // Registration failed on backend (e.g. username taken)
        // Rollback Firebase Auth account creation to avoid orphaned Auth records!
        await createdFbUser.delete();
        throw new Error(data.error || 'Failed to complete profile registration.');
      }
    } catch (err: any) {
      console.error('[AUTH] Registration Error:', err);
      let errorMsg = err.message || 'Failed to register account.';
      if (err.code === 'auth/email-already-in-use') {
        errorMsg = 'An account is already registered with this email.';
      }
      setAuthError(errorMsg);
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
      const idToken = await fbUser.getIdToken(true);

      const res = await fetch('/api/auth/firebase-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken,
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
        localStorage.setItem('token', idToken);
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
      
      {/* CUSTOM TOAST NOTIFICATIONS */}
      <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-3 pointer-events-none max-w-md w-full px-4">
        <AnimatePresence>
          {toasts.map((toast) => {
            let icon = <Info className="h-5 w-5 text-indigo-400" />;
            let bgColor = "bg-slate-900/95 border-slate-800/80";
            let barColor = "bg-indigo-500";
            let textColor = "text-white";

            if (toast.type === 'success') {
              icon = <CheckCircle2 className="h-5 w-5 text-emerald-400" />;
              bgColor = "bg-slate-900/95 border-emerald-500/30";
              barColor = "bg-emerald-500";
            } else if (toast.type === 'error') {
              icon = <AlertCircle className="h-5 w-5 text-rose-400" />;
              bgColor = "bg-slate-900/95 border-rose-500/30";
              barColor = "bg-rose-500";
            } else if (toast.type === 'warning') {
              icon = <AlertCircle className="h-5 w-5 text-amber-400" />;
              bgColor = "bg-slate-900/95 border-amber-500/30";
              barColor = "bg-amber-500";
            }

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: -25, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -25, scale: 0.95, transition: { duration: 0.15 } }}
                className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-2xl ${bgColor} backdrop-blur-md overflow-hidden relative`}
                style={{ width: '100%' }}
              >
                {/* Accent border bottom progress bar simulation */}
                <motion.div 
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: 3, ease: "linear" }}
                  className={`absolute bottom-0 left-0 h-1 ${barColor}`}
                />
                <div className="flex-shrink-0 mt-0.5">
                  {icon}
                </div>
                <div className="flex-grow">
                  <p className={`text-xs font-semibold tracking-wide ${textColor}`}>
                    {toast.message}
                  </p>
                </div>
                <button 
                  onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                  className="flex-shrink-0 text-slate-400 hover:text-white transition p-0.5 rounded cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* NAVIGATION HEADER BAR */}
      {currentTab !== 'cockpit' ? (
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
          systemSettings={systemSettings}
        />
      ) : (
        <header className="w-full border-b border-slate-200/20 bg-[#021813] sticky top-0 z-50">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
            <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigateTo('home')}>
              {systemSettings?.siteLogo ? (
                <img 
                  src={systemSettings.siteLogo} 
                  alt={systemSettings.siteName || "Logo"} 
                  className="h-10 w-auto object-contain rounded-lg"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-yellow-500 via-amber-500 to-emerald-600 text-black font-black text-xl shadow-lg shadow-emerald-500/10">
                  {systemSettings?.siteName ? systemSettings.siteName.charAt(0).toUpperCase() : 'B'}
                </div>
              )}
              <div>
                <span className="shiny-logo-text text-lg sm:text-2xl block tracking-wide select-none">{systemSettings?.siteName || "BETEPRO.COM"}</span>
                <span className="text-[9px] font-black tracking-widest text-[#FF9F00] uppercase block leading-none font-mono">Cockpit Admin Control</span>
              </div>
            </div>
            
            {user && (user.role === 'admin' || user.role === 'mod' || user.role === 'primary_admin') && (
              <div className="flex items-center space-x-4">
                <div className="hidden sm:flex flex-col items-end text-right font-mono text-[10px] text-[#8daaa3]">
                  <span className="font-bold text-white uppercase tracking-wider">{user.username}</span>
                  <span className="text-[#FF9F00] font-black uppercase tracking-widest">{user.role}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="rounded-xl bg-red-950/40 border border-red-900/60 px-4 py-2 text-xs font-black text-red-400 hover:bg-red-900/40 transition active:scale-95"
                >
                  Log Out
                </button>
              </div>
            )}
          </div>
        </header>
      )}

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
                      <button
                        onClick={() => {
                          setCurrentTab('home');
                          window.history.pushState({}, '', '/');
                        }}
                        className="w-full py-3 rounded-xl bg-[#1FA66A] hover:bg-[#1FA66A]/90 text-white font-extrabold text-xs transition shadow-sm"
                      >
                        Go to Player Portal (প্লেয়ার পোর্টালে যান)
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
                          if (!email || !password) {
                            throw new Error('Please fill in all fields.');
                          }

                          let loginEmail = email.trim();
                          if (!loginEmail.includes('@')) {
                            loginEmail = `${loginEmail.toLowerCase()}@betepro.com`;
                          }

                          // 1. Sign in natively via Google Firebase Client SDK
                          const userCredential = await signInWithEmailAndPassword(firebaseAuth, loginEmail, password);
                          const idToken = await userCredential.user.getIdToken(true);

                          // 2. Direct reliable server API call to /api/auth/admin-login
                          const res = await fetch('/api/auth/admin-login', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ idToken })
                          });

                          const data = await res.json();
                          if (res.ok) {
                            localStorage.setItem('token', idToken);
                            setUser(data.user);
                            setNotifications(data.notifications || []);
                            setAuthMode(null);
                            setEmail('');
                            setPassword('');
                            alert('Admin authorization successful! Welcome to the Cockpit.');
                          } else {
                            await signOut(firebaseAuth);
                            setAuthError(data.error || 'Invalid admin credentials or access denied.');
                          }
                        } catch (err: any) {
                          console.error(err);
                          let errorMsg = err.message || 'Verification failed.';
                          if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
                            errorMsg = 'Invalid admin credentials.';
                          }
                          setAuthError(errorMsg);
                        }
                      }} 
                      className="space-y-4 text-xs"
                    >
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Admin Email or Username</label>
                        <input
                          type="text"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="e.g. admin or admin@betepro.com"
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
              <div className="space-y-2">
                {supportChannels.map((channel) => (
                  <a 
                    key={channel.id}
                    href={channel.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-white hover:text-[#FF9F00] transition"
                  >
                    <span className="text-xs bg-[#FF9F00]/20 text-[#FF9F00] p-1 rounded-md font-mono leading-none">
                      {channel.icon === 'Send' ? 'TG' : channel.icon === 'Phone' ? 'WP' : 'SC'}
                    </span>
                    <span className="font-bold text-[11px]">{channel.name}</span>
                  </a>
                ))}
                {supportChannels.length === 0 && (
                  <span className="text-[#8daaa3] text-[11px] leading-relaxed block">
                    Undergoing system server updates. Live support is coming online shortly.
                  </span>
                )}
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
          <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-gradient-to-b from-[#03211a] to-[#011410] border border-[#0e4b3c]/80 rounded-[2rem] max-w-md w-full p-7 space-y-6 relative shadow-[0_0_50px_rgba(0,0,0,0.8)] text-white max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-emerald-900 scrollbar-track-transparent"
            >
              {/* Close Button */}
              <button 
                type="button"
                onClick={() => setAuthMode(null)} 
                className="absolute top-5 right-5 z-50 p-2 text-[#8daaa3] hover:text-white hover:bg-[#0e4b3c]/50 rounded-full transition-all duration-200 cursor-pointer"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Branding Header */}
              <div className="text-center space-y-1.5 pt-2">
                <span className="shiny-logo-text text-xl block italic tracking-wider font-extrabold text-yellow-400">
                  BETEPRO.COM
                </span>
                <p className="text-[10px] font-bold text-yellow-500/80 tracking-widest uppercase">
                  Elite Sports & Casino Platform
                </p>
              </div>

              {/* Tabs for Login & Register */}
              {authMode !== 'forgot' && (
                <div className="flex border-b border-[#0e4b3c] p-0.5 bg-[#011410] rounded-xl">
                  <button
                    type="button"
                    onClick={() => { setAuthMode('login'); setAuthError(''); setAuthSuccess(''); }}
                    className={`flex-1 py-2.5 text-xs font-black tracking-wider uppercase rounded-lg transition-all duration-300 ${
                      authMode === 'login'
                        ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black shadow-md'
                        : 'text-[#8daaa3] hover:text-white'
                    }`}
                  >
                    Player Login
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAuthMode('register'); setAuthError(''); setAuthSuccess(''); }}
                    className={`flex-1 py-2.5 text-xs font-black tracking-wider uppercase rounded-lg transition-all duration-300 ${
                      authMode === 'register'
                        ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black shadow-md'
                        : 'text-[#8daaa3] hover:text-white'
                    }`}
                  >
                    Open Profile
                  </button>
                </div>
              )}

              {/* Auth Mode Description */}
              <div className="text-center space-y-0.5">
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  {authMode === 'login' && 'Welcome Back'}
                  {authMode === 'register' && 'Join Elite Club'}
                  {authMode === 'forgot' && 'Account Recovery'}
                </h3>
                <p className="text-[11px] text-[#8daaa3]">
                  {authMode === 'login' && 'Enter credentials to load your active wagers'}
                  {authMode === 'register' && 'Get instantly credited with ৳700 welcome bonus'}
                  {authMode === 'forgot' && 'Recover secure passcode key instantly'}
                </p>
              </div>

              {/* Auth Error Handler (Ultra Sleek, Informative) */}
              {authError && (
                <motion.div 
                  initial={{ opacity: 0, y: -8 }} 
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3.5 rounded-2xl bg-red-950/50 border border-red-500/30 text-red-300 text-[11px] leading-relaxed flex items-start gap-3 shadow-inner"
                >
                  <AlertCircle className="h-4.5 w-4.5 text-red-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-extrabold block text-red-200 uppercase tracking-widest text-[9px]">
                      Authentication Notice
                    </span>
                    <p>{authError}</p>
                  </div>
                </motion.div>
              )}

              {authSuccess && (
                <motion.div 
                  initial={{ opacity: 0, y: -8 }} 
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-xl bg-emerald-950/40 text-emerald-400 border border-emerald-900/40 font-bold text-[11px]"
                >
                  {authSuccess}
                </motion.div>
              )}



              {/* LOGIN VIEW */}
              {authMode === 'login' && (
                <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs text-slate-200">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-[#8daaa3] uppercase tracking-wider">
                      Email Address
                    </label>
                    <div className="relative rounded-2xl bg-[#0a382e] border border-[#166453] focus-within:border-yellow-400 focus-within:bg-[#0e4c3f] transition-all duration-350 p-3 flex items-center gap-3 shadow-inner">
                      <Mail className="h-4.5 w-4.5 text-yellow-400 shrink-0" />
                      <input
                        type="email"
                        required
                        disabled={isAuthLoading}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter email address"
                        className="w-full bg-transparent text-sm text-white font-bold placeholder-slate-400/60 focus:outline-none disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-extrabold text-[#8daaa3] uppercase tracking-wider">
                        Secure Password
                      </label>
                      <button 
                        type="button" 
                        disabled={isAuthLoading} 
                        onClick={() => setAuthMode('forgot')} 
                        className="text-[9px] font-black text-yellow-400 uppercase tracking-wider hover:underline disabled:opacity-50 cursor-pointer"
                      >
                        Forgot Pass?
                      </button>
                    </div>
                    <div className="relative rounded-2xl bg-[#0a382e] border border-[#166453] focus-within:border-yellow-400 focus-within:bg-[#0e4c3f] transition-all duration-350 p-3 flex items-center gap-3 shadow-inner">
                      <ShieldCheck className="h-4.5 w-4.5 text-yellow-400 shrink-0" />
                      <input
                        type="password"
                        required
                        disabled={isAuthLoading}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-transparent text-sm text-white font-bold placeholder-slate-400/60 focus:outline-none disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isAuthLoading}
                    className="w-full rounded-2xl bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 py-3 text-xs font-black uppercase tracking-wider text-black hover:brightness-110 active:scale-95 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-75 cursor-pointer shadow-lg shadow-yellow-500/10"
                  >
                    {isAuthLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-black" />
                        <span>Verifying Account...</span>
                      </>
                    ) : (
                      <span>Authenticate Account</span>
                    )}
                  </button>
                </form>
              )}

              {/* REGISTER VIEW */}
              {authMode === 'register' && (
                <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs text-slate-200">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-[#8daaa3] uppercase tracking-wider">
                      Full Name
                    </label>
                    <div className="relative rounded-2xl bg-[#0a382e] border border-[#166453] focus-within:border-yellow-400 focus-within:bg-[#0e4c3f] transition-all duration-350 p-3 flex items-center gap-3 shadow-inner">
                      <Star className="h-4.5 w-4.5 text-yellow-400 shrink-0" />
                      <input
                        type="text"
                        required
                        disabled={isAuthLoading}
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Sakib Rahman"
                        className="w-full bg-transparent text-sm text-white font-bold placeholder-slate-400/60 focus:outline-none disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-[#8daaa3] uppercase tracking-wider">
                      Email Address
                    </label>
                    <div className="relative rounded-2xl bg-[#0a382e] border border-[#166453] focus-within:border-yellow-400 focus-within:bg-[#0e4c3f] transition-all duration-350 p-3 flex items-center gap-3 shadow-inner">
                      <Mail className="h-4.5 w-4.5 text-yellow-400 shrink-0" />
                      <input
                        type="email"
                        required
                        disabled={isAuthLoading}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. sakib@gmail.com"
                        className="w-full bg-transparent text-sm text-white font-bold placeholder-slate-400/60 focus:outline-none disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-[#8daaa3] uppercase tracking-wider">
                      Choose Password
                    </label>
                    <div className="relative rounded-2xl bg-[#0a382e] border border-[#166453] focus-within:border-yellow-400 focus-within:bg-[#0e4c3f] transition-all duration-350 p-3 flex items-center gap-3 shadow-inner">
                      <ShieldCheck className="h-4.5 w-4.5 text-yellow-400 shrink-0" />
                      <input
                        type="password"
                        required
                        disabled={isAuthLoading}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-transparent text-sm text-white font-bold placeholder-slate-400/60 focus:outline-none disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-yellow-400/90 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5" /> Invite Referral Code (Optional)
                    </label>
                    <div className="relative rounded-2xl bg-[#0a382e] border border-yellow-400/40 focus-within:border-yellow-400 focus-within:bg-[#0e4c3f] transition-all duration-350 p-3 flex items-center gap-3 shadow-inner">
                      <Flame className="h-4.5 w-4.5 text-yellow-400 shrink-0 animate-pulse" />
                      <input
                        type="text"
                        disabled={isAuthLoading}
                        value={referralCode}
                        onChange={(e) => setReferralCode(e.target.value)}
                        placeholder="Enter code to get welcome bonus"
                        className="w-full bg-transparent text-sm text-yellow-400 font-black uppercase placeholder-yellow-400/40 focus:outline-none disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isAuthLoading}
                    className="w-full rounded-2xl bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 py-3 text-xs font-black uppercase tracking-wider text-black hover:brightness-110 active:scale-95 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-75 cursor-pointer shadow-lg shadow-yellow-500/10"
                  >
                    {isAuthLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-black" />
                        <span>Processing Account...</span>
                      </>
                    ) : (
                      <span>Authorize Registration</span>
                    )}
                  </button>
                </form>
              )}

              {/* FORGOT PASSWORD VIEW */}
              {authMode === 'forgot' && (
                <form onSubmit={handleForgotSubmit} className="space-y-4 text-xs text-slate-200">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-[#8daaa3] uppercase tracking-wider">
                      Email Address
                    </label>
                    <div className="relative rounded-2xl bg-[#0a382e] border border-[#166453] focus-within:border-yellow-400 focus-within:bg-[#0e4c3f] transition-all duration-350 p-3 flex items-center gap-3 shadow-inner">
                      <Mail className="h-4.5 w-4.5 text-yellow-400 shrink-0" />
                      <input
                        type="email"
                        required
                        disabled={isAuthLoading}
                        placeholder="yourname@gmail.com"
                        className="w-full bg-transparent text-sm text-white font-bold placeholder-slate-400/60 focus:outline-none disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isAuthLoading}
                    className="w-full rounded-2xl bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 py-3 text-xs font-black uppercase tracking-wider text-black hover:brightness-110 active:scale-95 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-75 cursor-pointer shadow-lg shadow-yellow-500/10"
                  >
                    {isAuthLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-black" />
                        <span>Sending Link...</span>
                      </>
                    ) : (
                      <span>Send Recovery Passcode</span>
                    )}
                  </button>

                  <button 
                    type="button" 
                    disabled={isAuthLoading} 
                    onClick={() => setAuthMode('login')} 
                    className="w-full text-center text-[#8daaa3] text-[11px] font-extrabold hover:underline mt-2 disabled:opacity-50 cursor-pointer block"
                  >
                    Back to Player Login
                  </button>
                </form>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FLOATING SUPPORT CONTACTS */}
      {currentTab !== 'cockpit' && supportChannels.length > 0 && (
        <div className="fixed right-4 bottom-24 z-50 flex flex-col items-center space-y-3">
          {supportChannels.map((channel) => {
            let bgClass = "bg-[#25D366] shadow-[#25D366]/20";
            let IconComponent = Phone;

            if (channel.icon === 'Send') {
              bgClass = "bg-[#0088cc] shadow-[#0088cc]/20";
              IconComponent = Send;
            } else if (channel.icon === 'MessageSquare') {
              bgClass = "bg-gradient-to-tr from-sky-400 to-blue-600 shadow-sky-500/20";
              IconComponent = MessageSquare;
            } else if (channel.icon === 'Phone') {
              bgClass = "bg-[#25D366] shadow-[#25D366]/20";
              IconComponent = Phone;
            }

            return (
              <a 
                key={channel.id}
                href={channel.link} 
                target="_blank" 
                rel="noopener noreferrer" 
                className={`h-11 w-11 flex items-center justify-center rounded-full text-white shadow-lg hover:scale-110 active:scale-95 transition-all duration-300 ${bgClass}`}
                title={channel.name}
              >
                <IconComponent className="h-5 w-5" />
              </a>
            );
          })}
        </div>
      )}

    </div>
  );
}
