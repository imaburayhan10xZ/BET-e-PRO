/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';
import { 
  User, Match, Prediction, Transaction, 
  Promotion, Notification, LeaderboardEntry, 
  SupportTicket, SystemSettings, NewsItem,
  SupportChannel, BannerSlider
} from '../src/types';

const isVercel = process.env.VERCEL === '1';
const DATA_FILE = isVercel 
  ? path.join('/tmp', 'data.json') 
  : path.join(process.cwd(), 'data.json');

// VIP levels definition
export const VIP_LEVELS = [
  { level: 0, name: 'Bronze Member', pointsRequired: 0, dailyWithdrawLimit: 50000, cashBackPercent: 1 },
  { level: 1, name: 'Silver Elite', pointsRequired: 500, dailyWithdrawLimit: 100000, cashBackPercent: 2 },
  { level: 2, name: 'Gold Pro', pointsRequired: 2000, dailyWithdrawLimit: 250000, cashBackPercent: 3.5 },
  { level: 3, name: 'Platinum VIP', pointsRequired: 10000, dailyWithdrawLimit: 500000, cashBackPercent: 5 },
  { level: 4, name: 'Diamond Legend', pointsRequired: 50000, dailyWithdrawLimit: 1000000, cashBackPercent: 8 }
];

export interface DatabaseSchema {
  users: (User & { passwordHash: string; salt: string })[];
  matches: Match[];
  predictions: Prediction[];
  transactions: Transaction[];
  promotions: Promotion[];
  notifications: Notification[];
  leaderboard: LeaderboardEntry[];
  supportTickets: SupportTicket[];
  news: NewsItem[];
  settings: SystemSettings;
  supportChannels: SupportChannel[];
  banners: BannerSlider[];
}

// Helper to hash password using Node's crypto
export function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha256').toString('hex');
}

export function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

// Default Seed Data
const DEFAULT_SETTINGS: SystemSettings = {
  siteName: 'BETEPRO',
  maintenanceMode: false,
  minDeposit: 200,
  minWithdraw: 500,
  bKashNumber: '01700000000',
  nagadNumber: '01800000000',
  rocketNumber: '01900000000',
  referralBonus: 5, // 5% bonus on deposit
  userWinningPercentage: 70, // Default 70% win rate
  maxWinPercentageOfDeposit: 200, // Default 200% max win based on deposit
  marqueeNotice: '🎁🎁🎁 BETEPRO-তে স্বাগতম! নগদের মাধ্যমে প্রতিটি ডিপোজিটে ১.৫% বোনাস সরাসরি ওয়ালেট ব্যালেন্সে ইনস্ট্যান্ট যুক্ত হচ্ছে! এছাড়া রেফার করুন এবং প্রতি রেফারে ২০০ টাকা ফ্রি বোনাস লুফে নিন! 🎁🎁🎁',
};

