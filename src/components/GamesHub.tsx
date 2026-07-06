/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Flame, HelpCircle, Coins, Compass, RotateCcw, 
  Gamepad2, Sparkles, Star, Trophy, CircleDot, Play, Ban, 
  ShieldAlert, Volume2, VolumeX, RefreshCw, Zap, ShieldCheck, 
  Crosshair, Award, ArrowUpRight, TrendingUp, Users, ChevronRight, HelpCircle as HelpIcon 
} from 'lucide-react';
import { User } from '../types';
import { translations, Language } from '../utils/lang';

interface GamesHubProps {
  user: User | null;
  lang: Language;
  onRefreshUser: () => void;
  onAuthTrigger: () => void;
}

type GameType = 'fishing' | 'crash' | 'slots' | 'spin' | 'dice' | 'roulette' | 'mines' | 'blackjack' | 'plinko' | 'super_ace';

// Interface for interactive Jili Fishing fish
interface Fish {
  id: number;
  type: 'nemo' | 'jellyfish' | 'turtle' | 'shark' | 'dragon';
  label: string;
  emoji: string;
  multiplier: number;
  x: number; // percentage 0 - 100
  y: number; // percentage 10 - 80
  speed: number;
  direction: number; // 1 = right, -1 = left
  hp: number;
  maxHp: number;
  size: number;
}

// Interface for Jili Fishing coin sprays
interface CoinSpray {
  id: number;
  x: number;
  y: number;
  text: string;
}

