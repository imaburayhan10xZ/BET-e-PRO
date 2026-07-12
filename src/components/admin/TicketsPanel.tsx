/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Send, Check, RefreshCw, MessageSquare, ShieldAlert, X, Eye, ChevronRight } from 'lucide-react';
import { SupportTicket } from '../../types';

interface TicketsPanelProps {
  tickets: SupportTicket[];
  loading: boolean;
  onRefresh: () => void;
}

const PRESET_TEMPLATES = [
  { label: 'Verify Deposit ✅', text: 'We have manually cross-referenced your mobile ledger ID and successfully credited BDT to your player balance. Thank you for your patience!' },
  { label: 'Withdraw Transit 🏦', text: 'Your withdrawal voucher has been verified and released from our bKash nodes. Funds should land inside your wallet within 15-30 minutes.' },
  { label: 'Verification Request 🛡️', text: 'To complete your security audit, please upload an image of your NID card or billing statement in live support or email support@betepro.com.' },
  { label: 'Dispute Refused ❌', text: 'We have audited the official match statistics feed for your prediction. The settlement stands as resolved according to sports league records.' }
];

export default function TicketsPanel({ tickets, loading, onRefresh }: TicketsPanelProps) {
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyFeedback, setReplyFeedback] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed'>('all');

  const handleApplyPreset = (text: string) => {
    setReplyText(text);
  };

  const handleReplyTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyText) return;
    try {
      setReplyLoading(true);
      setReplyFeedback('');
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/tickets/${selectedTicket.id}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reply: replyText })
      });
      const data = await res.json();
      if (res.ok) {
        setReplyFeedback('Your response has been dispatched to the player.');
        setReplyText('');
        setSelectedTicket({ ...selectedTicket, status: 'replied' });
        onRefresh();
        setTimeout(() => {
          setSelectedTicket(null);
          setReplyFeedback('');
        }, 1200);
      } else {
        setReplyFeedback(data.error || 'Failed to dispatch reply.');
      }
    } catch (err) {
      setReplyFeedback('Network error.');
    } finally {
      setReplyLoading(false);
    }
  };

  const handleCloseTicket = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/tickets/${id}/close`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        if (selectedTicket?.id === id) {
          setSelectedTicket({ ...selectedTicket, status: 'closed' as any });
        }
        onRefresh();
        setTimeout(() => {
          setSelectedTicket(null);
        }, 1000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredTickets = tickets.filter(t => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'open') return t.status === 'open';
    if (statusFilter === 'closed') return t.status === 'closed' || t.status === 'replied';
    return true;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 text-xs"
    >
      {/* Search & Filter Header Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-100">
        <div className="flex items-center space-x-2.5">
          <MessageSquare className="h-4.5 w-4.5 text-[#FF9F00]" />
          <div>
            <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider">Player Inbox Support Tickets</h3>
            <span className="text-[10px] text-slate-400 font-bold">Manage incoming customer queries and complaints</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <select
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
            className="rounded-xl bg-slate-50 border border-slate-200 p-2.5 text-xs text-slate-700 focus:outline-none focus:border-[#FF9F00] focus:bg-white"
          >
            <option value="all">Inbox: All Inquiries</option>
            <option value="open">Active Open Tickets</option>
            <option value="closed">Resolved/Replied History</option>
          </select>
          
          <button 
            onClick={onRefresh} 
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-800 transition cursor-pointer"
            title="Refresh inbox"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Inbox List Layout (Full Width) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading && tickets.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white border border-slate-200 rounded-2xl">
            <RefreshCw className="h-5 w-5 text-[#FF9F00] animate-spin mx-auto mb-2.5" />
            <span className="font-semibold text-slate-500">Opening ticketing database...</span>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white border border-dashed border-slate-200 rounded-2xl text-slate-400 font-semibold">
            Support inbox is completely clear! No tickets match filter settings.
          </div>
        ) : (
          filteredTickets.map(t => (
            <div
              key={t.id}
              onClick={() => { setSelectedTicket(t); setReplyText(''); setReplyFeedback(''); }}
              className="cursor-pointer group rounded-2xl border border-slate-200 bg-white p-4.5 flex flex-col justify-between space-y-3.5 hover:border-[#FF9F00] transition duration-150"
            >
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  {t.status === 'open' ? (
                    <span className="inline-block rounded-full bg-amber-50 border border-amber-100/50 px-2.5 py-0.5 text-[8px] font-black text-amber-600 uppercase font-mono">Open</span>
                  ) : (
                    <span className="inline-block rounded-full bg-emerald-50 border border-emerald-100/50 px-2.5 py-0.5 text-[8px] font-black text-[#1FA66A] uppercase font-mono font-bold">Resolved</span>
                  )}
                  <span className="text-[9px] text-slate-400 font-mono">ID: {t.id.slice(0, 8)}...</span>
                </div>

                <h4 className="font-black text-slate-800 text-[12.5px] truncate group-hover:text-[#FF9F00] transition">{t.subject}</h4>
                <p className="text-slate-500 text-[11px] leading-relaxed line-clamp-2">{t.message}</p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400 font-bold font-mono">
                <span>Player: <strong className="text-slate-700">{t.username}</strong></span>
                <span className="text-[#FF9F00] group-hover:underline flex items-center space-x-0.5">
                  <span>View & Respond</span>
                  <ChevronRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* -------------------- POPUP: TICKET HELP-DESK MODAL -------------------- */}
      <AnimatePresence>
        {selectedTicket && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTicket(null)}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="bg-slate-950 text-white p-5 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-slate-900 rounded-xl text-amber-400 border border-slate-800">
                    <FileText className="h-5 w-5 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 font-mono">Staff helpdesk</span>
                    <h4 className="text-[12.5px] font-black text-white">{selectedTicket.subject}</h4>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition border border-white/10"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Form Body */}
              <div className="p-6 overflow-y-auto space-y-4 bg-slate-50/40 text-xs flex-1">
                
                {/* User reference row */}
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase pb-2 border-b border-slate-100 font-mono">
                  <span>Player: <strong className="text-slate-700">{selectedTicket.username}</strong></span>
                  <span>ID: <strong className="text-slate-700">{selectedTicket.userId}</strong></span>
                </div>

                {/* Thread chat bubble view */}
                <div className="space-y-3 bg-white p-4.5 rounded-2xl border border-slate-100 shadow-inner max-h-[180px] overflow-y-auto">
                  <div className="space-y-1">
                    <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-wider block font-mono">Original Player Query</span>
                    <div className="bg-slate-50 rounded-xl p-3 text-slate-700 text-xs leading-relaxed max-w-[85%] border border-slate-100 font-medium">
                      {selectedTicket.message}
                    </div>
                  </div>

                  {selectedTicket.status !== 'open' && (
                    <div className="space-y-1 text-right">
                      <span className="text-[8.5px] font-black text-emerald-500 uppercase tracking-wider block font-mono">Representative response</span>
                      <div className="inline-block bg-emerald-50/50 rounded-xl p-3 text-slate-700 text-xs leading-relaxed max-w-[85%] border border-emerald-100 text-left font-medium">
                        Representative Response dispatched successfully. Ticket status stands resolved.
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Presets Selection (Only if ticket is open) */}
                {selectedTicket.status === 'open' && (
                  <div className="space-y-2">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block font-mono">Quick Response Presets</span>
                    <div className="grid grid-cols-2 gap-2">
                      {PRESET_TEMPLATES.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleApplyPreset(preset.text)}
                          className="text-[10px] font-bold bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-300 p-2.5 rounded-xl text-slate-600 hover:text-[#FF9F00] text-left transition shadow-xs"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Response Submission Input / Resolve Box */}
                {selectedTicket.status === 'open' ? (
                  <form onSubmit={handleReplyTicket} className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Write helpdesk response</label>
                      <textarea
                        required
                        rows={3}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type customized guidelines or click preset buttons above..."
                        className="w-full rounded-xl bg-white border border-slate-200 p-3 text-xs text-slate-850 font-medium focus:outline-none focus:border-[#FF9F00] resize-none"
                      />
                    </div>

                    {replyFeedback && (
                      <p className={`text-[10px] font-bold text-center py-2 rounded-xl border ${
                        replyFeedback.includes('dispatched') ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-red-600 bg-red-50 border-red-100'
                      }`}>
                        {replyFeedback}
                      </p>
                    )}

                    <div className="grid grid-cols-3 gap-2 pt-1.5">
                      <button
                        type="button"
                        onClick={() => handleCloseTicket(selectedTicket.id)}
                        className="col-span-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10px] transition flex items-center justify-center space-x-1 cursor-pointer border border-slate-200"
                      >
                        <Check className="h-4 w-4 text-emerald-500 stroke-[3px]" />
                        <span>Force Settle</span>
                      </button>

                      <button
                        type="submit"
                        disabled={replyLoading}
                        className="col-span-2 py-3 rounded-xl bg-slate-900 hover:bg-[#FF9F00] text-white hover:text-slate-950 font-black uppercase tracking-wider text-[10.5px] transition flex items-center justify-center space-x-2 cursor-pointer shadow-sm"
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>{replyLoading ? 'Dispatching...' : 'Dispatch Reply'}</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="bg-emerald-50 border border-emerald-100/60 rounded-2xl p-4 flex items-start space-x-2.5 text-[#1FA66A] text-left leading-relaxed">
                    <MessageSquare className="h-5 w-5 shrink-0 text-[#1FA66A]" />
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider font-mono block">Ticket status: Settle Complete</span>
                      <p className="text-[10px] text-[#1FA66A] mt-0.5 font-medium">This support session is closed. Responses have been received by the player.</p>
                    </div>
                  </div>
                )}

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