function getSeedData(): DatabaseSchema {
  // Hash some default passwords
  const adminSalt = generateSalt();
  const userSalt = generateSalt();
  const demoSalt1 = generateSalt();
  const demoSalt2 = generateSalt();

  return {
    users: [
      {
        id: 'user_admin',
        username: 'admin',
        email: 'admin@betepro.com',
        phone: '01711111111',
        role: 'primary_admin',
        balance: 100000,
        referralCode: 'ADMINPRO',
        vipLevel: 4,
        vipPoints: 60000,
        isBlocked: false,
        fullName: 'BETEPRO Administrator',
        createdAt: new Date().toISOString(),
        passwordHash: hashPassword('admin123', adminSalt),
        salt: adminSalt
      },
      {
        id: 'user_player1',
        username: 'cricketer99',
        email: 'player1@betepro.com',
        phone: '01722222222',
        role: 'user',
        balance: 25000,
        referralCode: 'CRIC99',
        vipLevel: 1,
        vipPoints: 650,
        isBlocked: false,
        fullName: 'Sakib Rahman',
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        passwordHash: hashPassword('player123', userSalt),
        salt: userSalt
      },
      {
        id: 'user_player2',
        username: 'casinoking',
        email: 'casino@betepro.com',
        phone: '01733333333',
        role: 'user',
        balance: 1200,
        referralCode: 'CKING77',
        vipLevel: 0,
        vipPoints: 120,
        isBlocked: false,
        fullName: 'Abir Chowdhury',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        passwordHash: hashPassword('player123', demoSalt1),
        salt: demoSalt1
      },
      {
        id: 'user_blocked',
        username: 'blocked_user',
        email: 'blocked@betepro.com',
        phone: '01744444444',
        role: 'user',
        balance: 0,
        referralCode: 'BLOCKED',
        vipLevel: 0,
        vipPoints: 0,
        isBlocked: true,
        fullName: 'Suspicious Gambler',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        passwordHash: hashPassword('player123', demoSalt2),
        salt: demoSalt2
      }
    ],
    matches: [
      {
        id: 'match_1',
        sport: 'football',
        league: 'UEFA Champions League',
        time: 'Live',
        homeTeam: { name: 'Real Madrid', logo: '⚽' },
        awayTeam: { name: 'Manchester City', logo: '🛡️' },
        homeScore: 2,
        awayScore: 1,
        status: 'live',
        odds: { homeWin: 1.85, draw: 3.40, awayWin: 3.10, over_2_5: 1.70, under_2_5: 2.10 },
        stats: { possession: [48, 52], shotsOnTarget: [6, 5], fouls: [10, 8], corners: [4, 7] }
      },
      {
        id: 'match_2',
        sport: 'cricket',
        league: 'Indian Premier League (IPL)',
        time: 'Live',
        homeTeam: { name: 'Kolkata Knight Riders', logo: '🏏' },
        awayTeam: { name: 'Mumbai Indians', logo: '🐯' },
        homeScore: 184, // runs
        awayScore: 145, // runs (15.2 Overs)
        status: 'live',
        odds: { homeWin: 1.25, draw: 25.0, awayWin: 4.10 },
        stats: { possession: [100, 0] } // Default Cricket does not use typical match stats, but placeholder holds score
      },
      {
        id: 'match_3',
        sport: 'tennis',
        league: 'Wimbledon Men\'s Singles',
        time: 'Live',
        homeTeam: { name: 'Carlos Alcaraz', logo: '🎾' },
        awayTeam: { name: 'Novak Djokovic', logo: '🥇' },
        homeScore: 2, // Sets
        awayScore: 2, // Sets (Fifth Set: 4-3)
        status: 'live',
        odds: { homeWin: 1.95, draw: 0, awayWin: 1.85 },
        stats: { possession: [50, 50], shotsOnTarget: [8, 9], fouls: [0, 0] }
      },
      {
        id: 'match_4',
        sport: 'football',
        league: 'English Premier League',
        time: 'Today 22:30',
        homeTeam: { name: 'Arsenal', logo: '🔴' },
        awayTeam: { name: 'Chelsea', logo: '🔵' },
        homeScore: 0,
        awayScore: 0,
        status: 'upcoming',
        odds: { homeWin: 1.65, draw: 3.80, awayWin: 4.80, over_2_5: 1.60, under_2_5: 2.30 }
      },
      {
        id: 'match_5',
        sport: 'cricket',
        league: 'ICC T20 World Cup',
        time: 'Tomorrow 14:00',
        homeTeam: { name: 'Bangladesh', logo: '🇧🇩' },
        awayTeam: { name: 'India', logo: '🇮🇳' },
        homeScore: 0,
        awayScore: 0,
        status: 'upcoming',
        odds: { homeWin: 3.25, draw: 20.0, awayWin: 1.35 }
      },
      {
        id: 'match_6',
        sport: 'basketball',
        league: 'NBA Finals',
        time: 'Tomorrow 07:30',
        homeTeam: { name: 'Boston Celtics', logo: '🏀' },
        awayTeam: { name: 'Dallas Mavericks', logo: '🐴' },
        homeScore: 0,
        awayScore: 0,
        status: 'upcoming',
        odds: { homeWin: 1.55, draw: 12.0, awayWin: 2.45 }
      },
      {
        id: 'match_7',
        sport: 'esports',
        league: 'Dota 2 The International',
        time: 'Live',
        homeTeam: { name: 'Team Liquid', logo: '💧' },
        awayTeam: { name: 'Gaimin Gladiators', logo: '⚔️' },
        homeScore: 1,
        awayScore: 0,
        status: 'live',
        odds: { homeWin: 1.45, draw: 0, awayWin: 2.60 }
      }
    ],
    predictions: [
      {
        id: 'pred_1',
        userId: 'user_player1',
        username: 'cricketer99',
        matchId: 'match_1',
        matchDetails: {
          homeTeam: 'Real Madrid',
          awayTeam: 'Manchester City',
          sport: 'football',
          league: 'UEFA Champions League'
        },
        selection: 'home',
        odds: 1.85,
        betAmount: 1000,
        potentialPayout: 1850,
        status: 'pending',
        createdAt: new Date().toISOString()
      }
    ],
    transactions: [
      {
        id: 'tx_1',
        userId: 'user_player1',
        username: 'cricketer99',
        type: 'deposit',
        amount: 20000,
        status: 'success',
        paymentMethod: 'bKash',
        transactionId: 'BK99X8A1B',
        description: 'bKash Deposit Approved',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'tx_2',
        userId: 'user_player1',
        username: 'cricketer99',
        type: 'bet',
        amount: 1000,
        status: 'success',
        description: 'Placed prediction on Real Madrid vs Man City',
        createdAt: new Date().toISOString()
      },
      {
        id: 'tx_3',
        userId: 'user_player2',
        username: 'casinoking',
        type: 'deposit',
        amount: 1000,
        status: 'pending',
        paymentMethod: 'Nagad',
        transactionId: 'NG12345678',
        description: 'Nagad Deposit Request Pending',
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'tx_4',
        userId: 'user_player2',
        username: 'casinoking',
        type: 'withdraw',
        amount: 500,
        status: 'failed',
        paymentMethod: 'Nagad',
        transactionId: 'WD99182A',
        description: 'Withdrawal rejected (insufficient rollover)',
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
      }
    ],
    promotions: [
      {
        id: 'promo_welcome',
        title: '200% Super Welcome Bonus',
        description: 'Get a 200% match bonus on your very first deposit! Up to ৳20,000 extra cash in your BETEPRO wallet. 15x sports rollover wagering requirements apply.',
        image: '🎁',
        category: 'welcome',
        bonusPercentage: 200,
        minDeposit: 500,
        code: 'WELCOME200',
        active: true
      },
      {
        id: 'promo_sports',
        title: 'Daily 10% Sports Reload',
        description: 'Boost your betting funds every single day! Deposit any amount of ৳200 or more and grab an extra 10% cash bonus automatically.',
        image: '⚽',
        category: 'sports',
        bonusPercentage: 10,
        minDeposit: 200,
        code: 'RELOAD10',
        active: true
      },
      {
        id: 'promo_slots',
        title: 'Weekend 50% Slots Bonanza',
        description: 'Double the fun in our digital slots and Aviator crash games! Enjoy a 50% casino bonus up to ৳10,000 every Friday and Saturday.',
        image: '🎰',
        category: 'slots',
        bonusPercentage: 50,
        minDeposit: 1000,
        code: 'SLOTBONANZA',
        active: true
      }
    ],
    notifications: [
      {
        id: 'notif_1',
        userId: 'user_player1',
        title: '🎉 Welcome to BETEPRO',
        message: 'Your account has been fully registered! Go to the Wallet page to top up and grab your 200% Welcome Bonus.',
        read: false,
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'notif_2',
        userId: 'user_player1',
        title: '💳 Deposit Approved!',
        message: 'Your deposit of ৳20,000 has been verified and added to your wallet balance. Good luck!',
        read: true,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'notif_3',
        userId: 'user_player2',
        title: '⚠️ Action Required on Deposit',
        message: 'Your Nagad deposit request for ৳1,000 is currently under review by our agents.',
        read: false,
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
      }
    ],
    leaderboard: [
      { username: 'bpl_expert', vipLevel: 3, totalWinnings: 742000, gamesPlayed: 256, rank: 1 },
      { username: 'casinoking', vipLevel: 0, totalWinnings: 412000, gamesPlayed: 512, rank: 2 },
      { username: 'cricketer99', vipLevel: 1, totalWinnings: 245000, gamesPlayed: 84, rank: 3 },
      { username: 'aviator_pro_bd', vipLevel: 2, totalWinnings: 198500, gamesPlayed: 320, rank: 4 },
      { username: 'sakib_fan_1', vipLevel: 1, totalWinnings: 112000, gamesPlayed: 67, rank: 5 }
    ],
    supportTickets: [
      {
        id: 'ticket_1',
        userId: 'user_player1',
        username: 'cricketer99',
        subject: 'bKash Deposit Delay',
        message: 'Hi, I made a bKash deposit of ৳20,000, but it did not reflect immediately. Transaction ID: BK99X8A1B.',
        status: 'replied',
        reply: 'Thank you for contacting us. Your deposit was reviewed and successfully credited to your wallet!',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'ticket_2',
        userId: 'user_player2',
        username: 'casinoking',
        subject: 'Wagering Requirement Query',
        message: 'How can I check my current remaining turnover/rollover for the Welcome Bonus?',
        status: 'open',
        createdAt: new Date().toISOString()
      }
    ],
    news: [
      {
        id: 'news_1',
        title: 'BETEPRO Becomes Official Regional Sponsor!',
        content: 'We are proud to announce that BETEPRO is now the official sponsor for upcoming regional cricket matches! Expect exclusive higher odds and special 100% cashback offers for every league game.',
        image: '🏏',
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'news_2',
        title: 'The Crash Game Revolution: High Flyer Arena Released',
        content: 'Check out our newly released in-house crash game demo \"High Flyer\" and \"Lucky Spin\". Challenge multipliers up to 10,000x and dominate our monthly leaderboard to win bonus prizes!',
        image: '🚀',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    settings: DEFAULT_SETTINGS,
    supportChannels: [
      {
        id: 'sup_whatsapp',
        name: 'WhatsApp Support',
        icon: 'Phone',
        link: 'https://wa.me/8801700000000',
        active: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'sup_telegram',
        name: 'Telegram Channel',
        icon: 'Send',
        link: 'https://t.me/betepro_official',
        active: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'sup_livechat',
        name: '24/7 Live Chat',
        icon: 'MessageSquare',
        link: 'https://betepro.com/livechat',
        active: true,
        createdAt: new Date().toISOString()
      }
    ],
    banners: [
      {
        id: 'slide_1',
        title: 'নগদ ওয়ালেট টপ-আপে অতিরিক্ত +১.৫% বোনাস!',
        subtitle: '🔥 MASSIVE 1.5% NAGAD REWARD',
        description: 'BETEPRO-তে স্বাগতম! নগদের মাধ্যমে প্রতিটি ডিপোজিট করার সাথে সাথে সরাসরি ওয়ালেট ব্যালেন্সে ইনস্ট্যান্ট যুক্ত হচ্ছে অতিরিক্ত ১.৫% রিয়েল বোনাস।',
        image: '',
        linkTab: 'wallet',
        buttonText: 'টপ-আপ করুন',
        active: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'slide_2',
        title: 'Reach Platinum Club for 8% Turnover Cashback!',
        subtitle: '🌟 PLATINUM VIP TIER',
        description: 'Gain automatic VIP loyalty points on sports wagers and casino slots dice loops to unlock premium daily cash payouts.',
        image: '',
        linkTab: 'dashboard',
        buttonText: 'Access VIP Lounge',
        active: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'slide_3',
        title: 'Fly High on Aviator Simulator & Cashout!',
        subtitle: '⚡ LIVE MULTIPLIER CRASH',
        description: 'Place a virtual bet, watch the lucky flight vector rise exponentially, and click Cashout in real-time before the plane crashes!',
        image: '',
        linkTab: 'games',
        buttonText: 'Play Aviator',
        active: true,
        createdAt: new Date().toISOString()
      }
    ]
  };
}

let cachedDb: DatabaseSchema | null = null;
let isLoaded = false;
let isLoading = false;
let loadPromise: Promise<DatabaseSchema> | null = null;
let lastLoadTime = 0;

let dbInstance: any = null;

export function getFirestoreDb() {
  if (!dbInstance) {
    let firebaseConfig: any = null;

    // 1. Try to load from env variable FIREBASE_CONFIG (JSON string)
    if (process.env.FIREBASE_CONFIG) {
      try {
        console.log('[BETEPRO] Found FIREBASE_CONFIG environment variable. Parsing...');
        firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG);
      } catch (err) {
        console.error('Error parsing FIREBASE_CONFIG env variable:', err);
      }
    }

    // 2. Try to load from individual env variables
    if (!firebaseConfig && process.env.FIREBASE_PROJECT_ID) {
      console.log('[BETEPRO] Found individual Firebase environment variables. Constructing config...');
      firebaseConfig = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        appId: process.env.FIREBASE_APP_ID,
        apiKey: process.env.FIREBASE_API_KEY,
        authDomain: process.env.FIREBASE_AUTH_DOMAIN,
        firestoreDatabaseId: process.env.FIREBASE_DATABASE_ID,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      };
    }

    // 3. Try to load from firebase-applet-config.json (multiple paths)
    if (!firebaseConfig) {
      const pathsToTry = [
        path.join(process.cwd(), 'firebase-applet-config.json'),
        '/var/task/firebase-applet-config.json',
        'firebase-applet-config.json'
      ];

      for (const p of pathsToTry) {
        if (fs.existsSync(p)) {
          try {
            console.log('[BETEPRO] Loading Firebase config from file path:', p);
            const configRaw = fs.readFileSync(p, 'utf-8');
            firebaseConfig = JSON.parse(configRaw);
            break;
          } catch (err) {
            console.error(`Error reading config from path ${p}:`, err);
          }
        }
      }
    }

    // 4. Solid hardcoded fallback for Vercel environment where JSON may not be copied
    if (!firebaseConfig) {
      console.log('[BETEPRO] Using hardcoded fallback Firebase config for production routing...');
      firebaseConfig = {
        apiKey: "AIzaSyDUmN8a_aMiRL5tnZqlVA2ySoPOxX-Gtzk",
        authDomain: "caramel-poet-vgxqk.firebaseapp.com",
        projectId: "caramel-poet-vgxqk",
        storageBucket: "caramel-poet-vgxqk.firebasestorage.app",
        messagingSenderId: "858474249110",
        appId: "1:858474249110:web:ef9c60b0d204af3a963bb7",
        firestoreDatabaseId: "ai-studio-betepro-b6a3f733-91bd-405a-80ee-cc6e3903d102"
      };
    }

    if (firebaseConfig) {
      try {
        const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
        dbInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId);
        console.log('[BETEPRO] Firebase initialized successfully with database:', firebaseConfig.firestoreDatabaseId || '(default)');
      } catch (err) {
        console.error('Error initializing Firebase in server/db:', err);
      }
    } else {
      console.error('[BETEPRO] firebase-applet-config.json not found on disk, and no Firebase environment variables are configured.');
    }
  }
  return dbInstance;
}

