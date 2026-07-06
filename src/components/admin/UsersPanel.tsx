/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Search, Filter, ShieldCheck, Ban, Trash2, X, AlertTriangle, UserCheck, Sparkles, RefreshCw } from 'lucide-react';
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

  // Handle row selection
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
      className="space-y-6"
    >
      {/* Search and Filters bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, phone, email, id..."
            className="w-full rounded-xl bg-slate-50 border border-slate-200 pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#FF9F00] focus:bg-white"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full rounded-xl bg-slate-50 border border-slate-200 p-2.5 text-xs text-slate-700"
          >
            <option value="all">Status: All</option>
            <option value="active">Active Accounts</option>
            <option value="suspended">Suspended Accounts</option>
          </select>
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as any)}
          className="w-full rounded-xl bg-slate-50 border border-slate-200 p-2.5 text-xs text-slate-700"
        >
          <option value="all">Role: All</option>
          <option value="user">Standard Players</option>
          <option value="admin">Administrators</option>
        </select>

        <select
          value={vipFilter}
          onChange={(e) => setVipFilter(e.target.value)}
          className="w-full rounded-xl bg-slate-50 border border-slate-200 p-2.5 text-xs text-slate-700"
        >
          <option value="all">VIP: All Tiers</option>
          <option value="0">Bronze Member (0)</option>
          <option value="1">Silver Elite (1)</option>
          <option value="2">Gold Pro (2)</option>
          <option value="3">Platinum VIP (3)</option>
          <option value="4">Diamond Legend (4)</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table list */}
        <div className="lg:col-span-2 space-y-3">
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <th className="p-3">Player Detail</th>
                  <th className="p-3">Wallet Balance</th>
                  <th className="p-3">VIP Level</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-slate-400">
                      <RefreshCw className="h-5 w-5 text-[#FF9F00] animate-spin mx-auto mb-2" />
                      Loading player registry...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-400 font-medium">
                      No matching player registration records.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(u => (
                    <tr
                      key={u.id}
                      onClick={() => handleSelectUser(u)}
                      className={`cursor-pointer transition ${
                        selectedUser?.id === u.id ? 'bg-[#FF9F00]/5 hover:bg-[#FF9F00]/10' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="p-3">
                        <span className="font-extrabold text-slate-800 block">
                          {u.username} {u.role === 'admin' && <span className="text-[9px] bg-amber-500/10 text-amber-600 px-1.5 py-0.5 rounded font-black uppercase inline-block ml-1">Admin</span>}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{u.id}</span>
                      </td>
                      <td className="p-3 font-bold font-mono text-slate-700">
                        ৳{u.balance.toLocaleString()}
                      </td>
                      <td className="p-3 font-semibold text-[#FF9F00]">
                        Level {u.vipLevel}
                      </td>
                      <td className="p-3">
                        {u.isBlocked ? (
                          <span className="inline-block rounded-full bg-red-500/10 px-2 py-0.5 text-[9px] font-black text-red-600 uppercase">Suspended</span>
                        ) : (
                          <span className="inline-block rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-black text-[#1FA66A] uppercase">Active</span>
                        )}
                      </td>
                      <td className="p-3 text-right text-slate-400 font-semibold font-mono text-[10px]">
                        Inspect →
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Profile Inspector Section */}
        <div className="lg:col-span-1">
          {selectedUser ? (
            <div className="bg-slate-50/50 border border-slate-200 p-5 rounded-2xl space-y-5 h-fit shadow-sm">
              <div className="border-b border-slate-200/80 pb-3 flex justify-between items-start">
                <div>
                  <span className="text-[9px] font-black uppercase text-[#FF9F00] tracking-widest font-mono">Player Profile Inspector</span>
                  <h4 className="text-sm font-black text-slate-900 mt-1">{selectedUser.fullName || selectedUser.username}</h4>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">{selectedUser.email || 'No email associated'}</p>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-200/50 text-slate-400 hover:text-slate-700 transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Inspector Tabs / Forms */}
              <div className="space-y-4 text-xs">
                {/* Status indicator row */}
                <div className="flex justify-between items-center bg-white border border-slate-200 p-2.5 rounded-xl">
                  <span className="font-semibold text-slate-500">Account status:</span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleBlockToggle}
                      className={`flex items-center space-x-1.5 rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase transition ${
                        selectedUser.isBlocked 
                          ? 'bg-emerald-50 text-[#1FA66A] border border-emerald-100 hover:bg-emerald-100' 
                          : 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100'
                      }`}
                    >
                      {selectedUser.isBlocked ? (
                        <><ShieldCheck className="h-3 w-3" /> <span>Activate</span></>
                      ) : (
                        <><Ban className="h-3 w-3" /> <span>Suspend</span></>
                      )}
                    </button>
                  </div>
                </div>

                {/* Balance Modifier */}
                <form onSubmit={handleAdjustBalance} className="space-y-2.5 border-t border-slate-100 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-black uppercase tracking-wider text-[9px] text-slate-500">Adjust Wallet Balance</span>
                    <span className="font-mono font-black text-slate-800">Current: ৳{selectedUser.balance.toLocaleString()}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAdjustAction('add')}
                      className={`py-1.5 rounded-lg font-bold border text-[10px] transition ${
                        adjustAction === 'add' ? 'bg-[#1FA66A]/10 border-[#1FA66A]/30 text-[#1FA66A]' : 'bg-white border-slate-200 text-slate-500'
                      }`}
                    >
                      Credit (Add BDT)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjustAction('deduct')}
                      className={`py-1.5 rounded-lg font-bold border text-[10px] transition ${
                        adjustAction === 'deduct' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-white border-slate-200 text-slate-500'
                      }`}
                    >
                      Debit (Deduct)
                    </button>
                  </div>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      value={adjustAmount}
                      onChange={(e) => setAdjustAmount(e.target.value)}
                      className="w-full rounded-xl bg-white border border-slate-200 p-2.5 text-slate-800 font-bold font-mono focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={adjustLoading}
                      className="bg-[#1FA66A] hover:bg-[#157D4F] text-white font-black px-4 py-2.5 rounded-xl uppercase tracking-wider text-[10px] transition"
                    >
                      Apply
                    </button>
                  </div>
                  {adjustFeedback && (
                    <p className="text-[10px] text-center font-bold text-slate-600 bg-white border border-slate-100 p-1 rounded-lg">
                      {adjustFeedback}
                    </p>
                  )}
                </form>

                {/* VIP Configure */}
                <form onSubmit={handleUpdateVip} className="space-y-2.5 border-t border-slate-100 pt-3">
                  <span className="font-black uppercase tracking-wider text-[9px] text-slate-500 block">Configure VIP Status</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Tier Level</label>
                      <select
                        value={vipLevel}
                        onChange={(e) => setVipLevel(e.target.value)}
                        className="w-full rounded-xl bg-white border border-slate-200 p-2 text-slate-700"
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
                        className="w-full rounded-xl bg-white border border-slate-200 p-2 text-slate-800 font-mono font-bold focus:outline-none"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={vipLoading}
                    className="w-full py-2 rounded-xl bg-[#FF9F00] text-slate-950 font-black uppercase text-[9px] tracking-widest transition"
                  >
                    Save VIP Credentials
                  </button>
                  {vipFeedback && (
                    <p className="text-[10px] text-center font-bold text-slate-600 bg-white border border-slate-100 p-1 rounded-lg">
                      {vipFeedback}
                    </p>
                  )}
                </form>

                {/* Role/Privileges Manager */}
                <div className="space-y-2 border-t border-slate-100 pt-3">
                  <span className="font-black uppercase tracking-wider text-[9px] text-slate-500 block">Manage System Authorizations</span>
                  <div className="flex space-x-2">
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as any)}
                      className="w-full rounded-xl bg-white border border-slate-200 p-2 text-slate-700"
                    >
                      <option value="user">Standard Player Authority</option>
                      <option value="admin">Platform Administrator</option>
                    </select>
                    <button
                      onClick={handleUpdateRole}
                      disabled={roleLoading || selectedUser.role === newRole}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-black px-3 py-2 rounded-xl text-[9px] uppercase tracking-wider transition disabled:opacity-40"
                    >
                      Alter
                    </button>
                  </div>
                  {roleFeedback && (
                    <p className="text-[10px] text-center font-bold text-slate-600 bg-white border border-slate-100 p-1 rounded-lg">
                      {roleFeedback}
                    </p>
                  )}
                </div>

                {/* Purge Block */}
                <div className="border-t border-slate-200 pt-4 text-center">
                  {!showDeleteConfirm ? (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-[10px] font-bold transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Purge Player Profile</span>
                    </button>
                  ) : (
                    <div className="bg-red-50 border border-red-200/80 rounded-xl p-3 space-y-2.5 text-left">
                      <div className="flex items-start space-x-1.5 text-red-700">
                        <AlertTriangle className="h-4.5 w-4.5 shrink-0 text-red-600" />
                        <span className="text-[10px] font-bold uppercase tracking-wide">Destructive Ledger Command</span>
                      </div>
                      <p className="text-[10px] text-red-600 font-semibold leading-relaxed">
                        Executing this command permanently expunges this account and all associated transaction journals, game predictions, and notifications from the server databases.
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-center pt-1">
                        <button
                          onClick={() => setShowDeleteConfirm(false)}
                          className="py-1 rounded bg-white border border-slate-200 text-slate-600 font-bold text-[9px] hover:bg-slate-50 transition"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleDeleteUser}
                          disabled={deleteLoading}
                          className="py-1 rounded bg-red-600 hover:bg-red-700 text-white font-black text-[9px] tracking-wider uppercase transition"
                        >
                          Wipe Account
                        </button>
                      </div>
                    </div>
                  )}
                  {deleteFeedback && (
                    <p className="text-[10px] text-red-600 font-bold mt-2">{deleteFeedback}</p>
                  )}
                </div>

              </div>
            </div>
          ) : (
            <div className="border border-dashed border-slate-300 rounded-2xl bg-slate-50/40 flex flex-col items-center justify-center p-8 text-center text-slate-400 text-xs min-h-[300px]">
              <Sparkles className="h-8 w-8 text-slate-300 mb-2" />
              <span className="font-medium text-slate-400">Select a player from the ledger table to load the administrative Profile Inspector.</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
