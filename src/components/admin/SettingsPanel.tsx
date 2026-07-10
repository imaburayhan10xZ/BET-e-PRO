/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, Check, RefreshCw, ShieldAlert, Image, X, Upload, Trash2, Globe } from 'lucide-react';
import { SystemSettings } from '../../types';

interface SettingsPanelProps {
  settings: SystemSettings | null;
  loading: boolean;
  onRefresh: () => void;
}

export default function SettingsPanel({ settings, loading, onRefresh }: SettingsPanelProps) {
  const [siteName, setSiteName] = useState('BetePro BDT');
  const [siteLogo, setSiteLogo] = useState('');
  const [siteFavicon, setSiteFavicon] = useState('');
  const [isBrandingOpen, setIsBrandingOpen] = useState(false);
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
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);

  useEffect(() => {
    if (settings) {
      setSiteName(settings.siteName || 'BetePro BDT');
      setSiteLogo(settings.siteLogo || '');
      setSiteFavicon(settings.siteFavicon || '');
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

  const handleImageUpload = async (file: File, type: 'logo' | 'favicon') => {
    try {
      if (type === 'logo') setUploadingLogo(true);
      if (type === 'favicon') setUploadingFavicon(true);

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64data = reader.result;
        
        const token = localStorage.getItem('token');
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ image: base64data })
        });

        if (res.ok) {
          const data = await res.json();
          if (type === 'logo') {
            setSiteLogo(data.imageUrl);
          } else {
            setSiteFavicon(data.imageUrl);
          }
        } else {
          alert('Failed to upload image. Please try again.');
        }

        if (type === 'logo') setUploadingLogo(false);
        if (type === 'favicon') setUploadingFavicon(false);
      };
    } catch (e) {
      console.error(e);
      alert('Upload error.');
      if (type === 'logo') setUploadingLogo(false);
      if (type === 'favicon') setUploadingFavicon(false);
    }
  };

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
          siteLogo,
          siteFavicon,
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
        <div className="space-y-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block">🌐 Brand Identity & Assets</span>
          
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Platform Site Name</label>
            <input
              type="text"
              required
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              className="w-full rounded-xl bg-white border border-slate-200 p-3 text-slate-800 font-bold focus:outline-none"
            />
          </div>

          {/* Trigger button for the branding assets modal */}
          <div className="pt-2 border-t border-slate-200/60">
            <button
              type="button"
              onClick={() => setIsBrandingOpen(true)}
              className="w-full flex items-center justify-between p-3 bg-white hover:bg-slate-50 border border-slate-200/70 rounded-xl transition cursor-pointer active:scale-[0.98] group"
            >
              <div className="flex items-center space-x-3 text-left">
                <div className="flex -space-x-1.5 shrink-0">
                  {siteLogo ? (
                    <div className="h-8 w-8 bg-slate-950 rounded-lg p-0.5 border border-slate-200 flex items-center justify-center overflow-hidden">
                      <img src={siteLogo} alt="Logo" className="max-h-full max-w-full object-contain" referrerPolicy="no-referrer" />
                    </div>
                  ) : (
                    <div className="h-8 w-8 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center text-[8px] text-slate-400 font-bold font-mono">
                      LG
                    </div>
                  )}
                  {siteFavicon ? (
                    <div className="h-8 w-8 bg-white rounded-lg p-1 border border-slate-200 flex items-center justify-center overflow-hidden shadow-sm">
                      <img src={siteFavicon} alt="Favicon" className="max-h-full max-w-full object-contain" referrerPolicy="no-referrer" />
                    </div>
                  ) : (
                    <div className="h-8 w-8 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center text-[8px] text-slate-400 font-bold font-mono">
                      FAV
                    </div>
                  )}
                </div>
                <div>
                  <span className="text-[11px] font-black text-slate-700 block">Manage Branding Logo & Favicon</span>
                  <span className="text-[9px] text-slate-400 font-medium block">Click to upload or edit site logo & favicon</span>
                </div>
              </div>
              <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 group-hover:bg-indigo-100 px-2 py-1 rounded-lg transition shrink-0">
                Configure 📁
              </span>
            </button>
          </div>
        </div>

        {/* Floating Modal for Logo and Favicon Management */}
        <AnimatePresence>
          {isBrandingOpen && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsBrandingOpen(false)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />

              {/* Modal Container */}
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 15 }}
                className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden text-xs flex flex-col max-h-[90vh]"
              >
                {/* Header */}
                <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Globe className="h-4 w-4 text-amber-400" />
                    <div>
                      <h4 className="text-[11px] font-black uppercase tracking-wider text-amber-300">Branding Assets Manager</h4>
                      <p className="text-[9px] text-slate-300">লোগো এবং ব্রাউজার ট্যাব আইকন কনফিগারেশন</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsBrandingOpen(false)}
                    className="p-1 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Body scroll area */}
                <div className="p-5 space-y-5 overflow-y-auto">
                  
                  {/* 1. SITE LOGO SECTION */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <Image className="h-3.5 w-3.5 text-indigo-600" />
                        <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wide">Site Logo (সাইট লোগো)</span>
                      </div>
                      {siteLogo && (
                        <button
                          type="button"
                          onClick={() => setSiteLogo('')}
                          className="flex items-center space-x-0.5 text-[9px] font-bold text-rose-500 hover:underline cursor-pointer"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>Clear Logo</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-start space-x-3">
                      {siteLogo ? (
                        <div className="h-12 w-12 bg-slate-900 rounded-xl p-1 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                          <img src={siteLogo} alt="Logo" className="max-h-full max-w-full object-contain" referrerPolicy="no-referrer" />
                        </div>
                      ) : (
                        <div className="h-12 w-12 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center text-[8px] text-slate-400 font-bold font-mono shrink-0 select-none">
                          NO LOGO
                        </div>
                      )}

                      <div className="flex-1 space-y-1.5">
                        <input
                          type="text"
                          value={siteLogo}
                          onChange={(e) => setSiteLogo(e.target.value)}
                          placeholder="Paste Logo URL (e.g., /logo.svg)"
                          className="w-full rounded-lg bg-white border border-slate-200 px-2.5 py-1.5 text-[10px] text-slate-800 focus:outline-none font-mono"
                        />
                        
                        <div className="flex items-center space-x-2">
                          <span className="text-[9px] text-slate-400">or</span>
                          <label className="cursor-pointer text-[9px] font-black text-indigo-600 hover:text-indigo-800 transition flex items-center space-x-1">
                            <Upload className="h-3 w-3" />
                            <span>{uploadingLogo ? 'Uploading Logo...' : '📁 Upload Logo File'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleImageUpload(file, 'logo');
                              }}
                              disabled={uploadingLogo}
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                    <p className="text-[9px] text-slate-400 font-medium leading-relaxed">
                      লোগো ইমেজ ফাইল সরাসরি আপলোড করতে পারেন অথবা যেকোনো ইমেজের লিংক বসিয়ে দিতে পারেন। 
                    </p>
                  </div>

                  {/* 2. SITE FAVICON SECTION */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <Globe className="h-3.5 w-3.5 text-indigo-600" />
                        <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wide">Site Favicon (ট্যাব আইকন)</span>
                      </div>
                      {siteFavicon && (
                        <button
                          type="button"
                          onClick={() => setSiteFavicon('')}
                          className="flex items-center space-x-0.5 text-[9px] font-bold text-rose-500 hover:underline cursor-pointer"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>Clear Favicon</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-start space-x-3">
                      {siteFavicon ? (
                        <div className="h-12 w-12 bg-white rounded-xl p-1.5 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                          <img src={siteFavicon} alt="Favicon" className="max-h-full max-w-full object-contain" referrerPolicy="no-referrer" />
                        </div>
                      ) : (
                        <div className="h-12 w-12 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center text-[8px] text-slate-400 font-bold font-mono shrink-0 select-none">
                          FAVICON
                        </div>
                      )}

                      <div className="flex-1 space-y-1.5">
                        <input
                          type="text"
                          value={siteFavicon}
                          onChange={(e) => setSiteFavicon(e.target.value)}
                          placeholder="Paste Favicon URL (e.g., /favicon.svg)"
                          className="w-full rounded-lg bg-white border border-slate-200 px-2.5 py-1.5 text-[10px] text-slate-800 focus:outline-none font-mono"
                        />
                        
                        <div className="flex items-center space-x-2">
                          <span className="text-[9px] text-slate-400">or</span>
                          <label className="cursor-pointer text-[9px] font-black text-indigo-600 hover:text-indigo-800 transition flex items-center space-x-1">
                            <Upload className="h-3 w-3" />
                            <span>{uploadingFavicon ? 'Uploading Favicon...' : '📁 Upload Favicon File'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleImageUpload(file, 'favicon');
                              }}
                              disabled={uploadingFavicon}
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                    <p className="text-[9px] text-slate-400 font-medium leading-relaxed">
                      Favicon হল ব্রাউজারের ট্যাবে প্রদর্শিত ছোট আইকন। এখানে যেকোনো স্কয়ার আকারের ছবি আপলোড করুন।
                    </p>
                  </div>

                </div>

                {/* Footer action */}
                <div className="bg-slate-50 border-t border-slate-100 p-4 flex items-center justify-between">
                  <span className="text-[9.5px] font-semibold text-amber-600">
                    * Parameters saved upon clicking Main Save below
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsBrandingOpen(false)}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-wider text-[9px] rounded-xl transition cursor-pointer"
                  >
                    Apply & Close (প্রয়োগ করুন)
                  </button>
                </div>

              </motion.div>
            </div>
          )}
        </AnimatePresence>

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