export function readLocalDb(): DatabaseSchema {
  if (!fs.existsSync(DATA_FILE)) {
    const defaultData = getSeedData();
    writeLocalDb(defaultData);
    return defaultData;
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as DatabaseSchema;
    let mutated = false;
    if (!parsed.supportChannels) {
      parsed.supportChannels = [
        {
          id: 'sup_whatsapp',
          name: 'WhatsApp Support',
          icon: 'Phone',
          link: 'https://wa.me/8801700000000',
          active: true,
          createdAt: new Date().toISOString()
        },
        {
          id: 'sup_telegram',
          name: 'Telegram Channel',
          icon: 'Send',
          link: 'https://t.me/betepro_official',
          active: true,
          createdAt: new Date().toISOString()
        },
        {
          id: 'sup_livechat',
          name: '24/7 Live Chat',
          icon: 'MessageSquare',
          link: 'https://betepro.com/livechat',
          active: true,
          createdAt: new Date().toISOString()
        }
      ];
      mutated = true;
    }
    if (!parsed.banners) {
      parsed.banners = [
        {
          id: 'slide_1',
          title: 'নগদ ওয়ালেট টপ-আপে অতিরিক্ত +১.৫% বোনাস!',
          subtitle: '🔥 MASSIVE 1.5% NAGAD REWARD',
          description: 'BETEPRO-তে স্বাগতম! নগদের মাধ্যমে প্রতিটি ডিপোজিট করার সাথে সাথে সরাসরি ওয়ালেট ব্যালেন্সে ইনস্ট্যান্ট যুক্ত হচ্ছে অতিরিক্ত ১.৫% রিয়েল বোনাস।',
          image: '',
          linkTab: 'wallet',
          buttonText: 'টপ-আপ করুন',
          active: true,
          createdAt: new Date().toISOString()
        },
        {
          id: 'slide_2',
          title: 'Reach Platinum Club for 8% Turnover Cashback!',
          subtitle: '🌟 PLATINUM VIP TIER',
          description: 'Gain automatic VIP loyalty points on sports wagers and casino slots dice loops to unlock premium daily cash payouts.',
          image: '',
          linkTab: 'dashboard',
          buttonText: 'Access VIP Lounge',
          active: true,
          createdAt: new Date().toISOString()
        },
        {
          id: 'slide_3',
          title: 'Fly High on Aviator Simulator & Cashout!',
          subtitle: '⚡ LIVE MULTIPLIER CRASH',
          description: 'Place a virtual bet, watch the lucky flight vector rise exponentially, and click Cashout in real-time before the plane crashes!',
          image: '',
          linkTab: 'games',
          buttonText: 'Play Aviator',
          active: true,
          createdAt: new Date().toISOString()
        }
      ];
      mutated = true;
    }
    if (!parsed.settings) {
      parsed.settings = DEFAULT_SETTINGS;
      mutated = true;
    }
    if (parsed.settings.userWinningPercentage === undefined) {
      parsed.settings.userWinningPercentage = 70;
      parsed.settings.maxWinPercentageOfDeposit = 200;
      parsed.settings.marqueeNotice = '🎁🎁🎁 BETEPRO-তে স্বাগতম! নগদের মাধ্যমে প্রতিটি ডিপোজিটে ১.৫% বোনাস সরাসরি ওয়ালেট ব্যালেন্সে ইনস্ট্যান্ট যুক্ত হচ্ছে! এছাড়া রেফার করুন এবং প্রতি রেফারে ২০০ টাকা ফ্রি বোনাস লুফে নিন! 🎁🎁🎁';
      mutated = true;
    }
    parsed.users?.forEach(u => {
      const emailLower = u.email?.toLowerCase();
      if (u.username === 'admin' || emailLower === 'admin@betepro.com' || emailLower === 'aburayhan10x@gmail.com') {
        if (u.role !== 'primary_admin') {
          u.role = 'primary_admin';
          mutated = true;
        }
      }
    });
    if (mutated) {
      writeLocalDb(parsed);
    }
    return parsed;
  } catch (error) {
    console.error('Error reading local DB, restoring default seed data:', error);
    const defaultData = getSeedData();
    writeLocalDb(defaultData);
    return defaultData;
  }
}

