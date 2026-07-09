import { Router, Response } from 'express';
import { ensureDbLoaded, readDb, writeDb } from '../db';
import { verifyFirebaseIdToken } from './verifyToken';
import { authenticateToken, AuthenticatedRequest } from './authMiddleware';
import { getFirebaseConfig } from './firebase';

const router = Router();

/**
 * Endpoint to resolve Username or Phone Number to their registered email address.
 * Used during client-side Firebase login.
 */
router.post('/resolve-login', async (req, res) => {
  try {
    const { usernameOrPhone } = req.body;
    if (!usernameOrPhone) {
      return res.status(400).json({ error: 'Username or phone number is required.' });
    }

    const db = await ensureDbLoaded('/api/auth/resolve-login');
    const inputClean = usernameOrPhone.trim().toLowerCase();

    // Search by username or phone
    const user = db.users.find(u => 
      u.username.toLowerCase() === inputClean || 
      u.phone === usernameOrPhone
    );

    if (user) {
      return res.json({ email: user.email });
    }

    // If not found in our database, check if it's already an email format
    if (usernameOrPhone.includes('@')) {
      return res.json({ email: usernameOrPhone });
    }

    // Default auto-generated fallback format for usernames
    return res.json({ email: `${inputClean}@betepro.com` });
  } catch (err: any) {
    console.error('[AUTH-ROUTES] Error in resolve-login:', err);
    return res.status(500).json({ error: 'Failed to resolve identifier.' });
  }
});

/**
 * User Registration - Verifies Firebase ID Token and initializes user profile in Firestore.
 */
router.post('/register', async (req, res) => {
  try {
    const { idToken, fullName, username, phone, referralCode } = req.body;

    if (!idToken || !fullName || !username || !phone) {
      return res.status(400).json({ error: 'Please enter all required fields.' });
    }

    if (username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters.' });
    }

    // 1. Verify the ID Token
    const decoded = await verifyFirebaseIdToken(idToken);
    const uid = decoded.uid;
    const email = decoded.email || `${username.toLowerCase()}@betepro.com`;

    const db = await ensureDbLoaded('/api/auth/register');

    // 2. Validate uniqueness in database
    const existingUsername = db.users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (existingUsername) {
      return res.status(400).json({ error: 'Username is already taken. Please choose another.' });
    }

    const existingPhone = db.users.find(u => u.phone === phone);
    if (existingPhone) {
      return res.status(400).json({ error: 'Phone number is already registered.' });
    }

    // 3. Set up Referral
    let referredBy: string | undefined = undefined;
    if (referralCode) {
      const referrer = db.users.find(u => u.referralCode.toLowerCase() === referralCode.toLowerCase());
      if (referrer) {
        referredBy = referrer.id;
      }
    }

    const userReferral = 'BET-' + username.substring(0, 4).toUpperCase() + Math.floor(100 + Math.random() * 900);
    const startBalance = referredBy ? 700 : 500; 

    // Create profile
    const newUser = {
      id: uid, // Bind directly to Firebase Auth UID
      username,
      email,
      phone,
      role: 'user' as const,
      balance: startBalance,
      referralCode: userReferral,
      referredBy,
      vipLevel: 0,
      vipPoints: 0,
      isBlocked: false,
      fullName,
      createdAt: new Date().toISOString(),
      passwordHash: '',
      salt: ''
    };

    db.users.push(newUser);

    // Initial sign-up notification
    db.notifications.push({
      id: 'notif_' + Math.random().toString(36).substr(2, 9),
      userId: uid,
      title: '🎁 Welcome to BETEPRO!',
      message: `Thanks for joining us, ${fullName}! We have credited a promotional ৳${startBalance} to your wallet. Dive into live sports betting and casino games!`,
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
          type: 'referral_bonus' as const,
          amount: 200,
          status: 'success' as const,
          description: `Referral bonus for inviting ${username}`,
          createdAt: new Date().toISOString()
        });
        db.notifications.push({
          id: 'notif_' + Math.random().toString(36).substr(2, 9),
          userId: referrer.id,
          title: '👥 Referral Bonus Credited!',
          message: `Your friend ${fullName} registered using your link. ৳200 referral bonus was added to your wallet!`,
          read: false,
          createdAt: new Date().toISOString()
        });
      }
    }

    await writeDb(db);

    return res.status(201).json({
      token: idToken,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        balance: newUser.balance,
        referralCode: newUser.referralCode,
        vipLevel: newUser.vipLevel,
        vipPoints: newUser.vipPoints,
        fullName: newUser.fullName,
        createdAt: newUser.createdAt
      }
    });
  } catch (err: any) {
    console.error('[AUTH-ROUTES] Registration error:', err);
    return res.status(500).json({ error: err.message || 'An internal server error occurred during registration.' });
  }
});