export default function GamesHub({ user, lang, onRefreshUser, onAuthTrigger }: GamesHubProps) {
  const [activeGame, setActiveGame] = useState<GameType | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [aviatorPlayMode, setAviatorPlayMode] = useState<'choice' | 'real' | 'demo'>('choice');
  const [superAcePlayMode, setSuperAcePlayMode] = useState<'choice' | 'real' | 'demo'>('choice');
  const [selectedGame, setSelectedGame] = useState<GameType | null>(null);
  const [selectedMode, setSelectedMode] = useState<'demo' | 'real' | null>(null);
  const [isFullscreenRoom, setIsFullscreenRoom] = useState<boolean>(false);
  const [demoBalance, setDemoBalance] = useState<number>(50000);
  const [showChoiceModal, setShowChoiceModal] = useState<boolean>(false);
  const [modalTargetGame, setModalTargetGame] = useState<GameType | null>(null);
  const [superAceDemoType, setSuperAceDemoType] = useState<'iframe' | 'local'>('local');
  const [superAceBet, setSuperAceBet] = useState<string>('50');
  const [superAceGrid, setSuperAceGrid] = useState<string[][]>([
    ['A', 'K', 'Q', 'J', '10'],
    ['GA', 'GK', 'GQ', 'GJ', 'G10'],
    ['W', 'A', 'K', 'Q', 'J'],
    ['S', 'W', 'GA', 'GK', 'GQ']
  ]);
  const [superAceMultiplier, setSuperAceMultiplier] = useState<number>(1);
  const [superAceSpinning, setSuperAceSpinning] = useState<boolean>(false);
  const [superAceWinningCoords, setSuperAceWinningCoords] = useState<{ r: number; c: number }[]>([]);
  const [superAceTotalWin, setSuperAceTotalWin] = useState<number | null>(null);
  const [superAceLog, setSuperAceLog] = useState<string[]>([]);
  const t = translations[lang];

  // ==========================================
  // WEB AUDIO SYNTHESIZER
  // ==========================================
  const playSynthSound = (type: 'shoot' | 'coin' | 'win' | 'lose' | 'click' | 'explosion' | 'card') => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'shoot') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.12);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      } else if (type === 'coin') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.08); // G5
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else if (type === 'win') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16); // G5
        osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.24); // C6
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      } else if (type === 'explosion') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(90, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(25, ctx.currentTime + 0.35);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else if (type === 'lose') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(90, ctx.currentTime + 0.35);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(450, ctx.currentTime);
        gain.gain.setValueAtTime(0.03, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.04);
        osc.start();
        osc.stop(ctx.currentTime + 0.04);
      } else if (type === 'card') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(350, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(400, ctx.currentTime + 0.06);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.06);
        osc.start();
        osc.stop(ctx.currentTime + 0.06);
      }
    } catch (e) {
      // AudioContext fails gracefully
    }
  };

  // ==========================================
  // GAME 1: JILI OCEAN KING FISHING (NEW STUNNING GAME)
  // ==========================================
  const [fishingBet, setFishingBet] = useState<number>(10);
  const [fishList, setFishList] = useState<Fish[]>([]);
  const [coinSprays, setCoinSprays] = useState<CoinSpray[]>([]);
  const [cannonAngle, setCannonAngle] = useState<number>(0);
  const [fishingLoading, setFishingLoading] = useState<boolean>(false);
  const [fishFlashed, setFishFlashed] = useState<number | null>(null);
  const [cannonRecoil, setCannonRecoil] = useState<boolean>(false);
  const fishingAreaRef = useRef<HTMLDivElement | null>(null);

  // Initialize and move fish
  useEffect(() => {
    // Generate initial set of swimming fish
    const initialFish: Fish[] = [
      { id: 1, type: 'nemo', label: 'Coral Nemo', emoji: '🐠', multiplier: 2, x: 10, y: 25, speed: 0.4, direction: 1, hp: 1, maxHp: 1, size: 40 },
      { id: 2, type: 'nemo', label: 'Neon Tetra', emoji: '🐟', multiplier: 2, x: 70, y: 40, speed: 0.6, direction: -1, hp: 1, maxHp: 1, size: 38 },
      { id: 3, type: 'jellyfish', label: 'Pink Jelly', emoji: '👾', multiplier: 6, x: 30, y: 60, speed: 0.25, direction: 1, hp: 2, maxHp: 2, size: 55 },
      { id: 4, type: 'turtle', label: 'Ancient Turtle', emoji: '🐢', multiplier: 12, x: 80, y: 15, speed: 0.15, direction: -1, hp: 3, maxHp: 3, size: 68 },
      { id: 5, type: 'shark', label: 'Oceanic Shark', emoji: '🦈', multiplier: 25, x: 50, y: 50, speed: 0.35, direction: 1, hp: 5, maxHp: 5, size: 90 },
      { id: 6, type: 'dragon', label: 'Jili Golden Dragon', emoji: '🐲', multiplier: 80, x: -10, y: 75, speed: 0.12, direction: 1, hp: 10, maxHp: 10, size: 120 }
    ];
    setFishList(initialFish);

    const interval = setInterval(() => {
      setFishList(prevList => 
        prevList.map(fish => {
          let nextX = fish.x + (fish.speed * fish.direction);
          // If swims completely off right side, warp back to left
          if (fish.direction === 1 && nextX > 115) {
            nextX = -15;
            fish.y = 15 + Math.random() * 65;
          }
          // If swims completely off left side, warp back to right
          if (fish.direction === -1 && nextX < -15) {
            nextX = 115;
            fish.y = 15 + Math.random() * 65;
          }
          return { ...fish, x: nextX };
        })
      );
    }, 45);

    return () => clearInterval(interval);
  }, []);

  // Tracks cursor position to rotate cannon base
  const handleFishingMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!fishingAreaRef.current) return;
    const rect = fishingAreaRef.current.getBoundingClientRect();
    const areaWidth = rect.width;
    const areaHeight = rect.height;

    // Cannon base is at bottom-center (X: 50%, Y: 96%)
    const cannonX = rect.left + areaWidth / 2;
    const cannonY = rect.top + areaHeight - 15;

    const deltaX = e.clientX - cannonX;
    const deltaY = e.clientY - cannonY;

    // Angle in degrees (restrict angle so cannon can't shoot backwards)
    let angleRad = Math.atan2(deltaY, deltaX);
    let angleDeg = (angleRad * 180) / Math.PI + 90; // offset so 0deg is straight up
    angleDeg = Math.max(-75, Math.min(75, angleDeg)); // Clamp rotation

    setCannonAngle(angleDeg);
  };

  // Shoots cannon and checks for hit/capture of clicked fish
  const handleFishingClick = async (e: React.MouseEvent<HTMLDivElement>, targetFish: Fish) => {
    if (fishingLoading) return;

    const cost = fishingBet;
    if (selectedMode === 'demo') {
      if (demoBalance < cost) {
        alert('Insufficient demo balance to shoot. / পর্যাপ্ত ডেমো ব্যালেন্স নেই।');
        return;
      }
      setDemoBalance(prev => +(prev - cost).toFixed(2));
    } else {
      if (!user) { onAuthTrigger(); return; }
      if (user.balance < cost) {
        alert('Insufficient wallet balance to shoot.');
        return;
      }
    }

    // Recoil effect
    setCannonRecoil(true);
    setTimeout(() => setCannonRecoil(false), 100);

    // Audio & local flash hit effect
    playSynthSound('shoot');
    setFishFlashed(targetFish.id);
    setTimeout(() => setFishFlashed(null), 150);

    setFishingLoading(true);

    try {
      let data;
      if (selectedMode === 'demo') {
        // Local simulation!
        await new Promise(resolve => setTimeout(resolve, 80));
        let caughtProbability = 0.40; // nemo
        if (targetFish.type === 'jellyfish') caughtProbability = 0.15;
        else if (targetFish.type === 'turtle') caughtProbability = 0.08;
        else if (targetFish.type === 'shark') caughtProbability = 0.04;
        else if (targetFish.type === 'dragon') caughtProbability = 0.015;

        const caught = Math.random() < caughtProbability;
        const winAmount = caught ? cost * targetFish.multiplier : 0;
        if (caught) {
          setDemoBalance(prev => +(prev + winAmount).toFixed(2));
        }
        data = { caught, winAmount };
      } else {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/games/fishing/shoot', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ betAmount: cost, fishType: targetFish.type })
        });
        data = await res.json();
        if (!res.ok) {
          alert(data.error || 'Server rejected shoot.');
          setFishingLoading(false);
          return;
        }
      }

      // Check if we caught the fish
      if (data.caught) {
        playSynthSound('explosion');
        setTimeout(() => playSynthSound('coin'), 120);

        // Get click location relative to container
        if (fishingAreaRef.current) {
          const rect = fishingAreaRef.current.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const clickY = e.clientY - rect.top;

          const newCoin: CoinSpray = {
            id: Date.now(),
            x: clickX,
            y: clickY,
            text: `+৳${data.winAmount.toFixed(0)} BDT (${targetFish.label} Captured!)`
          };
          setCoinSprays(prev => [...prev, newCoin]);

          // Clear coin spray message after 2 seconds
          setTimeout(() => {
            setCoinSprays(prev => prev.filter(c => c.id !== newCoin.id));
          }, 2000);
        }

        // Respawn the caught fish at the edge
        setFishList(prev => 
          prev.map(f => {
            if (f.id === targetFish.id) {
              return {
                ...f,
                x: f.direction === 1 ? -15 : 115,
                y: 15 + Math.random() * 65
              };
            }
            return f;
          })
        );
      } else {
        // Visual bubble splash at click site
        playSynthSound('click');
      }

      if (selectedMode !== 'demo') {
        // Trigger call to update global parent wallet BDT immediately
        onRefreshUser();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFishingLoading(false);
    }
  };


  // ==========================================
  // GAME 2: JILI FORTUNE SLOTS (5-REEL 5-PAYLINE GOLD EDITION)
  // ==========================================
  const [slotsBet, setSlotsBet] = useState<string>('100');
  const [slotsRolling, setSlotsRolling] = useState(false);
  const [slotsFeedback, setSlotsFeedback] = useState<string>('');
  const [reels, setReels] = useState<string[]>([
    '💎', '⭐', '🍋',
    '🔔', '🍒', '🍉',
    '💎', '⭐', '🔔'
  ]);
  const [activePaylineWins, setActivePaylineWins] = useState<number[]>([]); // indexes of winning paths

  const playSlotsSpin = async () => {
    const amt = parseFloat(slotsBet);
    if (isNaN(amt) || amt < 10) { alert('Minimum bet is ৳10'); return; }

    if (selectedMode === 'demo') {
      if (demoBalance < amt) { alert('Insufficient demo balance. / পর্যাপ্ত ডেমো ব্যালেন্স নেই।'); return; }
    } else {
      if (!user) { onAuthTrigger(); return; }
      if (user.balance < amt) { alert('Insufficient balance.'); return; }
    }

    setSlotsRolling(true);
    setSlotsFeedback('');
    setActivePaylineWins([]);
    playSynthSound('click');

    try {
      let data;
      if (selectedMode === 'demo') {
        await new Promise(resolve => setTimeout(resolve, 150));
        const ICONS = ['🍋', '🍒', '🍉', '🔔', '⭐', '💎'];
        const r1 = ICONS[Math.floor(Math.random() * ICONS.length)];
        const r2 = ICONS[Math.floor(Math.random() * ICONS.length)];
        const r3 = ICONS[Math.floor(Math.random() * ICONS.length)];
        const won = r1 === r2 && r2 === r3;
        let winMultiplier = 0;
        if (won) {
          if (r1 === '💎') winMultiplier = 50;
          else if (r1 === '⭐') winMultiplier = 20;
          else if (r1 === '🔔') winMultiplier = 10;
          else winMultiplier = 5;
        }
        const winAmount = amt * winMultiplier;
        setDemoBalance(prev => +(prev - amt + winAmount).toFixed(2));
        data = { reels: [r1, r2, r3], won, winAmount, msg: won ? `Triple ${r1}!` : '' };
      } else {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/games/slots', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ betAmount: amt })
        });
        data = await res.json();
        if (!res.ok) {
          setSlotsRolling(false);
          alert(data.error);
          return;
        }
      }

      let counter = 0;
      const ICONS = ['🍋', '🍒', '🍉', '🔔', '⭐', '💎'];
      
      // Rolling ticker effect
      const reelTick = setInterval(() => {
        setReels(Array.from({ length: 9 }, () => ICONS[Math.floor(Math.random() * ICONS.length)]));
        playSynthSound('click');
        counter++;
        if (counter > 15) {
          clearInterval(reelTick);
          // Construct a 3x3 layout. The server returns reels length 3. Let's map it cleanly
          const r1 = data.reels[0];
          const r2 = data.reels[1];
          const r3 = data.reels[2];
          
          // Replicate landing on reels
          const finalReels = [
            r1, r2, r3,
            r2, r3, r1,
            r3, r1, r2
          ];
          setReels(finalReels);
          setSlotsRolling(false);

          if (data.won) {
            playSynthSound('win');
            setSlotsFeedback(`WIN! ${data.msg} (+৳${data.winAmount.toFixed(2)})`);
            // Trigger multi-line visual highlight pathways
            setActivePaylineWins([1, 2, 4]); // middle, diagonal lines highlight!
          } else {
            playSynthSound('lose');
            setSlotsFeedback('Try Again! Fortune is close.');
          }
          if (selectedMode !== 'demo') {
            onRefreshUser();
          }
        }
      }, 80);
    } catch (e) {
      setSlotsRolling(false);
    }
  };


  // ==========================================
  // GAME 3: AVIATOR STYLE CRASH (LIGHT FIN-GRID EDITION)
  // ==========================================
  const [crashBet, setCrashBet] = useState<string>('100');
  const [targetCashout, setTargetCashout] = useState<string>('2.00');
  const [crashState, setCrashState] = useState<'idle' | 'running' | 'cashed_out' | 'crashed'>('idle');
  const [crashMultiplier, setCrashMultiplier] = useState<number>(1.00);
  const [planeCrashedAt, setPlaneCrashedAt] = useState<number>(1.00);
  const [crashWin, setCrashWin] = useState<number>(0);
  const [crashHistory, setCrashHistory] = useState<number[]>([1.88, 3.20, 1.05, 5.40, 1.15, 2.75]);
  const crashIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Flight Loop
  const startCrashFlight = async () => {
    const amt = parseFloat(crashBet);
    const target = parseFloat(targetCashout);

    if (isNaN(amt) || amt < 10) { alert('Minimum bet is ৳10'); return; }
    
    if (selectedMode === 'demo') {
      if (demoBalance < amt) { alert('Insufficient demo balance. / পর্যাপ্ত ডেমো ব্যালেন্স নেই।'); return; }
      setDemoBalance(prev => +(prev - amt).toFixed(2));
    } else {
      if (!user) { onAuthTrigger(); return; }
      if (user.balance < amt) { alert('Insufficient balance.'); return; }
    }

    setCrashState('running');
    setCrashMultiplier(1.00);
    setCrashWin(0);
    playSynthSound('shoot');

    try {
      let data;
      if (selectedMode === 'demo') {
        await new Promise(resolve => setTimeout(resolve, 100));
        // Simulate local crash point
        const instantCrash = Math.random() < 0.12;
        const finalCrashAt = instantCrash ? 1.00 : +(1.01 + Math.random() * 4.5).toFixed(2);
        const didWin = !instantCrash && target <= finalCrashAt;
        data = { crashMultiplier: finalCrashAt, won: didWin };
      } else {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/games/crash', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ betAmount: amt, targetMultiplier: target })
        });

        if (!res.ok) {
          const err = await res.json();
          alert(err.error || 'Server error starting game');
          setCrashState('idle');
          return;
        }
        data = await res.json();
      }

      const finalCrashAt = data.crashMultiplier;
      const didWin = data.won;
      setPlaneCrashedAt(finalCrashAt);

      let currentMult = 1.00;
      if (crashIntervalRef.current) clearInterval(crashIntervalRef.current);
      
      crashIntervalRef.current = setInterval(() => {
        currentMult += 0.012 * Math.pow(currentMult, 1.15);
        currentMult = +(currentMult).toFixed(2);

        if (currentMult >= finalCrashAt) {
          clearInterval(crashIntervalRef.current!);
          setCrashMultiplier(finalCrashAt);
          setCrashState('crashed');
          playSynthSound('explosion');
          setCrashHistory(prev => [finalCrashAt, ...prev.slice(0, 5)]);
          if (selectedMode !== 'demo') {
            onRefreshUser();
          }
        } else if (didWin && currentMult >= target) {
          clearInterval(crashIntervalRef.current!);
          setCrashMultiplier(target);
          setCrashState('cashed_out');
          playSynthSound('win');
          const payout = +(amt * target).toFixed(2);
          setCrashWin(payout);
          if (selectedMode === 'demo') {
            setDemoBalance(prev => +(prev + payout).toFixed(2));
          } else {
            onRefreshUser();
          }
        } else {
          setCrashMultiplier(currentMult);
          if (Math.floor(currentMult * 10) % 5 === 0) {
            playSynthSound('click');
          }
        }
      }, 50);

    } catch (e) {
      setCrashState('idle');
      alert('Network lost.');
    }
  };

  const manualCrashCashout = () => {
    if (crashState !== 'running') return;
    if (crashMultiplier < planeCrashedAt) {
      if (crashIntervalRef.current) clearInterval(crashIntervalRef.current);
      setCrashState('cashed_out');
      playSynthSound('win');
      const amt = parseFloat(crashBet);
      const winnings = +(amt * crashMultiplier).toFixed(2);
      setCrashWin(winnings);
      if (selectedMode === 'demo') {
        setDemoBalance(prev => +(prev + winnings).toFixed(2));
      } else {
        setTimeout(() => {
          onRefreshUser();
        }, 500);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (crashIntervalRef.current) clearInterval(crashIntervalRef.current);
    };
  }, []);


  // ==========================================
  // GAME 4: LUCKY SPIN WHEEL
  // ==========================================
  const [spinBet, setSpinBet] = useState<string>('100');
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinResultIndex, setSpinResultIndex] = useState<number>(-1);
  const [spinWinText, setSpinWinText] = useState<string>('');
  const [wheelRotation, setWheelRotation] = useState<number>(0);

  const spinWheelPlay = async () => {
    const amt = parseFloat(spinBet);
    if (isNaN(amt) || amt < 10) return;

    if (selectedMode === 'demo') {
      if (demoBalance < amt) { alert('Insufficient demo balance. / পর্যাপ্ত ডেমো ব্যালেন্স নেই।'); return; }
      setDemoBalance(prev => +(prev - amt).toFixed(2));
    } else {
      if (!user) { onAuthTrigger(); return; }
      if (user.balance < amt) { alert('Insufficient balance.'); return; }
    }

    setIsSpinning(true);
    setSpinResultIndex(-1);
    setSpinWinText('');
    playSynthSound('click');

    try {
      let data;
      if (selectedMode === 'demo') {
        await new Promise(resolve => setTimeout(resolve, 150));
        const segments = [
          { label: '0.1x Ref', multiplier: 0.1 },
          { label: '0.5x Ref', multiplier: 0.5 },
          { label: '1.5x Return', multiplier: 1.5 },
          { label: '3.0x Gold Mega', multiplier: 3.0 },
          { label: '0.0x Empty', multiplier: 0 },
          { label: '1.2x Star', multiplier: 1.2 },
          { label: '2.0x Double Up', multiplier: 2.0 },
          { label: '5.0x JACKPOT', multiplier: 5.0 }
        ];
        const idx = Math.floor(Math.random() * segments.length);
        const segment = segments[idx];
        const winAmount = +(amt * segment.multiplier).toFixed(2);
        setDemoBalance(prev => +(prev + winAmount).toFixed(2));
        data = { segmentIndex: idx, label: segment.label, winAmount };
      } else {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/games/spin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ betAmount: amt })
        });
        data = await res.json();
        if (!res.ok) {
          setIsSpinning(false);
          alert(data.error);
          return;
        }
      }

      const idx = data.segmentIndex;
      const segmentDegree = 360 - (idx * 45); 
      const targetRotation = 1800 + segmentDegree;

      setWheelRotation(targetRotation);
      setSpinResultIndex(idx);

      setTimeout(() => {
        setIsSpinning(false);
        setSpinWinText(`Result: ${data.label}! Gained ৳${data.winAmount}`);
        if (data.winAmount > 0) {
          playSynthSound('win');
        } else {
          playSynthSound('lose');
        }
        if (selectedMode !== 'demo') {
          onRefreshUser();
        }
      }, 3200); 
    } catch (e) {
      setIsSpinning(false);
    }
  };


  // ==========================================
  // GAME 5: OVER / UNDER DICE ROLL
  // ==========================================
  const [diceBet, setDiceBet] = useState<string>('100');
  const [diceGuess, setDiceGuess] = useState<'over' | 'under'>('over');
  const [diceTarget, setDiceTarget] = useState<number>(50);
  const [diceRolling, setDiceRolling] = useState(false);
  const [rolledDiceNum, setRolledDiceNum] = useState<number | null>(null);
  const [diceWinResult, setDiceWinResult] = useState<{ won: boolean; payout: number } | null>(null);

  const playDiceRoll = async () => {
    const amt = parseFloat(diceBet);
    if (isNaN(amt) || amt < 10) return;

    if (selectedMode === 'demo') {
      if (demoBalance < amt) { alert('Insufficient demo balance. / পর্যাপ্ত ডেমো ব্যালেন্স নেই।'); return; }
      setDemoBalance(prev => +(prev - amt).toFixed(2));
    } else {
      if (!user) { onAuthTrigger(); return; }
      if (user.balance < amt) { alert('Insufficient balance.'); return; }
    }

    setDiceRolling(true);
    setDiceWinResult(null);
    setRolledDiceNum(null);
    playSynthSound('click');

    try {
      let data;
      if (selectedMode === 'demo') {
        await new Promise(resolve => setTimeout(resolve, 150));
        const roll = Math.floor(1 + Math.random() * 100);
        let won = false;
        if (diceGuess === 'over' && roll > diceTarget) won = true;
        else if (diceGuess === 'under' && roll < diceTarget) won = true;
        const multiplier = diceGuess === 'over' ? (100 / (100 - diceTarget)) : (100 / diceTarget);
        const winAmount = won ? +(amt * multiplier * 0.98).toFixed(2) : 0;
        setDemoBalance(prev => +(prev + winAmount).toFixed(2));
        data = { roll, won, winAmount };
      } else {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/games/dice', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ betAmount: amt, guess: diceGuess, target: diceTarget })
        });
        data = await res.json();
        if (!res.ok) {
          setDiceRolling(false);
          alert(data.error);
          return;
        }
      }

      let count = 0;
      const tick = setInterval(() => {
        setRolledDiceNum(Math.floor(1 + Math.random() * 100));
        playSynthSound('click');
        count++;
        if (count > 12) {
          clearInterval(tick);
          setRolledDiceNum(data.roll);
          setDiceRolling(false);
          setDiceWinResult({ won: data.won, payout: data.winAmount });
          if (data.won) {
            playSynthSound('win');
          } else {
            playSynthSound('lose');
          }
          if (selectedMode !== 'demo') {
            onRefreshUser();
          }
        }
      }, 70);
    } catch (e) {
      setDiceRolling(false);
    }
  };


  // ==========================================
  // GAME 6: ROULETTE (IVORY LIGHT TRACK)
  // ==========================================
  const [rouletteBet, setRouletteBet] = useState<string>('100');
  const [rouletteColor, setRouletteColor] = useState<'red' | 'black' | 'green'>('red');
  const [rouletteSpinning, setRouletteSpinning] = useState(false);
  const [rouletteResult, setRouletteResult] = useState<{ num: number; color: string; won: boolean; payout: number } | null>(null);

  const playRouletteSpin = async () => {
    const amt = parseFloat(rouletteBet);
    if (isNaN(amt) || amt < 10) return;

    if (selectedMode === 'demo') {
      if (demoBalance < amt) { alert('Insufficient demo balance. / পর্যাপ্ত ডেমো ব্যালেন্স নেই।'); return; }
      setDemoBalance(prev => +(prev - amt).toFixed(2));
    } else {
      if (!user) { onAuthTrigger(); return; }
      if (user.balance < amt) { alert('Insufficient balance.'); return; }
    }

    setRouletteSpinning(true);
    setRouletteResult(null);
    playSynthSound('click');

    try {
      let data;
      if (selectedMode === 'demo') {
        await new Promise(resolve => setTimeout(resolve, 150));
        const num = Math.floor(Math.random() * 37);
        let color = 'green';
        if (num > 0) {
          const redNumbers = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
          color = redNumbers.includes(num) ? 'red' : 'black';
        }
        const won = rouletteColor === color;
        const mult = rouletteColor === 'green' ? 14 : 2;
        const winAmount = won ? +(amt * mult).toFixed(2) : 0;
        setDemoBalance(prev => +(prev + winAmount).toFixed(2));
        data = { number: num, color, won, winAmount };
      } else {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/games/roulette', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ betAmount: amt, betType: rouletteColor })
        });
        data = await res.json();
        if (!res.ok) {
          setRouletteSpinning(false);
          alert(data.error);
          return;
        }
      }

      setTimeout(() => {
        setRouletteSpinning(false);
        setRouletteResult({ num: data.number, color: data.color, won: data.won, payout: data.winAmount });
        if (data.won) {
          playSynthSound('win');
        } else {
          playSynthSound('lose');
        }
        if (selectedMode !== 'demo') {
          onRefreshUser();
        }
      }, 1600);
    } catch (e) {
      setRouletteSpinning(false);
    }
  };


  // ==========================================
  // GAME 7: MINES (POLISHED GLASS TILES)
  // ==========================================
  const [minesBet, setMinesBet] = useState<string>('100');
  const [minesCount, setMinesCount] = useState<number>(3);
  const [minesState, setMinesState] = useState<'idle' | 'playing' | 'lost' | 'cashed_out'>('idle');
  const [minesRevealed, setMinesRevealed] = useState<number[]>([]);
  const [minesGrid, setMinesGrid] = useState<(boolean | null)[]>(Array(25).fill(null));
  const [minesMultiplier, setMinesMultiplier] = useState<number>(1.00);
  const [minesWin, setMinesWin] = useState<number>(0);
  const [minesLoading, setMinesLoading] = useState<boolean>(false);
  const [demoMinesList, setDemoMinesList] = useState<number[]>([]);

  const startMinesGame = async () => {
    const amt = parseFloat(minesBet);
    if (isNaN(amt) || amt < 10) { alert('Minimum bet is ৳10'); return; }

    if (selectedMode === 'demo') {
      if (demoBalance < amt) { alert('Insufficient demo balance. / পর্যাপ্ত ডেমো ব্যালেন্স নেই।'); return; }
      setDemoBalance(prev => +(prev - amt).toFixed(2));
    } else {
      if (!user) { onAuthTrigger(); return; }
      if (user.balance < amt) { alert('Insufficient balance.'); return; }
    }

    setMinesLoading(true);
    playSynthSound('click');
    try {
      if (selectedMode === 'demo') {
        await new Promise(resolve => setTimeout(resolve, 150));
        // Generate random mines
        const minesSet = new Set<number>();
        while (minesSet.size < minesCount) {
          minesSet.add(Math.floor(Math.random() * 25));
        }
        setDemoMinesList(Array.from(minesSet));
        
        setMinesState('playing');
        setMinesRevealed([]);
        setMinesGrid(Array(25).fill(null));
        setMinesMultiplier(1.00);
        setMinesWin(0);
      } else {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/games/mines/start', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ betAmount: amt, minesCount })
        });
        const data = await res.json();
        if (res.ok) {
          setMinesState('playing');
          setMinesRevealed([]);
          setMinesGrid(Array(25).fill(null));
          setMinesMultiplier(1.00);
          setMinesWin(0);
          onRefreshUser();
        } else {
          alert(data.error);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setMinesLoading(false);
    }
  };

  const revealMinesCell = async (index: number) => {
    if (minesState !== 'playing' || minesLoading) return;
    setMinesLoading(true);
    try {
      if (selectedMode === 'demo') {
        await new Promise(resolve => setTimeout(resolve, 100));
        const amt = parseFloat(minesBet);
        if (demoMinesList.includes(index)) {
          // Mine hit!
          setMinesState('lost');
          const finalGrid = Array(25).fill(false).map((_, i) => demoMinesList.includes(i) ? true : null);
          setMinesGrid(finalGrid);
          playSynthSound('explosion');
        } else {
          // Safe cell!
          playSynthSound('coin');
          const nextRevealed = [...minesRevealed, index];
          setMinesRevealed(nextRevealed);
          const nextGrid = [...minesGrid];
          nextGrid[index] = false;
          setMinesGrid(nextGrid);
          
          const s = nextRevealed.length;
          const safeRemaining = 25 - minesCount;
          let mult = 1.00;
          for (let i = 0; i < s; i++) {
            mult *= (25 - i) / (safeRemaining - i);
          }
          mult = +(mult * 0.98).toFixed(2);
          
          setMinesMultiplier(mult);
          setMinesWin(+(amt * mult).toFixed(2));
        }
      } else {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/games/mines/reveal', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ index })
        });
        const data = await res.json();
        if (res.ok) {
          if (data.mineHit) {
            setMinesState('lost');
            setMinesGrid(data.grid);
            playSynthSound('explosion');
            onRefreshUser();
          } else {
            playSynthSound('coin');
            setMinesRevealed(data.revealed);
            const nextGrid = [...minesGrid];
            nextGrid[index] = false;
            setMinesGrid(nextGrid);
            setMinesMultiplier(data.multiplier);
            setMinesWin(data.potentialPayout);
          }
        } else {
          alert(data.error);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setMinesLoading(false);
    }
  };

  const cashoutMinesGame = async () => {
    if (minesState !== 'playing' || minesLoading) return;
    setMinesLoading(true);
    try {
      if (selectedMode === 'demo') {
        await new Promise(resolve => setTimeout(resolve, 150));
        setMinesState('cashed_out');
        const finalGrid = Array(25).fill(false).map((_, i) => demoMinesList.includes(i) ? true : false);
        setMinesGrid(finalGrid);
        setDemoBalance(prev => +(prev + minesWin).toFixed(2));
        playSynthSound('win');
      } else {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/games/mines/cashout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await res.json();
        if (res.ok) {
          setMinesState('cashed_out');
          setMinesGrid(data.grid);
          setMinesMultiplier(data.multiplier);
          setMinesWin(data.winAmount);
          playSynthSound('win');
          onRefreshUser();
        } else {
          alert(data.error);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setMinesLoading(false);
    }
  };


  // ==========================================
  // GAME 8: BLACKJACK (TWENTY-ONE TEAL BOARD)
  // ==========================================
  interface BJCard {
    suit: string;
    value: string;
    score: number;
  }
  const calculateBlackjackScore = (cards: BJCard[]): number => {
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

  const [bjBet, setBjBet] = useState<string>('100');
  const [bjState, setBjState] = useState<'idle' | 'playing' | 'player_won' | 'dealer_won' | 'push' | 'busted' | 'blackjack' | 'loading'>('idle');
  const [bjPlayerCards, setBjPlayerCards] = useState<BJCard[]>([]);
  const [bjDealerCards, setBjDealerCards] = useState<BJCard[]>([]);
  const [bjPlayerScore, setBjPlayerScore] = useState<number>(0);
  const [bjDealerScoreShown, setBjDealerScoreShown] = useState<number>(0);
  const [bjMsg, setBjMsg] = useState<string>('');
  const [localBjDeck, setLocalBjDeck] = useState<BJCard[]>([]);

  const dealBlackjack = async () => {
    const amt = parseFloat(bjBet);
    if (isNaN(amt) || amt < 10) { alert('Minimum bet is ৳10'); return; }

    if (selectedMode === 'demo') {
      if (demoBalance < amt) { alert('Insufficient demo balance. / পর্যাপ্ত ডেমো ব্যালেন্স নেই।'); return; }
      setDemoBalance(prev => +(prev - amt).toFixed(2));
    } else {
      if (!user) { onAuthTrigger(); return; }
      if (user.balance < amt) { alert('Insufficient balance.'); return; }
    }

    setBjState('loading');
    setBjMsg('');
    playSynthSound('card');
    try {
      if (selectedMode === 'demo') {
        await new Promise(resolve => setTimeout(resolve, 300));
        // Create 4-deck shoe
        const suits = ['♠', '♥', '♦', '♣'];
        const values = [
          { val: '2', score: 2 }, { val: '3', score: 3 }, { val: '4', score: 4 },
          { val: '5', score: 5 }, { val: '6', score: 6 }, { val: '7', score: 7 },
          { val: '8', score: 8 }, { val: '9', score: 9 }, { val: '10', score: 10 },
          { val: 'J', score: 10 }, { val: 'Q', score: 10 }, { val: 'K', score: 10 },
          { val: 'A', score: 11 }
        ];
        const rawDeck: BJCard[] = [];
        for (let i = 0; i < 4; i++) {
          for (const s of suits) {
            for (const v of values) {
              rawDeck.push({ suit: s, value: v.val, score: v.score });
            }
          }
        }
        // Shuffle
        for (let i = rawDeck.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [rawDeck[i], rawDeck[j]] = [rawDeck[j], rawDeck[i]];
        }
        
        const pCards = [rawDeck.pop()!, rawDeck.pop()!];
        const dCards = [rawDeck.pop()!, rawDeck.pop()!];
        setLocalBjDeck(rawDeck);
        
        setBjPlayerCards(pCards);
        setBjDealerCards(dCards);
        
        const pScore = calculateBlackjackScore(pCards);
        const dScore = calculateBlackjackScore(dCards);
        setBjPlayerScore(pScore);
        
        if (pScore === 21) {
          if (dScore === 21) {
            setBjState('push');
            setBjMsg('Push! Both have Blackjack. / পুশ! ডিলার এবং প্লেয়ার দুজনেরই ব্ল্যাকজ্যাক।');
            setDemoBalance(prev => +(prev + amt).toFixed(2));
            playSynthSound('lose');
          } else {
            setBjState('blackjack');
            setBjMsg('Blackjack! You win 2.5x! / ব্ল্যাকজ্যাক! আপনি পেয়েছেন ২.৫ গুণ!');
            setDemoBalance(prev => +(prev + amt * 2.5).toFixed(2));
            playSynthSound('win');
          }
        } else {
          setBjState('playing');
          setBjDealerScoreShown(dCards[0].score);
        }
      } else {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/games/blackjack/deal', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ betAmount: amt })
        });
        const data = await res.json();
        if (res.ok) {
          setBjPlayerCards(data.playerCards);
          setBjDealerCards(data.dealerCards);
          setBjPlayerScore(data.playerScore);
          if (data.status === 'blackjack' || data.status === 'push') {
            setBjState(data.status);
            setBjMsg(data.msg);
            if (data.status === 'blackjack') playSynthSound('win');
            else playSynthSound('lose');
          } else {
            setBjState('playing');
            setBjDealerScoreShown(data.dealerScoreShown);
          }
          onRefreshUser();
        } else {
          alert(data.error);
          setBjState('idle');
        }
      }
    } catch (e) {
      console.error(e);
      setBjState('idle');
    }
  };

  const hitBlackjack = async () => {
    if (bjState !== 'playing') return;
    setBjState('loading');
    playSynthSound('card');
    try {
      if (selectedMode === 'demo') {
        await new Promise(resolve => setTimeout(resolve, 200));
        const deck = [...localBjDeck];
        const newCard = deck.pop()!;
        setLocalBjDeck(deck);
        const nextCards = [...bjPlayerCards, newCard];
        setBjPlayerCards(nextCards);
        
        const pScore = calculateBlackjackScore(nextCards);
        setBjPlayerScore(pScore);
        
        if (pScore > 21) {
          setBjState('busted');
          setBjMsg('Busted! Score exceeds 21. / বাস্টেড! আপনি হেরে গেছেন।');
          playSynthSound('lose');
        } else {
          setBjState('playing');
        }
      } else {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/games/blackjack/hit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await res.json();
        if (res.ok) {
          setBjPlayerCards(data.playerCards);
          setBjPlayerScore(data.playerScore);
          if (data.status === 'busted') {
            setBjState('busted');
            setBjDealerCards(data.dealerCards);
            setBjMsg(data.msg);
            playSynthSound('lose');
          } else {
            setBjState('playing');
          }
          onRefreshUser();
        } else {
          alert(data.error);
          setBjState('playing');
        }
      }
    } catch (e) {
      console.error(e);
      setBjState('playing');
    }
  };

  const standBlackjack = async () => {
    if (bjState !== 'playing') return;
    setBjState('loading');
    playSynthSound('click');
    try {
      if (selectedMode === 'demo') {
        await new Promise(resolve => setTimeout(resolve, 400));
        const amt = parseFloat(bjBet);
        let deck = [...localBjDeck];
        const dCards = [...bjDealerCards];
        
        let dScore = calculateBlackjackScore(dCards);
        while (dScore < 17) {
          dCards.push(deck.pop()!);
          dScore = calculateBlackjackScore(dCards);
        }
        setLocalBjDeck(deck);
        setBjDealerCards(dCards);
        setBjDealerScoreShown(dScore);
        
        const pScore = bjPlayerScore;
        if (dScore > 21) {
          setBjState('player_won');
          setBjMsg('Player wins! Dealer busted. / আপনি জিতেছেন! ডিলার বাস্টেড।');
          setDemoBalance(prev => +(prev + amt * 2).toFixed(2));
          playSynthSound('win');
        } else if (pScore > dScore) {
          setBjState('player_won');
          setBjMsg('Player wins! / আপনি জিতেছেন!');
          setDemoBalance(prev => +(prev + amt * 2).toFixed(2));
          playSynthSound('win');
        } else if (pScore === dScore) {
          setBjState('push');
          setBjMsg('Push! Hands are equal. / পুশ! ড্র হয়েছে।');
          setDemoBalance(prev => +(prev + amt).toFixed(2));
          playSynthSound('lose');
        } else {
          setBjState('dealer_won');
          setBjMsg('Dealer wins. / ডিলার জিতেছেন।');
          playSynthSound('lose');
        }
      } else {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/games/blackjack/stand', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await res.json();
        if (res.ok) {
          setBjPlayerCards(data.playerCards);
          setBjDealerCards(data.dealerCards);
          setBjPlayerScore(data.playerScore);
          setBjDealerScoreShown(data.dealerScore);
          setBjState(data.status);
          setBjMsg(data.msg);
          if (data.status === 'player_won') {
            playSynthSound('win');
          } else {
            playSynthSound('lose');
          }
          onRefreshUser();
        } else {
          alert(data.error);
          setBjState('playing');
        }
      }
    } catch (e) {
      console.error(e);
      setBjState('playing');
    }
  };


  // ==========================================
  // GAME 9: PLINKO (SOFT MINT DECK)
  // ==========================================
  const [plinkoBet, setPlinkoBet] = useState<string>('100');
  const [plinkoRisk, setPlinkoRisk] = useState<'low' | 'medium' | 'high'>('medium');
  const [plinkoDropping, setPlinkoDropping] = useState<boolean>(false);
  const [plinkoPath, setPlinkoPath] = useState<number[]>([]);
  const [plinkoBucket, setPlinkoBucket] = useState<number | null>(null);
  const [plinkoMult, setPlinkoMult] = useState<number | null>(null);
  const [plinkoWin, setPlinkoWin] = useState<number | null>(null);

  const playPlinko = async () => {
    const amt = parseFloat(plinkoBet);
    if (isNaN(amt) || amt < 10) { alert('Minimum bet is ৳10'); return; }

    if (selectedMode === 'demo') {
      if (demoBalance < amt) { alert('Insufficient demo balance. / পর্যাপ্ত ডেমো ব্যালেন্স নেই।'); return; }
      setDemoBalance(prev => +(prev - amt).toFixed(2));
    } else {
      if (!user) { onAuthTrigger(); return; }
      if (user.balance < amt) { alert('Insufficient balance.'); return; }
    }

    setPlinkoDropping(true);
    setPlinkoBucket(null);
    setPlinkoMult(null);
    setPlinkoWin(null);
    setPlinkoPath([]);
    playSynthSound('click');

    try {
      let data;
      if (selectedMode === 'demo') {
        await new Promise(resolve => setTimeout(resolve, 150));
        // Simulate Peg Path
        const path: number[] = [];
        for (let i = 0; i < 8; i++) {
          path.push(Math.random() < 0.5 ? 0 : 1);
        }
        const bucketIndex = path.reduce((sum, val) => sum + val, 0);
        const mults = {
          low: [5.6, 1.6, 1.1, 1.0, 0.5, 1.0, 1.1, 1.6, 5.6],
          medium: [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
          high: [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29]
        };
        const multiplier = mults[plinkoRisk][bucketIndex];
        const winAmount = +(amt * multiplier).toFixed(2);
        setDemoBalance(prev => +(prev + winAmount).toFixed(2));
        data = { path, bucketIndex, multiplier, winAmount };
      } else {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/games/plinko', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ betAmount: amt, risk: plinkoRisk })
        });
        data = await res.json();
        if (!res.ok) {
          alert(data.error);
          setPlinkoDropping(false);
          return;
        }
      }

      let i = 0;
      const interval = setInterval(() => {
        setPlinkoPath(prev => [...prev, data.path[i]]);
        playSynthSound('click');
        i++;
        if (i >= data.path.length) {
          clearInterval(interval);
          setPlinkoBucket(data.bucketIndex);
          setPlinkoMult(data.multiplier);
          setPlinkoWin(data.winAmount);
          setPlinkoDropping(false);
          if (data.winAmount >= amt) {
            playSynthSound('win');
          } else {
            playSynthSound('lose');
          }
          if (selectedMode !== 'demo') {
            onRefreshUser();
          }
        }
      }, 110);
    } catch (e) {
      console.error(e);
      setPlinkoDropping(false);
    }
  };

  const playSuperAceSpin = async () => {
    if (superAceSpinning) return;

    const amt = parseFloat(superAceBet);
    if (isNaN(amt) || amt < 10) {
      alert('Minimum wager is ৳10 BDT');
      return;
    }

    if (selectedMode === 'demo') {
      if (demoBalance < amt) {
        alert('Insufficient demo balance. / পর্যাপ্ত ডেমো ব্যালেন্স নেই।');
        return;
      }
      setDemoBalance(prev => +(prev - amt).toFixed(2));
    } else {
      if (!user) {
        onAuthTrigger();
        return;
      }
      if (user.balance < amt) {
        alert('Insufficient balance / অপর্যাপ্ত ব্যালেন্স');
        return;
      }
    }

    setSuperAceSpinning(true);
    setSuperAceWinningCoords([]);
    setSuperAceTotalWin(null);
    setSuperAceLog([]);
    setSuperAceMultiplier(1);
    playSynthSound('click');

    try {
      let data;
      if (selectedMode === 'demo') {
        await new Promise(resolve => setTimeout(resolve, 150));
        const totalMult = Math.random() < 0.4 ? +(1 + Math.random() * 8).toFixed(1) : 0;
        const SYMBOLS_POOL = ['A', 'K', 'Q', 'J', '10', 'W', 'S', 'GA', 'GK', 'GQ', 'GJ', 'G10'];
        const getRandomGrid = () => Array.from({ length: 4 }, () =>
          Array.from({ length: 5 }, () => SYMBOLS_POOL[Math.floor(Math.random() * SYMBOLS_POOL.length)])
        );
        const grid1 = getRandomGrid();
        const grid2 = getRandomGrid();
        
        if (totalMult === 0) {
          data = {
            cascades: [
              { grid: grid1, multiplier: 1, winningCoords: [], ways: [] }
            ],
            totalWin: 0
          };
        } else {
          const totalWin = +(amt * totalMult).toFixed(2);
          setDemoBalance(prev => +(prev + totalWin).toFixed(2));
          data = {
            cascades: [
              { grid: grid1, multiplier: 1, winningCoords: [[0, 0], [0, 1], [0, 2]], ways: ['Match Aces 3-of-a-kind'] },
              { grid: grid2, multiplier: 2, winningCoords: [], ways: [] }
            ],
            totalWin
          };
        }
      } else {
        const response = await fetch('/api/games/super_ace/spin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ betAmount: amt })
        });
        data = await response.json();
        if (!response.ok) {
          alert(data.error || 'Failed to connect to games server.');
          setSuperAceSpinning(false);
          return;
        }
      }

      // Animate grid spinning (shake it, cycle cards random style)
      let shuffleCounter = 0;
      const SYMBOLS_POOL = ['A', 'K', 'Q', 'J', '10', 'W', 'S', 'GA', 'GK', 'GQ', 'GJ', 'G10'];
      const interval = setInterval(() => {
        setSuperAceGrid(
          Array.from({ length: 4 }, () =>
            Array.from({ length: 5 }, () => SYMBOLS_POOL[Math.floor(Math.random() * SYMBOLS_POOL.length)])
          )
        );
        shuffleCounter++;
        if (shuffleCounter > 12) {
          clearInterval(interval);
          proceedWithCascades(data);
        }
      }, 80);
    } catch (e) {
      console.error(e);
      setSuperAceSpinning(false);
    }
  };

  const proceedWithCascades = async (data: any) => {
    const steps = data.cascades;
    if (!steps || steps.length === 0) {
      setSuperAceSpinning(false);
      return;
    }

    // Process each cascade sequentially with delays
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      setSuperAceGrid(step.grid);
      setSuperAceMultiplier(step.multiplier);
      
      if (step.winningCoords && step.winningCoords.length > 0) {
        setSuperAceWinningCoords(step.winningCoords);
        if (step.ways && step.ways.length > 0) {
          setSuperAceLog(prev => [...prev, `[Mult x${step.multiplier}] ` + step.ways.join(', ')]);
        }
        playSynthSound('win');
        // Wait to show winning highlights
        await new Promise(resolve => setTimeout(resolve, 1400));
      } else {
        setSuperAceWinningCoords([]);
        if (i === 0) {
          playSynthSound('lose');
          setSuperAceLog(prev => [...prev, 'No matches found this spin. Try again!']);
        }
      }
    }

    setSuperAceWinningCoords([]);
    setSuperAceTotalWin(data.totalWin);
    setSuperAceSpinning(false);
    if (selectedMode !== 'demo') {
      onRefreshUser();
    }
  };


  return (
    <div className="space-y-6 px-4 max-w-7xl mx-auto w-full text-slate-800">
      
      {/* HEADER SECTION WITH USER STATS & VOLUME */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center space-x-3.5">
          <div className="h-12 w-12 rounded-2xl bg-[#1FA66A]/10 flex items-center justify-center text-xl">
            🎰
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-1.5">
              JILI Premium Game Arena
              <span className="text-[10px] bg-amber-500/10 text-amber-600 font-extrabold uppercase px-2 py-0.5 rounded-full border border-amber-500/20">
                ⭐ Light Mode
              </span>
            </h2>
            <p className="text-xs text-slate-500 font-semibold">Fully certified, server-authoritative fair play.</p>
          </div>
        </div>

        <div className="flex items-center space-x-3.5 w-full md:w-auto justify-between md:justify-end">
          {user && (
            <div className="bg-[#1FA66A]/5 border border-[#1FA66A]/10 px-4.5 py-2 rounded-2xl flex items-center space-x-3">
              <span className="text-xs font-black text-[#1FA66A] uppercase font-mono">My Balance:</span>
              <span className="text-sm font-black text-slate-900 font-mono">৳{user.balance.toFixed(2)}</span>
            </div>
          )}
          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              playSynthSound('click');
            }}
            className="h-10 w-10 flex items-center justify-center rounded-xl border border-slate-200/80 bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
            title="Toggle Sound Effects"
          >
            {soundEnabled ? <Volume2 className="h-4.5 w-4.5" /> : <VolumeX className="h-4.5 w-4.5" />}
          </button>
        </div>
      </div>

      {/* GAMES SUB-TABS SELECTOR */}
      <div className="grid grid-cols-4 sm:grid-cols-10 gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200/80">
        <button
          onClick={() => { setActiveGame('fishing'); playSynthSound('click'); }}
          className={`flex flex-col items-center justify-center py-3.5 rounded-xl text-[11px] font-black tracking-tight transition-all duration-200 ${
            activeGame === 'fishing' ? 'bg-[#1FA66A] text-white shadow-md shadow-[#1FA66A]/10' : 'text-slate-600 hover:text-slate-900 hover:bg-white/90'
          }`}
        >
          <span className="text-xl mb-1">🌊</span>
          <span>Jili Fishing</span>
        </button>

        <button
          onClick={() => { setActiveGame('slots'); playSynthSound('click'); }}
          className={`flex flex-col items-center justify-center py-3.5 rounded-xl text-[11px] font-black tracking-tight transition-all duration-200 ${
            activeGame === 'slots' ? 'bg-[#1FA66A] text-white shadow-md shadow-[#1FA66A]/10' : 'text-slate-600 hover:text-slate-900 hover:bg-white/90'
          }`}
        >
          <span className="text-xl mb-1">🎰</span>
          <span>Jili Slots</span>
        </button>

        <button
          onClick={() => {
            setActiveGame('crash');
            if (crashState !== 'running') {
              setAviatorPlayMode('choice');
            }
            playSynthSound('click');
          }}
          className={`flex flex-col items-center justify-center py-3.5 rounded-xl text-[11px] font-black tracking-tight transition-all duration-200 ${
            activeGame === 'crash' ? 'bg-[#1FA66A] text-white shadow-md shadow-[#1FA66A]/10' : 'text-slate-600 hover:text-slate-900 hover:bg-white/90'
          }`}
        >
          <span className="text-xl mb-1">🚀</span>
          <span>Aviator</span>
        </button>

        <button
          onClick={() => { setActiveGame('spin'); playSynthSound('click'); }}
          className={`flex flex-col items-center justify-center py-3.5 rounded-xl text-[11px] font-black tracking-tight transition-all duration-200 ${
            activeGame === 'spin' ? 'bg-[#1FA66A] text-white shadow-md shadow-[#1FA66A]/10' : 'text-slate-600 hover:text-slate-900 hover:bg-white/90'
          }`}
        >
          <span className="text-xl mb-1">🎡</span>
          <span>Lucky Wheel</span>
        </button>

        <button
          onClick={() => { setActiveGame('dice'); playSynthSound('click'); }}
          className={`flex flex-col items-center justify-center py-3.5 rounded-xl text-[11px] font-black tracking-tight transition-all duration-200 ${
            activeGame === 'dice' ? 'bg-[#1FA66A] text-white shadow-md shadow-[#1FA66A]/10' : 'text-slate-600 hover:text-slate-900 hover:bg-white/90'
          }`}
        >
          <span className="text-xl mb-1">🎲</span>
          <span>Dice Over</span>
        </button>

        <button
          onClick={() => { setActiveGame('roulette'); playSynthSound('click'); }}
          className={`flex flex-col items-center justify-center py-3.5 rounded-xl text-[11px] font-black tracking-tight transition-all duration-200 ${
            activeGame === 'roulette' ? 'bg-[#1FA66A] text-white shadow-md shadow-[#1FA66A]/10' : 'text-slate-600 hover:text-slate-900 hover:bg-white/90'
          }`}
        >
          <span className="text-xl mb-1">🟢</span>
          <span>Roulette</span>
        </button>

        <button
          onClick={() => { setActiveGame('mines'); playSynthSound('click'); }}
          className={`flex flex-col items-center justify-center py-3.5 rounded-xl text-[11px] font-black tracking-tight transition-all duration-200 ${
            activeGame === 'mines' ? 'bg-[#1FA66A] text-white shadow-md shadow-[#1FA66A]/10' : 'text-slate-600 hover:text-slate-900 hover:bg-white/90'
          }`}
        >
          <span className="text-xl mb-1">💣</span>
          <span>Mines</span>
        </button>

        <button
          onClick={() => { setActiveGame('blackjack'); playSynthSound('click'); }}
          className={`flex flex-col items-center justify-center py-3.5 rounded-xl text-[11px] font-black tracking-tight transition-all duration-200 ${
            activeGame === 'blackjack' ? 'bg-[#1FA66A] text-white shadow-md shadow-[#1FA66A]/10' : 'text-slate-600 hover:text-slate-900 hover:bg-white/90'
          }`}
        >
          <span className="text-xl mb-1">🃏</span>
          <span>Blackjack</span>
        </button>

        <button
          onClick={() => { setActiveGame('plinko'); playSynthSound('click'); }}
          className={`flex flex-col items-center justify-center py-3.5 rounded-xl text-[11px] font-black tracking-tight transition-all duration-200 ${
            activeGame === 'plinko' ? 'bg-[#1FA66A] text-white shadow-md shadow-[#1FA66A]/10' : 'text-slate-600 hover:text-slate-900 hover:bg-white/90'
          }`}
        >
          <span className="text-xl mb-1">🛕</span>
          <span>Plinko</span>
        </button>

        <button
          onClick={() => {
            setActiveGame('super_ace');
            if (!superAceSpinning) {
              setSuperAcePlayMode('choice');
            }
            playSynthSound('click');
          }}
          className={`flex flex-col items-center justify-center py-3.5 rounded-xl text-[11px] font-black tracking-tight transition-all duration-200 ${
            activeGame === 'super_ace' ? 'bg-[#1FA66A] text-white shadow-md shadow-[#1FA66A]/10' : 'text-slate-600 hover:text-slate-900 hover:bg-white/90'
          }`}
        >
          <span className="text-xl mb-1">👑</span>
          <span>Super Ace</span>
        </button>
      </div>

      {/* MAIN DYNAMIC GAME CONTAINER */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 overflow-hidden min-h-[420px]">
        <AnimatePresence mode="wait">
          
          {/* ==========================================
              GAME 1: JILI OCEAN KING FISHING
             ========================================== */}
          {activeGame === 'fishing' && (
            <motion.div
              key="fishing"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="grid grid-cols-1 lg:grid-cols-4 gap-6"
            >
              {/* Interactive Fishing Aquarium Canvas */}
              <div 
                ref={fishingAreaRef}
                onMouseMove={handleFishingMouseMove}
                className="lg:col-span-3 bg-gradient-to-b from-[#EBF8FF] via-[#F0F9FF] to-[#DBF4FF] border border-sky-100 rounded-2xl relative h-96 overflow-hidden select-none cursor-crosshair shadow-inner"
              >
                {/* Bubble backgrounds */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-[#DDF2FF] via-transparent to-transparent opacity-60 pointer-events-none" />

                {/* Grid guidelines to feel like high-tech Jili UI */}
                <div className="absolute inset-0 grid grid-cols-6 grid-rows-4 pointer-events-none opacity-[0.04]">
                  {Array.from({ length: 24 }).map((_, i) => (
                    <div key={i} className="border border-sky-800" />
                  ))}
                </div>

                {/* Aquatic background decorations */}
                <div className="absolute bottom-2 left-6 text-2xl opacity-45 pointer-events-none">🌿</div>
                <div className="absolute bottom-3 left-12 text-3xl opacity-35 pointer-events-none animate-pulse">🌿</div>
                <div className="absolute bottom-2 right-8 text-2xl opacity-40 pointer-events-none">🌿</div>

                {/* Swimming animated fish */}
                {fishList.map(fish => {
                  const isFlashed = fishFlashed === fish.id;
                  return (
                    <button
                      key={fish.id}
                      onClick={(e) => handleFishingClick(e, fish)}
                      style={{ 
                        left: `${fish.x}%`, 
                        top: `${fish.y}%`, 
                        width: `${fish.size}px`, 
                        height: `${fish.size}px` 
                      }}
                      className="absolute origin-center flex flex-col items-center justify-center transition-all duration-75 focus:outline-none hover:scale-110 active:scale-95 group"
                    >
                      {/* Swimming Ripple ring */}
                      <span className="absolute inset-0 rounded-full bg-sky-400/10 animate-ping group-hover:bg-sky-400/20 scale-75" />

                      {/* Actual fish image representation (flipped depending on direction) */}
                      <span 
                        style={{ transform: `scaleX(${fish.direction})` }}
                        className={`text-3xl sm:text-4xl block select-none drop-shadow-md transition-all duration-75 ${
                          isFlashed ? 'brightness-200 saturate-200 scale-125 rotate-6' : 'animate-bounce'
                        }`}
                      >
                        {fish.emoji}
                      </span>

                      {/* Mini HP bar & multiplier label */}
                      <span className="absolute -bottom-4 bg-slate-900/60 backdrop-blur-md text-[8px] font-black text-white px-2 py-0.5 rounded-full font-mono scale-90 tracking-tighter">
                        {fish.label} ({fish.multiplier}x)
                      </span>
                    </button>
                  );
                })}

                {/* Coin float/explosion spray notifications */}
                <AnimatePresence>
                  {coinSprays.map(c => (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, y: c.y, scale: 0.5 }}
                      animate={{ opacity: 1, y: c.y - 60, scale: 1.1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="absolute z-20 pointer-events-none bg-amber-50 border border-amber-200 rounded-2xl p-2.5 shadow-lg flex items-center space-x-1.5"
                      style={{ left: c.x - 60 }}
                    >
                      <span className="text-xl">💰</span>
                      <span className="text-[10px] font-black text-amber-700 font-mono tracking-tight whitespace-nowrap">
                        {c.text}
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Rotatable Cannon Gun at the bottom-center */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center">
                  {/* Gun Turret Barrel */}
                  <motion.div 
                    style={{ rotate: cannonAngle }}
                    animate={cannonRecoil ? { scale: 0.85, y: 5 } : { scale: 1, y: 0 }}
                    className="h-16 w-8 bg-gradient-to-t from-slate-700 via-slate-800 to-amber-500 rounded-t-xl origin-bottom shadow-lg border-x border-slate-600 relative flex items-center justify-center"
                  >
                    <div className="absolute top-1 h-3 w-3 rounded-full bg-slate-900 border border-amber-300 animate-pulse" />
                    {/* Aim guideline laser */}
                    <div className="absolute -top-32 h-32 w-0.5 bg-dashed border-l border-amber-400/20 pointer-events-none" />
                  </motion.div>

                  {/* Heavy Cannon Base */}
                  <div className="h-10 w-20 rounded-t-3xl bg-slate-900 border-t-2 border-slate-700 flex flex-col items-center justify-center text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none shadow-lg shadow-slate-900/30">
                    <span className="text-amber-400 mt-1">JILI</span>
                    <span>CANNON</span>
                  </div>
                </div>

                {/* Water splash click guidance message */}
                <div className="absolute top-4 left-4 text-[10px] font-black uppercase text-slate-500 bg-white/70 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-200/50 pointer-events-none">
                  🎯 Tap any target fish to shoot bubbles & capture!
                </div>
              </div>

              {/* Fishing Controls Side Panel */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-4.5 space-y-4 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="border-b border-slate-200/60 pb-2">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1">
                      <Crosshair className="h-3.5 w-3.5 text-[#1FA66A]" />
                      Weapon Settings
                    </h4>
                  </div>

                  {/* Bullet Bet selector */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Bullet Cost (৳ BDT per shot)</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[1, 5, 10, 25, 50, 100].map(val => (
                        <button
                          key={val}
                          onClick={() => { setFishingBet(val); playSynthSound('click'); }}
                          className={`py-2 rounded-xl text-xs font-black font-mono border transition-all duration-150 ${
                            fishingBet === val
                              ? 'bg-[#1FA66A] text-white border-[#1FA66A] shadow-sm'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100/50'
                          }`}
                        >
                          ৳{val}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Aquarium guide values */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200/60 space-y-2 text-[10px]">
                    <span className="font-extrabold text-slate-700 uppercase tracking-wider block">Multiplier Loot Table:</span>
                    <div className="grid grid-cols-2 gap-1.5 text-slate-600 font-semibold font-mono">
                      <div className="flex justify-between border-b border-dashed border-slate-100 pb-0.5">
                        <span>🐠 Nemo:</span>
                        <span className="text-[#1FA66A] font-bold">2x Pay</span>
                      </div>
                      <div className="flex justify-between border-b border-dashed border-slate-100 pb-0.5">
                        <span>👾 Jellyfish:</span>
                        <span className="text-[#1FA66A] font-bold">6x Pay</span>
                      </div>
                      <div className="flex justify-between border-b border-dashed border-slate-100 pb-0.5">
                        <span>🐢 Turtle:</span>
                        <span className="text-[#1FA66A] font-bold">12x Pay</span>
                      </div>
                      <div className="flex justify-between border-b border-dashed border-slate-100 pb-0.5">
                        <span>🦈 Shark:</span>
                        <span className="text-[#1FA66A] font-bold">25x Pay</span>
                      </div>
                      <div className="flex justify-between md:col-span-2">
                        <span>🐲 Golden Dragon:</span>
                        <span className="text-amber-600 font-bold">80x Super Jackpot!</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-center text-slate-400 font-bold uppercase leading-tight bg-white p-2.5 rounded-xl border border-slate-200/40">
                  ⚡ Bullets trigger secure API verification instantly.
                </div>
              </div>
            </motion.div>
          )}

          {/* ==========================================
              GAME 2: JILI FORTUNE SLOTS (UPGRADED GOLD)
             ========================================== */}
          {activeGame === 'slots' && (
            <motion.div
              key="slots"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* Gold slots frame */}
              <div className="lg:col-span-2 bg-gradient-to-br from-amber-500 via-yellow-400 to-amber-600 p-4.5 rounded-3xl border-4 border-amber-300 shadow-xl flex flex-col items-center justify-center min-h-[350px]">
                
                {/* Header banner */}
                <div className="bg-slate-900 border border-amber-400 px-6 py-1.5 rounded-full mb-5 shadow-md">
                  <h3 className="text-xs font-black tracking-widest text-amber-300 uppercase font-mono animate-pulse">
                    🏆 FORTUNE JILI REELS 🏆
                  </h3>
                </div>

                {/* Reels Grid */}
                <div className="grid grid-cols-3 gap-3.5 bg-slate-950 p-4.5 rounded-2xl w-full max-w-sm border-2 border-amber-200 relative shadow-2xl">
                  {/* Decorative winning lines overlay */}
                  {activePaylineWins.length > 0 && (
                    <div className="absolute inset-0 border-2 border-yellow-400 rounded-2xl pointer-events-none animate-pulse scale-95 opacity-50" />
                  )}
                  
                  {reels.map((icon, idx) => (
                    <div 
                      key={idx}
                      className="h-24 rounded-xl bg-gradient-to-b from-white to-slate-100 flex items-center justify-center border border-slate-200 shadow-inner text-4xl select-none"
                    >
                      <motion.span
                        animate={slotsRolling ? { y: [0, -30, 30, 0] } : {}}
                        transition={{ duration: 0.1, repeat: slotsRolling ? Infinity : 0 }}
                      >
                        {icon}
                      </motion.span>
                    </div>
                  ))}
                </div>

                {/* Win payout list reference */}
                <div className="grid grid-cols-3 gap-2 text-[10px] font-extrabold text-slate-900 uppercase tracking-tight text-center mt-5 w-full max-w-sm border-t border-amber-400/40 pt-3">
                  <span>💎💎💎 = 50x</span>
                  <span>⭐⭐⭐ = 20x</span>
                  <span>🔔🔔🔔 = 10x</span>
                </div>
              </div>

              {/* Controls Column */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4.5 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="border-b border-slate-200/60 pb-2">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Slot Settings</h4>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Bet Amount (৳ BDT)</label>
                    <input
                      type="number"
                      value={slotsBet}
                      onChange={(e) => setSlotsBet(e.target.value)}
                      disabled={slotsRolling}
                      className="w-full rounded-xl bg-white border border-slate-200 p-3 text-sm text-slate-900 font-black font-mono focus:border-[#1FA66A] focus:outline-none"
                    />
                  </div>

                  {slotsFeedback && (
                    <div className={`p-3 rounded-xl text-center text-xs font-black uppercase border animate-bounce ${
                      slotsFeedback.includes('WIN') ? 'bg-green-500/10 border-green-500/20 text-green-700' : 'bg-slate-100 border-slate-200 text-slate-500'
                    }`}>
                      {slotsFeedback}
                    </div>
                  )}
                </div>

                <button
                  onClick={playSlotsSpin}
                  disabled={slotsRolling}
                  className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 py-4 text-xs font-black text-slate-950 hover:brightness-110 active:scale-95 transition tracking-widest uppercase shadow-lg shadow-amber-500/10"
                >
                  {slotsRolling ? 'SPINNING...' : 'SPIN JILI REELS'}
                </button>
              </div>
            </motion.div>
          )}

          {/* ==========================================
              GAME 3: AVIATOR STYLE CRASH (LIGHT GRAPH)
             ========================================== */}
          {activeGame === 'crash' && aviatorPlayMode === 'choice' && (
            <motion.div
              key="crash-choice"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="max-w-4xl mx-auto w-full py-6 px-2"
            >
              <div className="text-center mb-8">
                <div className="h-14 w-14 rounded-2xl bg-[#1FA66A]/10 flex items-center justify-center text-3xl mx-auto mb-3">
                  🚀
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  Choose Aviator Play Mode / এভিয়েটর গেম মোড
                </h3>
                <p className="text-xs text-slate-500 font-bold mt-1">
                  Select your preferred gameplay experience / আপনার পছন্দের খেলার ধরণ নির্বাচন করুন
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Real Play Card */}
                <div className="bg-white border-2 border-slate-200 hover:border-amber-400 p-6 rounded-3xl flex flex-col justify-between hover:shadow-lg transition-all duration-200 group relative overflow-hidden">
                  <div className="absolute top-0 right-0 h-24 w-24 bg-amber-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform" />
                  <div>
                    <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-2xl mb-4 shadow-inner">
                      ৳
                    </div>
                    <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                      Real Cash Play
                      <span className="text-[9px] bg-amber-500 text-slate-950 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Real Bet
                      </span>
                    </h4>
                    <p className="text-[11px] font-black text-amber-600 mt-0.5">রিয়েল ব্যালেন্স দিয়ে খেলুন</p>
                    <p className="text-xs text-slate-500 font-semibold mt-3 leading-relaxed">
                      Use your real wallet balance to bet on the upward-bound jet. Cashout manually or set an auto-cashout factor to multiply your money instantly!
                    </p>
                  </div>
                  <button
                    onClick={() => { setAviatorPlayMode('real'); playSynthSound('click'); }}
                    className="w-full mt-6 rounded-xl bg-amber-500 hover:bg-amber-600 py-3.5 text-xs font-black text-slate-950 transition uppercase tracking-widest shadow-md hover:shadow-lg cursor-pointer animate-fade-in"
                  >
                    Play Real (রিয়েল খেলুন) 🚀
                  </button>
                </div>

                {/* Demo Play Card */}
                <div className="bg-white border-2 border-slate-200 hover:border-sky-400 p-6 rounded-3xl flex flex-col justify-between hover:shadow-lg transition-all duration-200 group relative overflow-hidden">
                  <div className="absolute top-0 right-0 h-24 w-24 bg-sky-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform" />
                  <div>
                    <div className="h-12 w-12 rounded-xl bg-sky-500/10 flex items-center justify-center text-2xl mb-4 shadow-inner">
                      🎮
                    </div>
                    <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                      Demo Practice Play
                      <span className="text-[9px] bg-sky-500 text-white font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Free Demo
                      </span>
                    </h4>
                    <p className="text-[11px] font-black text-sky-600 mt-0.5">ফ্রি ডেমো খেলুন</p>
                    <p className="text-xs text-slate-500 font-semibold mt-3 leading-relaxed">
                      Loads the official Spribe Aviator demo simulation within the browser frame. Practice betting strategies and study real-time multipliers!
                    </p>
                  </div>
                  <button
                    onClick={() => { setAviatorPlayMode('demo'); playSynthSound('click'); }}
                    className="w-full mt-6 rounded-xl bg-sky-500 hover:bg-sky-600 py-3.5 text-xs font-black text-white transition uppercase tracking-widest shadow-md hover:shadow-lg cursor-pointer animate-fade-in"
                  >
                    Play Demo (ডেমো খেলুন) 🎮
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeGame === 'crash' && aviatorPlayMode === 'demo' && (
            <motion.div
              key="crash-demo"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-4 w-full"
            >
              {/* Demo Mode Sub-Header Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-center bg-slate-900 text-white p-4.5 rounded-2xl border border-slate-800 gap-3">
                <div className="flex items-center space-x-3.5">
                  <span className="text-2xl animate-pulse">🎮</span>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                      Spribe Aviator Demo Mode
                      <span className="text-[9px] bg-sky-500/20 text-sky-300 font-extrabold uppercase px-2 py-0.5 rounded-full border border-sky-500/30">
                        Practice Active
                      </span>
                    </h4>
                    <p className="text-[10px] text-slate-400 font-bold">Official Spribe simulator loaded inside frame securely.</p>
                  </div>
                </div>
                
                <button
                  onClick={() => { setAviatorPlayMode('choice'); playSynthSound('click'); }}
                  className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-xs font-black transition flex items-center gap-1.5 cursor-pointer text-slate-200 hover:text-white"
                >
                  👈 Change Mode (মোড পরিবর্তন)
                </button>
              </div>

              {/* Embedded Spribe Iframe */}
              <div className="rounded-3xl border-4 border-slate-950 bg-slate-950 relative overflow-hidden shadow-2xl h-[550px] w-full">
                <iframe
                  src="https://aviator-demo.spribegaming.com/?currency=USD&operator=demo&jurisdiction=CW&lang=EN&return_url=https%3A%2F%2Fspribe.co%2Fgames&user=23409&token=XHGi1Xh7FVWXAY7Z5PhKMrn4iFzaAsdt"
                  title="Spribe Aviator Demo Game"
                  className="w-full h-full border-0 rounded-2xl bg-slate-950"
                  allow="autoplay; fullscreen; encrypted-media"
                  referrerPolicy="no-referrer"
                />
              </div>
            </motion.div>
          )}

          {activeGame === 'crash' && aviatorPlayMode === 'real' && (
            <motion.div
              key="crash-real"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-4 w-full"
            >
              {/* Real Play Header Banner */}
              <div className="flex flex-col sm:flex-row justify-between items-center bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl gap-3">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl animate-bounce">⚡</span>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                      BETEPRO Real Cash Sky-Liner
                      <span className="text-[9px] bg-amber-500 text-slate-950 font-extrabold px-2 py-0.5 rounded-full uppercase">
                        Real Mode
                      </span>
                    </h4>
                    <p className="text-[10px] text-amber-700/80 font-bold">Wager with BDT wallet balance for instant multiplier gains.</p>
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    if (crashState === 'running') {
                      alert('Please wait until the current flight completes to switch mode!');
                      return;
                    }
                    setAviatorPlayMode('choice'); 
                    playSynthSound('click'); 
                  }}
                  className="px-4 py-2 rounded-xl border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/15 text-xs font-black text-amber-800 transition flex items-center gap-1.5 cursor-pointer"
                >
                  👈 Change Mode (মোড পরিবর্তন)
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Financial grid coordinate graph */}
                <div className="lg:col-span-2 bg-slate-50 border border-slate-200 rounded-2xl relative h-80 overflow-hidden flex flex-col justify-between p-4 shadow-inner">
                  {/* History pills top row */}
                  <div className="flex space-x-1 overflow-x-auto pb-1 z-10">
                    {crashHistory.map((h, i) => (
                      <span key={i} className={`text-[10px] font-black px-2.5 py-1 rounded-full font-mono shrink-0 border ${
                        h >= 2.0 ? 'bg-green-500/10 text-green-700 border-green-500/20' : 'bg-rose-500/10 text-rose-700 border-rose-500/20'
                      }`}>
                        {h.toFixed(2)}x
                      </span>
                    ))}
                  </div>

                  {/* Flying Plane Path Simulation Area */}
                  <div className="flex-1 flex items-center justify-center relative">
                    {/* Coordinate ticks */}
                    <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none opacity-[0.06] font-mono text-[9px] text-slate-900">
                      <div className="border-b border-slate-900 w-full text-right">3.00x -</div>
                      <div className="border-b border-slate-900 w-full text-right">2.00x -</div>
                      <div className="border-b border-slate-900 w-full text-right">1.50x -</div>
                      <div className="w-full text-right">1.00x -</div>
                    </div>

                    {crashState === 'idle' && (
                      <div className="text-center z-10">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">READY FOR FLIGHT</h4>
                        <p className="text-[10px] text-slate-500 font-bold">Press BET to launch the jet</p>
                      </div>
                    )}

                    {crashState === 'running' && (
                      <div className="text-center z-10 scale-110">
                        <motion.h2 
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{ repeat: Infinity, duration: 1 }}
                          className="text-5xl font-black font-mono text-slate-900 tracking-tight"
                        >
                          {crashMultiplier.toFixed(2)}x
                        </motion.h2>
                        <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest block mt-1 animate-pulse">UPWARD BOUND...</span>
                        
                        {/* CSS Airplane vector representation */}
                        <motion.div 
                          animate={{ y: [0, -15, 0], x: [0, 8, 0] }}
                          transition={{ repeat: Infinity, duration: 1.8 }}
                          className="text-4xl absolute -bottom-8 left-12"
                        >
                          🚀
                        </motion.div>
                      </div>
                    )}

                    {crashState === 'cashed_out' && (
                      <div className="text-center bg-green-50 border border-green-200 p-5 rounded-2xl z-10 animate-fade-in">
                        <span className="text-[10px] font-black text-green-700 uppercase tracking-widest block mb-1">SUCCESSFUL CASHOUT</span>
                        <h2 className="text-4xl font-black text-slate-900 font-mono">{crashMultiplier.toFixed(2)}x</h2>
                        <p className="text-xs font-bold text-green-600 mt-1">WON ৳{crashWin}</p>
                      </div>
                    )}

                    {crashState === 'crashed' && (
                      <div className="text-center bg-rose-50 border border-rose-200 p-5 rounded-2xl z-10">
                        <span className="text-[10px] font-black text-rose-700 uppercase tracking-widest block mb-1">FLEW AWAY (CRASHED)</span>
                        <h2 className="text-4xl font-black text-slate-900 font-mono">{crashMultiplier.toFixed(2)}x</h2>
                        <p className="text-xs text-rose-600 font-bold mt-1">Better luck on the next takeoff!</p>
                      </div>
                    )}
                  </div>

                  <div className="text-[9px] text-slate-400 uppercase font-black text-center z-10 border-t border-slate-200/50 pt-1.5">
                    BETEPRO Sky-Liner v2.5
                  </div>
                </div>

                {/* Controls Column */}
                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4.5 space-y-4">
                  <div className="border-b border-slate-200/60 pb-2">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Flight Deck</h4>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Wager (৳ BDT)</label>
                    <input
                      type="number"
                      value={crashBet}
                      onChange={(e) => setCrashBet(e.target.value)}
                      disabled={crashState === 'running'}
                      className="w-full rounded-xl bg-white border border-slate-200 p-3 text-sm text-slate-900 font-black font-mono focus:border-[#1FA66A] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Auto Cashout Factor</label>
                    <input
                      type="number"
                      step="0.05"
                      value={targetCashout}
                      onChange={(e) => setTargetCashout(e.target.value)}
                      disabled={crashState === 'running'}
                      className="w-full rounded-xl bg-white border border-slate-200 p-3 text-sm text-[#FF9F00] font-black font-mono focus:border-[#1FA66A] focus:outline-none"
                    />
                  </div>

                  {crashState === 'running' ? (
                    <button
                      onClick={manualCrashCashout}
                      className="w-full rounded-xl bg-[#FF9F00] py-4 text-xs font-black text-black hover:brightness-110 active:scale-95 transition tracking-widest uppercase shadow-lg"
                    >
                      🚀 CASHOUT @ ৳{(parseFloat(crashBet) * crashMultiplier).toFixed(0)}
                    </button>
                  ) : (
                    <button
                      onClick={startCrashFlight}
                      disabled={crashState === 'running'}
                      className="w-full rounded-xl bg-[#1FA66A] py-4 text-xs font-black text-white hover:brightness-110 active:scale-95 transition tracking-widest uppercase shadow-lg shadow-[#1FA66A]/10"
                    >
                      Place Bet & Fly
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ==========================================
              GAME 4: LUCKY SPIN WHEEL (PASTEL LIGHT)
             ========================================== */}
          {activeGame === 'spin' && (
            <motion.div
              key="spin"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* Spin board */}
              <div className="lg:col-span-2 flex flex-col items-center justify-center relative bg-slate-50 border border-slate-200 rounded-2xl h-80 overflow-hidden py-4">
                {/* Pointer top */}
                <div className="absolute top-10 z-10 text-2xl select-none text-rose-500">
                  ▼
                </div>

                {/* Wheel */}
                <div 
                  className="w-52 h-52 rounded-full border-4 border-emerald-500 relative shadow-xl flex items-center justify-center overflow-hidden transition-transform duration-[3000ms] ease-[cubic-bezier(0.25,0.1,0.25,1)] bg-white"
                  style={{ transform: `rotate(${wheelRotation}deg)` }}
                >
                  {[0, 1, 2, 3, 4, 5, 6, 7].map((num) => (
                    <div 
                      key={num} 
                      className="absolute inset-0 origin-center text-center text-[10px] font-black"
                      style={{ transform: `rotate(${num * 45}deg)` }}
                    >
                      <div className="h-26 w-0.5 bg-slate-200/60 mx-auto" />
                      <div className="absolute top-3 left-0 right-0 mx-auto">
                        <span className="block scale-95 uppercase font-mono tracking-tighter text-slate-700">
                          {num === 0 ? 'LOSE' : num === 1 ? '0.5x' : num === 2 ? '1.2x' : num === 3 ? '2x' : num === 4 ? 'FREE' : num === 5 ? '5x' : num === 6 ? '1.5x' : '10x🔥'}
                        </span>
                      </div>
                    </div>
                  ))}

                  <div className="absolute h-12 w-12 rounded-full bg-slate-100 border-2 border-emerald-500 flex items-center justify-center text-[10px] font-black text-slate-800 shadow">
                    SPIN
                  </div>
                </div>

                {spinWinText && (
                  <div className="mt-4 text-[10px] font-black text-center text-emerald-700 uppercase bg-green-50 border border-green-200 px-4 py-1.5 rounded-full animate-bounce">
                    {spinWinText}
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4.5 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="border-b border-slate-200/60 pb-2">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Lucky Wheel</h4>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Wager (৳ BDT)</label>
                    <input
                      type="number"
                      value={spinBet}
                      onChange={(e) => setSpinBet(e.target.value)}
                      disabled={isSpinning}
                      className="w-full rounded-xl bg-white border border-slate-200 p-3 text-sm text-slate-900 font-black font-mono focus:border-[#1FA66A] focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  onClick={spinWheelPlay}
                  disabled={isSpinning}
                  className="w-full rounded-xl bg-[#1FA66A] py-4 text-xs font-black text-white hover:brightness-110 active:scale-95 transition tracking-widest uppercase shadow-lg shadow-[#1FA66A]/10"
                >
                  {isSpinning ? 'SPINNING...' : 'LAUNCH SPIN'}
                </button>
              </div>
            </motion.div>
          )}

          {/* ==========================================
              GAME 5: OVER / UNDER DICE ROLL
             ========================================== */}
          {activeGame === 'dice' && (
            <motion.div
              key="dice"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              <div className="lg:col-span-2 flex flex-col items-center justify-center bg-slate-50 border border-slate-200 rounded-2xl h-80 overflow-hidden py-4 px-6 shadow-inner">
                <div className="flex space-x-4 mb-6">
                  <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-[#1FA66A] to-emerald-700 flex items-center justify-center border border-emerald-500/10 shadow-xl">
                    <span className="text-5xl font-black font-mono text-white select-none">
                      {rolledDiceNum !== null ? rolledDiceNum : '🎲'}
                    </span>
                  </div>
                </div>

                <div className="w-full max-w-sm space-y-1.5 text-xs text-slate-600 font-semibold">
                  <div className="flex justify-between text-[10px] uppercase font-bold text-slate-500">
                    <span>Under {diceTarget}</span>
                    <span>Over {diceTarget}</span>
                  </div>
                  <div className="h-3 w-full bg-slate-200 rounded-full relative overflow-hidden">
                    <div className="h-full bg-rose-400" style={{ width: `${diceTarget}%` }} />
                    <div className="h-full bg-emerald-500 absolute right-0 top-0" style={{ width: `${100 - diceTarget}%` }} />
                  </div>
                </div>

                {diceWinResult && (
                  <div className={`mt-5 text-xs font-black px-4.5 py-2 rounded-full border uppercase ${
                    diceWinResult.won ? 'bg-green-50 border-green-200 text-green-700 animate-bounce' : 'bg-rose-50 border-rose-200 text-rose-700'
                  }`}>
                    {diceWinResult.won ? `WON! Payout: +৳${diceWinResult.payout}` : 'Try again! Better luck ahead.'}
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4.5 space-y-4">
                <div className="border-b border-slate-200/60 pb-2">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Dice Options</h4>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Wager (৳ BDT)</label>
                  <input
                    type="number"
                    value={diceBet}
                    onChange={(e) => setDiceBet(e.target.value)}
                    disabled={diceRolling}
                    className="w-full rounded-xl bg-white border border-slate-200 p-3 text-sm text-slate-900 font-black font-mono focus:border-[#1FA66A] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setDiceGuess('over')}
                    disabled={diceRolling}
                    className={`py-2 rounded-xl text-xs font-bold border transition ${
                      diceGuess === 'over' ? 'bg-[#1FA66A] text-white border-[#1FA66A]' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100/50'
                    }`}
                  >
                    OVER
                  </button>
                  <button
                    onClick={() => setDiceGuess('under')}
                    disabled={diceRolling}
                    className={`py-2 rounded-xl text-xs font-bold border transition ${
                      diceGuess === 'under' ? 'bg-[#1FA66A] text-white border-[#1FA66A]' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100/50'
                    }`}
                  >
                    UNDER
                  </button>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase">
                    <span>Target Number</span>
                    <span className="text-emerald-600 font-mono font-black">{diceTarget}</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="90"
                    value={diceTarget}
                    onChange={(e) => setDiceTarget(parseInt(e.target.value))}
                    disabled={diceRolling}
                    className="w-full accent-[#1FA66A]"
                  />
                </div>

                <button
                  onClick={playDiceRoll}
                  disabled={diceRolling}
                  className="w-full rounded-xl bg-[#1FA66A] py-3.5 text-xs font-black text-white hover:brightness-110 transition uppercase tracking-widest shadow-lg shadow-[#1FA66A]/10"
                >
                  {diceRolling ? 'ROLLING...' : 'ROLL DICE'}
                </button>
              </div>
            </motion.div>
          )}

          {/* ==========================================
              GAME 6: ROULETTE (IVORY WHITE TRACK)
             ========================================== */}
          {activeGame === 'roulette' && (
            <motion.div
              key="roulette"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              <div className="lg:col-span-2 flex flex-col items-center justify-center bg-slate-50 border border-slate-200 rounded-2xl h-80 overflow-hidden py-4 shadow-inner">
                <div className="flex space-x-3 mb-6">
                  {['red', 'black', 'green'].map((color) => (
                    <div 
                      key={color} 
                      className={`h-20 w-20 rounded-2xl flex flex-col items-center justify-center border text-xs font-black uppercase transition-all duration-150 ${
                        color === 'red' ? 'bg-rose-600 text-white border-rose-500' : color === 'black' ? 'bg-slate-900 text-white border-slate-800' : 'bg-emerald-600 text-white border-emerald-500'
                      } ${rouletteColor === color ? 'ring-4 ring-offset-2 ring-[#1FA66A] scale-[1.05]' : 'opacity-40'}`}
                    >
                      <span>{color}</span>
                      <span className="text-[9px] font-bold text-slate-100 mt-1">{color === 'green' ? '35x Pay' : '2x Pay'}</span>
                    </div>
                  ))}
                </div>

                <div className="h-16 w-52 rounded-xl bg-white flex items-center justify-center border border-slate-200 relative shadow-sm">
                  {rouletteSpinning ? (
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-500 animate-pulse">Marble Spinning...</span>
                  ) : rouletteResult ? (
                    <div className="text-center animate-fade-in">
                      <span className="block text-[9px] font-bold uppercase text-slate-400">Spin Outcome</span>
                      <span className={`inline-block rounded-lg px-3 py-1 font-black text-white font-mono mt-1 text-xs ${
                        rouletteResult.color === 'red' ? 'bg-rose-600' : rouletteResult.color === 'black' ? 'bg-slate-900' : 'bg-emerald-600'
                      }`}>
                        Number {rouletteResult.num} ({rouletteResult.color.toUpperCase()})
                      </span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-black uppercase">PLACE WAGER CHIPS</span>
                  )}
                </div>

                {rouletteResult && !rouletteSpinning && (
                  <div className={`mt-4 text-xs font-black px-4.5 py-1.5 rounded-full uppercase border ${
                    rouletteResult.won ? 'bg-green-50 border-green-200 text-green-700' : 'bg-rose-50 border-rose-200 text-rose-700'
                  }`}>
                    {rouletteResult.won ? `WON! +৳${rouletteResult.payout}` : 'Lose! Fortune favors the bold.'}
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4.5 space-y-4">
                <div className="border-b border-slate-200/60 pb-2">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Roulette Board</h4>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Wager (৳ BDT)</label>
                  <input
                    type="number"
                    value={rouletteBet}
                    onChange={(e) => setRouletteBet(e.target.value)}
                    disabled={rouletteSpinning}
                    className="w-full rounded-xl bg-white border border-slate-200 p-3 text-sm text-slate-900 font-black font-mono focus:border-[#1FA66A] focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Betting Chip Color</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      onClick={() => setRouletteColor('red')}
                      disabled={rouletteSpinning}
                      className="py-2.5 rounded-xl bg-rose-600 text-white border border-rose-500 font-black text-[11px] uppercase"
                    >
                      Red
                    </button>
                    <button
                      onClick={() => setRouletteColor('black')}
                      disabled={rouletteSpinning}
                      className="py-2.5 rounded-xl bg-slate-900 text-white border border-slate-800 font-black text-[11px] uppercase"
                    >
                      Black
                    </button>
                    <button
                      onClick={() => setRouletteColor('green')}
                      disabled={rouletteSpinning}
                      className="py-2.5 rounded-xl bg-emerald-600 text-white border border-emerald-500 font-black text-[11px] uppercase"
                    >
                      Zero
                    </button>
                  </div>
                </div>

                <button
                  onClick={playRouletteSpin}
                  disabled={rouletteSpinning}
                  className="w-full rounded-xl bg-[#1FA66A] py-3.5 text-xs font-black text-white hover:brightness-110 transition uppercase tracking-widest shadow-lg shadow-[#1FA66A]/10"
                >
                  {rouletteSpinning ? 'SPINNING...' : 'LAUNCH ROULETTE'}
                </button>
              </div>
            </motion.div>
          )}

          {/* ==========================================
              GAME 7: MINES (POLISHED TILES)
             ========================================== */}
          {activeGame === 'mines' && (
            <motion.div
              key="mines"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              <div className="lg:col-span-2 flex flex-col items-center justify-center bg-slate-50 border border-slate-200 rounded-3xl p-6 min-h-[350px] shadow-inner">
                <div className="grid grid-cols-5 gap-2.5 max-w-sm w-full">
                  {minesGrid.map((cell, idx) => {
                    const isRevealed = minesRevealed.includes(idx);
                    return (
                      <button
                        key={idx}
                        onClick={() => revealMinesCell(idx)}
                        disabled={minesState !== 'playing' || isRevealed || minesLoading}
                        className={`h-14 sm:h-16 w-full rounded-2xl flex items-center justify-center font-black text-xl transition-all duration-200 select-none ${
                          cell === null
                            ? 'bg-white hover:bg-slate-100 border-2 border-slate-200/80 text-slate-400 shadow-sm active:scale-95 cursor-pointer disabled:cursor-not-allowed'
                            : cell === false
                            ? 'bg-emerald-50 border-2 border-emerald-500/30 text-emerald-500 font-black text-2xl shadow-md scale-100 animate-fade-in'
                            : 'bg-rose-50 border-2 border-rose-500/30 text-rose-500 text-2xl animate-bounce'
                        }`}
                      >
                        {cell === null ? '❓' : cell === false ? '💎' : '💣'}
                      </button>
                    );
                  })}
                </div>

                {minesState === 'playing' && (
                  <div className="mt-5 text-center text-xs space-y-1">
                    <span className="text-slate-400 font-extrabold uppercase">Multiplier</span>
                    <h3 className="text-2xl font-black text-[#1FA66A] font-mono">{minesMultiplier.toFixed(2)}x</h3>
                    <p className="text-[#FF9F00] font-black font-mono">Current value: ৳{minesWin.toFixed(2)}</p>
                  </div>
                )}

                {minesState === 'cashed_out' && (
                  <div className="mt-5 text-center bg-green-50 border border-green-200 px-6 py-2.5 rounded-2xl">
                    <span className="text-[10px] font-black text-green-700 uppercase tracking-wider block mb-1">CASHED OUT</span>
                    <h3 className="text-2xl font-black text-slate-900 font-mono">{minesMultiplier.toFixed(2)}x</h3>
                    <p className="text-green-600 font-black font-mono mt-0.5">WON ৳{minesWin.toFixed(2)}</p>
                  </div>
                )}

                {minesState === 'lost' && (
                  <div className="mt-5 text-center bg-rose-50 border border-rose-200 px-6 py-2.5 rounded-2xl">
                    <span className="text-[10px] font-black text-rose-700 uppercase tracking-wider block mb-0.5">EXPLODED!</span>
                    <p className="text-xs text-rose-600 font-bold">Try again, avoid the bombs!</p>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4.5 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="border-b border-slate-200/60 pb-2">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Mines Options</h4>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Mines Count</label>
                    <div className="grid grid-cols-4 gap-1">
                      {[1, 3, 5, 10].map(cnt => (
                        <button
                          key={cnt}
                          onClick={() => setMinesCount(cnt)}
                          disabled={minesState === 'playing'}
                          className={`py-1.5 rounded-lg text-xs font-black border transition ${
                            minesCount === cnt
                              ? 'bg-[#1FA66A] text-white border-[#1FA66A]'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100/50'
                          }`}
                        >
                          {cnt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Bet (৳ BDT)</label>
                    <input
                      type="number"
                      value={minesBet}
                      onChange={(e) => setMinesBet(e.target.value)}
                      disabled={minesState === 'playing' || minesLoading}
                      className="w-full rounded-xl bg-white border border-slate-200 p-3 text-sm text-slate-900 font-black font-mono focus:border-[#1FA66A] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  {minesState === 'playing' ? (
                    <button
                      onClick={cashoutMinesGame}
                      disabled={minesLoading || minesRevealed.length === 0}
                      className="w-full rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 py-4 text-xs font-black text-slate-950 hover:brightness-110 disabled:brightness-75 transition uppercase tracking-widest"
                    >
                      CASHOUT ৳{minesWin.toFixed(2)}
                    </button>
                  ) : (
                    <button
                      onClick={startMinesGame}
                      disabled={minesLoading}
                      className="w-full rounded-xl bg-[#1FA66A] py-4 text-xs font-black text-white hover:brightness-110 transition uppercase tracking-widest shadow-lg shadow-[#1FA66A]/10"
                    >
                      {minesLoading ? 'LOADING...' : 'START MINES RUN'}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ==========================================
              GAME 8: BLACKJACK (TEAL BOARD felt)
             ========================================== */}
          {activeGame === 'blackjack' && (
            <motion.div
              key="blackjack"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              <div className="lg:col-span-2 bg-gradient-to-b from-[#E6F4F1] to-[#D0ECE7] border border-teal-200 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[350px] shadow-inner">
                {/* Dealer Hand */}
                <div className="space-y-2 text-center">
                  <div className="inline-block rounded-full bg-white/85 px-4 py-1 text-[10px] font-black text-slate-700 uppercase font-mono border border-teal-200/50">
                    Dealer: {bjState === 'playing' ? bjDealerScoreShown : calculateBlackjackScore(bjDealerCards)} Pts
                  </div>

                  <div className="flex justify-center space-x-2.5">
                    {bjDealerCards.map((card, idx) => (
                      <div
                        key={idx}
                        className={`h-24 w-16 bg-white rounded-xl shadow border border-slate-200 flex flex-col justify-between p-2 select-none font-black scale-100 transition-all ${
                          card.suit === '❔' ? 'bg-gradient-to-br from-teal-500 to-teal-700 border-teal-400' : ''
                        }`}
                      >
                        {card.suit === '❔' ? (
                          <div className="flex-1 flex items-center justify-center text-xl text-white">🎰</div>
                        ) : (
                          <>
                            <div className={`text-xs ${card.suit === '♥️' || card.suit === '♦️' ? 'text-red-500' : 'text-slate-800'}`}>
                              {card.value}
                            </div>
                            <div className="text-xl text-center flex-1 flex items-center justify-center">
                              {card.suit}
                            </div>
                            <div className={`text-xs text-right ${card.suit === '♥️' || card.suit === '♦️' ? 'text-red-500' : 'text-slate-800'}`}>
                              {card.value}
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {bjMsg && (
                  <div className="text-center bg-white/95 backdrop-blur shadow-sm py-1.5 px-4 rounded-xl border border-teal-200 text-xs font-black text-amber-600 uppercase tracking-wider max-w-xs mx-auto my-3">
                    {bjMsg}
                  </div>
                )}

                {/* Player Hand */}
                <div className="space-y-2 text-center">
                  <div className="flex justify-center space-x-2.5">
                    {bjPlayerCards.map((card, idx) => (
                      <div
                        key={idx}
                        className="h-24 w-16 bg-white rounded-xl shadow border border-slate-200 flex flex-col justify-between p-2 select-none font-black scale-100 transition-all animate-fade-in"
                      >
                        <div className={`text-xs ${card.suit === '♥️' || card.suit === '♦️' ? 'text-red-500' : 'text-slate-800'}`}>
                          {card.value}
                        </div>
                        <div className="text-xl text-center flex-1 flex items-center justify-center">
                          {card.suit}
                        </div>
                        <div className={`text-xs text-right ${card.suit === '♥️' || card.suit === '♦️' ? 'text-red-500' : 'text-slate-800'}`}>
                          {card.value}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="inline-block rounded-full bg-white/85 px-4 py-1 text-[10px] font-black text-slate-700 uppercase font-mono border border-teal-200/50 mt-1">
                    Your Hand: {bjPlayerScore} Pts
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4.5 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="border-b border-slate-200/60 pb-2">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Blackjack Deck</h4>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Wager (৳ BDT)</label>
                    <input
                      type="number"
                      value={bjBet}
                      onChange={(e) => setBjBet(e.target.value)}
                      disabled={bjState === 'playing' || bjState === 'loading'}
                      className="w-full rounded-xl bg-white border border-slate-200 p-3 text-sm text-slate-900 font-black font-mono focus:border-[#1FA66A] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  {bjState === 'playing' ? (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={hitBlackjack}
                        className="rounded-xl bg-amber-500 py-3.5 text-xs font-black text-slate-950 hover:brightness-110 active:scale-95 transition"
                      >
                        HIT
                      </button>
                      <button
                        onClick={standBlackjack}
                        className="rounded-xl bg-[#1FA66A] py-3.5 text-xs font-black text-white hover:brightness-110 active:scale-95 transition"
                      >
                        STAND
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={dealBlackjack}
                      disabled={bjState === 'loading'}
                      className="w-full rounded-xl bg-[#1FA66A] py-3.5 text-xs font-black text-white hover:brightness-110 transition uppercase tracking-widest shadow-lg shadow-[#1FA66A]/10"
                    >
                      {bjState === 'loading' ? 'DEALING...' : 'DEAL HAND'}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ==========================================
              GAME 9: PLINKO (SOFT DECK DROP)
              ========================================== */}
          {activeGame === 'plinko' && (
            <motion.div
              key="plinko"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              <div className="lg:col-span-2 flex flex-col items-center justify-center bg-slate-50 border border-slate-200 rounded-3xl p-6 min-h-[350px] relative shadow-inner">
                <div className="flex flex-col items-center space-y-2 max-w-xs w-full my-auto">
                  {Array.from({ length: 9 }).map((_, rIdx) => (
                    <div key={rIdx} className="flex justify-center space-x-3">
                      {Array.from({ length: rIdx + 1 }).map((__, pIdx) => {
                        const stepCount = plinkoPath.length;
                        const rightSteps = plinkoPath.filter(step => step === 1).length;
                        const isPegActive = stepCount - 1 === rIdx && rightSteps === pIdx;

                        return (
                          <div
                            key={pIdx}
                            className={`h-2.5 w-2.5 rounded-full transition-all duration-100 ${
                              isPegActive ? 'bg-amber-500 scale-150 shadow shadow-amber-500' : 'bg-slate-300'
                            }`}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>

                {/* Mult Buckets */}
                <div className="grid grid-cols-11 gap-0.5 mt-5 w-full max-w-sm select-none border-t border-slate-200/60 pt-3">
                  {([5.0, 3.0, 1.6, 1.2, 1.0, 0.9, 1.0, 1.2, 1.6, 3.0, 5.0]).map((mult, bIdx) => {
                    const isWinningBucket = plinkoBucket === bIdx;
                    return (
                      <div
                        key={bIdx}
                        className={`py-1 text-[8px] font-mono font-black text-center rounded transition-all duration-200 ${
                          isWinningBucket
                            ? 'bg-amber-500 text-slate-950 scale-110 shadow-md'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {mult}x
                      </div>
                    );
                  })}
                </div>

                {plinkoWin !== null && (
                  <div className="absolute top-4 bg-green-50 border border-green-200 px-4 py-1 rounded-full text-xs font-black text-green-700 uppercase animate-bounce">
                    Landed! Paid ৳{plinkoWin.toFixed(2)} ({plinkoMult}x)
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4.5 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="border-b border-slate-200/60 pb-2">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Plinko</h4>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Risk Level</label>
                    <div className="grid grid-cols-3 gap-1">
                      {['low', 'medium', 'high'].map(r => (
                        <button
                          key={r}
                          onClick={() => setPlinkoRisk(r as any)}
                          disabled={plinkoDropping}
                          className={`py-1.5 rounded-lg text-xs font-black uppercase border transition ${
                            plinkoRisk === r
                              ? 'bg-[#1FA66A] text-white border-[#1FA66A]'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100/50'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Bet (৳ BDT)</label>
                    <input
                      type="number"
                      value={plinkoBet}
                      onChange={(e) => setPlinkoBet(e.target.value)}
                      disabled={plinkoDropping}
                      className="w-full rounded-xl bg-white border border-slate-200 p-3 text-sm text-slate-900 font-black"
                    />
                  </div>
                </div>

                <button
                  onClick={playPlinko}
                  disabled={plinkoDropping}
                  className="w-full rounded-xl bg-[#1FA66A] py-3.5 text-xs font-black text-white hover:brightness-110 transition uppercase tracking-widest shadow-lg shadow-[#1FA66A]/10"
                >
                  {plinkoDropping ? 'DROPPING...' : 'DROP PLINKO BALL'}
                </button>
              </div>
            </motion.div>
          )}

          {/* ==========================================
              GAME 10: JILI SUPER ACE (5x4 CASCADING SLOT)
             ========================================== */}
          {activeGame === 'super_ace' && superAcePlayMode === 'choice' && (
            <motion.div
              key="super-ace-choice"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="max-w-4xl mx-auto w-full py-6 px-2"
            >
              <div className="text-center mb-8">
                <div className="h-14 w-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-3xl mx-auto mb-3">
                  👑
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  Choose Super Ace Play Mode / সুপার এস গেম মোড
                </h3>
                <p className="text-xs text-slate-500 font-bold mt-1">
                  Select your preferred gameplay experience / আপনার পছন্দের খেলার ধরণ নির্বাচন করুন
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Real Play Card */}
                <div className="bg-white border-2 border-slate-200 hover:border-amber-400 p-6 rounded-3xl flex flex-col justify-between hover:shadow-lg transition-all duration-200 group relative overflow-hidden">
                  <div className="absolute top-0 right-0 h-24 w-24 bg-amber-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform" />
                  <div>
                    <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-2xl mb-4 shadow-inner">
                      ৳
                    </div>
                    <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                      Real Cash Play
                      <span className="text-[9px] bg-amber-500 text-slate-950 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Real Bet
                      </span>
                    </h4>
                    <p className="text-[11px] font-black text-amber-600 mt-0.5">রিয়েল ব্যালেন্স দিয়ে খেলুন</p>
                    <p className="text-xs text-slate-500 font-semibold mt-3 leading-relaxed">
                      Use your real BDT wallet balance to spin the 5x4 Golden Slot. Features wild transformations, cascading falls, and up to a 5x multiplier!
                    </p>
                  </div>
                  <button
                    onClick={() => { setSuperAcePlayMode('real'); playSynthSound('click'); }}
                    className="w-full mt-6 rounded-xl bg-amber-500 hover:bg-amber-600 py-3.5 text-xs font-black text-slate-950 transition uppercase tracking-widest shadow-md hover:shadow-lg cursor-pointer"
                  >
                    Play Real (রিয়েল খেলুন) 👑
                  </button>
                </div>

                {/* Demo Play Card */}
                <div className="bg-white border-2 border-slate-200 hover:border-sky-400 p-6 rounded-3xl flex flex-col justify-between hover:shadow-lg transition-all duration-200 group relative overflow-hidden">
                  <div className="absolute top-0 right-0 h-24 w-24 bg-sky-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform" />
                  <div>
                    <div className="h-12 w-12 rounded-xl bg-sky-500/10 flex items-center justify-center text-2xl mb-4 shadow-inner">
                      🎰
                    </div>
                    <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                      Demo Practice Play
                      <span className="text-[9px] bg-sky-500 text-white font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Free Demo
                      </span>
                    </h4>
                    <p className="text-[11px] font-black text-sky-600 mt-0.5">ফ্রি ডেমো খেলুন</p>
                    <p className="text-xs text-slate-500 font-semibold mt-3 leading-relaxed">
                      Embeds the original Jili Super Ace slot simulation in the browser frame. Practice free bets and learn paylines perfectly!
                    </p>
                  </div>
                  <button
                    onClick={() => { setSuperAcePlayMode('demo'); playSynthSound('click'); }}
                    className="w-full mt-6 rounded-xl bg-sky-500 hover:bg-sky-600 py-3.5 text-xs font-black text-white transition uppercase tracking-widest shadow-md hover:shadow-lg cursor-pointer"
                  >
                    Play Demo (ডেমো খেলুন) 🎰
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeGame === 'super_ace' && superAcePlayMode === 'demo' && (
            <motion.div
              key="super-ace-demo"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-4 w-full"
            >
              <div className="flex flex-col sm:flex-row justify-between items-center bg-slate-900 text-white p-4.5 rounded-2xl border border-slate-800 gap-3">
                <div className="flex items-center space-x-3.5">
                  <span className="text-2xl animate-pulse">🎰</span>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                      Jili Super Ace Demo Mode
                      <span className="text-[9px] bg-sky-500/20 text-sky-300 font-extrabold uppercase px-2 py-0.5 rounded-full border border-sky-500/30">
                        Demo Frame Active
                      </span>
                    </h4>
                    <p className="text-[10px] text-slate-400 font-bold">Official Jiligames simulator loaded inside browser frame securely.</p>
                  </div>
                </div>

                <button
                  onClick={() => { setSuperAcePlayMode('choice'); playSynthSound('click'); }}
                  className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-xs font-black transition flex items-center gap-1.5 cursor-pointer text-slate-200 hover:text-white"
                >
                  👈 Change Mode (মোড পরিবর্তন)
                </button>
              </div>

              {/* Embedded Jiligames Iframe */}
              <div className="rounded-3xl border-4 border-slate-950 bg-slate-950 relative overflow-hidden shadow-2xl h-[600px] w-full">
                <iframe
                  src="https://jiligames.com/PlusIntro/49?showGame=true"
                  title="Jili Super Ace Demo Game"
                  className="w-full h-full border-0 rounded-2xl bg-slate-950"
                  allow="autoplay; fullscreen; encrypted-media"
                  referrerPolicy="no-referrer"
                />
              </div>
            </motion.div>
          )}

          {activeGame === 'super_ace' && superAcePlayMode === 'real' && (
            <motion.div
              key="super-ace-real"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-4 w-full"
            >
              {/* Real Play Header */}
              <div className="flex flex-col sm:flex-row justify-between items-center bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl gap-3">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl animate-bounce">👑</span>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                      BETEPRO Super Ace Real Cash
                      <span className="text-[9px] bg-amber-500 text-slate-950 font-extrabold px-2 py-0.5 rounded-full uppercase">
                        Real Mode
                      </span>
                    </h4>
                    <p className="text-[10px] text-amber-700/80 font-bold">Spin with BDT wallet balance for cascading golden combinations.</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (superAceSpinning) {
                      alert('Please wait until the current spin cascades complete!');
                      return;
                    }
                    setSuperAcePlayMode('choice');
                    playSynthSound('click');
                  }}
                  className="px-4 py-2 rounded-xl border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/15 text-xs font-black text-amber-800 transition flex items-center gap-1.5 cursor-pointer"
                >
                  👈 Change Mode (মোড পরিবর্তন)
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 5x4 Grid Gameboard */}
                <div className="lg:col-span-2 bg-[#0E1726] border border-slate-800 rounded-3xl p-5 flex flex-col justify-between min-h-[420px] relative shadow-2xl overflow-hidden">
                  
                  {/* Glowing background multipliers track */}
                  <div className="flex items-center justify-between bg-slate-950/70 border border-slate-800/80 p-3 rounded-2xl mb-4">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Multiplier Track</span>
                    <div className="flex items-center space-x-2">
                      {([1, 2, 3, 5]).map(m => {
                        const active = superAceMultiplier === m;
                        return (
                          <span
                            key={m}
                            className={`px-3 py-1 text-xs font-black font-mono rounded-lg transition-all duration-200 border ${
                              active
                                ? 'bg-amber-500 text-slate-950 border-amber-400 scale-110 shadow-md shadow-amber-500/20'
                                : 'bg-slate-900 text-slate-500 border-slate-800'
                            }`}
                          >
                            x{m}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Slot Board Cells */}
                  <div className="grid grid-cols-5 gap-2.5 flex-1 relative">
                    {/* Rows rendering columns */}
                    {superAceGrid.map((row, rIdx) =>
                      row.map((symbol, cIdx) => {
                        const isGold = symbol.startsWith('G');
                        const baseChar = isGold ? symbol.substring(1) : symbol;
                        const isWild = symbol === 'W';
                        const isScatter = symbol === 'S';
                        const isWinning = superAceWinningCoords.some(coord => coord.r === rIdx && coord.c === cIdx);

                        // Card suit/icon maps
                        let label = baseChar;
                        let icon = '♠️';
                        let color = 'text-slate-200';
                        if (baseChar === 'A') { icon = '♠️'; color = 'text-indigo-400'; }
                        else if (baseChar === 'K') { icon = '♥️'; color = 'text-rose-400'; }
                        else if (baseChar === 'Q') { icon = '♣️'; color = 'text-emerald-400'; }
                        else if (baseChar === 'J') { icon = '♦️'; color = 'text-amber-400'; }
                        else if (baseChar === '10') { icon = '🃏'; color = 'text-slate-400'; }

                        if (isWild) { label = 'WILD'; icon = '👑'; color = 'text-yellow-400 font-extrabold'; }
                        if (isScatter) { label = 'SCATTER'; icon = '🌟'; color = 'text-teal-400 font-black'; }

                        return (
                          <motion.div
                            key={`${rIdx}-${cIdx}`}
                            animate={isWinning ? { scale: [1, 1.08, 1], rotate: [0, 1.5, -1.5, 0] } : {}}
                            transition={{ repeat: isWinning ? Infinity : 0, duration: 0.6 }}
                            className={`rounded-2xl flex flex-col items-center justify-between p-2 h-20 transition-all duration-300 relative select-none border-2 ${
                              isWinning
                                ? 'bg-[#1FA66A]/20 border-green-500 shadow-lg shadow-green-500/20'
                                : isWild
                                ? 'bg-gradient-to-br from-yellow-500/10 to-amber-500/20 border-amber-400/50 shadow shadow-amber-500/10'
                                : isScatter
                                ? 'bg-gradient-to-br from-teal-500/10 to-emerald-500/20 border-teal-400/40'
                                : isGold
                                ? 'bg-amber-500/10 border-amber-500/70 shadow-inner'
                                : 'bg-slate-900/60 border-slate-800'
                            }`}
                          >
                            {/* Gold Badge */}
                            {isGold && (
                              <span className="absolute -top-1.5 -left-1 text-[7px] bg-amber-500 text-slate-950 font-black px-1 rounded uppercase tracking-wider scale-90">
                                Gold
                              </span>
                            )}

                            {/* Top row mini text */}
                            <span className="text-[9px] font-black self-start tracking-tighter opacity-60">
                              {label}
                            </span>

                            {/* Large central icon */}
                            <span className="text-xl my-0.5">{icon}</span>

                            {/* Symbol text */}
                            <span className={`text-[10px] font-black font-mono self-end ${color}`}>
                              {isGold ? `${label}G` : label}
                            </span>
                          </motion.div>
                        );
                      })
                    )}
                  </div>

                  {/* Dynamic Logs and Total Win Box */}
                  <div className="mt-4 border-t border-slate-800/80 pt-3 flex flex-col md:flex-row items-stretch justify-between gap-3 bg-slate-950/40 p-3 rounded-2xl">
                    <div className="flex-1 space-y-1 max-h-16 overflow-y-auto font-mono text-[9px] text-slate-400 pr-1 select-none">
                      {superAceLog.length === 0 ? (
                        <div className="text-slate-500 italic">Logs: Ready for next spin deck / স্পিন করার জন্য প্রস্তুত...</div>
                      ) : (
                        superAceLog.map((log, idx) => (
                          <div key={idx} className="border-b border-slate-900/40 pb-0.5 last:border-b-0 leading-tight">
                            {log}
                          </div>
                        ))
                      )}
                    </div>

                    {superAceTotalWin !== null && (
                      <div className="flex flex-col justify-center items-center px-4 py-1.5 bg-green-500/10 border border-green-500/30 rounded-xl text-center shrink-0">
                        <span className="text-[8px] font-black text-green-400 uppercase tracking-wider">Total Win / মোট জয়</span>
                        <span className="text-sm font-black text-green-500 font-mono">৳{superAceTotalWin.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Control Panel */}
                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4.5 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="border-b border-slate-200/60 pb-2">
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Super Ace Deck</h4>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Bet / বাজি (৳ BDT)</label>
                      <input
                        type="number"
                        value={superAceBet}
                        onChange={(e) => setSuperAceBet(e.target.value)}
                        disabled={superAceSpinning}
                        className="w-full rounded-xl bg-white border border-slate-200 p-3 text-sm text-slate-900 font-black font-mono focus:border-[#1FA66A] focus:outline-none"
                      />
                    </div>

                    {/* Quick values selector */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Quick Bet</label>
                      <div className="grid grid-cols-4 gap-1">
                        {['10', '50', '200', '500'].map(val => (
                          <button
                            key={val}
                            onClick={() => setSuperAceBet(val)}
                            disabled={superAceSpinning}
                            className={`py-1 rounded-lg text-[10px] font-black border transition ${
                              superAceBet === val
                                ? 'bg-amber-500 text-slate-950 border-amber-400'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100/50'
                            }`}
                          >
                            ৳{val}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Payline Info Info Box */}
                    <div className="bg-white/80 p-3 rounded-xl border border-slate-200/60 text-[9px] text-slate-500 leading-relaxed font-semibold">
                      <span className="font-bold text-slate-700 uppercase block mb-1">💡 Super Ace Features:</span>
                      - Golden Cards (Gold) matching symbols transform into Wilds on cascade falls.<br />
                      - Scatter symbols appear to trigger high evaluation indexes.<br />
                      - Multiplier tracks boost winnings from 1x to 2x, 3x, and 5x recursively!
                    </div>
                  </div>

                  <button
                    onClick={playSuperAceSpin}
                    disabled={superAceSpinning}
                    className="w-full mt-4 rounded-xl bg-[#1FA66A] py-3.5 text-xs font-black text-white hover:brightness-110 active:scale-95 transition tracking-widest uppercase shadow-lg shadow-[#1FA66A]/10"
                  >
                    {superAceSpinning ? 'SPINNING...' : 'Spin Slot 👑'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ==========================================
              GAME 9: PLINKO (SOFT DECK DROP)
             ========================================== */}

        </AnimatePresence>
      </div>

      {/* DEMO NOTICE FOOTER */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-center justify-center space-x-2 text-center text-[10px] text-amber-700 font-black uppercase tracking-wider">
        <ShieldAlert className="h-4 w-4 text-amber-600" />
        <span>{t.demoNotice}</span>
      </div>

    </div>
  );
}