export function writeLocalDb(data: DatabaseSchema): void {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing to local DB file:', error);
  }
}

export async function syncCollectionToFirestore<T extends { id?: string; username?: string }>(
  collectionName: string,
  newItems: T[],
  oldItems: T[],
  idKey: keyof T = 'id'
): Promise<void> {
  const firestore = getFirestoreDb();
  if (!firestore) return;

  try {
    const newMap = new Map<string, T>();
    newItems.forEach(item => {
      const key = String(item[idKey] || '');
      if (key) newMap.set(key, item);
    });

    const oldMap = new Map<string, T>();
    oldItems.forEach(item => {
      const key = String(item[idKey] || '');
      if (key) oldMap.set(key, item);
    });

    const promises: Promise<any>[] = [];

    // 1. Find added or updated items
    for (const [key, newItem] of newMap.entries()) {
      const oldItem = oldMap.get(key);
      if (!oldItem || JSON.stringify(newItem) !== JSON.stringify(oldItem)) {
        const docRef = doc(firestore, collectionName, key);
        const cleanData = JSON.parse(JSON.stringify(newItem));
        promises.push(setDoc(docRef, cleanData));
      }
    }

    // 2. Find deleted items
    for (const key of oldMap.keys()) {
      if (!newMap.has(key)) {
        const docRef = doc(firestore, collectionName, key);
        promises.push(deleteDoc(docRef));
      }
    }

    if (promises.length > 0) {
      await Promise.all(promises);
      console.log(`[BETEPRO] Synced ${promises.length} changes to Firestore collection: ${collectionName}`);
    }
  } catch (err) {
    console.error(`[BETEPRO] Error syncing collection ${collectionName} to Firestore:`, err);
  }
}

