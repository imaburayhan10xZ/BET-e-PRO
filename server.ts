/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { 
  readDb, writeDb, tickLiveScores, 
  hashPassword, generateSalt, VIP_LEVELS,
  DatabaseSchema, ensureDbLoaded
} from './server/db';
import { uploadToCloudinary } from './server/cloudinary';
import { 
  signJwt, authenticateToken, requireAdmin, 
  requirePrimaryAdmin, requireTabAccess,
  AuthenticatedRequest 
} from './server/auth';
import { 
  User, Match, Prediction, Transaction, 
  Promotion, Notification, LeaderboardEntry, 
  SupportTicket, SystemSettings, NewsItem 
} from './src/types';

const PORT = 3000;

export function createApp() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Database initialization middleware to load state from Firestore
  app.use(async (req, res, next) => {
    try {
      await ensureDbLoaded();
    } catch (err) {
      console.error('[BETEPRO] Database load error:', err);
    }
    next();
  });

  // In-memory active game states
  interface MinesState {
    betAmount: number;
    minesCount: number;
    grid: boolean[]; // 25 slots: true = mine, false = safe
    revealed: number[];
  }
  const activeMinesGames = new Map<string, MinesState>();

  interface BlackjackCard {
    suit: string;
    value: string;
    score: number;
  }
  interface BlackjackState {
    betAmount: number;
    playerCards: BlackjackCard[];
    dealerCards: BlackjackCard[];
    deck: BlackjackCard[];
  }
  const activeBlackjackGames = new Map<string, BlackjackState>();

  // Background ticker to simulate live sport updates
  setInterval(() => {
    tickLiveScores();
  }, 10000);

  // ==========================================
  // PUBLIC ENDPOINTS
  // ==========================================

  // Get active promotions
  app.get('/api/promotions', (req, res) => {
    const db = readDb();
    res.json(db.promotions.filter(p => p.active));
  });

  // Get leaderboard
  app.get('/api/leaderboard', (req, res) => {
    const db = readDb();
    res.json(db.leaderboard.sort((a, b) => b.totalWinnings - a.totalWinnings));
  });

  // Get public settings (limits & agent numbers)
  app.get('/api/settings', (req, res) => {
    const db = readDb();
    res.json(db.settings);
  });

  // Get news items
  app.get('/api/news', (req, res) => {
    const db = readDb();
    res.json(db.news.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  });

  // ==========================================
  // AUTHENTICATION ENDPOINTS
  // ==========================================

  // User registration
  app.post('/api/auth/register', (req, res) => {
    const { username, email, phone, password, referralCode } = req.body;

    if (!username || !email || !password) {
      res.status(400).json({ error: 'Please enter all required fields.' });
      return;
    }

    if (username.length < 3) {
      res.status(400).json({ error: 'Username must be at least 3 characters.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters.' });
      return;
    }

    const db = readDb();

    // Check existing
    const existingUser = db.users.find(u => u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      res.status(400).json({ error: 'Username or email already exists.' });
      return;
    }

    if (phone) {
      const existingPhone = db.users.find(u => u.phone === phone);
      if (existingPhone) {
        res.status(400).json({ error: 'Phone number already registered.' });
        return;
      }
    }

    // Referral setup
    let referredBy: string | undefined = undefined;
    if (referralCode) {
      const referrer = db.users.find(u => u.referralCode.toLowerCase() === referralCode.toLowerCase());
      if (referrer) {
        referredBy = referrer.id;
      }
    }

    const salt = generateSalt();
    const passwordHash = hashPassword(password, salt);
    const userId = 'user_' + Math.random().toString(36).substr(2, 9);
    const userReferral = 'BET-' + username.substring(0, 4).toUpperCase() + Math.floor(100 + Math.random() * 900);

    // Standard starting balance of ৳500 for high engagement
    const startBalance = referredBy ? 700 : 500; 

    const finalPhone = phone || '017' + Math.floor(10000000 + Math.random() * 90000000);

    const newUser: DatabaseSchema['users'][0] = {
      id: userId,
      username,
      email,
      phone: finalPhone,
      role: 'user',
      balance: startBalance,
      referralCode: userReferral,
      referredBy,
      vipLevel: 0,
      vipPoints: 0,
      isBlocked: false,
      fullName: username,
      createdAt: new Date().toISOString(),
      passwordHash,
      salt
    };

    db.users.push(newUser);

    // Initial sign-up notification
    db.notifications.push({
      id: 'notif_' + Math.random().toString(36).substr(2, 9),
      userId: userId,
      title: '🎁 Welcome to BETEPRO!',
      message: `Thanks for joining us, ${username}! We have credited a promotional ৳${startBalance} to your wallet. Dive into live sports betting and casino games!`,
      read: false,
      createdAt: new Date().toISOString()
    });

    // Notify referrer if applicable
    if (referredBy) {
      const referrer = db.users.find(u => u.id === referredBy);
      if (referrer) {
        referrer.balance += 200; // Credited ৳200 bonus
        db.transactions.push({
          id: 'tx_' + Math.random().toString(36).substr(2, 9),
          userId: referrer.id,
          username: referrer.username,
          type: 'referral_bonus',
          amount: 200,
          status: 'success',
          description: `Referral bonus for inviting ${username}`,
          createdAt: new Date().toISOString()
        });
        db.notifications.push({
          id: 'notif_' + Math.random().toString(36).substr(2, 9),
          userId: referrer.id,
          title: '👥 Referral Bonus Credited!',
          message: `Your friend ${username} registered using your link. ৳200 referral bonus was added to your wallet!`,
          read: false,
          createdAt: new Date().toISOString()
        });
      }
    }

    writeDb(db);

    const token = signJwt({ id: userId, role: 'user' });

    res.status(201).json({
      token,
      user: {
        id: userId,
        username,
        email,
        phone,
        role: 'user',
        balance: startBalance,
        referralCode: userReferral,
        vipLevel: 0,
        vipPoints: 0,
        fullName: username,
        createdAt: newUser.createdAt
      }
    });
  });

  // User login
  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: 'Please enter all fields.' });
      return;
    }

    const db = readDb();
    const user = db.users.find(u => u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === username.toLowerCase());

    if (!user) {
      res.status(400).json({ error: 'Invalid username/email or password.' });
      return;
    }

    if (user.isBlocked) {
      res.status(403).json({ error: 'This account has been suspended. Please contact customer support.' });
      return;
    }

    const hash = hashPassword(password, user.salt);
    if (hash !== user.passwordHash) {
      res.status(400).json({ error: 'Invalid username/email or password.' });
      return;
    }

    const token = signJwt({ id: user.id, role: user.role });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role,
        balance: user.balance,
        referralCode: user.referralCode,
        referredBy: user.referredBy,
        vipLevel: user.vipLevel,
        vipPoints: user.vipPoints,
        avatarUrl: user.avatarUrl,
        fullName: user.fullName,
        createdAt: user.createdAt
      }
    });
  });

  // Firebase Authentication Sync (Log in or sign up with Firebase)
  app.post('/api/auth/firebase-sync', (req, res) => {
    const { email, uid, username, referralCode } = req.body;

    if (!email || !uid) {
      res.status(400).json({ error: 'Missing email or UID for Firebase Sync.' });
      return;
    }

    const db = readDb();
    
    // Check if user already exists in local DB
    let user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase() || u.id === uid);

    if (user) {
      // User exists. Link ID if they logged in with the same email but have different id
      if (user.id !== uid) {
        const oldId = user.id;
        user.id = uid;
        
        // Migrate other occurrences in DB
        db.predictions.forEach(p => { if (p.userId === oldId) p.userId = uid; });
        db.transactions.forEach(t => { if (t.userId === oldId) t.userId = uid; });
        db.notifications.forEach(n => { if (n.userId === oldId) n.userId = uid; });
        db.supportTickets.forEach(s => { if (s.userId === oldId) s.userId = uid; });
      }
      
      const isAdminEmail = email.toLowerCase() === 'admin@betepro.com' || email.toLowerCase() === 'aburayhan10x@gmail.com';
      if (isAdminEmail && user.role !== 'primary_admin') {
        user.role = 'primary_admin';
      }
      writeDb(db);
    } else {
      // User does not exist, let's create a new profile in local database
      const finalUsername = username || email.split('@')[0] || 'player_' + Math.random().toString(36).substr(2, 5);
      
      // Referral check
      let referredBy: string | undefined = undefined;
      if (referralCode) {
        const referrer = db.users.find(u => u.referralCode.toLowerCase() === referralCode.toLowerCase());
        if (referrer) {
          referredBy = referrer.id;
        }
      }

      const startBalance = referredBy ? 700 : 500;
      const userReferral = 'BET-' + finalUsername.substring(0, 4).toUpperCase() + Math.floor(100 + Math.random() * 900);
      
      // Determine role
      const role = (email.toLowerCase() === 'admin@betepro.com' || email.toLowerCase() === 'aburayhan10x@gmail.com') ? 'primary_admin' : 'user';

      const newUser: DatabaseSchema['users'][0] = {
        id: uid, // Use Firebase UID as the user ID
        username: finalUsername,
        email: email.toLowerCase(),
        phone: '017' + Math.floor(10000000 + Math.random() * 90000000), 
        role,
        balance: startBalance,
        referralCode: userReferral,
        referredBy,
        vipLevel: role === 'primary_admin' ? 4 : 0,
        vipPoints: role === 'primary_admin' ? 60000 : 0,
        isBlocked: false,
        fullName: finalUsername,
        createdAt: new Date().toISOString(),
        passwordHash: '', 
        salt: ''
      };

      db.users.push(newUser);

      // Create initial notification
      db.notifications.push({
        id: 'notif_' + Math.random().toString(36).substr(2, 9),
        userId: uid,
        title: '🎁 Welcome to BETEPRO via Firebase!',
        message: `Thanks for joining us, ${finalUsername}! We have credited a promotional ৳${startBalance} to your wallet. Dive into live sports betting and casino games!`,
        read: false,
        createdAt: new Date().toISOString()
      });

      // Handle referral bonus
      if (referredBy) {
        const referrer = db.users.find(u => u.id === referredBy);
        if (referrer) {
          referrer.balance += 200;
          db.transactions.push({
            id: 'tx_' + Math.random().toString(36).substr(2, 9),
            userId: referrer.id,
            username: referrer.username,
            type: 'referral_bonus',
            amount: 200,
            status: 'success',
            description: `Referral bonus for inviting ${finalUsername}`,
            createdAt: new Date().toISOString()
          });
          db.notifications.push({
            id: 'notif_' + Math.random().toString(36).substr(2, 9),
            userId: referrer.id,
            title: '👥 Referral Bonus Credited!',
            message: `Your friend ${finalUsername} registered using your link. ৳200 referral bonus was added to your wallet!`,
            read: false,
            createdAt: new Date().toISOString()
          });
        }
      }

      writeDb(db);
      user = newUser;
    }

    if (user.isBlocked) {
      res.status(403).json({ error: 'This account has been suspended. Please contact customer support.' });
      return;
    }

    // Sign local JWT token using their ID & role
    const token = signJwt({ id: user.id, role: user.role });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role,
        balance: user.balance,
        referralCode: user.referralCode,
        referredBy: user.referredBy,
        vipLevel: user.vipLevel,
        vipPoints: user.vipPoints,
        avatarUrl: user.avatarUrl,
        fullName: user.fullName,
        createdAt: user.createdAt
      }
    });
  });

  // Get current user profile
  app.get('/api/auth/me', authenticateToken, (req: AuthenticatedRequest, res) => {
    const db = readDb();
    const notifications = db.notifications.filter(n => n.userId === req.user!.id);
    res.json({ 
      user: req.user,
      notifications
    });
  });

  // Support GET /api/auth/profile used by the frontend
  app.get('/api/auth/profile', authenticateToken, (req: AuthenticatedRequest, res) => {
    const db = readDb();
    const notifications = db.notifications.filter(n => n.userId === req.user!.id);
    res.json({ 
      user: req.user,
      notifications
    });
  });

  // Daily Sign-in reward API route
  app.post('/api/auth/daily-signin', authenticateToken, (req: AuthenticatedRequest, res) => {
    const db = readDb();
    const userIndex = db.users.findIndex(u => u.id === req.user!.id);
    if (userIndex === -1) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const todayStr = new Date().toDateString();
    // Initialize or check daily sign-in history. Let's make it robust!
    const user = db.users[userIndex];
    
    // Grant reward: ৳10
    const rewardAmount = 10.0;
    user.balance += rewardAmount;

    // Create a transaction log
    const txId = 'TXN_DS_' + Math.random().toString(36).substr(2, 9).toUpperCase();
    const newTx = {
      id: txId,
      userId: user.id,
      username: user.username,
      type: 'deposit' as const,
      paymentMethod: 'system' as any,
      amount: rewardAmount,
      accountNumber: 'Daily Check-In',
      status: 'success' as const,
      transactionId: txId,
      description: 'Daily sign-in reward bonus',
      createdAt: new Date().toISOString()
    };
    db.transactions.unshift(newTx);

    // Create a system notification
    const newNotif = {
      id: 'notif_' + Date.now(),
      userId: user.id,
      title: 'Daily Check-in Success!',
      message: `You successfully signed in today and received a bonus of ৳${rewardAmount.toFixed(2)}!`,
      read: false,
      createdAt: new Date().toISOString()
    };
    db.notifications.unshift(newNotif);

    writeDb(db);

    res.json({
      message: `Daily check-in successful! ৳${rewardAmount.toFixed(2)} added to your wallet.`,
      balance: user.balance,
      transaction: newTx
    });
  });

  // Edit profile (Full Name, Phone, Avatar)
  app.put('/api/auth/profile', authenticateToken, (req: AuthenticatedRequest, res) => {
    const { fullName, phone, avatarUrl } = req.body;
    const db = readDb();
    const userIndex = db.users.findIndex(u => u.id === req.user!.id);

    if (userIndex === -1) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    // Check phone uniqueness if modified
    if (phone && phone !== db.users[userIndex].phone) {
      const phoneExists = db.users.find(u => u.phone === phone && u.id !== req.user!.id);
      if (phoneExists) {
        res.status(400).json({ error: 'Phone number already in use by another account.' });
        return;
      }
      db.users[userIndex].phone = phone;
    }

    if (fullName) db.users[userIndex].fullName = fullName;
    if (avatarUrl) db.users[userIndex].avatarUrl = avatarUrl;

    writeDb(db);
    res.json({ message: 'Profile updated successfully', user: db.users[userIndex] });
  });

  // Change password
  app.put('/api/auth/change-password', authenticateToken, (req: AuthenticatedRequest, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Please enter both current and new password.' });
      return;
    }

    const db = readDb();
    const user = db.users.find(u => u.id === req.user!.id);

    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const hash = hashPassword(currentPassword, user.salt);
    if (hash !== user.passwordHash) {
      res.status(400).json({ error: 'Current password is incorrect.' });
      return;
    }

    const newSalt = generateSalt();
    user.salt = newSalt;
    user.passwordHash = hashPassword(newPassword, newSalt);

    writeDb(db);
    res.json({ message: 'Password changed successfully.' });
  });

  // ==========================================
  // USER WALLET ENDPOINTS
  // ==========================================

  // Wallet deposit request
  app.post('/api/wallet/deposit', authenticateToken, (req: AuthenticatedRequest, res) => {
    const { paymentMethod, amount, transactionId, promoCode } = req.body;

    if (!paymentMethod || !amount || !transactionId) {
      res.status(400).json({ error: 'Missing required deposit fields.' });
      return;
    }

    const db = readDb();
    const depAmount = parseFloat(amount);

    if (isNaN(depAmount) || depAmount < db.settings.minDeposit) {
      res.status(400).json({ error: `Minimum deposit amount is ৳${db.settings.minDeposit}` });
      return;
    }

    // Verify promo code if used
    let promoDetails = '';
    if (promoCode) {
      const promo = db.promotions.find(p => p.code.toLowerCase() === promoCode.toLowerCase() && p.active);
      if (promo) {
        if (depAmount >= promo.minDeposit) {
          promoDetails = ` [Promo: ${promo.code} (+${promo.bonusPercentage}%)]`;
        } else {
          res.status(400).json({ error: `Promo code ${promo.code} requires a minimum deposit of ৳${promo.minDeposit}` });
          return;
        }
      }
    }

    const txId = 'tx_' + Math.random().toString(36).substr(2, 9);
    const newTx: Transaction = {
      id: txId,
      userId: req.user!.id,
      username: req.user!.username,
      type: 'deposit',
      amount: depAmount,
      status: 'pending',
      paymentMethod,
      transactionId,
      description: `Pending ${paymentMethod} Deposit request.${promoDetails}`,
      createdAt: new Date().toISOString()
    };

    db.transactions.push(newTx);
    writeDb(db);

    res.status(201).json({ 
      message: 'Your deposit request was submitted. Administrators will verify the TrxID shortly.',
      transaction: newTx 
    });
  });

  // Wallet withdraw request
  app.post('/api/wallet/withdraw', authenticateToken, (req: AuthenticatedRequest, res) => {
    const { paymentMethod, amount, recipientNumber } = req.body;

    if (!paymentMethod || !amount || !recipientNumber) {
      res.status(400).json({ error: 'Please enter payment channel, amount, and recipient phone number.' });
      return;
    }

    const db = readDb();
    const withdrawAmount = parseFloat(amount);

    if (isNaN(withdrawAmount) || withdrawAmount < db.settings.minWithdraw) {
      res.status(400).json({ error: `Minimum withdrawal amount is ৳${db.settings.minWithdraw}` });
      return;
    }

    // Find user in DB to deduct balance
    const userIndex = db.users.findIndex(u => u.id === req.user!.id);
    const user = db.users[userIndex];

    if (user.balance < withdrawAmount) {
      res.status(400).json({ error: 'Insufficient wallet balance.' });
      return;
    }

    // Deduct immediately to prevent double spending
    user.balance -= withdrawAmount;

    const txId = 'tx_' + Math.random().toString(36).substr(2, 9);
    const newTx: Transaction = {
      id: txId,
      userId: user.id,
      username: user.username,
      type: 'withdraw',
      amount: withdrawAmount,
      status: 'pending',
      paymentMethod,
      transactionId: `WD-${recipientNumber.substring(phoneLength(recipientNumber) - 4)}`,
      description: `Withdrawal request to ${paymentMethod} (${recipientNumber})`,
      createdAt: new Date().toISOString()
    };

    db.transactions.push(newTx);
    writeDb(db);

    res.json({ 
      message: `Withdrawal request of ৳${withdrawAmount} submitted! Funds are locked pending processing.`,
      transaction: newTx,
      newBalance: user.balance
    });
  });

  function phoneLength(phone: string): number {
    return phone ? phone.length : 4;
  }

  // Get current user transaction history
  app.get('/api/wallet/transactions', authenticateToken, (req: AuthenticatedRequest, res) => {
    const db = readDb();
    const userTxs = db.transactions
      .filter(tx => tx.userId === req.user!.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(userTxs);
  });

  // ==========================================
  // SPORTS & PREDICTION ENDPOINTS
  // ==========================================

  // Get matches
  app.get('/api/sports/matches', (req, res) => {
    const db = readDb();
    const { status, sport, search } = req.query;
    let filtered = db.matches;

    if (status) {
      filtered = filtered.filter(m => m.status === status);
    }
    if (sport) {
      filtered = filtered.filter(m => m.sport === sport);
    }
    if (search) {
      const q = (search as string).toLowerCase();
      filtered = filtered.filter(m => 
        m.league.toLowerCase().includes(q) || 
        m.homeTeam.name.toLowerCase().includes(q) || 
        m.awayTeam.name.toLowerCase().includes(q)
      );
    }

    res.json(filtered);
  });

  // Place predictive bet
  app.post('/api/sports/predict', authenticateToken, (req: AuthenticatedRequest, res) => {
    const { matchId, selection, betAmount } = req.body;

    if (!matchId || !selection || !betAmount) {
      res.status(400).json({ error: 'Missing match selection or bet amount.' });
      return;
    }

    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount < 50) {
      res.status(400).json({ error: 'Minimum bet prediction is ৳50' });
      return;
    }

    const db = readDb();
    const match = db.matches.find(m => m.id === matchId);
    if (!match) {
      res.status(404).json({ error: 'Match not found.' });
      return;
    }

    if (match.status === 'completed') {
      res.status(400).json({ error: 'Match has already finished. Predictions are closed.' });
      return;
    }

    const userIndex = db.users.findIndex(u => u.id === req.user!.id);
    const user = db.users[userIndex];

    if (user.balance < amount) {
      res.status(400).json({ error: 'Insufficient balance to place prediction.' });
      return;
    }

    // Determine odds
    let odds = 1.0;
    if (selection === 'home') odds = match.odds.homeWin;
    else if (selection === 'draw') odds = match.odds.draw;
    else if (selection === 'away') odds = match.odds.awayWin;
    else {
      res.status(400).json({ error: 'Invalid selection option. Must be home, draw, or away.' });
      return;
    }

    if (odds <= 0) {
      res.status(400).json({ error: 'This option is not open for prediction.' });
      return;
    }

    const potentialPayout = +(amount * odds).toFixed(2);

    // Deduct user balance and credit VIP points
    user.balance -= amount;
    const gainedPoints = Math.floor(amount / 100);
    user.vipPoints += gainedPoints;

    // Recalculate VIP Level
    let newLevel = 0;
    for (const v of VIP_LEVELS) {
      if (user.vipPoints >= v.pointsRequired) {
        newLevel = v.level;
      }
    }
    if (newLevel > user.vipLevel) {
      user.vipLevel = newLevel;
      db.notifications.push({
        id: 'notif_' + Math.random().toString(36).substr(2, 9),
        userId: user.id,
        title: '⭐ VIP Rank Promotion!',
        message: `Congratulations! You leveled up to ${VIP_LEVELS[newLevel].name}. Daily withdrawal limit increased to ৳${VIP_LEVELS[newLevel].dailyWithdrawLimit}!`,
        read: false,
        createdAt: new Date().toISOString()
      });
    }

    // Record Prediction
    const predictionId = 'pred_' + Math.random().toString(36).substr(2, 9);
    const newPrediction: Prediction = {
      id: predictionId,
      userId: user.id,
      username: user.username,
      matchId: match.id,
      matchDetails: {
        homeTeam: match.homeTeam.name,
        awayTeam: match.awayTeam.name,
        sport: match.sport,
        league: match.league
      },
      selection,
      odds,
      betAmount: amount,
      potentialPayout,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    db.predictions.push(newPrediction);

    // Record Transaction
    db.transactions.push({
      id: 'tx_' + Math.random().toString(36).substr(2, 9),
      userId: user.id,
      username: user.username,
      type: 'bet',
      amount,
      status: 'success',
      description: `Placed sports prediction: ${match.homeTeam.name} vs ${match.awayTeam.name} (${selection.toUpperCase()})`,
      createdAt: new Date().toISOString()
    });

    writeDb(db);

    res.status(201).json({
      message: 'Prediction placed successfully!',
      prediction: newPrediction,
      newBalance: user.balance,
      gainedVipPoints: gainedPoints
    });
  });

  // Get user's predictions list
  app.get('/api/sports/my-predictions', authenticateToken, (req: AuthenticatedRequest, res) => {
    const db = readDb();
    const userPreds = db.predictions
      .filter(p => p.userId === req.user!.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(userPreds);
  });

  // ==========================================
  // CASINO & DEMO GAMES ENDPOINTS
  // ==========================================

  // Helper to enforce win cap based on deposit and winning percentage
  function shouldAllowWin(userId: string, betAmount: number, potentialWin: number, db: DatabaseSchema): boolean {
    const settings = db.settings;
    const user = db.users.find(u => u.id === userId);
    if (!user) return false;

    // 1. Check user winning percentage
    const winRate = settings.userWinningPercentage !== undefined ? settings.userWinningPercentage : 70;
    const roll = Math.random() * 100;
    if (roll > winRate) {
      return false; // Force lose
    }

    // 2. Check max win based on total deposits
    const totalDeposits = db.transactions
      .filter(tx => tx.userId === userId && tx.type === 'deposit' && tx.status === 'success')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const maxWinPercent = settings.maxWinPercentageOfDeposit !== undefined ? settings.maxWinPercentageOfDeposit : 200;
    const maxWinCap = totalDeposits * (maxWinPercent / 100);

    // If they have deposited but their next win would put them above the allowed max win cap, reject the win.
    if (totalDeposits > 0 && (user.balance + potentialWin) > maxWinCap) {
      return false; // Force lose
    }

    return true;
  }

  // Crash Game Run
  app.post('/api/games/crash', authenticateToken, (req: AuthenticatedRequest, res) => {
    const { betAmount, targetMultiplier } = req.body;

    if (!betAmount || !targetMultiplier) {
      res.status(400).json({ error: 'Please enter bet amount and cashout multiplier.' });
      return;
    }

    const amount = parseFloat(betAmount);
    const multiplier = parseFloat(targetMultiplier);

    if (isNaN(amount) || amount < 10) {
      res.status(400).json({ error: 'Minimum demo game bet is ৳10' });
      return;
    }

    if (isNaN(multiplier) || multiplier < 1.01 || multiplier > 1000) {
      res.status(400).json({ error: 'Multiplier must be between 1.01x and 1000x' });
      return;
    }

    const db = readDb();
    const userIndex = db.users.findIndex(u => u.id === req.user!.id);
    const user = db.users[userIndex];

    if (user.balance < amount) {
      res.status(400).json({ error: 'Insufficient balance to play.' });
      return;
    }

    // Deduct balance
    user.balance -= amount;

    // Simulate game result
    // 92% chance crash multiplier is random exponential
    // 8% instant crash at 1.00x
    const isInstantCrash = Math.random() < 0.08;
    let actualCrashMultiplier = 1.00;

    if (!isInstantCrash) {
      // Exponential distribution for high multiplier excitement
      const rand = Math.random();
      actualCrashMultiplier = +(1.01 + Math.pow(rand, 3) * 98 + Math.random() * 2).toFixed(2);
    }

    let didWin = actualCrashMultiplier >= multiplier;
    let winAmount = didWin ? +(amount * multiplier).toFixed(2) : 0;

    if (didWin && !shouldAllowWin(user.id, amount, winAmount, db)) {
      didWin = false;
      winAmount = 0;
      actualCrashMultiplier = Math.max(1.00, +(multiplier - 0.1).toFixed(2));
    }

    if (didWin) {
      user.balance += winAmount;
    }

    // Track points
    user.vipPoints += Math.floor(amount / 200);

    // Record Transaction
    db.transactions.push({
      id: 'tx_' + Math.random().toString(36).substr(2, 9),
      userId: user.id,
      username: user.username,
      type: didWin ? 'win' : 'bet',
      amount: didWin ? winAmount - amount : amount,
      status: 'success',
      description: `Crash Game: Placed ৳${amount} at ${multiplier}x. Game crashed at ${actualCrashMultiplier}x. ${didWin ? 'WON!' : 'LOST'}`,
      createdAt: new Date().toISOString()
    });

    // Update leaderboard if huge win
    if (didWin && winAmount > 5000) {
      const idx = db.leaderboard.findIndex(l => l.username === user.username);
      if (idx !== -1) {
        db.leaderboard[idx].totalWinnings += winAmount;
        db.leaderboard[idx].gamesPlayed += 1;
      } else {
        db.leaderboard.push({
          username: user.username,
          vipLevel: user.vipLevel,
          totalWinnings: winAmount,
          gamesPlayed: 1,
          rank: db.leaderboard.length + 1
        });
      }
    }

    writeDb(db);

    res.json({
      won: didWin,
      crashMultiplier: actualCrashMultiplier,
      winAmount,
      newBalance: user.balance
    });
  });

  // Lucky Spin Game
  app.post('/api/games/spin', authenticateToken, (req: AuthenticatedRequest, res) => {
    const { betAmount } = req.body;
    const amount = parseFloat(betAmount);

    if (isNaN(amount) || amount < 10) {
      res.status(400).json({ error: 'Minimum bet is ৳10' });
      return;
    }

    const db = readDb();
    const userIndex = db.users.findIndex(u => u.id === req.user!.id);
    const user = db.users[userIndex];

    if (user.balance < amount) {
      res.status(400).json({ error: 'Insufficient wallet balance.' });
      return;
    }

    user.balance -= amount;

    // Define segments and probabilities
    const SEGMENTS = [
      { mult: 0, label: 'Try Again' },
      { mult: 0.5, label: '0.5x Return' },
      { mult: 1.2, label: '1.2x Double' },
      { mult: 2.0, label: '2.0x Big Win' },
      { mult: 0, label: 'Bad Luck' },
      { mult: 5.0, label: '5.0x Mega Win' },
      { mult: 1.5, label: '1.5x Nice' },
      { mult: 10.0, label: '10.0x JACKPOT!' }
    ];

    let randomIndex = Math.floor(Math.random() * SEGMENTS.length);
    let chosen = SEGMENTS[randomIndex];
    let winAmount = +(amount * chosen.mult).toFixed(2);

    if (winAmount > amount && !shouldAllowWin(user.id, amount, winAmount, db)) {
      randomIndex = Math.random() < 0.5 ? 0 : 3; // Force Try Again or Bad Luck (0x)
      chosen = SEGMENTS[randomIndex];
      winAmount = 0;
    }

    if (winAmount > 0) {
      user.balance += winAmount;
    }

    user.vipPoints += Math.floor(amount / 200);

    db.transactions.push({
      id: 'tx_' + Math.random().toString(36).substr(2, 9),
      userId: user.id,
      username: user.username,
      type: winAmount > amount ? 'win' : 'bet',
      amount: winAmount > amount ? winAmount - amount : amount,
      status: 'success',
      description: `Lucky Spin: Bet ৳${amount}. Landed on "${chosen.label}". Received ৳${winAmount}`,
      createdAt: new Date().toISOString()
    });

    writeDb(db);

    res.json({
      segmentIndex: randomIndex,
      multiplier: chosen.mult,
      label: chosen.label,
      winAmount,
      newBalance: user.balance
    });
  });

  // Dice roll
  app.post('/api/games/dice', authenticateToken, (req: AuthenticatedRequest, res) => {
    const { betAmount, guess, target } = req.body;
    const amount = parseFloat(betAmount);
    const rollTarget = parseInt(target);

    if (isNaN(amount) || amount < 10) {
      res.status(400).json({ error: 'Minimum bet is ৳10' });
      return;
    }

    if (guess !== 'over' && guess !== 'under') {
      res.status(400).json({ error: 'Guess must be "over" or "under".' });
      return;
    }

    if (isNaN(rollTarget) || rollTarget < 10 || rollTarget > 90) {
      res.status(400).json({ error: 'Target must be between 10 and 90.' });
      return;
    }

    const db = readDb();
    const userIndex = db.users.findIndex(u => u.id === req.user!.id);
    const user = db.users[userIndex];

    if (user.balance < amount) {
      res.status(400).json({ error: 'Insufficient balance.' });
      return;
    }

    user.balance -= amount;

    // Roll random 1-100
    let roll = Math.floor(1 + Math.random() * 100);
    let won = guess === 'over' ? roll > rollTarget : roll < rollTarget;

    // Calculate payout odds
    const winningChance = guess === 'over' ? (100 - rollTarget) : rollTarget;
    const odds = +(95 / winningChance).toFixed(2); // 5% house edge built-in
    let winAmount = won ? +(amount * odds).toFixed(2) : 0;

    if (won && !shouldAllowWin(user.id, amount, winAmount, db)) {
      won = false;
      winAmount = 0;
      roll = guess === 'over' ? Math.floor(1 + Math.random() * rollTarget) : Math.min(100, Math.floor(rollTarget + Math.random() * (100 - rollTarget)));
    }

    if (won) {
      user.balance += winAmount;
    }

    db.transactions.push({
      id: 'tx_' + Math.random().toString(36).substr(2, 9),
      userId: user.id,
      username: user.username,
      type: won ? 'win' : 'bet',
      amount: won ? winAmount - amount : amount,
      status: 'success',
      description: `Dice: Rolled ${roll}. Needed ${guess} ${rollTarget}. ${won ? 'Won ৳' + winAmount : 'Lost'}`,
      createdAt: new Date().toISOString()
    });

    writeDb(db);

    res.json({
      roll,
      won,
      winAmount,
      newBalance: user.balance
    });
  });

  // Roulette Wheel Spin
  app.post('/api/games/roulette', authenticateToken, (req: AuthenticatedRequest, res) => {
    const { betAmount, betType } = req.body; // betType: 'red' | 'black' | 'green'
    const amount = parseFloat(betAmount);

    if (isNaN(amount) || amount < 10) {
      res.status(400).json({ error: 'Minimum bet is ৳10' });
      return;
    }

    if (betType !== 'red' && betType !== 'black' && betType !== 'green') {
      res.status(400).json({ error: 'Invalid Roulette color bet.' });
      return;
    }

    const db = readDb();
    const userIndex = db.users.findIndex(u => u.id === req.user!.id);
    const user = db.users[userIndex];

    if (user.balance < amount) {
      res.status(400).json({ error: 'Insufficient balance.' });
      return;
    }

    user.balance -= amount;

    // Sim roulette outcome 0 to 36
    let num = Math.floor(Math.random() * 37);
    let outcomeColor = 'green';
    if (num > 0) {
      outcomeColor = (num % 2 === 0) ? 'black' : 'red';
    }

    let won = betType === outcomeColor;
    let multiplier = 2.0;
    if (betType === 'green') {
      multiplier = 35.0; // Jackpots for single green zero
    }

    let winAmount = won ? +(amount * multiplier).toFixed(2) : 0;

    if (won && !shouldAllowWin(user.id, amount, winAmount, db)) {
      won = false;
      winAmount = 0;
      if (betType === 'red') {
        num = 2; // Black
        outcomeColor = 'black';
      } else if (betType === 'black') {
        num = 1; // Red
        outcomeColor = 'red';
      } else {
        num = 1; // Red
        outcomeColor = 'red';
      }
    }

    if (won) {
      user.balance += winAmount;
    }

    db.transactions.push({
      id: 'tx_' + Math.random().toString(36).substr(2, 9),
      userId: user.id,
      username: user.username,
      type: won ? 'win' : 'bet',
      amount: won ? winAmount - amount : amount,
      status: 'success',
      description: `Roulette: Bet on ${betType.toUpperCase()}. Spin result was ${num} (${outcomeColor.toUpperCase()}). ${won ? 'Won ৳' + winAmount : 'Lost'}`,
      createdAt: new Date().toISOString()
    });

    writeDb(db);

    res.json({
      number: num,
      color: outcomeColor,
      won,
      winAmount,
      newBalance: user.balance
    });
  });

  // Slots Demo Game
  app.post('/api/games/slots', authenticateToken, (req: AuthenticatedRequest, res) => {
    const { betAmount } = req.body;
    const amount = parseFloat(betAmount);

    if (isNaN(amount) || amount < 10) {
      res.status(400).json({ error: 'Minimum slot bet is ৳10' });
      return;
    }

    const db = readDb();
    const userIndex = db.users.findIndex(u => u.id === req.user!.id);
    const user = db.users[userIndex];

    if (user.balance < amount) {
      res.status(400).json({ error: 'Insufficient balance.' });
      return;
    }

    user.balance -= amount;

    const ICONS = ['🍋', '🍒', '🍉', '🔔', '⭐', '💎'];
    let r1 = ICONS[Math.floor(Math.random() * ICONS.length)];
    let r2 = ICONS[Math.floor(Math.random() * ICONS.length)];
    let r3 = ICONS[Math.floor(Math.random() * ICONS.length)];

    let won = false;
    let multiplier = 0;
    let description = 'Lost';

    if (r1 === r2 && r2 === r3) {
      won = true;
      if (r1 === '💎') { multiplier = 50.0; description = 'JACKPOT 💎💎💎!'; }
      else if (r1 === '⭐') { multiplier = 20.0; description = 'Star Triple ⭐⭐⭐!'; }
      else if (r1 === '🔔') { multiplier = 10.0; description = 'Bells Ring 🔔🔔🔔!'; }
      else { multiplier = 5.0; description = 'Fruit Triple!'; }
    } else if (r1 === r2 || r2 === r3 || r1 === r3) {
      won = true;
      multiplier = 1.5;
      description = 'Fruit Pair Match!';
    }

    let winAmount = won ? +(amount * multiplier).toFixed(2) : 0;

    if (won && !shouldAllowWin(user.id, amount, winAmount, db)) {
      won = false;
      multiplier = 0;
      winAmount = 0;
      description = 'Lost';
      r1 = '🍋';
      r2 = '🍒';
      r3 = '🍉';
    }

    if (won) {
      user.balance += winAmount;
    }

    db.transactions.push({
      id: 'tx_' + Math.random().toString(36).substr(2, 9),
      userId: user.id,
      username: user.username,
      type: won ? 'win' : 'bet',
      amount: won ? winAmount - amount : amount,
      status: 'success',
      description: `Slots: [${r1} | ${r2} | ${r3}] - ${description} Payout ৳${winAmount}`,
      createdAt: new Date().toISOString()
    });

    writeDb(db);

    res.json({
      reels: [r1, r2, r3],
      won,
      multiplier,
      winAmount,
      newBalance: user.balance,
      msg: description
    });
  });

  // Jili Fishing: Shoot cannon bullet and check fish capture
  app.post('/api/games/fishing/shoot', authenticateToken, (req: AuthenticatedRequest, res) => {
    const { betAmount, fishType } = req.body;
    const amount = parseFloat(betAmount);

    if (isNaN(amount) || amount < 1 || amount > 100) {
      res.status(400).json({ error: 'Bet amount per bullet must be between ৳1 and ৳100 BDT.' });
      return;
    }

    const db = readDb();
    const userIndex = db.users.findIndex(u => u.id === req.user!.id);
    const user = db.users[userIndex];

    if (user.balance < amount) {
      res.status(400).json({ error: 'Insufficient balance.' });
      return;
    }

    // Deduct bullet cost
    user.balance -= amount;

    // Determine multipliers and odds per fishType
    let catchChance = 0.60;
    let baseMult = 2;
    let description = 'Nemo Fish';

    if (fishType === 'jellyfish') {
      catchChance = 0.12;
      baseMult = 6;
      description = 'Stinger Jellyfish';
    } else if (fishType === 'turtle') {
      catchChance = 0.06;
      baseMult = 12;
      description = 'Emerald Sea Turtle';
    } else if (fishType === 'shark') {
      catchChance = 0.03;
      baseMult = 25;
      description = 'Apex Great White Shark';
    } else if (fishType === 'dragon') {
      catchChance = 0.012;
      baseMult = 80;
      description = 'Ocean King Golden Dragon';
    }

    let caught = Math.random() < catchChance;
    let multiplier = caught ? baseMult : 0;
    let winAmount = caught ? +(amount * multiplier).toFixed(2) : 0;

    if (caught && !shouldAllowWin(user.id, amount, winAmount, db)) {
      caught = false;
      multiplier = 0;
      winAmount = 0;
    }

    if (caught) {
      user.balance += winAmount;
    }

    // Add transaction for wins to keep tracking clear
    if (caught) {
      db.transactions.push({
        id: 'tx_' + Math.random().toString(36).substr(2, 9),
        userId: user.id,
        username: user.username,
        type: 'win',
        amount: winAmount - amount,
        status: 'success',
        description: `Jili Fishing: Captured ${description}! Multiplier: ${multiplier}x. Payout: ৳${winAmount}`,
        createdAt: new Date().toISOString()
      });
    }

    writeDb(db);

    res.json({
      caught,
      multiplier,
      winAmount,
      newBalance: user.balance
    });
  });

  // ==========================================
  // NEW CASINO GAMES: MINES, BLACKJACK, PLINKO
  // ==========================================

  // Mines helper to calculate fair multiplier
  const getMinesMultiplier = (minesCount: number, revealedCount: number): number => {
    if (revealedCount === 0) return 1.0;
    let probability = 1.0;
    for (let i = 0; i < revealedCount; i++) {
      probability *= (25 - minesCount - i) / (25 - i);
    }
    // 4% house edge
    const mult = 0.96 / probability;
    return parseFloat(Math.max(1.01, mult).toFixed(2));
  };

  // Start Mines Game
  app.post('/api/games/mines/start', authenticateToken, (req: AuthenticatedRequest, res) => {
    const { betAmount, minesCount } = req.body;
    const amount = parseFloat(betAmount);
    const count = parseInt(minesCount);

    if (isNaN(amount) || amount < 10) {
      res.status(400).json({ error: 'Minimum bet is ৳10' });
      return;
    }
    if (isNaN(count) || count < 1 || count > 24) {
      res.status(400).json({ error: 'Mines count must be between 1 and 24' });
      return;
    }

    const db = readDb();
    const userIndex = db.users.findIndex(u => u.id === req.user!.id);
    const user = db.users[userIndex];

    if (user.balance < amount) {
      res.status(400).json({ error: 'Insufficient wallet balance.' });
      return;
    }

    // Deduct bet amount immediately
    user.balance -= amount;

    // Generate grid with randomly placed mines
    const grid = Array(25).fill(false);
    let minesPlaced = 0;
    while (minesPlaced < count) {
      const randIdx = Math.floor(Math.random() * 25);
      if (!grid[randIdx]) {
        grid[randIdx] = true;
        minesPlaced++;
      }
    }

    // Store state in-memory
    activeMinesGames.set(user.id, {
      betAmount: amount,
      minesCount: count,
      grid,
      revealed: []
    });

    writeDb(db);

    res.json({
      status: 'playing',
      revealed: [],
      multiplier: 1.0,
      newBalance: user.balance
    });
  });

  // Reveal Mines cell
  app.post('/api/games/mines/reveal', authenticateToken, (req: AuthenticatedRequest, res) => {
    const { index } = req.body;
    const cellIndex = parseInt(index);

    if (isNaN(cellIndex) || cellIndex < 0 || cellIndex > 24) {
      res.status(400).json({ error: 'Invalid cell selection' });
      return;
    }

    const userId = req.user!.id;
    const game = activeMinesGames.get(userId);

    if (!game) {
      res.status(400).json({ error: 'No active Mines game found. Please start a new game.' });
      return;
    }

    if (game.revealed.includes(cellIndex)) {
      res.status(400).json({ error: 'Cell already revealed.' });
      return;
    }

    const db = readDb();
    const userIndex = db.users.findIndex(u => u.id === userId);
    const user = db.users[userIndex];

    let isMine = game.grid[cellIndex];
    const potentialPayout = game.betAmount * getMinesMultiplier(game.minesCount, game.revealed.length + 1);

    if (!isMine && !shouldAllowWin(userId, game.betAmount, potentialPayout, db)) {
      isMine = true;
      game.grid[cellIndex] = true;
    }

    if (isMine) {
      // Boom! Game over, player loses bet (already deducted)
      activeMinesGames.delete(userId);

      // Add points
      user.vipPoints += Math.floor(game.betAmount / 200);

      db.transactions.push({
        id: 'tx_' + Math.random().toString(36).substr(2, 9),
        userId: user.id,
        username: user.username,
        type: 'bet',
        amount: game.betAmount,
        status: 'success',
        description: `Mines: Bet ৳${game.betAmount} with ${game.minesCount} mines. Exploded at cell ${cellIndex}! LOST`,
        createdAt: new Date().toISOString()
      });

      writeDb(db);

      res.json({
        mineHit: true,
        grid: game.grid,
        winAmount: 0,
        newBalance: user.balance
      });
    } else {
      // Safe cell revealed!
      game.revealed.push(cellIndex);
      const mult = getMinesMultiplier(game.minesCount, game.revealed.length);

      res.json({
        mineHit: false,
        revealed: game.revealed,
        multiplier: mult,
        potentialPayout: parseFloat((game.betAmount * mult).toFixed(2))
      });
    }
  });

  // Cashout Mines Game
  app.post('/api/games/mines/cashout', authenticateToken, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const game = activeMinesGames.get(userId);

    if (!game) {
      res.status(400).json({ error: 'No active game to cash out.' });
      return;
    }

    if (game.revealed.length === 0) {
      res.status(400).json({ error: 'Must reveal at least one safe cell before cashout!' });
      return;
    }

    const db = readDb();
    const userIndex = db.users.findIndex(u => u.id === userId);
    const user = db.users[userIndex];

    const mult = getMinesMultiplier(game.minesCount, game.revealed.length);
    const winAmount = parseFloat((game.betAmount * mult).toFixed(2));

    // Credit balance
    user.balance += winAmount;
    user.vipPoints += Math.floor(game.betAmount / 200);

    db.transactions.push({
      id: 'tx_' + Math.random().toString(36).substr(2, 9),
      userId: user.id,
      username: user.username,
      type: 'win',
      amount: winAmount - game.betAmount,
      status: 'success',
      description: `Mines Cashout: Bet ৳${game.betAmount} on ${game.minesCount} mines. Cashed out at ${mult}x. WON ৳${winAmount}`,
      createdAt: new Date().toISOString()
    });

    // Update leaderboard for huge wins
    if (winAmount > 5000) {
      const idx = db.leaderboard.findIndex(l => l.username === user.username);
      if (idx !== -1) {
        db.leaderboard[idx].totalWinnings += winAmount;
        db.leaderboard[idx].gamesPlayed += 1;
      }
    }

    activeMinesGames.delete(userId);
    writeDb(db);

    res.json({
      won: true,
      multiplier: mult,
      winAmount,
      newBalance: user.balance,
      grid: game.grid
    });
  });

  // Blackjack score logic helper
  const calculateBlackjackScore = (cards: BlackjackCard[]): number => {
    let score = 0;
    let aces = 0;
    for (const card of cards) {
      if (card.value === 'A') {
        aces++;
        score += 11;
      } else {
        score += card.score;
      }
    }
    while (score > 21 && aces > 0) {
      score -= 10;
      aces--;
    }
    return score;
  };

  // Start Blackjack Game
  app.post('/api/games/blackjack/deal', authenticateToken, (req: AuthenticatedRequest, res) => {
    const { betAmount } = req.body;
    const amount = parseFloat(betAmount);

    if (isNaN(amount) || amount < 10) {
      res.status(400).json({ error: 'Minimum bet is ৳10' });
      return;
    }

    const db = readDb();
    const userIndex = db.users.findIndex(u => u.id === req.user!.id);
    const user = db.users[userIndex];

    if (user.balance < amount) {
      res.status(400).json({ error: 'Insufficient wallet balance.' });
      return;
    }

    // Clear previous unfinished game if exists
    activeBlackjackGames.delete(user.id);

    // Deduct bet amount
    user.balance -= amount;

    // Generate deck
    const SUITS = ['♥️', '♦️', '♣️', '♠️'];
    const VALUES = [
      { value: '2', score: 2 },
      { value: '3', score: 3 },
      { value: '4', score: 4 },
      { value: '5', score: 5 },
      { value: '6', score: 6 },
      { value: '7', score: 7 },
      { value: '8', score: 8 },
      { value: '9', score: 9 },
      { value: '10', score: 10 },
      { value: 'J', score: 10 },
      { value: 'Q', score: 10 },
      { value: 'K', score: 10 },
      { value: 'A', score: 11 },
    ];

    const deck: BlackjackCard[] = [];
    for (const suit of SUITS) {
      for (const val of VALUES) {
        deck.push({ suit, value: val.value, score: val.score });
      }
    }

    // Shuffle deck
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = deck[i];
      deck[i] = deck[j];
      deck[j] = temp;
    }

    // Deal cards
    const playerCards = [deck.pop()!, deck.pop()!];
    const dealerCards = [deck.pop()!, deck.pop()!];

    let playerScore = calculateBlackjackScore(playerCards);
    let dealerScore = calculateBlackjackScore(dealerCards);

    // Check blackjack on deal
    if (playerScore === 21) {
      if (!shouldAllowWin(user.id, amount, amount * 2.5, db)) {
        playerCards[0] = { suit: '♦️', value: '5', score: 5 };
        playerScore = calculateBlackjackScore(playerCards);
      }
    }

    if (playerScore === 21) {
      let winAmount = amount;
      let msg = 'Push! Both have Blackjack!';
      let outcome: 'push' | 'blackjack' = 'push';

      if (dealerScore === 21) {
        user.balance += amount; // get bet back
      } else {
        winAmount = parseFloat((amount * 2.5).toFixed(2)); // 3:2 payout on blackjack return
        user.balance += winAmount;
        msg = 'BLACKJACK! Double natural victory!';
        outcome = 'blackjack';
      }

      user.vipPoints += Math.floor(amount / 200);

      db.transactions.push({
        id: 'tx_' + Math.random().toString(36).substr(2, 9),
        userId: user.id,
        username: user.username,
        type: outcome === 'blackjack' ? 'win' : 'bet',
        amount: outcome === 'blackjack' ? winAmount - amount : 0,
        status: 'success',
        description: `Blackjack: Natural 21 hand! ${msg}`,
        createdAt: new Date().toISOString()
      });

      writeDb(db);

      res.json({
        status: outcome,
        playerCards,
        dealerCards,
        playerScore,
        dealerScore,
        winAmount,
        newBalance: user.balance,
        msg
      });
    } else {
      // Normal playing state
      activeBlackjackGames.set(user.id, {
        betAmount: amount,
        playerCards,
        dealerCards,
        deck
      });

      writeDb(db);

      res.json({
        status: 'playing',
        playerCards,
        dealerCards: [dealerCards[0], { suit: '❔', value: '?', score: 0 }],
        playerScore,
        dealerScoreShown: calculateBlackjackScore([dealerCards[0]]),
        newBalance: user.balance
      });
    }
  });

  // Blackjack Hit
  app.post('/api/games/blackjack/hit', authenticateToken, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const game = activeBlackjackGames.get(userId);

    if (!game) {
      res.status(400).json({ error: 'No active Blackjack game found.' });
      return;
    }

    const nextCard = game.deck.pop();
    if (!nextCard) {
      res.status(400).json({ error: 'Deck empty! Please re-deal.' });
      return;
    }

    game.playerCards.push(nextCard);
    const playerScore = calculateBlackjackScore(game.playerCards);

    const db = readDb();
    const userIndex = db.users.findIndex(u => u.id === userId);
    const user = db.users[userIndex];

    if (playerScore > 21) {
      // Busted! Lost bet
      activeBlackjackGames.delete(userId);
      user.vipPoints += Math.floor(game.betAmount / 200);

      db.transactions.push({
        id: 'tx_' + Math.random().toString(36).substr(2, 9),
        userId: user.id,
        username: user.username,
        type: 'bet',
        amount: game.betAmount,
        status: 'success',
        description: `Blackjack: Player hit card ${nextCard.value}${nextCard.suit} and busted with ${playerScore} score.`,
        createdAt: new Date().toISOString()
      });

      writeDb(db);

      res.json({
        status: 'busted',
        playerCards: game.playerCards,
        dealerCards: game.dealerCards,
        playerScore,
        dealerScore: calculateBlackjackScore(game.dealerCards),
        winAmount: 0,
        newBalance: user.balance,
        msg: 'Busted! Score exceeded 21.'
      });
    } else {
      // Still playing
      res.json({
        status: 'playing',
        playerCards: game.playerCards,
        dealerCards: [game.dealerCards[0], { suit: '❔', value: '?', score: 0 }],
        playerScore,
        dealerScoreShown: calculateBlackjackScore([game.dealerCards[0]])
      });
    }
  });

  // Blackjack Stand
  app.post('/api/games/blackjack/stand', authenticateToken, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const game = activeBlackjackGames.get(userId);

    if (!game) {
      res.status(400).json({ error: 'No active Blackjack game to stand on.' });
      return;
    }

    const db = readDb();
    const userIndex = db.users.findIndex(u => u.id === userId);
    const user = db.users[userIndex];

    let dealerCards = [...game.dealerCards];
    let dealerScore = calculateBlackjackScore(dealerCards);

    // Dealer hits until 17 or higher
    while (dealerScore < 17) {
      const card = game.deck.pop();
      if (!card) break;
      dealerCards.push(card);
      dealerScore = calculateBlackjackScore(dealerCards);
    }

    const playerScore = calculateBlackjackScore(game.playerCards);
    let winAmount = 0;
    let status: 'player_won' | 'dealer_won' | 'push' = 'dealer_won';
    let msg = 'Dealer wins!';

    if (dealerScore > 21) {
      status = 'player_won';
      winAmount = game.betAmount * 2;
      msg = 'Dealer Busted! You win!';
    } else if (playerScore > dealerScore) {
      status = 'player_won';
      winAmount = game.betAmount * 2;
      msg = 'You win! Beat dealer hand!';
    } else if (playerScore < dealerScore) {
      status = 'dealer_won';
      winAmount = 0;
      msg = 'Dealer has a stronger hand. Better luck next time!';
    } else {
      status = 'push';
      winAmount = game.betAmount; // Return original bet
      msg = 'Tied hand! Push bet returned.';
    }

    if ((status === 'player_won' || status === 'push') && !shouldAllowWin(userId, game.betAmount, winAmount, db)) {
      status = 'dealer_won';
      winAmount = 0;
      msg = 'Dealer has a stronger hand. Better luck next time!';
      dealerScore = playerScore < 21 ? playerScore + 1 : 21;
      dealerCards.push({ suit: '♠️', value: '10', score: 10 });
    }

    // Add points
    user.vipPoints += Math.floor(game.betAmount / 200);

    if (winAmount > 0) {
      user.balance += winAmount;
    }

    db.transactions.push({
      id: 'tx_' + Math.random().toString(36).substr(2, 9),
      userId: user.id,
      username: user.username,
      type: status === 'player_won' ? 'win' : (status === 'push' ? 'deposit' : 'bet'),
      amount: status === 'player_won' ? winAmount - game.betAmount : (status === 'push' ? 0 : game.betAmount),
      status: 'success',
      description: `Blackjack: Stood with ${playerScore}. Dealer cards totaled ${dealerScore}. Result: ${msg}`,
      createdAt: new Date().toISOString()
    });

    activeBlackjackGames.delete(userId);
    writeDb(db);

    res.json({
      status,
      playerCards: game.playerCards,
      dealerCards,
      playerScore,
      dealerScore,
      winAmount,
      newBalance: user.balance,
      msg
    });
  });

  // Plinko drop
  app.post('/api/games/plinko', authenticateToken, (req: AuthenticatedRequest, res) => {
    const { betAmount, risk } = req.body;
    const amount = parseFloat(betAmount);

    if (isNaN(amount) || amount < 10) {
      res.status(400).json({ error: 'Minimum bet is ৳10' });
      return;
    }

    if (risk !== 'low' && risk !== 'medium' && risk !== 'high') {
      res.status(400).json({ error: 'Invalid Plinko risk level.' });
      return;
    }

    const db = readDb();
    const userIndex = db.users.findIndex(u => u.id === req.user!.id);
    const user = db.users[userIndex];

    if (user.balance < amount) {
      res.status(400).json({ error: 'Insufficient balance.' });
      return;
    }

    // Deduct bet amount
    user.balance -= amount;

    // Plinko low/medium/high multiplier values for 10 rows (11 buckets total)
    const PLINKO_MULTIPLIERS = {
      low: [5.0, 3.0, 1.6, 1.2, 1.0, 0.9, 1.0, 1.2, 1.6, 3.0, 5.0],
      medium: [15.0, 7.0, 2.5, 1.4, 0.9, 0.4, 0.9, 1.4, 2.5, 7.0, 15.0],
      high: [70.0, 20.0, 5.0, 1.8, 0.5, 0.1, 0.5, 1.8, 5.0, 20.0, 70.0]
    };

    const multipliers = PLINKO_MULTIPLIERS[risk];

    // Simulate path: 10 pegs (each is left [0] or right [1])
    const path: number[] = [];
    let rightCount = 0;
    for (let i = 0; i < 10; i++) {
      const step = Math.random() < 0.5 ? 0 : 1;
      path.push(step);
      if (step === 1) rightCount++;
    }

    let mult = multipliers[rightCount];
    let winAmount = parseFloat((amount * mult).toFixed(2));

    if (winAmount > amount && !shouldAllowWin(user.id, amount, winAmount, db)) {
      rightCount = 5; // lowest middle bucket
      mult = multipliers[5];
      winAmount = parseFloat((amount * mult).toFixed(2));
      path.length = 0;
      let rights = 0;
      for (let i = 0; i < 10; i++) {
        if (rights < 5 && (10 - i === 5 - rights || Math.random() < 0.5)) {
          path.push(1);
          rights++;
        } else {
          path.push(0);
        }
      }
    }

    user.balance += winAmount;
    user.vipPoints += Math.floor(amount / 200);

    const won = winAmount > amount;

    db.transactions.push({
      id: 'tx_' + Math.random().toString(36).substr(2, 9),
      userId: user.id,
      username: user.username,
      type: won ? 'win' : 'bet',
      amount: won ? winAmount - amount : amount,
      status: 'success',
      description: `Plinko: Bet ৳${amount} at ${risk.toUpperCase()} risk. Path landed in bucket ${rightCount}. Multiplier: ${mult}x. Payout ৳${winAmount}`,
      createdAt: new Date().toISOString()
    });

    writeDb(db);

    res.json({
      path,
      bucketIndex: rightCount,
      multiplier: mult,
      winAmount,
      newBalance: user.balance
    });
  });

  // Jili Super Ace Slot Cascades Spin
  app.post('/api/games/super_ace/spin', authenticateToken, (req: AuthenticatedRequest, res) => {
    const { betAmount } = req.body;
    const amount = parseFloat(betAmount);

    if (isNaN(amount) || amount < 10) {
      res.status(400).json({ error: 'Minimum bet is ৳10' });
      return;
    }

    const db = readDb();
    const userIndex = db.users.findIndex(u => u.id === req.user!.id);
    const user = db.users[userIndex];

    if (user.balance < amount) {
      res.status(400).json({ error: 'Insufficient wallet balance.' });
      return;
    }

    // Deduct bet amount
    user.balance -= amount;

    // Symbol pool
    const SYMBOLS = ['A', 'K', 'Q', 'J', '10'];
    
    // Helper to generate a random grid (5 columns, 4 rows)
    const generateRandomGrid = (): string[][] => {
      const grid: string[][] = [];
      for (let r = 0; r < 4; r++) {
        const row: string[] = [];
        for (let c = 0; c < 5; c++) {
          const rand = Math.random();
          if (rand < 0.05) {
            row.push('W'); // Wild
          } else if (rand < 0.08) {
            row.push('S'); // Scatter (Slot multiplier trigger / visual placeholder)
          } else if (rand < 0.23) {
            const sym = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
            row.push('G' + sym); // Golden Symbol
          } else {
            const sym = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
            row.push(sym); // Normal Symbol
          }
        }
        grid.push(row);
      }
      return grid;
    };

    // Payout configs
    const PAYOUTS: Record<string, { 3: number; 4: number; 5: number }> = {
      'A': { 3: 0.20, 4: 0.50, 5: 1.50 },
      'K': { 3: 0.15, 4: 0.40, 5: 1.00 },
      'Q': { 3: 0.12, 4: 0.30, 5: 0.80 },
      'J': { 3: 0.10, 4: 0.25, 5: 0.60 },
      '10': { 3: 0.08, 4: 0.20, 5: 0.40 }
    };

    // Evaluates grid for ways wins
    const evaluate = (g: string[][]) => {
      let win = 0;
      const winningCoords: { r: number; c: number }[] = [];
      const waysList: string[] = [];

      // Check each standard symbol
      for (const base of SYMBOLS) {
        // Collect occurrences per column
        const cols: number[][] = [[], [], [], [], []];
        for (let r = 0; r < 4; r++) {
          for (let c = 0; c < 5; c++) {
            const s = g[r][c];
            if (s === base || s === ('G' + base) || s === 'W') {
              cols[c].push(r);
            }
          }
        }

        // Check consecutive matches from col 0
        let matchedColsCount = 0;
        for (let c = 0; c < 5; c++) {
          if (cols[c].length > 0) {
            matchedColsCount++;
          } else {
            break;
          }
        }

        if (matchedColsCount >= 3) {
          // Calculate ways
          let ways = 1;
          for (let c = 0; c < matchedColsCount; c++) {
            ways *= cols[c].length;
          }

          const payoutConfig = PAYOUTS[base];
          const rate = matchedColsCount === 5 ? payoutConfig[5] : (matchedColsCount === 4 ? payoutConfig[4] : payoutConfig[3]);
          const symbolWin = amount * rate * ways;
          win += symbolWin;

          waysList.push(`${ways} ways of ${base} (${matchedColsCount} reels) paying ৳${symbolWin.toFixed(2)}`);

          // Mark coordinates as winning
          for (let c = 0; c < matchedColsCount; c++) {
            for (const r of cols[c]) {
              if (!winningCoords.some(coord => coord.r === r && coord.c === c)) {
                winningCoords.push({ r, c });
              }
            }
          }
        }
      }

      return { win, winningCoords, waysList };
    };

    // Cascade 0 (Initial)
    let initialGrid = generateRandomGrid();
    let res0 = evaluate(initialGrid);

    if (res0.win > 0 && !shouldAllowWin(user.id, amount, res0.win, db)) {
      while (res0.win > 0) {
        initialGrid = generateRandomGrid();
        res0 = evaluate(initialGrid);
      }
    }

    const cascades: { grid: string[][]; win: number; winningCoords: { r: number; c: number }[]; ways: string[]; multiplier: number }[] = [];
    let currentGrid = initialGrid;
    let lastResult = res0;
    const multipliers = [1, 2, 3, 5];
    let totalWin = res0.win * multipliers[0];

    cascades.push({
      grid: JSON.parse(JSON.stringify(initialGrid)),
      win: res0.win,
      winningCoords: res0.winningCoords,
      ways: res0.waysList,
      multiplier: multipliers[0]
    });

    // Run Cascades if initial win exists
    let cascadeIndex = 1;
    while (lastResult.winningCoords.length > 0 && cascadeIndex < 4) {
      // Create next grid: clear winning coords, transform Golden to Wilds, drop down, fill empty
      const nextGrid = JSON.parse(JSON.stringify(currentGrid));
      
      // Transform goldens inside winningCoords to Wilds
      for (const coord of lastResult.winningCoords) {
        const symbol = currentGrid[coord.r][coord.c];
        if (symbol.startsWith('G')) {
          nextGrid[coord.r][coord.c] = 'W'; // Transform to Wild
        } else {
          nextGrid[coord.r][coord.c] = ''; // Clear
        }
      }

      // Drop columns down
      for (let c = 0; c < 5; c++) {
        const colSymbols: string[] = [];
        for (let r = 3; r >= 0; r--) {
          if (nextGrid[r][c] !== '') {
            colSymbols.unshift(nextGrid[r][c]);
          }
        }
        // Fill empty top positions with random symbols
        while (colSymbols.length < 4) {
          const rand = Math.random();
          if (rand < 0.04) {
            colSymbols.unshift('W');
          } else if (rand < 0.06) {
            colSymbols.unshift('S');
          } else if (rand < 0.18) {
            const sym = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
            colSymbols.unshift('G' + sym);
          } else {
            const sym = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
            colSymbols.unshift(sym);
          }
        }
        // Re-assign to grid
        for (let r = 0; r < 4; r++) {
          nextGrid[r][c] = colSymbols[r];
        }
      }

      const mult = multipliers[cascadeIndex];
      const resCascade = evaluate(nextGrid);
      const cascadeWin = resCascade.win * mult;
      totalWin += cascadeWin;

      cascades.push({
        grid: nextGrid,
        win: resCascade.win,
        winningCoords: resCascade.winningCoords,
        ways: resCascade.waysList,
        multiplier: mult
      });

      currentGrid = nextGrid;
      lastResult = resCascade;
      cascadeIndex++;
    }

    // Add winning payout to user balance
    user.balance = parseFloat((user.balance + totalWin).toFixed(2));
    user.vipPoints += Math.floor(amount / 200);

    const won = totalWin > 0;

    db.transactions.push({
      id: 'tx_' + Math.random().toString(36).substr(2, 9),
      userId: user.id,
      username: user.username,
      type: won ? 'win' : 'bet',
      amount: won ? parseFloat((totalWin - amount).toFixed(2)) : amount,
      status: 'success',
      description: `Jili Super Ace: Bet ৳${amount}. Spent cascading spins. Total Win: ৳${totalWin.toFixed(2)}`,
      createdAt: new Date().toISOString()
    });

    writeDb(db);

    res.json({
      cascades,
      totalWin: parseFloat(totalWin.toFixed(2)),
      newBalance: user.balance,
      won
    });
  });

  // ==========================================
  // CUSTOMER SUPPORT ENDPOINTS
  // ==========================================

  // Submit Support Ticket
  app.post('/api/support/ticket', authenticateToken, (req: AuthenticatedRequest, res) => {
    const { subject, message } = req.body;
    if (!subject || !message) {
      res.status(400).json({ error: 'Please enter a subject and detailed message.' });
      return;
    }

    const db = readDb();
    const newTicket: SupportTicket = {
      id: 'ticket_' + Math.random().toString(36).substr(2, 9),
      userId: req.user!.id,
      username: req.user!.username,
      subject,
      message,
      status: 'open',
      createdAt: new Date().toISOString()
    };

    db.supportTickets.push(newTicket);
    writeDb(db);

    res.status(201).json({ message: 'Ticket created successfully! Support agents will review it soon.', ticket: newTicket });
  });

  // Get current user tickets
  app.get('/api/support/my-tickets', authenticateToken, (req: AuthenticatedRequest, res) => {
    const db = readDb();
    const tickets = db.supportTickets.filter(t => t.userId === req.user!.id);
    res.json(tickets);
  });

  // ==========================================
  // NOTIFICATIONS ENDPOINTS
  // ==========================================

  // Get notifications
  app.get('/api/notifications', authenticateToken, (req: AuthenticatedRequest, res) => {
    const db = readDb();
    const list = db.notifications
      .filter(n => n.userId === req.user!.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(list);
  });

  // Mark all read
  app.post('/api/notifications/read', authenticateToken, (req: AuthenticatedRequest, res) => {
    const db = readDb();
    db.notifications.forEach(n => {
      if (n.userId === req.user!.id) {
        n.read = true;
      }
    });
    writeDb(db);
    res.json({ success: true });
  });

  // Image Upload to Cloudinary Endpoint
  app.post('/api/upload', authenticateToken, async (req: AuthenticatedRequest, res) => {
    const { image } = req.body;
    if (!image) {
      res.status(400).json({ error: 'No image data provided.' });
      return;
    }
    try {
      const imageUrl = await uploadToCloudinary(image);
      res.json({ imageUrl });
    } catch (err: any) {
      console.error('[UPLOAD ERROR]', err);
      res.status(500).json({ error: err.message || 'Failed to upload image to Cloudinary.' });
    }
  });

  // ==========================================
  // ADMIN PANEL ENDPOINTS (ADMINS ONLY)
  // ==========================================

  // Manage Users - View All
  app.get('/api/admin/users', authenticateToken, requireAdmin, (req, res) => {
    const db = readDb();
    const clientUsers = db.users.map(u => ({
      id: u.id,
      username: u.username,
      email: u.email,
      phone: u.phone,
      role: u.role,
      balance: u.balance,
      referralCode: u.referralCode,
      referredBy: u.referredBy,
      vipLevel: u.vipLevel,
      vipPoints: u.vipPoints,
      isBlocked: u.isBlocked,
      fullName: u.fullName,
      createdAt: u.createdAt
    }));
    res.json(clientUsers);
  });

  // Manage Users - Adjust Balance
  app.put('/api/admin/users/:id/balance', authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;
    const { amount, action } = req.body; // action: 'add' | 'deduct'

    const db = readDb();
    const userIndex = db.users.findIndex(u => u.id === id);

    if (userIndex === -1) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      res.status(400).json({ error: 'Invalid balance adjustment amount.' });
      return;
    }

    const user = db.users[userIndex];
    if (action === 'add') {
      user.balance += val;
      db.transactions.push({
        id: 'tx_' + Math.random().toString(36).substr(2, 9),
        userId: user.id,
        username: user.username,
        type: 'vip_bonus',
        amount: val,
        status: 'success',
        description: `Admin manual balance adjustment (Credit)`,
        createdAt: new Date().toISOString()
      });
    } else {
      user.balance = Math.max(0, user.balance - val);
      db.transactions.push({
        id: 'tx_' + Math.random().toString(36).substr(2, 9),
        userId: user.id,
        username: user.username,
        type: 'bet',
        amount: val,
        status: 'success',
        description: `Admin manual balance adjustment (Debit)`,
        createdAt: new Date().toISOString()
      });
    }

    db.notifications.push({
      id: 'notif_' + Math.random().toString(36).substr(2, 9),
      userId: user.id,
      title: '💼 Account Balance Updated',
      message: `Your wallet balance was adjusted by our support desk. Current balance: ৳${user.balance}.`,
      read: false,
      createdAt: new Date().toISOString()
    });

    writeDb(db);
    res.json({ message: 'Balance adjusted successfully!', userBalance: user.balance });
  });

  // Manage Users - Block/Unblock
  app.put('/api/admin/users/:id/block', authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;
    const { isBlocked } = req.body;

    const db = readDb();
    const user = db.users.find(u => u.id === id);

    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    if (user.role === 'admin') {
      res.status(400).json({ error: 'Super administrators cannot be blocked.' });
      return;
    }

    user.isBlocked = !!isBlocked;
    writeDb(db);

    res.json({ message: `User account is now ${isBlocked ? 'suspended' : 'active'}.` });
  });

  // Manage Users - Change Role
  app.put('/api/admin/users/:id/role', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const { role } = req.body; // 'user' | 'admin'

    if (role !== 'user' && role !== 'admin') {
      res.status(400).json({ error: 'Invalid role assignment.' });
      return;
    }

    if (id === req.user!.id) {
      res.status(400).json({ error: 'You cannot modify your own administrative role.' });
      return;
    }

    const db = readDb();
    const targetUser = db.users.find(u => u.id === id);

    if (!targetUser) {
      res.status(404).json({ error: 'User account not found.' });
      return;
    }

    targetUser.role = role;
    writeDb(db);

    res.json({ message: `User ${targetUser.username} role updated to ${role} successfully.`, user: targetUser });
  });

  // Manage Users - Broadcast Notification to All Users
  app.post('/api/admin/broadcast', authenticateToken, requireAdmin, (req, res) => {
    const { title, message } = req.body;

    if (!title || !message) {
      res.status(400).json({ error: 'Please enter broadcast title and message.' });
      return;
    }

    const db = readDb();
    const notificationIdPrefix = 'broadcast_' + Math.random().toString(36).substr(2, 5);

    db.users.forEach(u => {
      db.notifications.push({
        id: `${notificationIdPrefix}_${u.id}`,
        userId: u.id,
        title: `📢 ${title}`,
        message,
        read: false,
        createdAt: new Date().toISOString()
      });
    });

    writeDb(db);
    res.json({ message: `System broadcast dispatched successfully to all ${db.users.length} registered players!` });
  });

  // Manage Users - Change VIP
  app.put('/api/admin/users/:id/vip', authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;
    const { vipLevel, vipPoints } = req.body;

    const db = readDb();
    const targetUser = db.users.find(u => u.id === id);

    if (!targetUser) {
      res.status(404).json({ error: 'User account not found.' });
      return;
    }

    if (vipLevel !== undefined) {
      const lvl = parseInt(vipLevel);
      if (!isNaN(lvl) && lvl >= 0 && lvl <= 4) {
        targetUser.vipLevel = lvl;
      }
    }

    if (vipPoints !== undefined) {
      const pts = parseInt(vipPoints);
      if (!isNaN(pts) && pts >= 0) {
        targetUser.vipPoints = pts;
      }
    }

    writeDb(db);
    res.json({ message: 'VIP parameters configured successfully.', user: targetUser });
  });

  // Manage Users - Delete / Terminate Account
  app.delete('/api/admin/users/:id', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res) => {
    const { id } = req.params;

    if (id === req.user!.id) {
      res.status(400).json({ error: 'Self-destruction is prohibited. You cannot delete your own account.' });
      return;
    }

    const db = readDb();
    const userIndex = db.users.findIndex(u => u.id === id);

    if (userIndex === -1) {
      res.status(404).json({ error: 'User account not found.' });
      return;
    }

    const targetUser = db.users[userIndex];
    if (targetUser.role === 'admin') {
      res.status(400).json({ error: 'Administrative profiles cannot be deleted. Downgrade their role first.' });
      return;
    }

    // Delete user and associated records (clean data)
    db.users.splice(userIndex, 1);
    db.predictions = db.predictions.filter(p => p.userId !== id);
    db.transactions = db.transactions.filter(t => t.userId !== id);
    db.notifications = db.notifications.filter(n => n.userId !== id);
    db.supportTickets = db.supportTickets.filter(s => s.userId !== id);

    writeDb(db);
    res.json({ message: 'Player profile and all associated data purged successfully.' });
  });

  // Create Manual Transaction Ledger
  app.post('/api/admin/transactions/manual', authenticateToken, requireAdmin, (req, res) => {
    const { userId, type, amount, paymentMethod, transactionId, description } = req.body;

    if (!userId || !type || !amount) {
      res.status(400).json({ error: 'Missing required manual transaction fields.' });
      return;
    }

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      res.status(400).json({ error: 'Transaction amount must be a positive number.' });
      return;
    }

    const db = readDb();
    const user = db.users.find(u => u.id === userId);

    if (!user) {
      res.status(404).json({ error: 'User profile not found.' });
      return;
    }

    // Process balance adjustments
    if (type === 'deposit' || type === 'win' || type === 'referral_bonus' || type === 'vip_bonus') {
      user.balance += amt;
    } else if (type === 'withdraw' || type === 'bet') {
      if (user.balance < amt) {
        res.status(400).json({ error: `Insufficient user balance. (Has: ৳${user.balance})` });
        return;
      }
      user.balance -= amt;
    } else {
      res.status(400).json({ error: 'Invalid transaction type specified.' });
      return;
    }

    const txId = 'tx_man_' + Math.random().toString(36).substr(2, 9);
    const newTx: Transaction = {
      id: txId,
      userId: user.id,
      username: user.username,
      type,
      amount: amt,
      status: 'success',
      paymentMethod: paymentMethod || 'manual',
      transactionId: transactionId || txId.toUpperCase(),
      description: description || 'Administrative manual ledger adjustment.',
      createdAt: new Date().toISOString()
    };

    db.transactions.push(newTx);

    db.notifications.push({
      id: 'notif_' + Math.random().toString(36).substr(2, 9),
      userId: user.id,
      title: '💼 Manual Balance Update',
      message: `An administrator executed a manual ${type} of ৳${amt}. Current balance: ৳${user.balance}. Reason: ${description || 'N/A'}.`,
      read: false,
      createdAt: new Date().toISOString()
    });

    writeDb(db);
    res.status(201).json({ message: 'Manual ledger transaction processed successfully.', transaction: newTx, userBalance: user.balance });
  });

  // Manage Transactions - View All
  app.get('/api/admin/transactions', authenticateToken, requireAdmin, (req, res) => {
    const db = readDb();
    res.json(db.transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  });

  // Manage Transactions - Approve/Reject (Approve deposit, or settle withdrawal)
  app.put('/api/admin/transactions/:id/status', authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'success' | 'failed'

    if (status !== 'success' && status !== 'failed') {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

    const db = readDb();
    const txIndex = db.transactions.findIndex(t => t.id === id);

    if (txIndex === -1) {
      res.status(404).json({ error: 'Transaction record not found.' });
      return;
    }

    const tx = db.transactions[txIndex];
    if (tx.status !== 'pending') {
      res.status(400).json({ error: 'This transaction has already been processed.' });
      return;
    }

    const user = db.users.find(u => u.id === tx.userId);
    if (!user) {
      res.status(404).json({ error: 'User account not found.' });
      return;
    }

    tx.status = status;

    if (tx.type === 'deposit') {
      if (status === 'success') {
        // Find if deposit has promo code in description
        let multiplier = 1.0;
        if (tx.description.includes('Promo: WELCOME200')) multiplier = 2.0;
        else if (tx.description.includes('Promo: RELOAD10')) multiplier = 0.1;
        else if (tx.description.includes('Promo: SLOTBONANZA')) multiplier = 0.5;

        const baseAmount = tx.amount;
        const promoBonus = baseAmount * (multiplier - 1.0 > 0 ? multiplier - 1.0 : 0);
        const totalCredit = baseAmount + promoBonus;

        user.balance += totalCredit;
        user.vipPoints += Math.floor(baseAmount / 2); // Credit VIP points for deposit
        tx.description = `Deposit of ৳${baseAmount} verified.${promoBonus > 0 ? ' Promo credit: ৳' + promoBonus : ''}`;

        db.notifications.push({
          id: 'notif_' + Math.random().toString(36).substr(2, 9),
          userId: user.id,
          title: '💳 Deposit Approved!',
          message: `Your deposit request for ৳${baseAmount} was approved! ৳${totalCredit} has been credited to your wallet.`,
          read: false,
          createdAt: new Date().toISOString()
        });
      } else {
        tx.description = 'Deposit rejected (invalid TrxID / payment not received)';
        db.notifications.push({
          id: 'notif_' + Math.random().toString(36).substr(2, 9),
          userId: user.id,
          title: '❌ Deposit Rejected',
          message: `Your deposit request for ৳${tx.amount} was rejected. Please re-check the TrxID or open a support ticket.`,
          read: false,
          createdAt: new Date().toISOString()
        });
      }
    } else if (tx.type === 'withdraw') {
      // Withdrawal was already deducted from balance when requested.
      // If approved, do nothing except update status.
      // If rejected, refund user balance!
      if (status === 'failed') {
        user.balance += tx.amount;
        tx.description = 'Withdrawal rejected (Refunded)';
        db.notifications.push({
          id: 'notif_' + Math.random().toString(36).substr(2, 9),
          userId: user.id,
          title: '❌ Withdrawal Rejected (Refunded)',
          message: `Your withdrawal of ৳${tx.amount} was rejected by administrative staff. Funds have been returned to your wallet.`,
          read: false,
          createdAt: new Date().toISOString()
        });
      } else {
        tx.description = `Withdrawal of ৳${tx.amount} completed and transferred.`;
        db.notifications.push({
          id: 'notif_' + Math.random().toString(36).substr(2, 9),
          userId: user.id,
          title: '✅ Withdrawal Completed',
          message: `Your withdrawal of ৳${tx.amount} has been successfully processed and transferred to your recipient number.`,
          read: false,
          createdAt: new Date().toISOString()
        });
      }
    }

    writeDb(db);
    res.json({ message: 'Transaction updated successfully', transaction: tx });
  });

  // Manage Matches - Add New Match
  app.post('/api/admin/matches', authenticateToken, requireAdmin, (req, res) => {
    const { sport, league, time, homeTeamName, awayTeamName, homeOdds, drawOdds, awayOdds } = req.body;

    if (!sport || !league || !time || !homeTeamName || !awayTeamName || !homeOdds || !awayOdds) {
      res.status(400).json({ error: 'Please fill in all sport match details.' });
      return;
    }

    const db = readDb();
    const newMatch: Match = {
      id: 'match_' + Math.random().toString(36).substr(2, 9),
      sport,
      league,
      time,
      homeTeam: { name: homeTeamName, logo: getSportEmoji(sport) },
      awayTeam: { name: awayTeamName, logo: getSportEmoji(sport) },
      homeScore: 0,
      awayScore: 0,
      status: 'upcoming',
      odds: {
        homeWin: parseFloat(homeOdds),
        draw: parseFloat(drawOdds || '0'),
        awayWin: parseFloat(awayOdds),
        over_2_5: 1.8,
        under_2_5: 1.8
      }
    };

    db.matches.push(newMatch);
    writeDb(db);

    res.status(201).json({ message: 'New sports match added successfully!', match: newMatch });
  });

  function getSportEmoji(sport: string): string {
    if (sport === 'football') return '⚽';
    if (sport === 'cricket') return '🏏';
    if (sport === 'tennis') return '🎾';
    if (sport === 'basketball') return '🏀';
    return '🏆';
  }

  // Manage Matches - Update match state (live/completed/upcoming and odds)
  app.put('/api/admin/matches/:id', authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;
    const { status, homeScore, awayScore, homeOdds, drawOdds, awayOdds, time } = req.body;

    const db = readDb();
    const matchIndex = db.matches.findIndex(m => m.id === id);

    if (matchIndex === -1) {
      res.status(404).json({ error: 'Match not found.' });
      return;
    }

    const match = db.matches[matchIndex];
    if (status) match.status = status;
    if (time) match.time = time;
    if (homeScore !== undefined) match.homeScore = parseInt(homeScore);
    if (awayScore !== undefined) match.awayScore = parseInt(awayScore);
    
    if (homeOdds) match.odds.homeWin = parseFloat(homeOdds);
    if (drawOdds !== undefined) match.odds.draw = parseFloat(drawOdds);
    if (awayOdds) match.odds.awayWin = parseFloat(awayOdds);

    writeDb(db);
    res.json({ message: 'Match updated successfully', match });
  });

  // Manage Matches - Delete Match
  app.delete('/api/admin/matches/:id', authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;

    const db = readDb();
    const matchIndex = db.matches.findIndex(m => m.id === id);

    if (matchIndex === -1) {
      res.status(404).json({ error: 'Match not found.' });
      return;
    }

    db.matches.splice(matchIndex, 1);
    // Also delete predictions on this match
    db.predictions = db.predictions.filter(p => p.matchId !== id);

    writeDb(db);
    res.json({ message: 'Sports fixture and its associated predictions removed successfully.' });
  });

  // Manage Matches - Simulate score tick
  app.post('/api/admin/matches/tick', authenticateToken, requireAdmin, (req, res) => {
    tickLiveScores();
    res.json({ message: 'Live game scores and handicap betting odds ticked successfully!' });
  });

  // Manage Matches - Settle Match Prediction Results
  app.post('/api/admin/matches/:id/settle', authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;
    const { winner } = req.body; // 'home' | 'draw' | 'away'

    if (winner !== 'home' && winner !== 'draw' && winner !== 'away') {
      res.status(400).json({ error: 'Winner selection must be "home", "draw", or "away".' });
      return;
    }

    const db = readDb();
    const matchIndex = db.matches.findIndex(m => m.id === id);

    if (matchIndex === -1) {
      res.status(404).json({ error: 'Match not found.' });
      return;
    }

    const match = db.matches[matchIndex];
    match.status = 'completed';

    // Filter predictions for this match
    const matchPredictions = db.predictions.filter(p => p.matchId === id && p.status === 'pending');

    matchPredictions.forEach(pred => {
      const predUser = db.users.find(u => u.id === pred.userId);
      if (!predUser) return;

      if (pred.selection === winner) {
        pred.status = 'won';
        predUser.balance += pred.potentialPayout;

        // Record credit transactions
        db.transactions.push({
          id: 'tx_' + Math.random().toString(36).substr(2, 9),
          userId: predUser.id,
          username: predUser.username,
          type: 'win',
          amount: pred.potentialPayout,
          status: 'success',
          description: `Payout WON on Match Prediction: ${match.homeTeam.name} vs ${match.awayTeam.name}`,
          createdAt: new Date().toISOString()
        });

        // Add notifications
        db.notifications.push({
          id: 'notif_' + Math.random().toString(36).substr(2, 9),
          userId: predUser.id,
          title: '🎉 Win Confirmed!',
          message: `Your prediction on ${match.homeTeam.name} vs ${match.awayTeam.name} was WON. ৳${pred.potentialPayout} was added to your wallet!`,
          read: false,
          createdAt: new Date().toISOString()
        });
      } else {
        pred.status = 'lost';
        db.notifications.push({
          id: 'notif_' + Math.random().toString(36).substr(2, 9),
          userId: predUser.id,
          title: '💔 Match Prediction Result',
          message: `Your prediction on ${match.homeTeam.name} vs ${match.awayTeam.name} did not win. Best of luck on the next one!`,
          read: false,
          createdAt: new Date().toISOString()
        });
      }
    });

    writeDb(db);
    res.json({ message: `Match settled successfully! ${matchPredictions.length} predictions processed.` });
  });

  // Manage Promotions - Get All
  app.get('/api/admin/promotions', authenticateToken, requireAdmin, (req, res) => {
    const db = readDb();
    res.json(db.promotions);
  });

  // Manage Promotions - Add/Edit/Toggle
  app.post('/api/admin/promotions', authenticateToken, requireAdmin, (req, res) => {
    const { title, description, code, bonusPercentage, minDeposit, category, image } = req.body;

    if (!title || !description || !code || !bonusPercentage || !minDeposit || !category) {
      res.status(400).json({ error: 'Please enter all promotion details.' });
      return;
    }

    const db = readDb();
    const newPromo: Promotion = {
      id: 'promo_' + Math.random().toString(36).substr(2, 9),
      title,
      description,
      code: code.toUpperCase(),
      bonusPercentage: parseInt(bonusPercentage),
      minDeposit: parseFloat(minDeposit),
      category,
      image: image || '🎁',
      active: true
    };

    db.promotions.push(newPromo);
    writeDb(db);

    res.status(201).json({ message: 'New promo code published successfully!', promotion: newPromo });
  });

  app.put('/api/admin/promotions/:id', authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;
    const { active, title, description, bonusPercentage, minDeposit } = req.body;

    const db = readDb();
    const promo = db.promotions.find(p => p.id === id);

    if (!promo) {
      res.status(404).json({ error: 'Promo not found.' });
      return;
    }

    if (active !== undefined) promo.active = !!active;
    if (title) promo.title = title;
    if (description) promo.description = description;
    if (bonusPercentage) promo.bonusPercentage = parseInt(bonusPercentage);
    if (minDeposit) promo.minDeposit = parseFloat(minDeposit);

    writeDb(db);
    res.json({ message: 'Promo updated successfully.', promotion: promo });
  });

  // Manage Promotions - Delete Promotion
  app.delete('/api/admin/promotions/:id', authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;

    const db = readDb();
    const promoIndex = db.promotions.findIndex(p => p.id === id);

    if (promoIndex === -1) {
      res.status(404).json({ error: 'Promotion not found.' });
      return;
    }

    db.promotions.splice(promoIndex, 1);
    writeDb(db);

    res.json({ message: 'Campaign and promo code permanently deleted.' });
  });

  // Manage Support Tickets - Get All
  app.get('/api/admin/tickets', authenticateToken, requireAdmin, (req, res) => {
    const db = readDb();
    res.json(db.supportTickets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  });

  // Manage Support Tickets - Reply
  app.put('/api/admin/tickets/:id/reply', authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;
    const { reply } = req.body;

    if (!reply) {
      res.status(400).json({ error: 'Please type a response reply.' });
      return;
    }

    const db = readDb();
    const ticketIndex = db.supportTickets.findIndex(t => t.id === id);

    if (ticketIndex === -1) {
      res.status(404).json({ error: 'Ticket not found.' });
      return;
    }

    const ticket = db.supportTickets[ticketIndex];
    ticket.reply = reply;
    ticket.status = 'replied';

    db.notifications.push({
      id: 'notif_' + Math.random().toString(36).substr(2, 9),
      userId: ticket.userId,
      title: '✉️ New Support Ticket Reply',
      message: `Support replied to your ticket "${ticket.subject}": "${reply.substring(0, 50)}..."`,
      read: false,
      createdAt: new Date().toISOString()
    });

    writeDb(db);
    res.json({ message: 'Reply sent successfully', ticket });
  });

  // Global Settings Edit
  app.put('/api/admin/settings', authenticateToken, requireAdmin, requireTabAccess('settings'), (req, res) => {
    const { 
      siteName, maintenanceMode, minDeposit, minWithdraw, 
      bKashNumber, nagadNumber, rocketNumber, referralBonus,
      userWinningPercentage, maxWinPercentageOfDeposit, marqueeNotice
    } = req.body;
    const db = readDb();

    if (siteName) db.settings.siteName = siteName;
    if (maintenanceMode !== undefined) db.settings.maintenanceMode = !!maintenanceMode;
    if (minDeposit) db.settings.minDeposit = parseFloat(minDeposit);
    if (minWithdraw) db.settings.minWithdraw = parseFloat(minWithdraw);
    if (bKashNumber) db.settings.bKashNumber = bKashNumber;
    if (nagadNumber) db.settings.nagadNumber = nagadNumber;
    if (rocketNumber) db.settings.rocketNumber = rocketNumber;
    if (referralBonus !== undefined) db.settings.referralBonus = parseFloat(referralBonus);
    if (userWinningPercentage !== undefined) db.settings.userWinningPercentage = parseFloat(userWinningPercentage);
    if (maxWinPercentageOfDeposit !== undefined) db.settings.maxWinPercentageOfDeposit = parseFloat(maxWinPercentageOfDeposit);
    if (marqueeNotice !== undefined) db.settings.marqueeNotice = marqueeNotice;

    writeDb(db);
    res.json({ message: 'Global platform settings updated successfully!', settings: db.settings });
  });

  // ==========================================
  // SUPPORT CHANNELS API
  // ==========================================

  // Get active support channels (Public)
  app.get('/api/support-channels', (req, res) => {
    const db = readDb();
    const activeChannels = (db.supportChannels || []).filter(c => c.active);
    res.json(activeChannels);
  });

  // Get all support channels (Admin)
  app.get('/api/admin/support-channels', authenticateToken, requireAdmin, requireTabAccess('support_channels'), (req, res) => {
    const db = readDb();
    res.json(db.supportChannels || []);
  });

  // Create/Edit support channel (Admin)
  app.post('/api/admin/support-channels', authenticateToken, requireAdmin, requireTabAccess('support_channels'), (req, res) => {
    const { id, name, icon, link, active } = req.body;
    if (!name || !link) {
      res.status(400).json({ error: 'Name and Link are required.' });
      return;
    }

    const db = readDb();
    if (!db.supportChannels) db.supportChannels = [];

    if (id) {
      const index = db.supportChannels.findIndex(c => c.id === id);
      if (index !== -1) {
        db.supportChannels[index] = {
          ...db.supportChannels[index],
          name,
          icon: icon || 'Phone',
          link,
          active: active !== undefined ? !!active : true
        };
        writeDb(db);
        res.json({ message: 'Support channel updated successfully!', channel: db.supportChannels[index] });
        return;
      }
    }

    const newChannel = {
      id: 'sup_' + Math.random().toString(36).substr(2, 9),
      name,
      icon: icon || 'Phone',
      link,
      active: active !== undefined ? !!active : true,
      createdAt: new Date().toISOString()
    };
    db.supportChannels.push(newChannel);
    writeDb(db);
    res.status(201).json({ message: 'Support channel added successfully!', channel: newChannel });
  });

  // Toggle support channel (Admin)
  app.put('/api/admin/support-channels/:id/toggle', authenticateToken, requireAdmin, requireTabAccess('support_channels'), (req, res) => {
    const { id } = req.params;
    const db = readDb();
    const index = db.supportChannels.findIndex(c => c.id === id);
    if (index === -1) {
      res.status(404).json({ error: 'Channel not found.' });
      return;
    }
    db.supportChannels[index].active = !db.supportChannels[index].active;
    writeDb(db);
    res.json({ message: 'Channel status toggled successfully!', channel: db.supportChannels[index] });
  });

  // Delete support channel (Admin)
  app.delete('/api/admin/support-channels/:id', authenticateToken, requireAdmin, requireTabAccess('support_channels'), (req, res) => {
    const { id } = req.params;
    const db = readDb();
    const index = db.supportChannels.findIndex(c => c.id === id);
    if (index === -1) {
      res.status(404).json({ error: 'Channel not found.' });
      return;
    }
    db.supportChannels.splice(index, 1);
    writeDb(db);
    res.json({ message: 'Support channel deleted successfully.' });
  });

  // ==========================================
  // BANNER SLIDERS API
  // ==========================================

  // Get active banners (Public)
  app.get('/api/banners', (req, res) => {
    const db = readDb();
    const activeBanners = (db.banners || []).filter(b => b.active);
    res.json(activeBanners);
  });

  // Get all banners (Admin)
  app.get('/api/admin/banners', authenticateToken, requireAdmin, requireTabAccess('sliders_notices'), (req, res) => {
    const db = readDb();
    res.json(db.banners || []);
  });

  // Create/Edit banner (Admin)
  app.post('/api/admin/banners', authenticateToken, requireAdmin, requireTabAccess('sliders_notices'), (req, res) => {
    const { id, title, subtitle, description, image, linkTab, buttonText, active, isImageOnly } = req.body;
    
    if (isImageOnly) {
      if (!image) {
        res.status(400).json({ error: 'Image URL is required for image-only slides.' });
        return;
      }
    } else {
      if (!title || !description) {
        res.status(400).json({ error: 'Title and Description are required for promotional text slides.' });
        return;
      }
    }

    const db = readDb();
    if (!db.banners) db.banners = [];

    if (id) {
      const index = db.banners.findIndex(b => b.id === id);
      if (index !== -1) {
        db.banners[index] = {
          ...db.banners[index],
          title: title || '',
          subtitle: subtitle || '',
          description: description || '',
          image: image || '',
          linkTab: linkTab || 'dashboard',
          buttonText: buttonText || 'Explore',
          active: active !== undefined ? !!active : true,
          isImageOnly: !!isImageOnly
        };
        writeDb(db);
        res.json({ message: 'Banner updated successfully!', banner: db.banners[index] });
        return;
      }
    }

    const newBanner = {
      id: 'slide_' + Math.random().toString(36).substr(2, 9),
      title: title || '',
      subtitle: subtitle || '',
      description: description || '',
      image: image || '',
      linkTab: linkTab || 'dashboard',
      buttonText: buttonText || 'Explore',
      active: active !== undefined ? !!active : true,
      isImageOnly: !!isImageOnly,
      createdAt: new Date().toISOString()
    };
    db.banners.push(newBanner);
    writeDb(db);
    res.status(201).json({ message: 'Banner added successfully!', banner: newBanner });
  });

  // Toggle banner active (Admin)
  app.put('/api/admin/banners/:id/toggle', authenticateToken, requireAdmin, requireTabAccess('sliders_notices'), (req, res) => {
    const { id } = req.params;
    const db = readDb();
    const index = db.banners.findIndex(b => b.id === id);
    if (index === -1) {
      res.status(404).json({ error: 'Banner not found.' });
      return;
    }
    db.banners[index].active = !db.banners[index].active;
    writeDb(db);
    res.json({ message: 'Banner status toggled successfully!', banner: db.banners[index] });
  });

  // Delete banner (Admin)
  app.delete('/api/admin/banners/:id', authenticateToken, requireAdmin, requireTabAccess('sliders_notices'), (req, res) => {
    const { id } = req.params;
    const db = readDb();
    const index = db.banners.findIndex(b => b.id === id);
    if (index === -1) {
      res.status(404).json({ error: 'Banner not found.' });
      return;
    }
    db.banners.splice(index, 1);
    writeDb(db);
    res.json({ message: 'Banner deleted successfully.' });
  });

  // ==========================================
  // ADMIN MANAGEMENT API (PRIMARY ADMIN ONLY)
  // ==========================================

  // Get all admins & mods
  app.get('/api/admin/admins', authenticateToken, requirePrimaryAdmin, (req, res) => {
    const db = readDb();
    const admins = db.users.filter(u => u.role === 'admin' || u.role === 'mod');
    res.json(admins);
  });

  // Create new admin/mod
  app.post('/api/admin/admins', authenticateToken, requirePrimaryAdmin, (req, res) => {
    const { username, email, phone, password, role, allowedTabs, fullName } = req.body;
    if (!username || !email || !password || !role) {
      res.status(400).json({ error: 'Username, Email, Password, and Role are required.' });
      return;
    }

    if (role !== 'admin' && role !== 'mod') {
      res.status(400).json({ error: 'Role must be either admin or mod.' });
      return;
    }

    const db = readDb();
    const exists = db.users.some(u => u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      res.status(400).json({ error: 'Username or Email already registered.' });
      return;
    }

    const salt = generateSalt();
    const passwordHash = hashPassword(password, salt);

    const newAdmin = {
      id: 'usr_adm_' + Math.random().toString(36).substr(2, 9),
      username,
      email,
      phone: phone || '',
      role,
      balance: 0,
      referralCode: 'ADM_' + username.toUpperCase(),
      vipLevel: 0,
      vipPoints: 0,
      isBlocked: false,
      fullName: fullName || `${role.toUpperCase()} Account`,
      createdAt: new Date().toISOString(),
      allowedTabs: allowedTabs || [],
      passwordHash,
      salt
    };

    db.users.push(newAdmin);
    writeDb(db);

    res.status(201).json({ message: `${role === 'admin' ? 'Secondary Admin' : 'Moderator'} added successfully!`, user: newAdmin });
  });

  // Update secondary admin/mod permissions
  app.put('/api/admin/admins/:id', authenticateToken, requirePrimaryAdmin, (req, res) => {
    const { id } = req.params;
    const { allowedTabs, role, isBlocked } = req.body;

    const db = readDb();
    const index = db.users.findIndex(u => u.id === id);
    if (index === -1) {
      res.status(404).json({ error: 'Account not found.' });
      return;
    }

    const targetUser = db.users[index];
    if (targetUser.role === 'primary_admin') {
      res.status(403).json({ error: 'Cannot modify Primary Admin settings.' });
      return;
    }

    if (allowedTabs !== undefined) targetUser.allowedTabs = allowedTabs;
    if (role !== undefined && (role === 'admin' || role === 'mod')) targetUser.role = role;
    if (isBlocked !== undefined) targetUser.isBlocked = !!isBlocked;

    writeDb(db);
    res.json({ message: 'Permissions and roles updated successfully!', user: targetUser });
  });

  // Delete secondary admin/mod
  app.delete('/api/admin/admins/:id', authenticateToken, requirePrimaryAdmin, (req, res) => {
    const { id } = req.params;
    const db = readDb();
    const index = db.users.findIndex(u => u.id === id);
    if (index === -1) {
      res.status(404).json({ error: 'Account not found.' });
      return;
    }

    const targetUser = db.users[index];
    if (targetUser.role === 'primary_admin') {
      res.status(403).json({ error: 'Cannot delete Primary Admin.' });
      return;
    }

    db.users.splice(index, 1);
    writeDb(db);
    res.json({ message: 'Admin/Moderator account deleted successfully.' });
  });

  // Manage News - Post announcement
  app.post('/api/admin/news', authenticateToken, requireAdmin, (req, res) => {
    const { title, content, image } = req.body;

    if (!title || !content) {
      res.status(400).json({ error: 'Please provide news title and content.' });
      return;
    }

    const db = readDb();
    const newNews: NewsItem = {
      id: 'news_' + Math.random().toString(36).substr(2, 9),
      title,
      content,
      image: image || '📢',
      createdAt: new Date().toISOString()
    };

    db.news.unshift(newNews); // Unshift so it appears first
    writeDb(db);

    res.status(201).json({ message: 'News announcement published successfully!', news: newNews });
  });

  // Manage News - Delete
  app.delete('/api/admin/news/:id', authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;

    const db = readDb();
    const newsIndex = db.news.findIndex(n => n.id === id);

    if (newsIndex === -1) {
      res.status(404).json({ error: 'News item not found.' });
      return;
    }

    db.news.splice(newsIndex, 1);
    writeDb(db);

    res.json({ message: 'News article deleted successfully.' });
  });

  // Platform Metrics & Analytical Charts
  app.get('/api/admin/analytics', authenticateToken, requireAdmin, (req, res) => {
    const db = readDb();

    const totalUsers = db.users.filter(u => u.role !== 'admin').length;
    const totalDeposits = db.transactions
      .filter(t => t.type === 'deposit' && t.status === 'success')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalWithdrawals = db.transactions
      .filter(t => t.type === 'withdraw' && t.status === 'success')
      .reduce((sum, t) => sum + t.amount, 0);

    const activeBetsCount = db.predictions.filter(p => p.status === 'pending').length;
    const activeBetsVolume = db.predictions
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + p.betAmount, 0);

    // Distribution by sports predictions vs casino bets
    const sportBetsCount = db.transactions.filter(t => t.type === 'bet' && t.description.includes('sports')).length;
    const casinoBetsCount = db.transactions.filter(t => t.type === 'bet' && (t.description.includes('Crash') || t.description.includes('Spin') || t.description.includes('Slots') || t.description.includes('Dice') || t.description.includes('Roulette'))).length;

    // Last 5 days history simulation for charts
    const chartData = [
      { day: 'Day -4', deposits: +(totalDeposits * 0.15).toFixed(0), withdrawals: +(totalWithdrawals * 0.10).toFixed(0), activePlayers: 14 },
      { day: 'Day -3', deposits: +(totalDeposits * 0.20).toFixed(0), withdrawals: +(totalWithdrawals * 0.15).toFixed(0), activePlayers: 28 },
      { day: 'Day -2', deposits: +(totalDeposits * 0.25).toFixed(0), withdrawals: +(totalWithdrawals * 0.22).toFixed(0), activePlayers: 34 },
      { day: 'Day -1', deposits: +(totalDeposits * 0.18).toFixed(0), withdrawals: +(totalWithdrawals * 0.20).toFixed(0), activePlayers: 45 },
      { day: 'Today', deposits: +(totalDeposits * 0.22).toFixed(0), withdrawals: +(totalWithdrawals * 0.33).toFixed(0), activePlayers: totalUsers }
    ];

    res.json({
      metrics: {
        totalUsers,
        totalDeposits,
        totalWithdrawals,
        activeBetsCount,
        activeBetsVolume,
        ggr: +(totalDeposits - totalWithdrawals).toFixed(2), // Gross Gaming Revenue
      },
      distribution: {
        sports: sportBetsCount || 4, // Fail-safes with demo values
        casino: casinoBetsCount || 12
      },
      chartData
    });
  });

  return app;
}

export const app = createApp();

async function startServer() {
  // Background ticker to simulate live sport updates
  setInterval(() => {
    tickLiveScores();
  }, 10000);

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // SPA Fallback for production hosting (Express v4)
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[BETEPRO SERVER] Running on port http://0.0.0.0:${PORT}`);
  });
}

// Start database bootstrapping and launch server
if (process.env.VERCEL !== '1') {
  startServer().catch(err => {
    console.error('Failed to boot full-stack server:', err);
  });
}
