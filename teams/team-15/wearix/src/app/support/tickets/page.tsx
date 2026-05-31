'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  X,
  Star,
  ChevronDown,
  MessageSquare,
  User,
  Calendar,
  Tag,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import { mockTickets, SupportTicket, ChatMessage } from '@/data/mockChats';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

// ─── Modal ────────────────────────────────────────────────────────────────────

function TicketModal({ ticket, onClose }: { ticket: SupportTicket; onClose: () => void }) {
  const priorityColors: Record<string, string> = {
    High: 'bg-red-100 text-red-700 border-red-200',
    Medium: 'bg-amber-100 text-amber-700 border-amber-200',
    Low: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  };
  const statusColors: Record<string, string> = {
    Open: 'bg-blue-100 text-blue-700',
    'In Progress': 'bg-amber-100 text-amber-700',
    Resolved: 'bg-emerald-100 text-emerald-700',
    Closed: 'bg-gray-100 text-gray-600',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-[#E5E5E5]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-semibold text-[#666] bg-[#F5F5F5] px-2 py-0.5 rounded">
                {ticket.id}
              </span>
              <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${statusColors[ticket.status]}`}>
                {ticket.status}
              </span>
              <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${priorityColors[ticket.priority]}`}>
                {ticket.priority}
              </span>
            </div>
            <h2 className="text-lg font-bold text-[#1A1A1A]">{ticket.subject}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#F5F5F5] rounded-lg transition-colors"
          >
            <X size={18} className="text-[#666]" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-3 divide-x divide-[#F0F0F0]">
            {/* Conversation (2/3) */}
            <div className="col-span-2 p-5 space-y-1">
              <p className="text-xs font-semibold text-[#999] uppercase tracking-wide mb-3">Conversation</p>
              {ticket.messages.map((msg) => {
                const isUser = msg.sender === 'user';
                const time = new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                return (
                  <div key={msg.id} className={`flex flex-col mb-3 ${isUser ? 'items-end' : 'items-start'}`}>
                    <div className={`text-[10px] font-medium mb-1 ${isUser ? 'text-[#999]' : 'text-[#666]'}`}>
                      {isUser ? ticket.customerName : msg.sender === 'agent' ? (ticket.agentName ?? 'Agent') : 'Wearix Bot'} · {time}
                    </div>
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-sm max-w-[85%] leading-relaxed ${
                        isUser
                          ? 'bg-[#F0F0F0] text-[#1A1A1A] rounded-br-none'
                          : msg.sender === 'agent'
                          ? 'bg-black text-white rounded-bl-none'
                          : 'bg-white border border-[#E5E5E5] text-[#1A1A1A] rounded-bl-none'
                      }`}
                    >
                      {msg.message}
                    </div>
                  </div>
                );
              })}

              {/* Resolution */}
              {ticket.resolution && (
                <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <p className="text-xs font-semibold text-emerald-700 mb-1 flex items-center gap-1">
                    <span>✓</span> Resolution Notes
                  </p>
                  <p className="text-sm text-emerald-800">{ticket.resolution}</p>
                </div>
              )}

              {/* Star Rating */}
              {ticket.rating && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs text-[#666]">Customer Rating:</span>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={14}
                        className={s <= ticket.rating! ? 'fill-amber-400 text-amber-400' : 'text-[#DDD]'}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-semibold text-[#1A1A1A]">{ticket.rating}/5</span>
                </div>
              )}
            </div>

            {/* Metadata (1/3) */}
            <div className="p-5 space-y-5 bg-[#FAFAFA]">
              {/* Customer Info */}
              <div>
                <p className="text-xs font-semibold text-[#999] uppercase tracking-wide mb-2 flex items-center gap-1">
                  <User size={11} /> Customer
                </p>
                <p className="text-sm font-semibold text-[#1A1A1A]">{ticket.customerName}</p>
                <p className="text-xs text-[#666] break-all">{ticket.customerEmail}</p>
              </div>

              {/* Agent */}
              {ticket.agentName && (
                <div>
                  <p className="text-xs font-semibold text-[#999] uppercase tracking-wide mb-2">Assigned Agent</p>
                  <p className="text-sm font-semibold text-[#1A1A1A]">{ticket.agentName}</p>
                  <p className="text-xs text-[#666]">{ticket.tier} · {ticket.department ?? 'General'}</p>
                </div>
              )}

              {/* Dates */}
              <div>
                <p className="text-xs font-semibold text-[#999] uppercase tracking-wide mb-2 flex items-center gap-1">
                  <Calendar size={11} /> Dates
                </p>
                <div className="space-y-1">
                  <p className="text-xs text-[#666]">
                    <span className="font-medium text-[#1A1A1A]">Created:</span><br />
                    {formatDate(ticket.createdAt)}
                  </p>
                  {ticket.resolvedAt && (
                    <p className="text-xs text-[#666]">
                      <span className="font-medium text-[#1A1A1A]">Resolved:</span><br />
                      {formatDate(ticket.resolvedAt)}
                    </p>
                  )}
                </div>
              </div>

              {/* Tags */}
              <div>
                <p className="text-xs font-semibold text-[#999] uppercase tracking-wide mb-2 flex items-center gap-1">
                  <Tag size={11} /> Tags
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {ticket.tags.map((tag) => (
                    <span key={tag} className="text-[10px] bg-[#EFEFEF] text-[#666] px-2 py-0.5 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TicketHistoryPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  const filtered = useMemo(() => {
    return mockTickets.filter((t) => {
      const matchSearch =
        !search ||
        t.subject.toLowerCase().includes(search.toLowerCase()) ||
        t.customerName.toLowerCase().includes(search.toLowerCase()) ||
        t.id.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'All' || t.status === statusFilter;
      const matchPriority = priorityFilter === 'All' || t.priority === priorityFilter;
      const created = new Date(t.createdAt);
      const matchFrom = !dateFrom || created >= new Date(dateFrom);
      const matchTo = !dateTo || created <= new Date(dateTo);
      return matchSearch && matchStatus && matchPriority && matchFrom && matchTo;
    });
  }, [search, statusFilter, priorityFilter, dateFrom, dateTo]);

  const priorityColors: Record<string, string> = {
    High: 'bg-red-100 text-red-700 border-red-200',
    Medium: 'bg-amber-100 text-amber-700 border-amber-200',
    Low: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  };

  const statusColors: Record<string, string> = {
    Open: 'bg-blue-100 text-blue-700 border-blue-200',
    'In Progress': 'bg-amber-100 text-amber-700 border-amber-200',
    Resolved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    Closed: 'bg-gray-100 text-gray-600 border-gray-200',
  };

  return (
    <div className="min-h-screen bg-[#F9F9F9]">
      {/* Header */}
      <div className="bg-white border-b border-[#E5E5E5]">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <Link
            href="/support"
            className="inline-flex items-center gap-1.5 text-sm text-[#666] hover:text-[#1A1A1A] transition-colors mb-3"
          >
            <ArrowLeft size={14} /> Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-[#1A1A1A] tracking-tight">Support Ticket History</h1>
          <p className="text-sm text-[#666] mt-0.5">{mockTickets.length} total tickets</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-4">
        {/* Filter Bar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-[#E5E5E5] rounded-xl p-4 shadow-sm"
        >
          <div className="flex flex-wrap gap-3 items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" />
              <input
                type="text"
                placeholder="Search by ID, customer, or subject…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-[#F5F5F5] rounded-lg border border-transparent focus:border-[#1A1A1A] outline-none transition-colors placeholder-[#999]"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X size={12} className="text-[#999]" />
                </button>
              )}
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 text-sm bg-[#F5F5F5] rounded-lg border border-transparent focus:border-[#1A1A1A] outline-none cursor-pointer text-[#1A1A1A]"
              >
                {['All', 'Open', 'In Progress', 'Resolved', 'Closed'].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#666] pointer-events-none" />
            </div>

            {/* Priority Filter */}
            <div className="relative">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 text-sm bg-[#F5F5F5] rounded-lg border border-transparent focus:border-[#1A1A1A] outline-none cursor-pointer text-[#1A1A1A]"
              >
                {['All', 'High', 'Medium', 'Low'].map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#666] pointer-events-none" />
            </div>

            {/* Date Range */}
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 text-sm bg-[#F5F5F5] rounded-lg border border-transparent focus:border-[#1A1A1A] outline-none text-[#1A1A1A]"
            />
            <span className="text-sm text-[#999]">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 text-sm bg-[#F5F5F5] rounded-lg border border-transparent focus:border-[#1A1A1A] outline-none text-[#1A1A1A]"
            />

            {/* Active filters count */}
            {(search || statusFilter !== 'All' || priorityFilter !== 'All' || dateFrom || dateTo) && (
              <button
                onClick={() => { setSearch(''); setStatusFilter('All'); setPriorityFilter('All'); setDateFrom(''); setDateTo(''); }}
                className="flex items-center gap-1.5 text-xs text-[#666] hover:text-[#1A1A1A] px-3 py-2 bg-[#F0F0F0] rounded-lg transition-colors"
              >
                <X size={12} /> Clear filters
              </button>
            )}
          </div>
        </motion.div>

        {/* Results count */}
        <p className="text-sm text-[#666]">
          Showing <span className="font-semibold text-[#1A1A1A]">{filtered.length}</span> ticket{filtered.length !== 1 ? 's' : ''}
        </p>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl border border-[#E5E5E5] shadow-sm overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#F0F0F0] bg-[#F9F9F9]">
                  {['Ticket ID', 'Customer', 'Subject', 'Agent', 'Priority', 'Status', 'Created', 'Resolved', 'Actions'].map((h) => (
                    <th key={h} className="text-left text-[11px] font-semibold text-[#666] uppercase tracking-wide px-4 py-3 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-16 text-[#999] text-sm">
                        No tickets match your filters
                      </td>
                    </tr>
                  ) : (
                    filtered.map((ticket, i) => (
                      <motion.tr
                        key={ticket.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="border-b border-[#F0F0F0] hover:bg-[#F9F9F9] transition-colors"
                      >
                        <td className="px-4 py-3 text-sm font-mono font-semibold text-[#1A1A1A] whitespace-nowrap">{ticket.id}</td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-[#1A1A1A] whitespace-nowrap">{ticket.customerName}</p>
                          <p className="text-xs text-[#999]">{ticket.customerEmail}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-[#666] max-w-[180px]">
                          <p className="truncate">{ticket.subject}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-[#666] whitespace-nowrap">
                          {ticket.agentName ?? <span className="text-[#CCC] italic">Unassigned</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${priorityColors[ticket.priority]}`}>
                            {ticket.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${statusColors[ticket.status]}`}>
                            {ticket.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-[#666] whitespace-nowrap">{formatDate(ticket.createdAt)}</td>
                        <td className="px-4 py-3 text-xs text-[#666] whitespace-nowrap">
                          {ticket.resolvedAt ? formatDate(ticket.resolvedAt) : <span className="text-[#CCC]">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setSelectedTicket(ticket)}
                            className="flex items-center gap-1 text-xs font-medium text-black hover:underline whitespace-nowrap"
                          >
                            <MessageSquare size={11} /> View Details
                          </motion.button>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {selectedTicket && (
          <TicketModal ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