export async function ensureDbLoaded(): Promise<DatabaseSchema> {
  const now = Date.now();
  if (isLoaded && cachedDb && (now - lastLoadTime < 5000)) {
    return cachedDb;
  }

  if (isLoading && loadPromise) {
    return loadPromise;
  }

  isLoading = true;
  loadPromise = (async () => {
    const firestore = getFirestoreDb();
    if (!firestore) {
      console.warn('Firestore is not configured. Falling back to local DB.');
      cachedDb = readLocalDb();
      isLoaded = true;
      isLoading = false;
      lastLoadTime = Date.now();
      return cachedDb;
    }

    console.log('[BETEPRO] Fetching database state from Firestore...');
    try {
      const listCollections: { key: keyof DatabaseSchema; idKey: string }[] = [
        { key: 'users', idKey: 'id' },
        { key: 'matches', idKey: 'id' },
        { key: 'predictions', idKey: 'id' },
        { key: 'transactions', idKey: 'id' },
        { key: 'promotions', idKey: 'id' },
        { key: 'notifications', idKey: 'id' },
        { key: 'leaderboard', idKey: 'username' },
        { key: 'supportTickets', idKey: 'id' },
        { key: 'news', idKey: 'id' },
        { key: 'supportChannels', idKey: 'id' },
        { key: 'banners', idKey: 'id' }
      ];

      const newDb: any = {
        users: [],
        matches: [],
        predictions: [],
        transactions: [],
        promotions: [],
        notifications: [],
        leaderboard: [],
        supportTickets: [],
        news: [],
        settings: DEFAULT_SETTINGS,
        supportChannels: [],
        banners: []
      };

      // Fetch all collections in parallel!
      await Promise.all([
        ...listCollections.map(async ({ key, idKey }) => {
          try {
            const querySnapshot = await getDocs(collection(firestore, key));
            const items: any[] = [];
            querySnapshot.forEach((docSnap) => {
              items.push({ [idKey]: docSnap.id, ...docSnap.data() });
            });

            // Ensure aburayhan10x@gmail.com and admin role settings are respected
            if (key === 'users') {
              items.forEach(u => {
                const emailLower = u.email?.toLowerCase();
                if (u.username === 'admin' || emailLower === 'admin@betepro.com' || emailLower === 'aburayhan10x@gmail.com') {
                  u.role = 'primary_admin';
                }
              });
            }

            newDb[key] = items;
          } catch (err) {
            console.error(`[BETEPRO] Failed to fetch collection ${key} from Firestore:`, err);
            // Fallback to local DB list for this key if it fails
            const local = readLocalDb();
            newDb[key] = local[key] || [];
          }
        }),
        // Fetch settings document
        (async () => {
          try {
            const systemDoc = await getDoc(doc(firestore, 'settings', 'system'));
            if (systemDoc.exists()) {
              newDb.settings = systemDoc.data() as SystemSettings;
            } else {
              console.log('[BETEPRO] Settings document not found in system. Seeding default...');
              await setDoc(doc(firestore, 'settings', 'system'), DEFAULT_SETTINGS);
              newDb.settings = DEFAULT_SETTINGS;
            }
          } catch (err) {
            console.error('[BETEPRO] Failed to fetch settings from Firestore:', err);
            const local = readLocalDb();
            newDb.settings = local.settings || DEFAULT_SETTINGS;
          }
        })()
      ]);

      // Seed if empty
      if (newDb.users.length === 0 && newDb.matches.length === 0) {
        console.log('[BETEPRO] Firestore database is empty. Seeding default dataset now...');
        const defaultData = readLocalDb();
        const seedPromises: Promise<any>[] = [];

        listCollections.forEach(({ key, idKey }) => {
          const list = defaultData[key] as any[];
          list.forEach(item => {
            const id = item[idKey];
            if (id) {
              seedPromises.push(setDoc(doc(firestore, key, id), item));
            }
          });
        });

        seedPromises.push(setDoc(doc(firestore, 'settings', 'system'), defaultData.settings));
        await Promise.all(seedPromises);
        console.log('[BETEPRO] Successfully seeded Firestore!');
        cachedDb = defaultData;
      } else {
        cachedDb = newDb;
      }

      writeLocalDb(cachedDb!);
      isLoaded = true;
      isLoading = false;
      lastLoadTime = Date.now();
      return cachedDb!;
    } catch (err) {
      console.error('[BETEPRO] Error fetching from Firestore, falling back to local DB:', err);
      cachedDb = readLocalDb();
      isLoaded = true;
      isLoading = false;
      lastLoadTime = Date.now();
      return cachedDb;
    }
  })();

  return loadPromise;
}

