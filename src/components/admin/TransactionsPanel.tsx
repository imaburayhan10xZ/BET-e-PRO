/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Search, Check, X, ShieldAlert, Sparkles, UserCheck, RefreshCw, FileText, Plus } from 'lucide-react';
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

  // Manual Transaction Voucher Builder State
  const [selectedUserId, setSelectedUserId] = useState('');
  const [newTxType, setNewTxType] = useState<'deposit' | 'withdraw' | 'win' | 'referral_bonus' | 'vip_bonus'>('deposit');
  const [newTxAmount, setNewTxAmount] = useState('500');
  const [newTxMethod, setNewTxMethod] = useState('system');
  const [newTxRef, setNewTxRef] = useState('');
  const [newTxDesc, setNewTxDesc] = useState('');
  const [voucherFeedback, setVoucherFeedback] = useState('');
  const [voucherLoading, setVoucherLoading] = useState(false);

  // Settle rejection comment state
  const [rejectionTargetId, setRejectionTargetId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

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
        setRejectionTargetId(null);
        setRejectionReason('');
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
      className="space-y-6"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Ledgers and Filter Block */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider">Gateway Transaction Ledger</h3>
            <button onClick={onRefresh} className="p-1 rounded text-slate-500 hover:text-slate-800 transition">
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by User, Ref, Method..."
                className="w-full rounded-xl bg-slate-50 border border-slate-200 pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#FF9F00] focus:bg-white"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full rounded-xl bg-slate-50 border border-slate-200 p-2 text-xs text-slate-700"
            >
              <option value="all">State: All</option>
              <option value="pending">Pending Requests</option>
              <option value="success">Approved Success</option>
              <option value="failed">Rejected Failed</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="w-full rounded-xl bg-slate-50 border border-slate-200 p-2 text-xs text-slate-700"
            >
              <option value="all">Type: All</option>
              <option value="deposit">Deposits</option>
              <option value="withdraw">Withdrawals</option>
              <option value="bet">Casino Bets</option>
              <option value="win">Win Payouts</option>
            </select>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <th className="p-3">User & ID</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Details</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Resolve</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-slate-400 animate-pulse">
                      Assembling gateway records...
                    </td>
                  </tr>
                ) : filteredTxs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400 font-medium">
                      No transaction records matched.
                    </td>
                  </tr>
                ) : (
                  filteredTxs.map(tx => (
                    <tr key={tx.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-3">
                        <span className="font-extrabold text-slate-800 block">{tx.username}</span>
                        <span className="text-[9px] text-slate-400 font-mono block mt-0.5">{tx.id}</span>
                      </td>
                      <td className="p-3">
                        <span className={`inline-block text-[10px] font-black uppercase tracking-wider ${
                          tx.type === 'deposit' || tx.type === 'win' ? 'text-[#1FA66A]' : 'text-red-500'
                        }`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="p-3 font-bold font-mono text-slate-800">
                        ৳{tx.amount.toLocaleString()}
                      </td>
                      <td className="p-3 leading-normal text-slate-600">
                        <span className="font-semibold block text-[11px]">{tx.paymentMethod}</span>
                        {tx.transactionId && <span className="block font-mono text-[9px] text-slate-400 mt-0.5">{tx.transactionId}</span>}
                      </td>
                      <td className="p-3">
                        {tx.status === 'success' ? (
                          <span className="inline-block rounded-full bg-emerald-50 border border-emerald-100 px-2 py-0.5 text-[8px] font-black text-[#1FA66A] uppercase">Approved</span>
                        ) : tx.status === 'failed' ? (
                          <span className="inline-block rounded-full bg-red-50 border border-red-100 px-2 py-0.5 text-[8px] font-black text-red-600 uppercase">Rejected</span>
                        ) : (
                          <span className="inline-block rounded-full bg-amber-50 border border-amber-100 px-2 py-0.5 text-[8px] font-black text-amber-600 uppercase">Pending</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        {tx.status === 'pending' ? (
                          <div className="flex justify-end space-x-1">
                            <button
                              onClick={() => handleProcessTransaction(tx.id, true)}
                              className="bg-emerald-50 text-[#1FA66A] border border-emerald-100 p-1 rounded hover:bg-[#1FA66A] hover:text-white transition"
                              title="Approve transaction"
                            >
                              <Check className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => handleProcessTransaction(tx.id, false)}
                              className="bg-red-50 text-red-600 border border-red-100 p-1 rounded hover:bg-red-500 hover:text-white transition"
                              title="Reject transaction"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[9px] text-slate-400 font-bold uppercase font-mono">Resolved</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Voucher Creator form */}
        <div className="lg:col-span-1">
          <div className="bg-slate-50/50 border border-slate-200 p-5 rounded-2xl space-y-4 shadow-sm">
            <div className="border-b border-slate-200/80 pb-2.5 flex items-center space-x-2">
              <Plus className="h-4.5 w-4.5 text-[#FF9F00]" />
              <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">Manual Ledger Voucher</h4>
            </div>

            <p className="text-slate-500 text-[11px] leading-relaxed">
              Process manual balance ledger entries to bypass traditional mobile agency checkpoints. Directly credit or debit players for agent deposits or custom loyalty rewards.
            </p>

            <form onSubmit={handleCreateVoucher} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Select Player Account</label>
                <select
                  required
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full rounded-xl bg-white border border-slate-200 p-2.5 text-slate-800"
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
                    className="w-full rounded-xl bg-white border border-slate-200 p-2 text-slate-700"
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
                    className="w-full rounded-xl bg-white border border-slate-200 p-2 text-slate-800 font-mono font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Agent Node</label>
                  <select
                    value={newTxMethod}
                    onChange={(e) => setNewTxMethod(e.target.value)}
                    className="w-full rounded-xl bg-white border border-slate-200 p-2 text-slate-700"
                  >
                    <option value="bKash">bKash</option>
                    <option value="Nagad">Nagad</option>
                    <option value="Rocket">Rocket</option>
                    <option value="Manual Agent">Manual Agent</option>
                    <option value="system">System Adjust</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">VReference ID (Ref)</label>
                  <input
                    type="text"
                    value={newTxRef}
                    onChange={(e) => setNewTxRef(e.target.value)}
                    placeholder="e.g. TAX991A"
                    className="w-full rounded-xl bg-white border border-slate-200 p-2 text-slate-800 font-mono focus:outline-none"
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
                  className="w-full rounded-xl bg-white border border-slate-200 p-2.5 text-slate-800 focus:outline-none"
                />
              </div>

              {voucherFeedback && (
                <p className={`text-[10px] font-bold text-center py-1.5 rounded-lg border ${
                  voucherFeedback.includes('processed') ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-red-600 bg-red-50 border-red-100'
                }`}>
                  {voucherFeedback}
                </p>
              )}

              <button
                type="submit"
                disabled={voucherLoading}
                className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase text-[10px] tracking-widest transition"
              >
                {voucherLoading ? 'Processing Ledger...' : 'Post Manual Ledger Entry'}
              </button>
            </form>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