/**
 * User Login / Token Verification - Checks credentials from Firebase Token.
 */
router.post('/login', async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ error: 'Firebase ID Token is required.' });
    }

    // 1. Verify the ID Token with Google
    const decoded = await verifyFirebaseIdToken(idToken);
    const uid = decoded.uid;

    const db = await ensureDbLoaded('/api/auth/login');
    const user = db.users.find(u => u.id === uid);

    if (!user) {
      return res.status(404).json({ error: 'Account profile not found in database. Please register first.' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ error: 'This account has been suspended by an administrator.' });
    }

    // Trigger daily-signin notification check or update last login
    const notifications = db.notifications.filter(n => n.userId === user.id);

    return res.json({
      token: idToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role,
        balance: user.balance,
        referralCode: user.referralCode,
        vipLevel: user.vipLevel,
        vipPoints: user.vipPoints,
        fullName: user.fullName,
        createdAt: user.createdAt
      },
      notifications
    });
  } catch (err: any) {
    console.error('[AUTH-ROUTES] Login error:', err);
    return res.status(401).json({ error: err.message || 'Authentication failed.' });
  }
});

/**
 * Admin Login / Verification.
 */
router.post('/admin-login', async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ error: 'Firebase ID Token is required for Admin login.' });
    }

    const decoded = await verifyFirebaseIdToken(idToken);
    const uid = decoded.uid;

    const db = await ensureDbLoaded('/api/auth/admin-login');
    const user = db.users.find(u => u.id === uid);

    if (!user) {
      return res.status(404).json({ error: 'Admin account profile not found in database.' });
    }

    const allowedRoles = ['admin', 'super_admin', 'primary_admin', 'mod', 'moderator'];
    if (!allowedRoles.includes(user.role || '')) {
      return res.status(403).json({ error: 'Access denied: Admin privileges required.' });
    }

    const notifications = db.notifications.filter(n => n.userId === user.id);

    return res.json({
      token: idToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role,
        balance: user.balance,
        referralCode: user.referralCode,
        vipLevel: user.vipLevel,
        vipPoints: user.vipPoints,
        fullName: user.fullName,
        createdAt: user.createdAt
      },
      notifications
    });
  } catch (err: any) {
    console.error('[AUTH-ROUTES] Admin Login error:', err);
    return res.status(401).json({ error: err.message || 'Admin verification failed.' });
  }
});

/**
 * Firebase Auth Synchronization endpoint.
 */
