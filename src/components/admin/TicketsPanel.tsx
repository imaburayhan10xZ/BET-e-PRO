/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { FileText, Send, Check, RefreshCw, MessageSquare, ShieldAlert } from 'lucide-react';
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
  { label: 'Bet Dispute Refused ❌', text: 'We have audited the official match statistics feed for your prediction. The settlement stands as resolved according to sports league records.' }
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
        // Update selected state locally
        setSelectedTicket({ ...selectedTicket, status: 'replied' });
        onRefresh();
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
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filter logic
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
      className="space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Support inquiries list panel */}
        <div className="md:col-span-1 space-y-3.5">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider">Player Inbox</h3>
            <button onClick={onRefresh} className="p-1 rounded text-slate-500 hover:text-slate-800 transition">
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>

          <select
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
            className="w-full rounded-xl bg-slate-50 border border-slate-200 p-2.5 text-xs text-slate-700"
          >
            <option value="all">Inbox: All Inquiries</option>
            <option value="open">Active Open Tickets</option>
            <option value="closed">Resolved/Replied History</option>
          </select>

          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {loading && tickets.length === 0 ? (
              <p className="text-center py-10 text-slate-400 animate-pulse text-xs">Opening ticketing database...</p>
            ) : filteredTickets.length === 0 ? (
              <p className="text-center py-10 text-slate-400 font-medium text-xs">Support inbox completely clear!</p>
            ) : (
              filteredTickets.map(t => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTicket(t)}
                  className={`rounded-xl border p-3.5 text-xs cursor-pointer transition ${
                    selectedTicket?.id === t.id
                      ? 'border-[#FF9F00] bg-[#FF9F00]/5'
                      : 'border-slate-200 bg-white hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="font-extrabold text-slate-800 text-[11px] truncate max-w-[120px]">{t.subject}</span>
                    {t.status === 'open' ? (
                      <span className="inline-block rounded-full bg-amber-50 border border-amber-100 px-2 py-0.5 text-[8px] font-black text-amber-600 uppercase">Open</span>
                    ) : (
                      <span className="inline-block rounded-full bg-emerald-50 border border-emerald-100 px-2 py-0.5 text-[8px] font-black text-[#1FA66A] uppercase">Resolved</span>
                    )}
                  </div>
                  <p className="text-slate-500 text-[10px] truncate leading-normal">{t.message}</p>
                  <div className="flex justify-between items-center text-[8.5px] text-slate-400 font-mono mt-2">
                    <span>User: <span className="font-bold text-slate-600">{t.username}</span></span>
                    <span>Ticket: {t.id}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Reply workspace */}
        <div className="md:col-span-2">
          {selectedTicket ? (
            <div className="bg-slate-50/40 border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="border-b border-slate-200/80 pb-3 flex justify-between items-start">
                <div>
                  <span className="text-[9px] font-black uppercase text-[#FF9F00] tracking-widest font-mono">Administrative Helpdesk desk</span>
                  <h4 className="text-xs font-black text-slate-900 mt-1">Inquiry: {selectedTicket.subject}</h4>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">Submitted by: {selectedTicket.username} ({selectedTicket.userId})</p>
                </div>
                {selectedTicket.status === 'open' && (
                  <button
                    onClick={() => handleCloseTicket(selectedTicket.id)}
                    className="flex items-center space-x-1 py-1 px-2.5 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 font-bold text-[9px] uppercase transition"
                  >
                    <Check className="h-3 w-3 text-[#1FA66A]" />
                    <span>Close Ticket</span>
                  </button>
                )}
              </div>

              {/* Chat thread display */}
              <div className="space-y-3.5 max-h-[160px] overflow-y-auto bg-white border border-slate-200/80 p-4 rounded-xl shadow-inner">
                <div className="space-y-1">
                  <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-wider block">Original Message</span>
                  <div className="bg-slate-55 rounded-xl p-3 text-slate-700 text-xs leading-relaxed max-w-[85%] border border-slate-100">
                    {selectedTicket.message}
                  </div>
                </div>

                {selectedTicket.status !== 'open' && (
                  <div className="space-y-1 text-right">
                    <span className="text-[8.5px] font-black text-[#1FA66A] uppercase tracking-wider block">Admin response</span>
                    <div className="inline-block bg-[#1FA66A]/5 rounded-xl p-3 text-slate-700 text-xs leading-relaxed max-w-[85%] border border-[#1FA66A]/10 text-left">
                      Representative Response dispatched successfully. Ticket stands resolved.
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Preset select widgets */}
              {selectedTicket.status === 'open' && (
                <div className="space-y-2">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Quick Resolve Presets</span>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_TEMPLATES.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleApplyPreset(preset.text)}
                        className="text-[10px] font-semibold bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-300 px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-[#FF9F00] transition shadow-sm"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Response entry form */}
              {selectedTicket.status === 'open' ? (
                <form onSubmit={handleReplyTicket} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Write administrative response</label>
                    <textarea
                      required
                      rows={3}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type details or use a Quick Resolve Preset above..."
                      className="w-full rounded-xl bg-white border border-slate-200 p-3 text-xs text-slate-800 focus:outline-none focus:border-[#FF9F00] resize-none"
                    />
                  </div>

                  {replyFeedback && (
                    <p className="text-[10px] text-center font-bold text-slate-600 bg-white border border-slate-100 p-1.5 rounded-lg">
                      {replyFeedback}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={replyLoading}
                    className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white text-xs font-black uppercase tracking-wider transition"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>{replyLoading ? 'Dispatching response...' : 'Submit Support Response'}</span>
                  </button>
                </form>
              ) : (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-start space-x-2 text-[#1FA66A]">
                  <MessageSquare className="h-4.5 w-4.5 shrink-0 text-[#1FA66A]" />
                  <span className="text-[10px] font-bold uppercase tracking-wider leading-relaxed">This player ticket has been resolved. No further action is required.</span>
                </div>
              )}

            </div>
          ) : (
            <div className="border border-dashed border-slate-300 rounded-2xl bg-slate-50/40 flex flex-col items-center justify-center p-8 text-center text-slate-400 text-xs min-h-[300px]">
              <FileText className="h-10 w-10 text-slate-300 mb-2" />
              <span>Select a player support ticket from the registry list to load the administrative response terminal.</span>
            </div>
          )}
        </div>

      </div>
    </motion.div>
  );
}
