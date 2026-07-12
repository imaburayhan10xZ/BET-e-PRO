/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Check, X, ShieldAlert, Sparkles, UserCheck, 
  RefreshCw, FileText, Plus, Eye, Wallet, HelpCircle, FileCheck
} from 'lucide-react';
import { Transaction, User } from '../../types';

interface TransactionsPanelProps {
  transactions: Transaction[];
  users: User[];
  loading: boolean;
  onRefresh: () => void;
  onRefreshUser: () => void;
}

export default function TransactionsPanel({ transactions, users, loading, onRefresh, onRefreshUser }: TransactionsPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'success' | 'failed'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'deposit' | 'withdraw' | 'bet' | 'win'>('all');

  // Popup Triggers
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [selectedTxDetail, setSelectedTxDetail] = useState<Transaction | null>(null);

  // Manual Transaction Voucher Builder State
  const [selectedUserId, setSelectedUserId] = useState('');
  const [newTxType, setNewTxType] = useState<'deposit' | 'withdraw' | 'win' | 'referral_bonus' | 'vip_bonus'>('deposit');
  const [newTxAmount, setNewTxAmount] = useState('500');
  const [newTxMethod, setNewTxMethod] = useState('system');
  const [newTxRef, setNewTxRef] = useState('');
  const [newTxDesc, setNewTxDesc] = useState('');
  const [voucherFeedback, setVoucherFeedback] = useState('');
  const [voucherLoading, setVoucherLoading] = useState(false);

  const handleCreateVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !newTxAmount) {
      setVoucherFeedback('Please select a player and specify an amount.');
      return;
    }
    try {
      setVoucherLoading(true);
      setVoucherFeedback('');
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/transactions/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: selectedUserId,
          type: newTxType,
          amount: newTxAmount,
          paymentMethod: newTxMethod,
          transactionId: newTxRef,
          description: newTxDesc
        })
      });
      const data = await res.json();
      if (res.ok) {
        setVoucherFeedback('Voucher voucher processed! Balance updated successfully.');
        setSelectedUserId('');
        setNewTxAmount('500');
        setNewTxRef('');
        setNewTxDesc('');
        onRefresh();
        onRefreshUser();
        setTimeout(() => {
          setShowVoucherModal(false);
          setVoucherFeedback('');
        }, 1500);
      } else {
        setVoucherFeedback(data.error || 'Voucher processing failed.');
      }
    } catch (err) {
      setVoucherFeedback('Network failure.');
    } finally {
      setVoucherLoading(false);
    }
  };

  const handleProcessTransaction = async (id: string, approve: boolean) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/transactions/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: approve ? 'success' : 'failed' })
      });
      if (res.ok) {
        setSelectedTxDetail(null);
        onRefresh();
        onRefreshUser();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered ledgers
  const filteredTxs = transactions.filter(tx => {
    const matchesSearch = 
      tx.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tx.transactionId && tx.transactionId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (tx.paymentMethod && tx.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;
    const matchesType = typeFilter === 'all' || tx.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 text-xs"
    >
      {/* Search, Filter & Voucher trigger action top bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100">
        
        {/* Searches & Filters left side */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="relative">
            <Search className="absolute left-3 top-3.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search user, reference ID..."
              className="w-full rounded-xl bg-slate-50 border border-slate-200 pl-9 pr-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#FF9F00] focus:bg-white transition"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full rounded-xl bg-slate-50 border border-slate-200 p-2.5 text-xs text-slate-700 focus:outline-none focus:border-[#FF9F00] focus:bg-white"
          >
            <option value="all">State: All</option>
            <option value="pending">Pending Requests</option>
            <option value="success">Approved Success</option>
            <option value="failed">Rejected Failed</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="w-full rounded-xl bg-slate-50 border border-slate-200 p-2.5 text-xs text-slate-700 focus:outline-none focus:border-[#FF9F00] focus:bg-white"
          >
            <option value="all">Type: All</option>
            <option value="deposit">Deposits</option>
            <option value="withdraw">Withdrawals</option>
            <option value="bet">Casino Bets</option>
            <option value="win">Win Payouts</option>
          </select>
        </div>

        {/* Voucher Action Trigger Button */}
        <div className="shrink-0 flex items-center space-x-2">
          <button
            type="button"
            onClick={() => { setShowVoucherModal(true); setVoucherFeedback(''); }}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-[#FF9F00] text-white hover:text-slate-950 font-black flex items-center space-x-1.5 transition text-[11px] tracking-wider uppercase shadow-sm cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Post Manual Ledger Entry</span>
          </button>
          
          <button 
            onClick={onRefresh} 
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-800 transition cursor-pointer"
            title="Refresh database records"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

      </div>

      {/* Main ledger list Table (Full Width) */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
              <th className="p-4 pl-5">User & ID</th>
              <th className="p-4">Type</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Details</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right pr-5">Resolve / View</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && transactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-slate-400">
                  <RefreshCw className="h-5 w-5 text-[#FF9F00] animate-spin mx-auto mb-2.5" />
                  <span className="font-semibold text-slate-500">Assembling gateway records...</span>
                </td>
              </tr>
            ) : filteredTxs.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-slate-400 font-semibold">
                  No transaction records matched.
                </td>
              </tr>
            ) : (
              filteredTxs.map(tx => (
                <tr 
                  key={tx.id} 
                  onClick={() => setSelectedTxDetail(tx)}
                  className="hover:bg-slate-50/70 transition duration-150 cursor-pointer"
                >
                  <td className="p-4 pl-5">
                    <span className="font-extrabold text-slate-800 block text-[12px]">{tx.username}</span>
                    <span className="text-[9.5px] text-slate-400 font-mono block mt-1">{tx.id}</span>
                  </td>
                  <td className="p-4">
                    <span className={`inline-block text-[10px] font-black uppercase tracking-wider ${
                      tx.type === 'deposit' || tx.type === 'win' ? 'text-[#1FA66A]' : 'text-red-500'
                    }`}>
                      {tx.type}
                    </span>
                  </td>
                  <td className="p-4 font-black font-mono text-slate-800 text-[12px]">
                    ৳{tx.amount.toLocaleString()}
                  </td>
                  <td className="p-4 leading-normal text-slate-600">
                    <span className="font-semibold block text-[11px]">{tx.paymentMethod}</span>
                    {tx.transactionId && <span className="block font-mono text-[9px] text-slate-400 mt-1">{tx.transactionId}</span>}
                  </td>
                  <td className="p-4">
                    {tx.status === 'success' ? (
                      <span className="inline-block rounded-full bg-emerald-50 border border-emerald-100 px-2.5 py-1 text-[8.5px] font-black text-[#1FA66A] uppercase">Approved</span>
                    ) : tx.status === 'failed' ? (
                      <span className="inline-block rounded-full bg-red-50 border border-red-100 px-2.5 py-1 text-[8.5px] font-black text-red-600 uppercase">Rejected</span>
                    ) : (
                      <span className="inline-block rounded-full bg-amber-50 border border-amber-100 px-2.5 py-1 text-[8.5px] font-black text-amber-600 uppercase">Pending</span>
                    )}
                  </td>
                  <td className="p-4 text-right pr-5">
                    {tx.status === 'pending' ? (
                      <button
                        type="button"
                        className="px-3.5 py-1.5 bg-[#FF9F00] text-slate-950 font-black rounded-lg transition text-[10px] uppercase tracking-wider flex items-center space-x-1.5 ml-auto"
                      >
                        <ShieldAlert className="h-3.5 w-3.5" />
                        <span>Action Required</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="px-3.5 py-1.5 bg-slate-100 text-slate-500 font-bold rounded-lg transition text-[10px] uppercase tracking-wider flex items-center space-x-1.5 ml-auto hover:bg-slate-200 hover:text-slate-800"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>View Journal</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* -------------------- POPUP 1: MANUAL LEDGER VOUCHER FORM MODAL -------------------- */}
      <AnimatePresence>
        {showVoucherModal && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowVoucherModal(false)}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="bg-slate-950 text-white p-5 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-slate-900 rounded-xl text-[#FF9F00] border border-slate-800">
                    <Plus className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 font-mono">Ledger voucher</span>
                    <h4 className="text-[13px] font-black text-white">Manual Ledger Voucher</h4>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowVoucherModal(false)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer border border-white/10"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleCreateVoucher} className="p-6 overflow-y-auto space-y-4 bg-slate-50/40 text-xs">
                <p className="text-slate-500 text-[11px] leading-relaxed pb-2 border-b border-slate-100">
                  Process manual balance ledger entries to bypass traditional mobile agency checkpoints. Directly credit or debit players for agent deposits or custom loyalty rewards.
                </p>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Select Player Account</label>
                  <select
                    required
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full rounded-xl bg-white border border-slate-200 p-3 text-slate-800 font-medium focus:outline-none focus:border-[#FF9F00]"
                  >
                    <option value="">Choose User...</option>
                    {users.filter(u => u.role !== 'admin').map(u => (
                      <option key={u.id} value={u.id}>{u.username} (Has: ৳{u.balance})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Adjustment Type</label>
                    <select
                      value={newTxType}
                      onChange={(e: any) => setNewTxType(e.target.value)}
                      className="w-full rounded-xl bg-white border border-slate-200 p-2.5 text-slate-700 font-medium focus:outline-none focus:border-[#FF9F00]"
                    >
                      <option value="deposit">Credit: Deposit</option>
                      <option value="win">Credit: Casino Win</option>
                      <option value="referral_bonus">Credit: Referral</option>
                      <option value="vip_bonus">Credit: VIP Perk</option>
                      <option value="withdraw">Debit: Withdrawal</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Amount (৳ BDT)</label>
                    <input
                      type="number"
                      required
                      value={newTxAmount}
                      onChange={(e) => setNewTxAmount(e.target.value)}
                      className="w-full rounded-xl bg-white border border-slate-200 p-2.5 text-slate-800 font-mono font-bold focus:outline-none focus:border-[#FF9F00]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Agent Node</label>
                    <select
                      value={newTxMethod}
                      onChange={(e) => setNewTxMethod(e.target.value)}
                      className="w-full rounded-xl bg-white border border-slate-200 p-2.5 text-slate-700 font-medium focus:outline-none focus:border-[#FF9F00]"
                    >
                      <option value="bKash">bKash</option>
                      <option value="Nagad">Nagad</option>
                      <option value="Rocket">Rocket</option>
                      <option value="Manual Agent">Manual Agent</option>
                      <option value="system">System Adjust</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Reference ID (Ref)</label>
                    <input
                      type="text"
                      value={newTxRef}
                      onChange={(e) => setNewTxRef(e.target.value)}
                      placeholder="e.g. TAX991A"
                      className="w-full rounded-xl bg-white border border-slate-200 p-2.5 text-slate-800 font-mono focus:outline-none focus:border-[#FF9F00]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Ledger Explanation Note</label>
                  <input
                    type="text"
                    value={newTxDesc}
                    onChange={(e) => setNewTxDesc(e.target.value)}
                    placeholder="e.g. Offline bank agent manual credit"
                    className="w-full rounded-xl bg-white border border-slate-200 p-3 text-slate-800 focus:outline-none focus:border-[#FF9F00]"
                  />
                </div>

                {voucherFeedback && (
                  <p className={`text-[10px] font-bold text-center py-2 rounded-xl border ${
                    voucherFeedback.includes('processed') ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-red-600 bg-red-50 border-red-100'
                  }`}>
                    {voucherFeedback}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={voucherLoading}
                  className="w-full py-3 rounded-xl bg-slate-900 hover:bg-[#FF9F00] text-white hover:text-slate-950 font-black uppercase text-[10.5px] tracking-widest transition cursor-pointer"
                >
                  {voucherLoading ? 'Processing Ledger...' : 'Post Manual Ledger Entry'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* -------------------- POPUP 2: INDIVIDUAL TRANSACTION RESOLVER MODAL -------------------- */}
      <AnimatePresence>
        {selectedTxDetail && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTxDetail(null)}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="bg-slate-950 text-white p-5 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-slate-900 rounded-xl text-amber-400 border border-slate-800 animate-pulse">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 font-mono">Audit Voucher</span>
                    <h4 className="text-[12.5px] font-black text-white">Resolve Gateway Request</h4>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTxDetail(null)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer border border-white/10"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Form Body */}
              <div className="p-6 space-y-4 bg-slate-50/40 text-xs">
                
                {/* User / ID detail lines */}
                <div className="bg-white p-4.5 rounded-2xl border border-slate-100 space-y-2.5 shadow-xs">
                  <div className="flex justify-between items-center text-slate-400 font-bold text-[10px] uppercase">
                    <span>Account User</span>
                    <span>Reference ID</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-slate-850 text-sm">{selectedTxDetail.username}</span>
                    <span className="font-mono font-bold text-slate-500">{selectedTxDetail.id.slice(0, 8)}...</span>
                  </div>
                </div>

                {/* Amount and gateway detail cards */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="bg-white p-3 rounded-2xl border border-slate-100 space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Gateway Node</span>
                    <span className="font-black text-slate-800 text-[12px]">{selectedTxDetail.paymentMethod}</span>
                  </div>
                  <div className="bg-white p-3 rounded-2xl border border-slate-100 space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Voucher Amount</span>
                    <span className="font-mono font-black text-slate-800 text-[12px]">৳{selectedTxDetail.amount.toLocaleString()}</span>
                  </div>
                </div>

                {/* Additional transaction information */}
                {selectedTxDetail.transactionId && (
                  <div className="bg-white p-3.5 rounded-xl border border-slate-100 space-y-1.5 font-mono">
                    <span className="text-[9.5px] text-slate-400 font-bold uppercase tracking-wide block">Player Provided TrxID (Ref)</span>
                    <span className="text-slate-700 font-extrabold text-[11px] block select-all bg-slate-50 border border-slate-100 px-2 py-1 rounded-lg text-center break-all">
                      {selectedTxDetail.transactionId}
                    </span>
                  </div>
                )}

                {selectedTxDetail.description && (
                  <div className="bg-white p-3 rounded-xl border border-slate-100">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Explanation Note</span>
                    <p className="text-[11px] text-slate-600 mt-1 font-medium">{selectedTxDetail.description}</p>
                  </div>
                )}

                {/* Resolution Status or Action Buttons */}
                <div className="pt-3 border-t border-slate-150">
                  {selectedTxDetail.status === 'pending' ? (
                    <div className="space-y-2.5">
                      <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest text-center block bg-amber-50 border border-amber-100/50 py-1.5 rounded-lg">
                        ⚠️ Action required: Settle ledger entry
                      </span>
                      
                      <div className="grid grid-cols-2 gap-2.5 pt-1">
                        <button
                          type="button"
                          onClick={() => handleProcessTransaction(selectedTxDetail.id, false)}
                          className="py-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-500 hover:text-white font-black uppercase text-[10px] tracking-wider transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs"
                        >
                          <X className="h-4 w-4" />
                          <span>Reject Payout</span>
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => handleProcessTransaction(selectedTxDetail.id, true)}
                          className="py-3 rounded-xl bg-[#1FA66A] hover:bg-[#157D4F] text-white font-black uppercase text-[10px] tracking-wider transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs"
                        >
                          <Check className="h-4 w-4" />
                          <span>Approve & Pay</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-3 rounded-2xl bg-slate-100 border border-slate-200/50">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Settle State</span>
                      <div className="flex items-center justify-center space-x-1.5 mt-1 font-mono font-black text-slate-700 text-xs">
                        <FileCheck className="h-4 w-4 text-emerald-500" />
                        <span className="uppercase text-[11px]">RESOLVED {selectedTxDetail.status}</span>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