export function readDb(): DatabaseSchema {
  if (!cachedDb) {
    cachedDb = readLocalDb();
  }
  return cachedDb;
}

export async function writeDb(data: DatabaseSchema): Promise<void> {
  const oldDb = readLocalDb();
  cachedDb = data;
  writeLocalDb(data);

  const firestore = getFirestoreDb();
  if (!firestore) return;

  try {
    await Promise.all([
      syncCollectionToFirestore('users', data.users, oldDb.users, 'id'),
      syncCollectionToFirestore('matches', data.matches, oldDb.matches, 'id'),
      syncCollectionToFirestore('predictions', data.predictions, oldDb.predictions, 'id'),
      syncCollectionToFirestore('transactions', data.transactions, oldDb.transactions, 'id'),
      syncCollectionToFirestore('promotions', data.promotions, oldDb.promotions, 'id'),
      syncCollectionToFirestore('notifications', data.notifications, oldDb.notifications, 'id'),
      syncCollectionToFirestore('leaderboard', data.leaderboard, oldDb.leaderboard, 'username'),
      syncCollectionToFirestore('supportTickets', data.supportTickets, oldDb.supportTickets, 'id'),
      syncCollectionToFirestore('news', data.news, oldDb.news, 'id'),
      syncCollectionToFirestore('supportChannels', data.supportChannels, oldDb.supportChannels, 'id'),
      syncCollectionToFirestore('banners', data.banners, oldDb.banners, 'id')
    ]);

    if (JSON.stringify(data.settings) !== JSON.stringify(oldDb.settings)) {
      await setDoc(doc(firestore, 'settings', 'system'), JSON.parse(JSON.stringify(data.settings)));
    }
  } catch (err) {
    console.error('[BETEPRO] Async Firestore collection sync failed:', err);
  }
}