router.post('/firebase-sync', async (req, res) => {
  try {
    const { idToken, username, referralCode } = req.body;
    if (!idToken) {
      return res.status(400).json({ error: 'Firebase ID Token is required for synchronization.' });
    }

    const decoded = await verifyFirebaseIdToken(idToken);
    const uid = decoded.uid;
    const email = decoded.email || '';

    const db = await ensureDbLoaded('/api/auth/firebase-sync');
    let user = db.users.find(u => u.id === uid || u.email.toLowerCase() === email.toLowerCase());

    if (user) {
      if (user.id !== uid) {
        const oldId = user.id;
        user.id = uid;

        // Migrate relations
        db.predictions.forEach(p => { if (p.userId === oldId) p.userId = uid; });
        db.transactions.forEach(t => { if (t.userId === oldId) t.userId = uid; });
        db.notifications.forEach(n => { if (n.userId === oldId) n.userId = uid; });
        db.supportTickets.forEach(s => { if (s.userId === oldId) s.userId = uid; });
      }

      const isAdminEmail = email.toLowerCase() === 'admin@betepro.com' || email.toLowerCase() === 'aburayhan10x@gmail.com';
      if (isAdminEmail && user.role !== 'primary_admin') {
        user.role = 'primary_admin';
      }

      await writeDb(db);
    } else {
      // Auto-register via Sync (e.g. Social Google Sign-in)
      const finalUsername = username || email.split('@')[0] || 'player_' + Math.random().toString(36).substr(2, 5);

      let referredBy: string | undefined = undefined;
      if (referralCode) {
        const referrer = db.users.find(u => u.referralCode.toLowerCase() === referralCode.toLowerCase());
        if (referrer) {
          referredBy = referrer.id;
        }
      }

      const startBalance = referredBy ? 700 : 500;
      const userReferral = 'BET-' + finalUsername.substring(0, 4).toUpperCase() + Math.floor(100 + Math.random() * 900);
      const role: 'primary_admin' | 'user' = (email.toLowerCase() === 'admin@betepro.com' || email.toLowerCase() === 'aburayhan10x@gmail.com') ? 'primary_admin' : 'user';

      const newUser = {
        id: uid,
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

      db.notifications.push({
        id: 'notif_' + Math.random().toString(36).substr(2, 9),
        userId: uid,
        title: '🎁 Welcome to BETEPRO via Firebase!',
        message: `Thanks for joining us, ${finalUsername}! We have credited a promotional ৳${startBalance} to your wallet. Dive into live sports betting and casino games!`,
        read: false,
        createdAt: new Date().toISOString()
      });

      if (referredBy) {
        const referrer = db.users.find(u => u.id === referredBy);
        if (referrer) {
          referrer.balance += 200;
          db.transactions.push({
            id: 'tx_' + Math.random().toString(36).substr(2, 9),
            userId: referrer.id,
            username: referrer.username,
            type: 'referral_bonus' as const,
            amount: 200,
            status: 'success' as const,
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

      await writeDb(db);
      user = newUser;
    }

    if (user.isBlocked) {
      return res.status(403).json({ error: 'This account has been suspended. Please contact customer support.' });
    }

    return res.json({
      token: idToken,
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
  } catch (err: any) {
    console.error('[AUTH-ROUTES] Firebase Sync error:', err);
    return res.status(500).json({ error: err.message || 'An internal server error occurred during auth sync.' });
  }
});

/**
 * Get profile data.
 */
router.get('/profile', authenticateToken, async (req: any, res) => {
  try {
    const db = await ensureDbLoaded('/api/auth/profile');
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const notifications = db.notifications.filter(n => n.userId === user.id);
    return res.json({ 
      user,
      notifications
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve profile.' });
  }
});

/**
 * Daily Sign-in reward API route.
 */
router.post('/daily-signin', authenticateToken, async (req: any, res) => {
  try {
    const db = await ensureDbLoaded('/api/auth/daily-signin');
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const userIndex = db.users.findIndex(u => u.id === user.id);
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const dbUser = db.users[userIndex];
    const rewardAmount = 10.0;
    dbUser.balance += rewardAmount;

    const txId = 'TXN_DS_' + Math.random().toString(36).substr(2, 9).toUpperCase();
    const newTx = {
      id: txId,
      userId: dbUser.id,
      username: dbUser.username,
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

    const newNotif = {
      id: 'notif_' + Date.now(),
      userId: dbUser.id,
      title: 'Daily Check-in Success!',
      message: `You successfully signed in today and received a bonus of ৳${rewardAmount.toFixed(2)}!`,
      read: false,
      createdAt: new Date().toISOString()
    };
    db.notifications.unshift(newNotif);

    await writeDb(db);

    return res.json({
      message: `Daily check-in successful! ৳${rewardAmount.toFixed(2)} added to your wallet.`,
      balance: dbUser.balance,
      transaction: newTx
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to complete daily sign-in.' });
  }
});

/**
 * Edit profile details.
 */
router.put('/profile', authenticateToken, async (req: any, res) => {
  try {
    const { fullName, phone, avatarUrl } = req.body;
    const db = await ensureDbLoaded('/api/auth/profile');
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const userIndex = db.users.findIndex(u => u.id === user.id);

    if (userIndex === -1) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    if (phone && phone !== db.users[userIndex].phone) {
      const phoneExists = db.users.find(u => u.phone === phone && u.id !== user.id);
      if (phoneExists) {
        return res.status(400).json({ error: 'Phone number already in use by another account.' });
      }
      db.users[userIndex].phone = phone;
    }

    if (fullName) db.users[userIndex].fullName = fullName;
    if (avatarUrl) db.users[userIndex].avatarUrl = avatarUrl;

    await writeDb(db);
    return res.json({ message: 'Profile updated successfully', user: db.users[userIndex] });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update profile.' });
  }
});

/**
 * Change user password directly in Firebase Authentication via REST API.
 */
router.put('/change-password', authenticateToken, async (req: any, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }

    // Access authorization token from request headers
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Authentication token required.' });
    }

    const config = getFirebaseConfig();
    const apiKey = config.apiKey;

    // Securely update the password directly in Firebase Auth
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idToken: token,
        password: newPassword,
        returnSecureToken: true
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      let parsedError: any = {};
      try {
        parsedError = JSON.parse(errorText);
      } catch (e) {}
      const msg = parsedError.error?.message || 'Password update failed';
      return res.status(400).json({ error: `Firebase Auth: ${msg}` });
    }

    return res.json({ message: 'Password changed successfully in Firebase Auth.' });
  } catch (err: any) {
    console.error('[AUTH-ROUTES] Password change error:', err);
    return res.status(500).json({ error: 'Failed to change password.' });
  }
});

export default router;
