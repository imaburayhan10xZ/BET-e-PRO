/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Filter, ShieldCheck, Ban, Trash2, X, AlertTriangle, 
  UserCheck, Sparkles, RefreshCw, Eye, Award, Wallet, ShieldAlert
} from 'lucide-react';
import { User } from '../../types';

interface UsersPanelProps {
  users: User[];
  loading: boolean;
  onRefresh: () => void;
  onRefreshUser: () => void;
}

export default function UsersPanel({ users, loading, onRefresh, onRefreshUser }: UsersPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'admin'>('all');
  const [vipFilter, setVipFilter] = useState<string>('all');

  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Balance adjustment state
  const [adjustAmount, setAdjustAmount] = useState('1000');
  const [adjustAction, setAdjustAction] = useState<'add' | 'deduct'>('add');
  const [adjustFeedback, setAdjustFeedback] = useState('');
  const [adjustLoading, setAdjustLoading] = useState(false);

  // VIP config state
  const [vipLevel, setVipLevel] = useState('0');
  const [vipPoints, setVipPoints] = useState('0');
  const [vipFeedback, setVipFeedback] = useState('');
  const [vipLoading, setVipLoading] = useState(false);

  // Role config state
  const [newRole, setNewRole] = useState<'user' | 'admin'>('user');
  const [roleFeedback, setRoleFeedback] = useState('');
  const [roleLoading, setRoleLoading] = useState(false);

  // Deletion state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteFeedback, setDeleteFeedback] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Handle row selection (opens popup)
  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setAdjustFeedback('');
    setVipFeedback('');
    setRoleFeedback('');
    setDeleteFeedback('');
    setVipLevel(user.vipLevel.toString());
    setVipPoints(user.vipPoints.toString());
    setNewRole(user.role);
    setShowDeleteConfirm(false);
  };

  const handleAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      setAdjustLoading(true);
      setAdjustFeedback('');
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/users/${selectedUser.id}/balance`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: adjustAmount, action: adjustAction })
      });
      const data = await res.json();
      if (res.ok) {
        setAdjustFeedback('Ledger entry posted and player balance modified!');
        setSelectedUser({ ...selectedUser, balance: data.userBalance });
        onRefresh();
        onRefreshUser();
      } else {
        setAdjustFeedback(data.error || 'Failed to modify balance.');
      }
    } catch (err) {
      setAdjustFeedback('Network error.');
    } finally {
      setAdjustLoading(false);
    }
  };

  const handleUpdateVip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      setVipLoading(true);
      setVipFeedback('');
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/users/${selectedUser.id}/vip`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ vipLevel, vipPoints })
      });
      const data = await res.json();
      if (res.ok) {
        setVipFeedback('VIP credentials updated successfully!');
        setSelectedUser({ ...selectedUser, vipLevel: data.user.vipLevel, vipPoints: data.user.vipPoints });
        onRefresh();
      } else {
        setVipFeedback(data.error || 'Failed to update VIP settings.');
      }
    } catch (err) {
      setVipFeedback('Network error.');
    } finally {
      setVipLoading(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedUser) return;
    try {
      setRoleLoading(true);
      setRoleFeedback('');
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/users/${selectedUser.id}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });
      const data = await res.json();
      if (res.ok) {
        setRoleFeedback('Account authorization credentials updated!');
        setSelectedUser({ ...selectedUser, role: data.user.role });
        onRefresh();
      } else {
        setRoleFeedback(data.error || 'Failed to alter role.');
      }
    } catch (err) {
      setRoleFeedback('Network error.');
    } finally {
      setRoleLoading(false);
    }
  };

  const handleBlockToggle = async () => {
    if (!selectedUser) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/users/${selectedUser.id}/block`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isBlocked: !selectedUser.isBlocked })
      });
      const data = await res.json();
      if (res.ok) {
        setSelectedUser({ ...selectedUser, isBlocked: !selectedUser.isBlocked });
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      setDeleteLoading(true);
      setDeleteFeedback('');
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setDeleteFeedback('Account and match records fully expunged.');
        setSelectedUser(null);
        setShowDeleteConfirm(false);
        onRefresh();
      } else {
        setDeleteFeedback(data.error || 'Purge failed.');
      }
    } catch (err) {
      setDeleteFeedback('Network error.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Filter logic
  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.phone && u.phone.includes(searchTerm)) ||
      (u.fullName && u.fullName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'suspended' && u.isBlocked) || 
      (statusFilter === 'active' && !u.isBlocked);

    const matchesRole = 
      roleFilter === 'all' || 
      u.role === roleFilter;

    const matchesVip = 
      vipFilter === 'all' || 
      u.vipLevel.toString() === vipFilter;

    return matchesSearch && matchesStatus && matchesRole && matchesVip;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 text-xs"
    >
      {/* Search and Filters bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-slate-100">
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, phone, id..."
            className="w-full rounded-xl bg-slate-50 border border-slate-200 pl-10 pr-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#FF9F00] focus:bg-white transition"
          />
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-700 focus:outline-none focus:border-[#FF9F00] focus:bg-white"
          >
            <option value="all">Status: All</option>
            <option value="active">Active Accounts</option>
            <option value="suspended">Suspended Accounts</option>
          </select>
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as any)}
          className="w-full rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-700 focus:outline-none focus:border-[#FF9F00] focus:bg-white"
        >
          <option value="all">Role: All</option>
          <option value="user">Standard Players</option>
          <option value="admin">Administrators</option>
        </select>

        <select
          value={vipFilter}
          onChange={(e) => setVipFilter(e.target.value)}
          className="w-full rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-700 focus:outline-none focus:border-[#FF9F00] focus:bg-white"
        >
          <option value="all">VIP: All Tiers</option>
          <option value="0">Bronze Member (0)</option>
          <option value="1">Silver Elite (1)</option>
          <option value="2">Gold Pro (2)</option>
          <option value="3">Platinum VIP (3)</option>
          <option value="4">Diamond Legend (4)</option>
        </select>
      </div>

      {/* Main List Table (Full Width) */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
              <th className="p-4 pl-5">Player Detail</th>
              <th className="p-4">Wallet Balance</th>
              <th className="p-4">VIP Level</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right pr-5">Manage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && users.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-slate-400">
                  <RefreshCw className="h-5 w-5 text-[#FF9F00] animate-spin mx-auto mb-2.5" />
                  <span className="font-semibold text-slate-500">Loading player registry...</span>
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-10 text-slate-400 font-semibold">
                  No matching player registration records.
                </td>
              </tr>
            ) : (
              filteredUsers.map(u => (
                <tr
                  key={u.id}
                  onClick={() => handleSelectUser(u)}
                  className="cursor-pointer hover:bg-[#FF9F00]/5 transition duration-150"
                >
                  <td className="p-4 pl-5">
                    <span className="font-extrabold text-slate-800 text-[12.5px] block">
                      {u.username} {u.role === 'admin' && <span className="text-[9px] bg-amber-500/10 text-amber-600 px-1.5 py-0.5 rounded font-black uppercase inline-block ml-1">Admin</span>}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono block mt-1">{u.id}</span>
                  </td>
                  <td className="p-4 font-black font-mono text-slate-700 text-[12px]">
                    ৳{u.balance.toLocaleString()}
                  </td>
                  <td className="p-4 font-semibold text-[#FF9F00]">
                    Level {u.vipLevel}
                  </td>
                  <td className="p-4">
                    {u.isBlocked ? (
                      <span className="inline-block rounded-full bg-red-500/10 px-2.5 py-1 text-[9px] font-black text-red-600 uppercase">Suspended</span>
                    ) : (
                      <span className="inline-block rounded-full bg-emerald-500/10 px-2.5 py-1 text-[9px] font-black text-[#1FA66A] uppercase">Active</span>
                    )}
                  </td>
                  <td className="p-4 text-right pr-5">
                    <button
                      type="button"
                      className="px-3.5 py-1.5 bg-slate-900 hover:bg-[#FF9F00] text-white hover:text-slate-950 font-black rounded-lg transition text-[10px] uppercase tracking-wider flex items-center space-x-1.5 ml-auto"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Manage</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* -------------------- POPUP PROFILE INSPECTOR MODAL -------------------- */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedUser(null)}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="bg-slate-950 text-white p-5 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-slate-900 rounded-xl text-[#FF9F00] border border-slate-800">
                    <UserCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 font-mono">Player Control Console</span>
                    <h4 className="text-[13px] font-black text-white">{selectedUser.fullName || selectedUser.username}</h4>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer border border-white/10"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Scrollable Form Body */}
              <div className="p-6 overflow-y-auto space-y-5 bg-slate-50/40 text-xs">
                
                {/* Account Details overview cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white p-3 rounded-2xl border border-slate-100 flex items-center space-x-3">
                    <Wallet className="h-5 w-5 text-emerald-500 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block">Wallet Balance</span>
                      <span className="font-mono font-black text-slate-800 text-[13px]">৳{selectedUser.balance.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-2xl border border-slate-100 flex items-center space-x-3">
                    <Award className="h-5 w-5 text-amber-500 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block">VIP Tier</span>
                      <span className="font-extrabold text-[#FF9F00] text-[13px]">Level {selectedUser.vipLevel}</span>
                    </div>
                  </div>
                </div>

                {/* Email/Phone line */}
                <div className="bg-white px-4 py-2.5 rounded-xl border border-slate-100 flex justify-between text-[11px] text-slate-500 font-medium">
                  <span>ID: <strong className="font-mono text-slate-700">{selectedUser.id}</strong></span>
                  <span>Email: <strong className="text-slate-700">{selectedUser.email || 'None'}</strong></span>
                </div>

                {/* 1. Account Block/Toggle Status */}
                <div className="flex justify-between items-center bg-white border border-slate-100 p-3.5 rounded-2xl shadow-xs">
                  <div>
                    <span className="font-black text-slate-800 text-[11px] uppercase tracking-wider block">Account status</span>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Restrict or reinstate server access.</span>
                  </div>
                  <button
                    onClick={handleBlockToggle}
                    className={`flex items-center space-x-1.5 rounded-xl px-4 py-2 text-[11px] font-black uppercase transition ${
                      selectedUser.isBlocked 
                        ? 'bg-emerald-500 text-white hover:bg-emerald-600' 
                        : 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100'
                    }`}
                  >
                    {selectedUser.isBlocked ? (
                      <><ShieldCheck className="h-3.5 w-3.5" /> <span>Re-Activate</span></>
                    ) : (
                      <><Ban className="h-3.5 w-3.5" /> <span>Suspend Player</span></>
                    )}
                  </button>
                </div>

                {/* 2. Adjust Balance Form */}
                <form onSubmit={handleAdjustBalance} className="bg-white border border-slate-100 p-4.5 rounded-2xl shadow-xs space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <span className="font-black uppercase tracking-wider text-[10px] text-slate-600">Adjust Wallet Balance</span>
                    <span className="text-[10px] text-slate-400 font-bold">Manual ledger overrides</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAdjustAction('add')}
                      className={`py-2 rounded-lg font-bold border text-[11px] transition ${
                        adjustAction === 'add' ? 'bg-[#1FA66A]/10 border-[#1FA66A]/30 text-[#1FA66A]' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      Credit (Add BDT)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjustAction('deduct')}
                      className={`py-2 rounded-lg font-bold border text-[11px] transition ${
                        adjustAction === 'deduct' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      Debit (Deduct BDT)
                    </button>
                  </div>

                  <div className="flex space-x-2">
                    <input
                      type="number"
                      value={adjustAmount}
                      onChange={(e) => setAdjustAmount(e.target.value)}
                      className="w-full rounded-xl bg-slate-50 border border-slate-200 p-2.5 text-slate-800 font-extrabold font-mono focus:outline-none focus:bg-white text-sm"
                    />
                    <button
                      type="submit"
                      disabled={adjustLoading}
                      className="bg-[#1FA66A] hover:bg-[#157D4F] text-white font-black px-5 py-2.5 rounded-xl uppercase tracking-wider text-[11px] transition cursor-pointer shrink-0"
                    >
                      {adjustLoading ? 'Applying...' : 'Apply Adjust'}
                    </button>
                  </div>

                  {adjustFeedback && (
                    <p className="text-[10px] text-center font-bold text-[#1FA66A] bg-emerald-50 border border-emerald-100 p-2 rounded-xl mt-1">
                      {adjustFeedback}
                    </p>
                  )}
                </form>

                {/* 3. VIP Configurations Form */}
                <form onSubmit={handleUpdateVip} className="bg-white border border-slate-100 p-4.5 rounded-2xl shadow-xs space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <span className="font-black uppercase tracking-wider text-[10px] text-slate-600">Configure VIP Status</span>
                    <span className="text-[10px] text-slate-400 font-bold">VIP Levels & Tiers</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Tier Level</label>
                      <select
                        value={vipLevel}
                        onChange={(e) => setVipLevel(e.target.value)}
                        className="w-full rounded-xl bg-slate-50 border border-slate-200 p-2.5 text-slate-700 font-semibold focus:outline-none focus:bg-white"
                      >
                        <option value="0">Bronze (0)</option>
                        <option value="1">Silver Elite (1)</option>
                        <option value="2">Gold Pro (2)</option>
                        <option value="3">Platinum VIP (3)</option>
                        <option value="4">Diamond Legend (4)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">VIP Points</label>
                      <input
                        type="number"
                        value={vipPoints}
                        onChange={(e) => setVipPoints(e.target.value)}
                        className="w-full rounded-xl bg-slate-50 border border-slate-200 p-2.5 text-slate-800 font-mono font-bold focus:outline-none focus:bg-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={vipLoading}
                    className="w-full py-2.5 rounded-xl bg-[#FF9F00] text-slate-950 font-black uppercase text-[10px] tracking-widest transition hover:opacity-90 cursor-pointer"
                  >
                    {vipLoading ? 'Saving...' : 'Save VIP Credentials'}
                  </button>

                  {vipFeedback && (
                    <p className="text-[10px] text-center font-bold text-slate-600 bg-slate-50 border border-slate-100 p-2 rounded-xl">
                      {vipFeedback}
                    </p>
                  )}
                </form>

                {/* 4. Role & Privileges */}
                <div className="bg-white border border-slate-100 p-4.5 rounded-2xl shadow-xs space-y-3">
                  <span className="font-black uppercase tracking-wider text-[10px] text-slate-600 block">Manage System Authorizations</span>
                  <div className="flex space-x-2">
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as any)}
                      className="w-full rounded-xl bg-slate-50 border border-slate-200 p-2.5 text-slate-700 font-semibold"
                    >
                      <option value="user">Standard Player Authority</option>
                      <option value="admin">Platform Administrator</option>
                    </select>
                    <button
                      onClick={handleUpdateRole}
                      disabled={roleLoading || selectedUser.role === newRole}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-black px-4 py-2 rounded-xl text-[10px] uppercase tracking-wider transition disabled:opacity-40 cursor-pointer shrink-0"
                    >
                      Alter
                    </button>
                  </div>
                  {roleFeedback && (
                    <p className="text-[10px] text-center font-bold text-[#FF9F00] bg-[#FF9F00]/5 border border-[#FF9F00]/10 p-2 rounded-xl">
                      {roleFeedback}
                    </p>
                  )}
                </div>

                {/* 5. Wipe/Purge (Destructive command) */}
                <div className="border-t border-slate-200 pt-4 text-center">
                  {!showDeleteConfirm ? (
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 text-[11px] font-black transition cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Purge Player Profile</span>
                    </button>
                  ) : (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-3 text-left">
                      <div className="flex items-start space-x-2 text-red-700">
                        <AlertTriangle className="h-5 w-5 shrink-0 text-red-600 mt-0.5" />
                        <div>
                          <span className="text-[11px] font-black uppercase tracking-wide">Destructive Ledger Command</span>
                          <p className="text-[10.5px] text-red-600 font-medium leading-relaxed mt-1">
                            Executing this command permanently expunges this account and all associated transaction journals, game predictions, and notifications from the server databases.
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-center pt-1.5">
                        <button
                          type="button"
                          onClick={() => setShowDeleteConfirm(false)}
                          className="py-2 rounded-xl bg-white border border-slate-200 text-slate-600 font-bold text-[10px] hover:bg-slate-50 transition cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleDeleteUser}
                          disabled={deleteLoading}
                          className="py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-[10px] tracking-wider uppercase transition cursor-pointer"
                        >
                          {deleteLoading ? 'Wiping...' : 'Wipe Account'}
                        </button>
                      </div>
                    </div>
                  )}
                  {deleteFeedback && (
                    <p className="text-[11px] text-red-600 font-black mt-2">{deleteFeedback}</p>
                  )}
                </div>

              </div>

              {/* Footer */}
              <div className="bg-slate-50 border-t border-slate-100 p-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-wider text-[10px] rounded-xl transition cursor-pointer"
                >
                  Close Profile Inspector
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