// Function to update Match stats and score dynamically to simulate Live sports ticker!
export function tickLiveScores(): void {
  const db = readDb();
  let changed = false;

  db.matches = db.matches.map(m => {
    if (m.status !== 'live') return m;

    changed = true;
    if (m.sport === 'football') {
      if (Math.random() < 0.08) {
        if (Math.random() < 0.5) {
          m.homeScore += 1;
        } else {
          m.awayScore += 1;
        }
      }
      m.odds.homeWin = Math.max(1.05, +(m.odds.homeWin + (Math.random() * 0.2 - 0.1)).toFixed(2));
      m.odds.awayWin = Math.max(1.05, +(m.odds.awayWin + (Math.random() * 0.2 - 0.1)).toFixed(2));
      
      if (m.stats) {
        const homePossession = Math.min(75, Math.max(25, Math.floor(m.stats.possession?.[0] || 50 + (Math.random() * 6 - 3))));
        m.stats.possession = [homePossession, 100 - homePossession];
        
        if (Math.random() < 0.15) {
          if (Math.random() < 0.5) {
            m.stats.shotsOnTarget = [(m.stats.shotsOnTarget?.[0] || 0) + 1, m.stats.shotsOnTarget?.[1] || 0];
          } else {
            m.stats.shotsOnTarget = [m.stats.shotsOnTarget?.[0] || 0, (m.stats.shotsOnTarget?.[1] || 0) + 1];
          }
        }
      }
    } else if (m.sport === 'cricket') {
      m.awayScore += Math.floor(Math.random() * 6);
      m.odds.homeWin = Math.max(1.01, +(m.odds.homeWin + (Math.random() * 0.1 - 0.05)).toFixed(2));
      m.odds.awayWin = Math.max(1.01, +(m.odds.awayWin + (Math.random() * 0.2 - 0.1)).toFixed(2));
    } else if (m.sport === 'tennis') {
      if (Math.random() < 0.15) {
        m.odds.homeWin = +(1.5 + Math.random()).toFixed(2);
        m.odds.awayWin = +(1.5 + Math.random()).toFixed(2);
      }
    } else if (m.sport === 'esports') {
      if (Math.random() < 0.06) {
        if (Math.random() < 0.5) {
          m.homeScore += 1;
        } else {
          m.awayScore += 1;
        }
      }
      m.odds.homeWin = Math.max(1.05, +(m.odds.homeWin + (Math.random() * 0.1 - 0.05)).toFixed(2));
      m.odds.awayWin = Math.max(1.05, +(m.odds.awayWin + (Math.random() * 0.1 - 0.05)).toFixed(2));
    }
    return m;
  });

  if (changed) {
    writeDb(db);
  }
}
