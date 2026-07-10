/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Settings, Check, RefreshCw, ShieldAlert } from 'lucide-react';
import { SystemSettings } from '../../types';

interface SettingsPanelProps {
  settings: SystemSettings | null;
  loading: boolean;
  onRefresh: () => void;
}

export default function SettingsPanel({ settings, loading, onRefresh }: SettingsPanelProps) {
  const [siteName, setSiteName] = useState('BetePro BDT');
  const [minDeposit, setMinDeposit] = useState('200');
  const [minWithdraw, setMinWithdraw] = useState('500');
  const [bKashNumber, setBKashNumber] = useState('');
  const [nagadNumber, setNagadNumber] = useState('');
  const [rocketNumber, setRocketNumber] = useState('');
  const [referralBonus, setReferralBonus] = useState('50'); // BDT Referral credit
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [userWinningPercentage, setUserWinningPercentage] = useState('70');
  const [maxWinPercentageOfDeposit, setMaxWinPercentageOfDeposit] = useState('200');
  const [dailyBonusCountLimit, setDailyBonusCountLimit] = useState('1');
  const [dailyBonusAmount, setDailyBonusAmount] = useState('10');
  const [bonusWinRatePercentage, setBonusWinRatePercentage] = useState('30');
  const [signupBonusAmount, setSignupBonusAmount] = useState('500');
  const [referralBonusAmount, setReferralBonusAmount] = useState('200');
  const [androidApkLink, setAndroidApkLink] = useState('');
  const [iosAppLink, setIosAppLink] = useState('');
  const [iosAvailable, setIosAvailable] = useState(false);

  const [feedback, setFeedback] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    if (settings) {
      setSiteName(settings.siteName || 'BetePro BDT');
      setMinDeposit(settings.minDeposit?.toString() || '200');
      setMinWithdraw(settings.minWithdraw?.toString() || '500');
      setBKashNumber(settings.bKashNumber || '');
      setNagadNumber(settings.nagadNumber || '');
      setRocketNumber(settings.rocketNumber || '');
      setReferralBonus((settings as any).referralBonus?.toString() || '50');
      setMaintenanceMode((settings as any).maintenanceMode || false);
      setUserWinningPercentage((settings as any).userWinningPercentage?.toString() || '70');
      setMaxWinPercentageOfDeposit((settings as any).maxWinPercentageOfDeposit?.toString() || '200');
      setDailyBonusCountLimit((settings as any).dailyBonusCountLimit?.toString() || '1');
      setDailyBonusAmount((settings as any).dailyBonusAmount?.toString() || '10');
      setBonusWinRatePercentage((settings as any).bonusWinRatePercentage?.toString() || '30');
      setSignupBonusAmount(settings.signupBonusAmount?.toString() || '500');
      setReferralBonusAmount(settings.referralBonusAmount?.toString() || '200');
      setAndroidApkLink(settings.androidApkLink || '');
      setIosAppLink(settings.iosAppLink || '');
      setIosAvailable(!!settings.iosAvailable);
    }
  }, [settings]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaveLoading(true);
      setFeedback('');
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          siteName,
          minDeposit,
          minWithdraw,
          bKashNumber,
          nagadNumber,
          rocketNumber,
          referralBonus,
          maintenanceMode,
          userWinningPercentage: parseFloat(userWinningPercentage),
          maxWinPercentageOfDeposit: parseFloat(maxWinPercentageOfDeposit),
          dailyBonusCountLimit: parseInt(dailyBonusCountLimit),
          dailyBonusAmount: parseFloat(dailyBonusAmount),
          bonusWinRatePercentage: parseFloat(bonusWinRatePercentage),
          signupBonusAmount: parseFloat(signupBonusAmount),
          referralBonusAmount: parseFloat(referralBonusAmount),
          androidApkLink,
          iosAppLink,
          iosAvailable
        })
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback('Administrative parameters and risk control configurations compiled successfully!');
        onRefresh();
      } else {
        setFeedback(data.error || 'Failed to update configurations.');
      }
    } catch (err) {
      setFeedback('Network error.');
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading && !settings) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <RefreshCw className="h-8 w-8 text-[#FF9F00] animate-spin" />
        <p className="text-slate-400 font-medium text-xs">Loading brand system settings...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto space-y-4"
    >
      <div className="border-b border-slate-100 pb-2 mb-2 flex justify-between items-center">
        <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider">Configure System Parameters</h3>
        <button onClick={onRefresh} className="p-1 rounded text-slate-500 hover:text-slate-800 transition">
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
        
        {/* Brand details */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase">Platform Site Name</label>
          <input
            type="text"
            required
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
            className="w-full rounded-xl bg-slate-50 border border-slate-200 p-3 text-slate-800 font-bold focus:bg-white focus:outline-none"
          />
        </div>

        {/* Maintenance Mode (Toggle switch!) */}
        <div className="flex items-center justify-between bg-red-50/50 border border-red-100 p-3 rounded-2xl">
          <div className="space-y-0.5 pr-2">
            <span className="text-[10px] font-black uppercase text-red-600 tracking-wide block">Maintenance Mode Downtime</span>
            <span className="text-[10px] text-slate-500 font-medium leading-relaxed block">
              Enabling blockades all casino play and sports predictions sitewide, serving a protective maintenance banner instantly.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setMaintenanceMode(!maintenanceMode)}
            className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors shrink-0 ${
              maintenanceMode ? 'bg-red-600' : 'bg-slate-300'
            }`}
          >
            <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
              maintenanceMode ? 'translate-x-6' : 'translate-x-0'
            }`} />
          </button>
        </div>

        {/* Min deposit and min withdraw */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Min Deposit (৳ BDT)</label>
            <input
              type="number"
              required
              value={minDeposit}
              onChange={(e) => setMinDeposit(e.target.value)}
              className="w-full rounded-xl bg-slate-50 border border-slate-200 p-3 text-slate-800 focus:bg-white focus:outline-none font-bold"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Min Withdraw (৳ BDT)</label>
            <input
              type="number"
              required
              value={minWithdraw}
              onChange={(e) => setMinWithdraw(e.target.value)}
              className="w-full rounded-xl bg-slate-50 border border-slate-200 p-3 text-slate-800 focus:bg-white focus:outline-none font-bold"
            />
          </div>
        </div>

        {/* Referral program configure */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase">Referral Invitation Credit Bonus (৳ BDT)</label>
          <input
            type="number"
            required
            value={referralBonus}
            onChange={(e) => setReferralBonus(e.target.value)}
            className="w-full rounded-xl bg-slate-50 border border-slate-200 p-3 text-slate-800 focus:bg-white focus:outline-none font-bold font-mono"
          />
        </div>

        {/* Dynamic Risk Control Limits */}
        <div className="space-y-3 border-t border-slate-100 pt-3.5">
          <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 block">Game Win Rate & Risk Control</span>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">User Win Chance % *</label>
              <input
                type="number"
                required
                min="0"
                max="100"
                value={userWinningPercentage}
                onChange={(e) => setUserWinningPercentage(e.target.value)}
                className="w-full rounded-xl bg-slate-50 border border-slate-200 p-3 text-slate-900 focus:bg-white focus:outline-none font-bold"
              />
              <span className="text-[9px] text-slate-400 font-medium">Global win probability filter.</span>
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Max Win % of Deposit *</label>
              <input
                type="number"
                required
                min="0"
                value={maxWinPercentageOfDeposit}
                onChange={(e) => setMaxWinPercentageOfDeposit(e.target.value)}
                className="w-full rounded-xl bg-slate-50 border border-slate-200 p-3 text-slate-900 focus:bg-white focus:outline-none font-bold"
              />
              <span className="text-[9px] text-slate-400 font-medium">Max payout cap of total deposits.</span>
            </div>
          </div>
        </div>

        {/* Free Daily Bonus Control */}
        <div className="space-y-3 border-t border-slate-100 pt-3.5 bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
          <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600 block">🎁 Free Daily Bonus Control</span>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Daily Claim Limit (Times)</label>
              <input
                type="number"
                required
                min="0"
                value={dailyBonusCountLimit}
                onChange={(e) => setDailyBonusCountLimit(e.target.value)}
                className="w-full rounded-xl bg-white border border-slate-200 p-3 text-slate-900 focus:bg-white focus:outline-none font-bold"
              />
              <span className="text-[9px] text-slate-400 font-medium leading-relaxed block">How many times a user can claim daily.</span>
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Bonus Amount (৳ BDT)</label>
              <input
                type="number"
                required
                min="0"
                value={dailyBonusAmount}
                onChange={(e) => setDailyBonusAmount(e.target.value)}
                className="w-full rounded-xl bg-white border border-slate-200 p-3 text-slate-900 focus:bg-white focus:outline-none font-bold"
              />
              <span className="text-[9px] text-slate-400 font-medium leading-relaxed block">Amount added to wallet per claim.</span>
            </div>
          </div>

          <div className="space-y-1 pt-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Bonus Play Win Chance %</label>
            <input
              type="number"
              required
              min="0"
              max="100"
              value={bonusWinRatePercentage}
              onChange={(e) => setBonusWinRatePercentage(e.target.value)}
              className="w-full rounded-xl bg-white border border-slate-200 p-3 text-slate-900 focus:bg-white focus:outline-none font-bold"
            />
            <span className="text-[9px] text-slate-400 font-medium leading-relaxed block">
              Win rate applied strictly when user plays games using bonus money (zero deposit or recent check-in).
            </span>
          </div>
        </div>

        {/* Free Registration & Referral Bonus Control */}
        <div className="space-y-3 border-t border-slate-100 pt-3.5 bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
          <span className="text-[9px] font-black uppercase tracking-widest text-teal-600 block">🎁 Signup & Referral Reg Bonus</span>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Signup Free Bonus (৳ BDT)</label>
              <input
                type="number"
                required
                min="0"
                value={signupBonusAmount}
                onChange={(e) => setSignupBonusAmount(e.target.value)}
                className="w-full rounded-xl bg-white border border-slate-200 p-3 text-slate-900 focus:bg-white focus:outline-none font-bold"
              />
              <span className="text-[9px] text-slate-400 font-medium leading-relaxed block">Automatically given to new users.</span>
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Referral Reward (৳ BDT)</label>
              <input
                type="number"
                required
                min="0"
                value={referralBonusAmount}
                onChange={(e) => setReferralBonusAmount(e.target.value)}
                className="w-full rounded-xl bg-white border border-slate-200 p-3 text-slate-900 focus:bg-white focus:outline-none font-bold"
              />
              <span className="text-[9px] text-slate-400 font-medium leading-relaxed block">Given to referrer upon successful sign up.</span>
            </div>
          </div>
        </div>

        {/* App Download Links Control */}
        <div className="space-y-3 border-t border-slate-100 pt-3.5 bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
          <span className="text-[9px] font-black uppercase tracking-widest text-[#FF9F00] block">📱 App Download Configuration</span>
          
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Android APK Download Link</label>
            <input
              type="text"
              value={androidApkLink}
              onChange={(e) => setAndroidApkLink(e.target.value)}
              className="w-full rounded-xl bg-white border border-slate-200 p-3 text-slate-900 focus:bg-white focus:outline-none font-mono"
              placeholder="e.g. https://domain.com/app.apk"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">iOS App Store / PWA Link</label>
            <input
              type="text"
              value={iosAppLink}
              onChange={(e) => setIosAppLink(e.target.value)}
              className="w-full rounded-xl bg-white border border-slate-200 p-3 text-slate-900 focus:bg-white focus:outline-none font-mono"
              placeholder="e.g. https://apps.apple.com/..."
            />
          </div>

          <div className="flex items-center justify-between bg-amber-50/50 border border-amber-100 p-2.5 rounded-xl">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-amber-800 uppercase block">iOS App Availability</span>
              <span className="text-[9px] text-slate-500 leading-normal block">
                Toggle to show as "Unavailable" (under construction) or display download link.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIosAvailable(!iosAvailable)}
              className={`w-10 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors shrink-0 ${
                iosAvailable ? 'bg-amber-500' : 'bg-slate-300'
              }`}
            >
              <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                iosAvailable ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>
        </div>

        {/* Agent phone numbers */}
        <div className="space-y-2 border-t border-slate-100 pt-3.5">
          <span className="text-[9px] font-black uppercase tracking-widest text-[#FF9F00] block">Mobile Wallet Gateway Cash-in Nodes</span>
          
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase">bKash Agent Number</label>
            <input
              type="text"
              value={bKashNumber}
              onChange={(e) => setBKashNumber(e.target.value)}
              className="w-full rounded-xl bg-slate-50 border border-slate-200 p-3 text-slate-900 focus:bg-white focus:outline-none font-mono font-bold"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase">Nagad Agent Number</label>
            <input
              type="text"
              value={nagadNumber}
              onChange={(e) => setNagadNumber(e.target.value)}
              className="w-full rounded-xl bg-slate-50 border border-slate-200 p-3 text-slate-900 focus:bg-white focus:outline-none font-mono font-bold"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase">Rocket Agent Number</label>
            <input
              type="text"
              value={rocketNumber}
              onChange={(e) => setRocketNumber(e.target.value)}
              className="w-full rounded-xl bg-slate-50 border border-slate-200 p-3 text-slate-900 focus:bg-white focus:outline-none font-mono font-bold"
            />
          </div>
        </div>

        {feedback && (
          <p className={`text-[10px] font-bold text-center py-2 border rounded-xl ${
            feedback.includes('compiled') ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-red-600 bg-red-50 border-red-100'
          }`}>
            {feedback}
          </p>
        )}

        <button
          type="submit"
          disabled={saveLoading}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 text-white font-black uppercase tracking-wider text-[10px] transition"
        >
          {saveLoading ? 'Compiling settings...' : 'Save administrative parameters'}
        </button>

      </form>
    </motion.div>
  );
}
