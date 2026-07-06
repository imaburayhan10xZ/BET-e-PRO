/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  id: string;
  username: string;
  email: string;
  phone: string;
  role: 'user' | 'admin' | 'mod' | 'primary_admin';
  balance: number;
  referralCode: string;
  referredBy?: string;
  vipLevel: number;
  vipPoints: number;
  isBlocked: boolean;
  avatarUrl?: string;
  fullName?: string;
  createdAt: string;
  allowedTabs?: string[]; // for restricted admin/mod access
}

export type TransactionType = 'deposit' | 'withdraw' | 'bet' | 'win' | 'referral_bonus' | 'vip_bonus';
export type TransactionStatus = 'pending' | 'success' | 'failed';

export interface Transaction {
  id: string;
  userId: string;
  username: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  paymentMethod?: string;
  transactionId?: string; // payment reference
  description: string;
  createdAt: string;
}

export type SportType = 'football' | 'cricket' | 'tennis' | 'basketball' | 'volleyball' | 'badminton' | 'baseball' | 'esports';

export interface Team {
  name: string;
  logo: string;
}

export interface Match {
  id: string;
  sport: SportType;
  league: string;
  time: string;
  homeTeam: Team;
  awayTeam: Team;
  homeScore: number;
  awayScore: number;
  status: 'live' | 'upcoming' | 'completed';
  odds: {
    homeWin: number;
    draw: number;
    awayWin: number;
    over_2_5?: number;
    under_2_5?: number;
  };
  stats?: {
    possession?: [number, number];
    shotsOnTarget?: [number, number];
    fouls?: [number, number];
    corners?: [number, number];
  };
}

export interface Prediction {
  id: string;
  userId: string;
  username: string;
  matchId: string;
  matchDetails: {
    homeTeam: string;
    awayTeam: string;
    sport: SportType;
    league: string;
  };
  selection: 'home' | 'draw' | 'away';
  odds: number;
  betAmount: number;
  potentialPayout: number;
  status: 'pending' | 'won' | 'lost' | 'refunded';
  createdAt: string;
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  image: string;
  category: 'sports' | 'slots' | 'live_casino' | 'welcome';
  bonusPercentage: number;
  minDeposit: number;
  code: string;
  active: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface LeaderboardEntry {
  username: string;
  vipLevel: number;
  totalWinnings: number;
  gamesPlayed: number;
  rank: number;
}

export interface SupportTicket {
  id: string;
  userId: string;
  username: string;
  subject: string;
  message: string;
  status: 'open' | 'replied' | 'closed';
  reply?: string;
  createdAt: string;
}

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  image: string;
  createdAt: string;
}

export interface SystemSettings {
  siteName: string;
  maintenanceMode: boolean;
  minDeposit: number;
  minWithdraw: number;
  bKashNumber: string;
  nagadNumber: string;
  rocketNumber: string;
  referralBonus: number; // percentage or fixed amount
  userWinningPercentage: number;
  maxWinPercentageOfDeposit: number;
  marqueeNotice: string;
}

export interface SupportChannel {
  id: string;
  name: string;
  icon: string;
  link: string;
  active: boolean;
  createdAt: string;
}

export interface BannerSlider {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image?: string;
  linkTab: string;
  buttonText: string;
  active: boolean;
  isImageOnly?: boolean;
  createdAt: string;
}
