/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings, Check, RefreshCw, ShieldAlert, Image, X, Upload, Trash2, 
  Globe, Percent, Lock, Smartphone, Award, Download, Coins, Wallet, 
  ChevronRight, HelpCircle, Save, Sliders, BellRing, ClipboardCheck
} from 'lucide-react';
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

  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [activeAccordion, setActiveAccordion] = useState<string | null>(null);

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

  // Check if current parameters are modified compared to loaded settings
  const isModified = settings ? (
    siteName !== (settings.siteName || 'BetePro BDT') ||
    siteLogo !== (settings.siteLogo || '') ||
    siteFavicon !== (settings.siteFavicon || '') ||
    minDeposit !== (settings.minDeposit?.toString() || '200') ||
    minWithdraw !== (settings.minWithdraw?.toString() || '500') ||
    bKashNumber !== (settings.bKashNumber || '') ||
    nagadNumber !== (settings.nagadNumber || '') ||
    rocketNumber !== (settings.rocketNumber || '') ||
    referralBonus !== ((settings as any).referralBonus?.toString() || '50') ||
    maintenanceMode !== ((settings as any).maintenanceMode || false) ||
    userWinningPercentage !== ((settings as any).userWinningPercentage?.toString() || '70') ||
    maxWinPercentageOfDeposit !== ((settings as any).maxWinPercentageOfDeposit?.toString() || '200') ||
    dailyBonusCountLimit !== ((settings as any).dailyBonusCountLimit?.toString() || '1') ||
    dailyBonusAmount !== ((settings as any).dailyBonusAmount?.toString() || '10') ||
    bonusWinRatePercentage !== ((settings as any).bonusWinRatePercentage?.toString() || '30') ||
    signupBonusAmount !== (settings.signupBonusAmount?.toString() || '500') ||
    referralBonusAmount !== (settings.referralBonusAmount?.toString() || '200') ||
    androidApkLink !== (settings.androidApkLink || '') ||
    iosAppLink !== (settings.iosAppLink || '') ||
    iosAvailable !== (!!settings.iosAvailable)
  ) : false;

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

  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
        setFeedback('Configurations saved and applied successfully across all databases!');
        onRefresh();
        // Clear active states
        setTimeout(() => setFeedback(''), 4000);
      } else {
        setFeedback(data.error || 'Failed to update configurations.');
      }
    } catch (err) {
      setFeedback('Network error. Settings were not saved.');
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

  // Define the section layouts for the Bento Grid
  const bentoSections = [
    {
      id: 'branding',
      title: 'Brand & Identity',
      titleBn: 'ব্র্যান্ডিং এবং লোগো',
      desc: 'Platform site name, logo upload, and tab icon customization.',
      icon: Globe,
      color: 'bg-blue-50 text-blue-600 border-blue-100 hover:border-blue-300',
      count: 3,
      summary: `${siteName} (Logo: ${siteLogo ? 'Set' : 'Default'})`
    },
    {
      id: 'system',
      title: 'Limits & Security',
      titleBn: 'লেনদেন ও সিকিউরিটি',
      desc: 'Maintenance downtime control, minimum deposits & withdrawals.',
      icon: Lock,
      color: 'bg-rose-50 text-rose-600 border-rose-100 hover:border-rose-300',
      count: 3,
      summary: `Dep: ৳${minDeposit} | With: ৳${minWithdraw} | ${maintenanceMode ? '🚨 Maintenance' : '🟢 Live'}`
    },
    {
      id: 'gateway',
      title: 'Cash Gateway Nodes',
      titleBn: 'মোবাইল ওয়ালেট গেটওয়ে',
      desc: 'Configuring bKash, Nagad, and Rocket wallet recipient numbers.',
      icon: Smartphone,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:border-emerald-300',
      count: 3,
      summary: `bKash: ${bKashNumber || 'N/A'} | Nagad: ${nagadNumber || 'N/A'}`
    },
    {
      id: 'risk',
      title: 'Risk Win Probabilities',
      titleBn: 'গেম রিস্ক ও উইন কন্ট্রোল',
      desc: 'Fine-tune global winning chance percentages and deposit payout caps.',
      icon: Percent,
      color: 'bg-amber-50 text-amber-600 border-amber-100 hover:border-amber-300',
      count: 2,
      summary: `Win Prob: ${userWinningPercentage}% | Deposit Cap: ${maxWinPercentageOfDeposit}%`
    },
    {
      id: 'bonus',
      title: 'Promotions & Rewards',
      titleBn: 'বোনাস এবং পুরস্কার',
      desc: 'Free registration bonuses, referral gifts, and daily check-in loops.',
      icon: Award,
      color: 'bg-purple-50 text-purple-600 border-purple-100 hover:border-purple-300',
      count: 6,
      summary: `Reg: ৳${signupBonusAmount} | Ref: ৳${referralBonusAmount} | Daily: ৳${dailyBonusAmount}`
    },
    {
      id: 'apps',
      title: 'App Downloads',
      titleBn: 'মোবাইল অ্যাপ্লিকেশন লিঙ্ক',
      desc: 'Manage direct Android APK binaries and PWA/iOS store links.',
      icon: Download,
      color: 'bg-cyan-50 text-cyan-600 border-cyan-100 hover:border-cyan-300',
      count: 3,
      summary: `Android: ${androidApkLink ? 'Live' : 'Empty'} | iOS: ${iosAvailable ? 'Active' : 'Closed'}`
    }
  ];

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 text-xs text-slate-700">
      
      {/* HEADER BAR */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-sm font-black uppercase text-slate-800 tracking-wider">Configure System Parameters</h3>
          <p className="text-[10px] text-slate-400 mt-0.5">Manage administrative controls, rewards, branding, and transaction gates.</p>
        </div>
        <button 
          onClick={onRefresh} 
          className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition flex items-center space-x-1 font-bold cursor-pointer border border-slate-200/50"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span className="text-[10px]">Sync DB</span>
        </button>
      </div>

      {/* BENTO GRID OF CARDS (MAIN SCREEN) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {bentoSections.map((sec) => {
          const IconComponent = sec.icon;
          return (
            <motion.div
              key={sec.id}
              whileHover={{ scale: 1.015, y: -2 }}
              whileTap={{ scale: 0.985 }}
              onClick={() => {
                setActiveSection(sec.id);
                setActiveAccordion(null); // Reset option selected inside
              }}
              className="p-5 bg-white border border-slate-200/80 rounded-2xl cursor-pointer transition-all hover:shadow-md flex flex-col justify-between space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className={`p-3 rounded-2xl ${sec.color.split(' ')[0]} ${sec.color.split(' ')[1]} border ${sec.color.split(' ')[2]} shrink-0`}>
                  <IconComponent className="h-5 w-5" />
                </div>
                <span className="text-[9px] font-extrabold px-2.5 py-1 rounded-full bg-slate-50 text-slate-500 border border-slate-100 font-mono">
                  {sec.count} Options
                </span>
              </div>
              
              <div className="space-y-1">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center space-x-1.5">
                  <span>{sec.title}</span>
                  <span className="text-[10px] text-slate-400 font-normal">({sec.titleBn})</span>
                </h4>
                <p className="text-[11px] text-slate-400 leading-normal">{sec.desc}</p>
              </div>

              <div className="pt-3 border-t border-dashed border-slate-100 flex items-center justify-between text-[10px] font-semibold text-slate-500">
                <span className="truncate max-w-[85%]">{sec.summary}</span>
                <ChevronRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-600" />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* FLOATING SAVE PARAMETERS BANNER */}
      <AnimatePresence>
        {isModified && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[999] max-w-md w-full px-4"
          >
            <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-amber-500 text-slate-950 rounded-xl">
                  <Sliders className="h-4 w-4 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-amber-400">Settings Have Been Modified</h4>
                  <p className="text-[10px] text-slate-300">সেটিংস পরিবর্তন করা হয়েছে। সেভ করতে ক্লিক করুন।</p>
                </div>
              </div>
              <button
                onClick={() => handleSaveSettings()}
                disabled={saveLoading}
                className="shrink-0 px-4 py-2 rounded-xl bg-[#1FA66A] hover:bg-[#1fa66ad0] text-white text-[10px] font-black uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center space-x-1.5 cursor-pointer"
              >
                {saveLoading ? (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                ) : (
                  <Save className="h-3 w-3" />
                )}
                <span>Save All (সেভ করুন)</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FEEDBACK PROMPTS */}
      {feedback && (
        <p className={`text-[10px] font-bold text-center py-3 border rounded-xl ${
          feedback.includes('successfully') ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-red-600 bg-red-50 border-red-100'
        }`}>
          {feedback}
        </p>
      )}

      {/* -------------------- DETAIL OVERLAY POPUP (MODAL) -------------------- */}
      <AnimatePresence>
        {activeSection && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveSection(null)}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            />

            {/* Modal Container */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh]"
            >
              
              {/* Header */}
              {(() => {
                const cur = bentoSections.find(s => s.id === activeSection);
                if (!cur) return null;
                const HeaderIcon = cur.icon;
                return (
                  <div className="bg-slate-900 text-white p-4.5 flex items-center justify-between border-b border-slate-800">
                    <div className="flex items-center space-x-3">
                      <div className="p-2.5 rounded-xl bg-slate-800 text-amber-400">
                        <HeaderIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center space-x-1.5">
                          <span>{cur.title}</span>
                          <span className="text-[10px] text-slate-400 font-bold">({cur.titleBn})</span>
                        </h4>
                        <p className="text-[9px] text-slate-400 font-medium">{cur.desc}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveSection(null)}
                      className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
                    >
                      <X className="h-4.5 w-4.5" />
                    </button>
                  </div>
                );
              })()}

              {/* Body: Beautiful Accordion list */}
              <div className="p-5 overflow-y-auto space-y-3.5 max-h-[60vh] bg-slate-50/50">
                
                {/* BRANDING SECTION CONTENT */}
                {activeSection === 'branding' && (
                  <>
                    {/* Item 1: Site Name */}
                    <div className="border border-slate-200/70 bg-white rounded-2xl overflow-hidden shadow-sm">
                      <button
                        type="button"
                        onClick={() => setActiveAccordion(activeAccordion === 'siteName' ? null : 'siteName')}
                        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition cursor-pointer"
                      >
                        <div className="flex items-center space-x-3">
                          <Globe className="h-4 w-4 text-blue-500" />
                          <div className="text-left">
                            <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wide">Platform Site Name</span>
                            <span className="text-[10px] text-slate-400 block">সাইটের নাম পরিবর্তন করুন</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 max-w-[120px] truncate">
                          {siteName}
                        </span>
                      </button>

                      <AnimatePresence>
                        {activeAccordion === 'siteName' && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-slate-100 p-4 space-y-3 bg-slate-50/30"
                          >
                            <label className="text-[10px] font-bold text-slate-500 uppercase block">Enter Custom Site Name</label>
                            <input
                              type="text"
                              required
                              value={siteName}
                              onChange={(e) => setSiteName(e.target.value)}
                              className="w-full rounded-xl bg-white border border-slate-200 p-3 text-slate-800 font-black focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                              placeholder="e.g. BetePro BDT"
                            />
                            <p className="text-[9px] text-slate-400 leading-normal">
                              এটি সম্পূর্ণ অ্যাপ্লিকেশনের সব পৃষ্ঠায় টাইটেল, লোগো টেক্সট এবং কপিরাইট নোটিশে স্বয়ংক্রিয়ভাবে পরিবর্তিত হবে।
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Item 2: Site Logo */}
                    <div className="border border-slate-200/70 bg-white rounded-2xl overflow-hidden shadow-sm">
                      <button
                        type="button"
                        onClick={() => setActiveAccordion(activeAccordion === 'siteLogo' ? null : 'siteLogo')}
                        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition cursor-pointer"
                      >
                        <div className="flex items-center space-x-3">
                          <Image className="h-4 w-4 text-blue-500" />
                          <div className="text-left">
                            <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wide">Platform Logo Asset</span>
                            <span className="text-[10px] text-slate-400 block">লোগো ছবি ফাইল বা লিংক আপডেট</span>
                          </div>
                        </div>
                        {siteLogo ? (
                          <div className="h-7 w-12 bg-slate-900 rounded-lg p-0.5 border border-slate-200 flex items-center justify-center overflow-hidden">
                            <img src={siteLogo} alt="Preview" className="max-h-full max-w-full object-contain" referrerPolicy="no-referrer" />
                          </div>
                        ) : (
                          <span className="text-[9px] font-extrabold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">Default</span>
                        )}
                      </button>

                      <AnimatePresence>
                        {activeAccordion === 'siteLogo' && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-slate-100 p-4 space-y-4 bg-slate-50/30"
                          >
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Logo Image (সাইট লোগো)</label>
                              {siteLogo && (
                                <button
                                  type="button"
                                  onClick={() => setSiteLogo('')}
                                  className="text-[9px] font-bold text-rose-500 flex items-center space-x-0.5 hover:underline cursor-pointer"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  <span>Clear Custom</span>
                                </button>
                              )}
                            </div>

                            <div className="flex items-start space-x-3">
                              {siteLogo ? (
                                <div className="h-12 w-12 bg-slate-950 rounded-xl p-1 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden shadow">
                                  <img src={siteLogo} alt="Logo" className="max-h-full max-w-full object-contain" referrerPolicy="no-referrer" />
                                </div>
                              ) : (
                                <div className="h-12 w-12 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center text-[8px] text-slate-400 font-bold shrink-0 select-none">
                                  DEFAULT
                                </div>
                              )}

                              <div className="flex-1 space-y-1.5">
                                <input
                                  type="text"
                                  value={siteLogo}
                                  onChange={(e) => setSiteLogo(e.target.value)}
                                  placeholder="Paste custom logo URL (or upload file below)"
                                  className="w-full rounded-lg bg-white border border-slate-200 px-2.5 py-1.5 text-[10px] text-slate-800 focus:outline-none font-mono"
                                />
                                
                                <label className="cursor-pointer text-[9.5px] font-black text-indigo-600 hover:text-indigo-800 transition flex items-center space-x-1">
                                  <Upload className="h-3 w-3" />
                                  <span>{uploadingLogo ? 'Uploading logo to CDN...' : '📁 Upload New File'}</span>
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
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Item 3: Site Favicon */}
                    <div className="border border-slate-200/70 bg-white rounded-2xl overflow-hidden shadow-sm">
                      <button
                        type="button"
                        onClick={() => setActiveAccordion(activeAccordion === 'siteFavicon' ? null : 'siteFavicon')}
                        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition cursor-pointer"
                      >
                        <div className="flex items-center space-x-3">
                          <Globe className="h-4 w-4 text-blue-500" />
                          <div className="text-left">
                            <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wide">Browser Tab Favicon</span>
                            <span className="text-[10px] text-slate-400 block">ব্রাউজার ট্যাবের ছোট আইকন</span>
                          </div>
                        </div>
                        {siteFavicon ? (
                          <div className="h-8 w-8 bg-white rounded-lg p-1 border border-slate-200 flex items-center justify-center overflow-hidden">
                            <img src={siteFavicon} alt="Favicon" className="max-h-full max-w-full object-contain" referrerPolicy="no-referrer" />
                          </div>
                        ) : (
                          <span className="text-[9px] font-extrabold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">Default</span>
                        )}
                      </button>

                      <AnimatePresence>
                        {activeAccordion === 'siteFavicon' && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-slate-100 p-4 space-y-4 bg-slate-50/30"
                          >
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Favicon Icon (ট্যাব আইকন)</label>
                              {siteFavicon && (
                                <button
                                  type="button"
                                  onClick={() => setSiteFavicon('')}
                                  className="text-[9px] font-bold text-rose-500 flex items-center space-x-0.5 hover:underline cursor-pointer"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  <span>Clear Custom</span>
                                </button>
                              )}
                            </div>

                            <div className="flex items-start space-x-3">
                              {siteFavicon ? (
                                <div className="h-12 w-12 bg-white rounded-xl p-1.5 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                                  <img src={siteFavicon} alt="Favicon" className="max-h-full max-w-full object-contain" referrerPolicy="no-referrer" />
                                </div>
                              ) : (
                                <div className="h-12 w-12 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center text-[8px] text-slate-400 font-bold shrink-0 select-none">
                                  DEFAULT
                                </div>
                              )}

                              <div className="flex-1 space-y-1.5">
                                <input
                                  type="text"
                                  value={siteFavicon}
                                  onChange={(e) => setSiteFavicon(e.target.value)}
                                  placeholder="Paste custom favicon URL (or upload square image below)"
                                  className="w-full rounded-lg bg-white border border-slate-200 px-2.5 py-1.5 text-[10px] text-slate-800 focus:outline-none font-mono"
                                />
                                
                                <label className="cursor-pointer text-[9.5px] font-black text-indigo-600 hover:text-indigo-800 transition flex items-center space-x-1">
                                  <Upload className="h-3 w-3" />
                                  <span>{uploadingFavicon ? 'Uploading Favicon to CDN...' : '📁 Upload Square File'}</span>
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
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </>
                )}

                {/* SYSTEM & LIMITS CONTENT */}
                {activeSection === 'system' && (
                  <>
                    {/* Item 1: Maintenance Mode */}
                    <div className="border border-slate-200/70 bg-white rounded-2xl overflow-hidden shadow-sm">
                      <div className="flex items-center justify-between p-4 bg-red-50/30 border-b border-red-100/40">
                        <div className="flex items-center space-x-3">
                          <Lock className="h-4 w-4 text-red-500" />
                          <div className="text-left">
                            <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wide">Maintenance Downtime</span>
                            <span className="text-[10px] text-slate-400 block">মেইনটেন্যান্স মোড চালু বা বন্ধ করুন</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setMaintenanceMode(!maintenanceMode)}
                          className={`w-11 h-5.5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors shrink-0 ${
                            maintenanceMode ? 'bg-red-600' : 'bg-slate-300'
                          }`}
                        >
                          <div className={`bg-white w-4.5 h-4.5 rounded-full shadow transform transition-transform ${
                            maintenanceMode ? 'translate-x-5' : 'translate-x-0'
                          }`} />
                        </button>
                      </div>
                      <div className="p-4 bg-slate-50/50">
                        <p className="text-[9.5px] text-slate-500 leading-normal">
                          মেইনটেন্যান্স মোড সক্রিয় করলে সাধারণ ব্যবহারকারীরা সাইটে অ্যাক্সেস করতে পারবে না এবং একটি সতর্কতা ব্যানার দেখতে পাবে।
                        </p>
                      </div>
                    </div>

                    {/* Item 2: Minimum Deposit */}
                    <div className="border border-slate-200/70 bg-white rounded-2xl overflow-hidden shadow-sm">
                      <button
                        type="button"
                        onClick={() => setActiveAccordion(activeAccordion === 'minDeposit' ? null : 'minDeposit')}
                        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition cursor-pointer"
                      >
                        <div className="flex items-center space-x-3">
                          <Coins className="h-4 w-4 text-rose-500" />
                          <div className="text-left">
                            <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wide">Minimum Deposit Limit</span>
                            <span className="text-[10px] text-slate-400 block">সর্বনিম্ন ডিপোজিট সীমা</span>
                          </div>
                        </div>
                        <span className="text-[10.5px] font-black text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100">
                          ৳ {minDeposit}
                        </span>
                      </button>

                      <AnimatePresence>
                        {activeAccordion === 'minDeposit' && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-slate-100 p-4 space-y-3 bg-slate-50/30"
                          >
                            <label className="text-[10px] font-bold text-slate-500 uppercase block">Min Deposit Amount (৳ BDT)</label>
                            <input
                              type="number"
                              required
                              value={minDeposit}
                              onChange={(e) => setMinDeposit(e.target.value)}
                              className="w-full rounded-xl bg-white border border-slate-200 p-3 text-slate-900 font-black focus:outline-none text-xs"
                            />
                            <p className="text-[9px] text-slate-400">ডিপোজিট রিকোয়েস্ট সাবমিট করতে হলে ব্যবহারকারীকে অবশ্যই এই পরিমাণের সমান বা বেশি ডিপোজিট করতে হবে।</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Item 3: Minimum Withdraw */}
                    <div className="border border-slate-200/70 bg-white rounded-2xl overflow-hidden shadow-sm">
                      <button
                        type="button"
                        onClick={() => setActiveAccordion(activeAccordion === 'minWithdraw' ? null : 'minWithdraw')}
                        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition cursor-pointer"
                      >
                        <div className="flex items-center space-x-3">
                          <Wallet className="h-4 w-4 text-rose-500" />
                          <div className="text-left">
                            <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wide">Minimum Withdraw Limit</span>
                            <span className="text-[10px] text-slate-400 block">সর্বনিম্ন উইথড্র সীমা</span>
                          </div>
                        </div>
                        <span className="text-[10.5px] font-black text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100">
                          ৳ {minWithdraw}
                        </span>
                      </button>

                      <AnimatePresence>
                        {activeAccordion === 'minWithdraw' && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-slate-100 p-4 space-y-3 bg-slate-50/30"
                          >
                            <label className="text-[10px] font-bold text-slate-500 uppercase block">Min Withdraw Amount (৳ BDT)</label>
                            <input
                              type="number"
                              required
                              value={minWithdraw}
                              onChange={(e) => setMinWithdraw(e.target.value)}
                              className="w-full rounded-xl bg-white border border-slate-200 p-3 text-slate-900 font-black focus:outline-none text-xs"
                            />
                            <p className="text-[9px] text-slate-400">ব্যবহারকারী যখন উইথড্র রিকোয়েস্ট পাঠাবে, ব্যালেন্স অবশ্যই এই সীমার বেশি হতে হবে।</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </>
                )}

                {/* GATEWAY WALLET NODES */}
                {activeSection === 'gateway' && (
                  <>
                    {/* Item 1: bKash */}
                    <div className="border border-slate-200/70 bg-white rounded-2xl overflow-hidden shadow-sm">
                      <button
                        type="button"
                        onClick={() => setActiveAccordion(activeAccordion === 'bKash' ? null : 'bKash')}
                        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition cursor-pointer"
                      >
                        <div className="flex items-center space-x-3">
                          <Smartphone className="h-4 w-4 text-emerald-500" />
                          <div className="text-left">
                            <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wide">bKash Agent Number</span>
                            <span className="text-[10px] text-slate-400 block">বিকাশ এজেন্ট নম্বর পরিবর্তন</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-slate-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                          {bKashNumber || 'Not Set'}
                        </span>
                      </button>

                      <AnimatePresence>
                        {activeAccordion === 'bKash' && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-slate-100 p-4 space-y-3 bg-slate-50/30"
                          >
                            <label className="text-[10px] font-bold text-slate-500 uppercase block">bKash Agent (১১ ডিজিট)</label>
                            <input
                              type="text"
                              value={bKashNumber}
                              onChange={(e) => setBKashNumber(e.target.value)}
                              className="w-full rounded-xl bg-white border border-slate-200 p-3 text-slate-900 font-black focus:outline-none text-xs font-mono"
                              placeholder="e.g. 017XXXXXXXX"
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Item 2: Nagad */}
                    <div className="border border-slate-200/70 bg-white rounded-2xl overflow-hidden shadow-sm">
                      <button
                        type="button"
                        onClick={() => setActiveAccordion(activeAccordion === 'nagad' ? null : 'nagad')}
                        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition cursor-pointer"
                      >
                        <div className="flex items-center space-x-3">
                          <Smartphone className="h-4 w-4 text-emerald-500" />
                          <div className="text-left">
                            <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wide">Nagad Agent Number</span>
                            <span className="text-[10px] text-slate-400 block">নগদ এজেন্ট নম্বর পরিবর্তন</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-slate-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                          {nagadNumber || 'Not Set'}
                        </span>
                      </button>

                      <AnimatePresence>
                        {activeAccordion === 'nagad' && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-slate-100 p-4 space-y-3 bg-slate-50/30"
                          >
                            <label className="text-[10px] font-bold text-slate-500 uppercase block">Nagad Agent (১১ ডিজিট)</label>
                            <input
                              type="text"
                              value={nagadNumber}
                              onChange={(e) => setNagadNumber(e.target.value)}
                              className="w-full rounded-xl bg-white border border-slate-200 p-3 text-slate-900 font-black focus:outline-none text-xs font-mono"
                              placeholder="e.g. 018XXXXXXXX"
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Item 3: Rocket */}
                    <div className="border border-slate-200/70 bg-white rounded-2xl overflow-hidden shadow-sm">
                      <button
                        type="button"
                        onClick={() => setActiveAccordion(activeAccordion === 'rocket' ? null : 'rocket')}
                        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition cursor-pointer"
                      >
                        <div className="flex items-center space-x-3">
                          <Smartphone className="h-4 w-4 text-emerald-500" />
                          <div className="text-left">
                            <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wide">Rocket Agent Number</span>
                            <span className="text-[10px] text-slate-400 block">রকেট এজেন্ট নম্বর পরিবর্তন</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-slate-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                          {rocketNumber || 'Not Set'}
                        </span>
                      </button>

                      <AnimatePresence>
                        {activeAccordion === 'rocket' && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-slate-100 p-4 space-y-3 bg-slate-50/30"
                          >
                            <label className="text-[10px] font-bold text-slate-500 uppercase block">Rocket Agent (১২ ডিজিট)</label>
                            <input
                              type="text"
                              value={rocketNumber}
                              onChange={(e) => setRocketNumber(e.target.value)}
                              className="w-full rounded-xl bg-white border border-slate-200 p-3 text-slate-900 font-black focus:outline-none text-xs font-mono"
                              placeholder="e.g. 019XXXXXXXXX"
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </>
                )}

                {/* RISK & WIN PERCENTAGES */}
                {activeSection === 'risk' && (
                  <>
                    {/* Item 1: User Winning Chance */}
                    <div className="border border-slate-200/70 bg-white rounded-2xl overflow-hidden shadow-sm">
                      <button
                        type="button"
                        onClick={() => setActiveAccordion(activeAccordion === 'winRate' ? null : 'winRate')}
                        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition cursor-pointer"
                      >
                        <div className="flex items-center space-x-3">
                          <Percent className="h-4 w-4 text-amber-500" />
                          <div className="text-left">
                            <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wide">Global Win Chance %</span>
                            <span className="text-[10px] text-slate-400 block">ক্যাসিনো গেম জয়ের সাধারণ ফিল্টার</span>
                          </div>
                        </div>
                        <span className="text-[10.5px] font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100">
                          {userWinningPercentage}%
                        </span>
                      </button>

                      <AnimatePresence>
                        {activeAccordion === 'winRate' && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-slate-100 p-4 space-y-3 bg-slate-50/30"
                          >
                            <label className="text-[10px] font-bold text-slate-500 uppercase block">User Win Probability (0% - 100%)</label>
                            <input
                              type="number"
                              required
                              min="0"
                              max="100"
                              value={userWinningPercentage}
                              onChange={(e) => setUserWinningPercentage(e.target.value)}
                              className="w-full rounded-xl bg-white border border-slate-200 p-3 text-slate-900 font-black focus:outline-none text-xs"
                            />
                            <p className="text-[9px] text-slate-400 leading-normal">
                              এটি স্লট, চাকা ঘুড়ানো বা ডাইস গেম খেলার সময় ব্যবহারকারী জিতবে নাকি হারবে তার সম্ভাবনা নিয়ন্ত্রণ করে।
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Item 2: Max Win % of Deposit */}
                    <div className="border border-slate-200/70 bg-white rounded-2xl overflow-hidden shadow-sm">
                      <button
                        type="button"
                        onClick={() => setActiveAccordion(activeAccordion === 'maxPayout' ? null : 'maxPayout')}
                        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition cursor-pointer"
                      >
                        <div className="flex items-center space-x-3">
                          <ShieldAlert className="h-4 w-4 text-amber-500" />
                          <div className="text-left">
                            <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wide">Max Win Cap of Deposit</span>
                            <span className="text-[10px] text-slate-400 block">আমানতের সর্বোচ্চ উইন লিমিট</span>
                          </div>
                        </div>
                        <span className="text-[10.5px] font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100">
                          {maxWinPercentageOfDeposit}%
                        </span>
                      </button>

                      <AnimatePresence>
                        {activeAccordion === 'maxPayout' && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-slate-100 p-4 space-y-3 bg-slate-50/30"
                          >
                            <label className="text-[10px] font-bold text-slate-500 uppercase block">Max Win Multiplier Cap of Lifetime Deposit %</label>
                            <input
                              type="number"
                              required
                              min="0"
                              value={maxWinPercentageOfDeposit}
                              onChange={(e) => setMaxWinPercentageOfDeposit(e.target.value)}
                              className="w-full rounded-xl bg-white border border-slate-200 p-3 text-slate-900 font-black focus:outline-none text-xs"
                            />
                            <p className="text-[9px] text-slate-400 leading-normal">
                              একটি সুরক্ষা লিমিট। একজন ব্যবহারকারী তার মোট লাইফটাইম ডিপোজিট পরিমাণের সর্বোচ্চ কত গুণ পর্যন্ত গেম খেলে উইথড্র করতে পারবে।
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </>
                )}

                {/* BONUS & REWARDS */}
                {activeSection === 'bonus' && (
                  <>
                    {/* Item 1: Registration Signup Bonus */}
                    <div className="border border-slate-200/70 bg-white rounded-2xl overflow-hidden shadow-sm">
                      <button
                        type="button"
                        onClick={() => setActiveAccordion(activeAccordion === 'signupBonus' ? null : 'signupBonus')}
                        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition cursor-pointer"
                      >
                        <div className="flex items-center space-x-3">
                          <Award className="h-4 w-4 text-purple-500" />
                          <div className="text-left">
                            <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wide">Signup Free Bonus</span>
                            <span className="text-[10px] text-slate-400 block">নতুন রেজিস্ট্রেশন করলে স্বয়ংক্রিয় বোনাস</span>
                          </div>
                        </div>
                        <span className="text-[10.5px] font-black text-purple-600 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-100">
                          ৳ {signupBonusAmount}
                        </span>
                      </button>

                      <AnimatePresence>
                        {activeAccordion === 'signupBonus' && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-slate-100 p-4 space-y-3 bg-slate-50/30"
                          >
                            <label className="text-[10px] font-bold text-slate-500 uppercase block">Signup Free Bonus (৳ BDT)</label>
                            <input
                              type="number"
                              required
                              value={signupBonusAmount}
                              onChange={(e) => setSignupBonusAmount(e.target.value)}
                              className="w-full rounded-xl bg-white border border-slate-200 p-3 text-slate-900 font-black focus:outline-none text-xs"
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Item 2: Referral Reward Amount */}
                    <div className="border border-slate-200/70 bg-white rounded-2xl overflow-hidden shadow-sm">
                      <button
                        type="button"
                        onClick={() => setActiveAccordion(activeAccordion === 'referralReward' ? null : 'referralReward')}
                        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition cursor-pointer"
                      >
                        <div className="flex items-center space-x-3">
                          <Award className="h-4 w-4 text-purple-500" />
                          <div className="text-left">
                            <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wide">Referrer Commission Reward</span>
                            <span className="text-[10px] text-slate-400 block">বন্ধুকে আমন্ত্রণ জানালে রেফারার বোনাস</span>
                          </div>
                        </div>
                        <span className="text-[10.5px] font-black text-purple-600 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-100">
                          ৳ {referralBonusAmount}
                        </span>
                      </button>

                      <AnimatePresence>
                        {activeAccordion === 'referralReward' && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-slate-100 p-4 space-y-3 bg-slate-50/30"
                          >
                            <label className="text-[10px] font-bold text-slate-500 uppercase block">Referral Signup Reward (৳ BDT)</label>
                            <input
                              type="number"
                              required
                              value={referralBonusAmount}
                              onChange={(e) => setReferralBonusAmount(e.target.value)}
                              className="w-full rounded-xl bg-white border border-slate-200 p-3 text-slate-900 font-black focus:outline-none text-xs"
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Item 3: Referral Invitation Credit */}
                    <div className="border border-slate-200/70 bg-white rounded-2xl overflow-hidden shadow-sm">
                      <button
                        type="button"
                        onClick={() => setActiveAccordion(activeAccordion === 'referralInvitation' ? null : 'referralInvitation')}
                        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition cursor-pointer"
                      >
                        <div className="flex items-center space-x-3">
                          <Award className="h-4 w-4 text-purple-500" />
                          <div className="text-left">
                            <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wide">Referral Deposit Credit</span>
                            <span className="text-[10px] text-slate-400 block">রেফারকৃত ব্যক্তি ডিপোজিট করলে বোনাস</span>
                          </div>
                        </div>
                        <span className="text-[10.5px] font-black text-purple-600 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-100">
                          ৳ {referralBonus}
                        </span>
                      </button>

                      <AnimatePresence>
                        {activeAccordion === 'referralInvitation' && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-slate-100 p-4 space-y-3 bg-slate-50/30"
                          >
                            <label className="text-[10px] font-bold text-slate-500 uppercase block">Referral First-Deposit Credit (৳ BDT)</label>
                            <input
                              type="number"
                              required
                              value={referralBonus}
                              onChange={(e) => setReferralBonus(e.target.value)}
                              className="w-full rounded-xl bg-white border border-slate-200 p-3 text-slate-900 font-black focus:outline-none text-xs"
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Item 4: Daily Bonus Limit */}
                    <div className="border border-slate-200/70 bg-white rounded-2xl overflow-hidden shadow-sm">
                      <button
                        type="button"
                        onClick={() => setActiveAccordion(activeAccordion === 'dailyLimit' ? null : 'dailyLimit')}
                        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition cursor-pointer"
                      >
                        <div className="flex items-center space-x-3">
                          <Coins className="h-4 w-4 text-purple-500" />
                          <div className="text-left">
                            <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wide">Daily Claim limit</span>
                            <span className="text-[10px] text-slate-400 block">প্রতিদিন কতবার বোনাস ক্লেইম করা যাবে</span>
                          </div>
                        </div>
                        <span className="text-[10.5px] font-black text-purple-600 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-100">
                          {dailyBonusCountLimit} Times
                        </span>
                      </button>

                      <AnimatePresence>
                        {activeAccordion === 'dailyLimit' && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-slate-100 p-4 space-y-3 bg-slate-50/30"
                          >
                            <label className="text-[10px] font-bold text-slate-500 uppercase block">Daily check-in claims allowed</label>
                            <input
                              type="number"
                              required
                              value={dailyBonusCountLimit}
                              onChange={(e) => setDailyBonusCountLimit(e.target.value)}
                              className="w-full rounded-xl bg-white border border-slate-200 p-3 text-slate-900 font-black focus:outline-none text-xs"
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Item 5: Daily Bonus Amount */}
                    <div className="border border-slate-200/70 bg-white rounded-2xl overflow-hidden shadow-sm">
                      <button
                        type="button"
                        onClick={() => setActiveAccordion(activeAccordion === 'dailyAmount' ? null : 'dailyAmount')}
                        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition cursor-pointer"
                      >
                        <div className="flex items-center space-x-3">
                          <Coins className="h-4 w-4 text-purple-500" />
                          <div className="text-left">
                            <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wide">Daily Bonus Amount</span>
                            <span className="text-[10px] text-slate-400 block">প্রতিদিন ক্লেইমে প্রাপ্ত বোনাস পরিমাণ</span>
                          </div>
                        </div>
                        <span className="text-[10.5px] font-black text-purple-600 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-100">
                          ৳ {dailyBonusAmount}
                        </span>
                      </button>

                      <AnimatePresence>
                        {activeAccordion === 'dailyAmount' && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-slate-100 p-4 space-y-3 bg-slate-50/30"
                          >
                            <label className="text-[10px] font-bold text-slate-500 uppercase block">Bonus reward amount (৳ BDT)</label>
                            <input
                              type="number"
                              required
                              value={dailyBonusAmount}
                              onChange={(e) => setDailyBonusAmount(e.target.value)}
                              className="w-full rounded-xl bg-white border border-slate-200 p-3 text-slate-900 font-black focus:outline-none text-xs"
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Item 6: Bonus Win Rate */}
                    <div className="border border-slate-200/70 bg-white rounded-2xl overflow-hidden shadow-sm">
                      <button
                        type="button"
                        onClick={() => setActiveAccordion(activeAccordion === 'bonusWin' ? null : 'bonusWin')}
                        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition cursor-pointer"
                      >
                        <div className="flex items-center space-x-3">
                          <Percent className="h-4 w-4 text-purple-500" />
                          <div className="text-left">
                            <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wide">Bonus Play Win Rate %</span>
                            <span className="text-[10px] text-slate-400 block">বোনাস ব্যালেন্স দিয়ে খেলার জয়ের হার</span>
                          </div>
                        </div>
                        <span className="text-[10.5px] font-black text-purple-600 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-100">
                          {bonusWinRatePercentage}%
                        </span>
                      </button>

                      <AnimatePresence>
                        {activeAccordion === 'bonusWin' && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-slate-100 p-4 space-y-3 bg-slate-50/30"
                          >
                            <label className="text-[10px] font-bold text-slate-500 uppercase block">Win percentage for play on bonus</label>
                            <input
                              type="number"
                              required
                              min="0"
                              max="100"
                              value={bonusWinRatePercentage}
                              onChange={(e) => setBonusWinRatePercentage(e.target.value)}
                              className="w-full rounded-xl bg-white border border-slate-200 p-3 text-slate-900 font-black focus:outline-none text-xs"
                            />
                            <p className="text-[9px] text-slate-400 leading-normal">
                              কোনো ব্যবহারকারী যদি ডিপোজিট না করে শুধুমাত্র উপহার বা দৈনিক বোনাস দিয়ে গেম খেলে, তবে এই জয়ের হারটি প্রযোজ্য হবে (সাধারণত কম রাখা ভালো)।
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </>
                )}

                {/* APP CONFIGURATION CONTENT */}
                {activeSection === 'apps' && (
                  <>
                    {/* Item 1: Android APK link */}
                    <div className="border border-slate-200/70 bg-white rounded-2xl overflow-hidden shadow-sm">
                      <button
                        type="button"
                        onClick={() => setActiveAccordion(activeAccordion === 'androidApk' ? null : 'androidApk')}
                        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition cursor-pointer"
                      >
                        <div className="flex items-center space-x-3">
                          <Download className="h-4 w-4 text-cyan-500" />
                          <div className="text-left">
                            <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wide">Android APK Binary URL</span>
                            <span className="text-[10px] text-slate-400 block">অ্যান্ড্রয়েড অ্যাপ ডাউনলোড লিঙ্ক</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 max-w-[150px] truncate bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                          {androidApkLink ? 'Configured ✅' : 'Empty'}
                        </span>
                      </button>

                      <AnimatePresence>
                        {activeAccordion === 'androidApk' && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-slate-100 p-4 space-y-3 bg-slate-50/30"
                          >
                            <label className="text-[10px] font-bold text-slate-500 uppercase block">APK Download Link</label>
                            <input
                              type="text"
                              value={androidApkLink}
                              onChange={(e) => setAndroidApkLink(e.target.value)}
                              placeholder="e.g. https://domain.com/app.apk"
                              className="w-full rounded-xl bg-white border border-slate-200 p-3 text-slate-900 font-black focus:outline-none text-xs font-mono"
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Item 2: iOS Link */}
                    <div className="border border-slate-200/70 bg-white rounded-2xl overflow-hidden shadow-sm">
                      <button
                        type="button"
                        onClick={() => setActiveAccordion(activeAccordion === 'iosApp' ? null : 'iosApp')}
                        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition cursor-pointer"
                      >
                        <div className="flex items-center space-x-3">
                          <Download className="h-4 w-4 text-cyan-500" />
                          <div className="text-left">
                            <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wide">iOS App / PWA Link</span>
                            <span className="text-[10px] text-slate-400 block">আইওএস অ্যাপ বা পিডব্লিউএ গেটওয়ে লিঙ্ক</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 max-w-[150px] truncate bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                          {iosAppLink ? 'Configured ✅' : 'Empty'}
                        </span>
                      </button>

                      <AnimatePresence>
                        {activeAccordion === 'iosApp' && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-slate-100 p-4 space-y-3 bg-slate-50/30"
                          >
                            <label className="text-[10px] font-bold text-slate-500 uppercase block">App Store or installation web link</label>
                            <input
                              type="text"
                              value={iosAppLink}
                              onChange={(e) => setIosAppLink(e.target.value)}
                              placeholder="e.g. https://apps.apple.com/..."
                              className="w-full rounded-xl bg-white border border-slate-200 p-3 text-slate-900 font-black focus:outline-none text-xs font-mono"
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Item 3: iOS Available toggle */}
                    <div className="border border-slate-200/70 bg-white rounded-2xl overflow-hidden shadow-sm">
                      <div className="flex items-center justify-between p-4 bg-amber-50/30 border-b border-amber-100/40">
                        <div className="flex items-center space-x-3">
                          <Smartphone className="h-4 w-4 text-cyan-500" />
                          <div className="text-left">
                            <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wide">iOS App Status Gateway</span>
                            <span className="text-[10px] text-slate-400 block">আইওএস ডাউনলোডের প্রাপ্যতা নির্ধারণ করুন</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIosAvailable(!iosAvailable)}
                          className={`w-11 h-5.5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors shrink-0 ${
                            iosAvailable ? 'bg-amber-500' : 'bg-slate-300'
                          }`}
                        >
                          <div className={`bg-white w-4.5 h-4.5 rounded-full shadow transform transition-transform ${
                            iosAvailable ? 'translate-x-5' : 'translate-x-0'
                          }`} />
                        </button>
                      </div>
                      <div className="p-4 bg-slate-50/50">
                        <p className="text-[9.5px] text-slate-500 leading-normal">
                          এটি বন্ধ থাকলে ব্যবহারকারীরা "iOS App Under Construction" দেখতে পাবে এবং এটি অন থাকলে আপনার নির্ধারিত লিঙ্কটিতে রিডাইরেক্ট হবে।
                        </p>
                      </div>
                    </div>
                  </>
                )}

              </div>

              {/* Footer action inside modal */}
              <div className="bg-slate-900 border-t border-slate-800 p-4.5 flex items-center justify-between">
                <span className="text-[9.5px] text-amber-500 font-black uppercase tracking-wider flex items-center space-x-1">
                  <BellRing className="h-3 w-3 animate-pulse shrink-0" />
                  <span>Requires Save to DB</span>
                </span>
                
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setActiveSection(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-black uppercase tracking-wider text-[9.5px] rounded-xl transition cursor-pointer"
                  >
                    Done (ঠিক আছে)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleSaveSettings();
                      setActiveSection(null);
                    }}
                    disabled={saveLoading}
                    className="px-4.5 py-2 bg-[#1FA66A] hover:bg-[#1fa66ad7] text-white font-black uppercase tracking-wider text-[9.5px] rounded-xl transition cursor-pointer shadow-md flex items-center space-x-1"
                  >
                    <ClipboardCheck className="h-3 w-3" />
                    <span>Apply & Save</span>
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
