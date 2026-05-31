'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Minimize2, Zap, ArrowUpRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

// ── localStorage helpers ──────────────────────────────────────────────────────
const LS_KEY = 'wearix_chat_tickets';

export interface ChatTicket {
  id: string;
  customerName: string;
  customerEmail: string;
  issueText: string;           // first user message
  draftResponse: string;       // first AI response
  tier: string;
  intent: string;
  confidence: number;
  status: string;              // 'Resolved' | 'Escalated' | 'Pending'
  department: string;
  createdAt: string;
  messages: Array<{ role: 'user' | 'support'; text: string; timestamp: string }>;
  brief?: {
    sentiment?: string;
    priority?: string;
    sla?: string;
    department?: string;
    issue_summary?: string;
    recommended_actions?: string;
  } | null;
  source: 'chat';
}

export function loadChatTickets(): ChatTicket[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function saveChatTickets(tickets: ChatTicket[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(tickets));
  // Dispatch a custom event so the support dashboard on the same page updates instantly
  window.dispatchEvent(new CustomEvent('wearix_chat_updated'));
}

function upsertChatTicket(ticket: ChatTicket) {
  const existing = loadChatTickets();
  const idx = existing.findIndex((t) => t.id === ticket.id);
  if (idx >= 0) existing[idx] = ticket;
  else existing.unshift(ticket);
  saveChatTickets(existing);
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface Message {
  id: string;
  role: 'user' | 'support';
  text: string;
  timestamp: Date;
  tier?: string;
  intent?: string;
  status?: string;
  confidence?: number;
  brief?: ChatTicket['brief'];
  isTyping?: boolean;
}

// ── Quick reply chips ─────────────────────────────────────────────────────────
const QUICK_REPLIES = [
  'Track my order',
  'Return policy',
  'Refund status',
  'Contact human',
];

// ── Typing indicator ──────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 bg-[#999] rounded-full"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  );
}

// ── ChatWidget ────────────────────────────────────────────────────────────────
export default function ChatWidget() {
  const { user } = useAuth();
  const [open, setOpen]           = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [input, setInput]         = useState('');
  const [loading, setLoading]     = useState(false);
  // Stable session ID for this browser tab session
  const sessionIdRef = useRef<string>(`CHAT-${Date.now()}`);
  const [messages, setMessages]   = useState<Message[]>([
    {
      id: 'welcome',
      role: 'support',
      text: "Hi there! 👋 Welcome to Wearix Support. I'm powered by an AI agent — ask me about orders, returns, shipping, or anything else.",
      timestamp: new Date(),
    },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    if (open && !minimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open, minimized]);

  // Persist ticket to localStorage whenever messages change (after first user msg)
  useEffect(() => {
    const userMsgs = messages.filter((m) => m.role === 'user' && !m.isTyping);
    if (userMsgs.length === 0) return;

    const firstUser = userMsgs[0];
    const lastSupport = [...messages].reverse().find((m) => m.role === 'support' && !m.isTyping);

    const ticket: ChatTicket = {
      id: sessionIdRef.current,
      customerName: user?.name ?? 'Guest User',
      customerEmail: user?.email ?? 'guest@wearix.com',
      issueText: firstUser.text,
      draftResponse: lastSupport?.text ?? '',
      tier: lastSupport?.tier ?? 'Tier-1',
      intent: lastSupport?.intent ?? 'contact_customer_service',
      confidence: lastSupport?.confidence ?? 0.75,
      status: lastSupport?.tier === 'Tier-2' ? 'Escalated' : 'Resolved',
      department: lastSupport?.brief?.department ?? (lastSupport?.tier === 'Tier-2' ? 'Escalation' : 'Support'),
      createdAt: firstUser.timestamp.toISOString(),
      messages: messages
        .filter((m) => !m.isTyping)
        .map((m) => ({ role: m.role, text: m.text, timestamp: m.timestamp.toISOString() })),
      brief: lastSupport?.brief ?? null,
      source: 'chat',
    };

    upsertChatTicket(ticket);
  }, [messages, user]);

  const addTypingIndicator = (): string => {
    const id = `typing-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id, role: 'support', text: '', timestamp: new Date(), isTyping: true },
    ]);
    return id;
  };

  const removeTypingIndicator = (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  const sendMessage = async (text?: string) => {
    const trimmed = (text ?? input).trim();
    if (!trimmed || loading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const typingId = addTypingIndicator();

    try {
      const res = await fetch('/api/support/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
      });

      const data = await res.json();
      removeTypingIndicator(typingId);

      const supportMsg: Message = {
        id: `support-${Date.now()}`,
        role: 'support',
        text: data.response ?? "Thanks for reaching out! A support agent will be with you shortly.",
        timestamp: new Date(),
        tier: data.tier,
        intent: data.intent,
        status: data.status,
        confidence: data.confidence,
        brief: data.brief ?? null,
      };

      setMessages((prev) => [...prev, supportMsg]);
    } catch {
      removeTypingIndicator(typingId);
      setMessages((prev) => [
        ...prev,
        {
          id: `support-${Date.now()}`,
          role: 'support',
          text: "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (d: Date) =>
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  const tierColor = (tier?: string) =>
    tier === 'Tier-2' ? 'text-red-500' : 'text-green-600';

  return (
    <>
      {/* ── Floating button ──────────────────────────────────────────────── */}
      <motion.button
        onClick={() => { setOpen((p) => !p); setMinimized(false); }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-black text-white rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.24)] flex items-center justify-center"
        aria-label={open ? 'Close chat' : 'Open chat'}
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <X className="w-5 h-5" />
            </motion.span>
          ) : (
            <motion.span key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <MessageCircle className="w-5 h-5" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* ── Chat panel ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="fixed bottom-24 right-6 z-50 w-[440px] bg-white border border-[#E5E5E5] rounded-sm shadow-[0_16px_60px_rgba(0,0,0,0.16)] flex flex-col overflow-hidden"
            style={{ maxHeight: minimized ? '56px' : '640px' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-black text-white flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold leading-none">Wearix Support</p>
                    <Zap className="w-3 h-3 text-yellow-400" />
                  </div>
                  <p className="text-[10px] text-white/60 mt-0.5">AI-powered · Groq LLM</p>
                </div>
              </div>
              <button
                onClick={() => setMinimized((p) => !p)}
                className="p-1.5 rounded-sm hover:bg-white/10 transition-colors"
                aria-label={minimized ? 'Expand chat' : 'Minimize chat'}
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>

            {/* Messages + input */}
            {!minimized && (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-[#F9F9F9]" style={{ minHeight: '380px' }}>
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {msg.role === 'support' && (
                        <div className="w-6 h-6 rounded-full bg-black text-white text-[9px] font-bold flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                          W
                        </div>
                      )}
                      <div
                        className={`max-w-[78%] px-4 py-3 rounded-sm text-[15px] leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-black text-white'
                            : 'bg-white border border-[#E5E5E5] text-[#1A1A1A]'
                        }`}
                      >
                        {msg.isTyping ? (
                          <TypingDots />
                        ) : (
                          <>
                            <p className="whitespace-pre-wrap">{msg.text}</p>
                            <div className="flex items-center justify-between mt-1 gap-2">
                              <p className={`text-[10px] ${msg.role === 'user' ? 'text-white/50' : 'text-[#999]'}`}>
                                {formatTime(msg.timestamp)}
                              </p>
                              {msg.tier && (
                                <span className={`text-[9px] font-semibold uppercase tracking-wider ${tierColor(msg.tier)}`}>
                                  {msg.tier} · {msg.intent?.replace(/_/g, ' ')}
                                </span>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick replies — show only on first message */}
                {messages.length <= 1 && (
                  <div className="px-3 py-2 bg-[#F9F9F9] border-t border-[#E5E5E5] flex flex-wrap gap-1.5">
                    {QUICK_REPLIES.map((qr) => (
                      <button
                        key={qr}
                        onClick={() => sendMessage(qr)}
                        disabled={loading}
                        className="text-[11px] font-medium px-2.5 py-1 border border-[#E5E5E5] bg-white rounded-full hover:bg-black hover:text-white hover:border-black transition-colors disabled:opacity-40"
                      >
                        {qr}
                      </button>
                    ))}
                  </div>
                )}

                {/* Input */}
                <div className="px-3 py-3 border-t border-[#E5E5E5] bg-white flex items-center gap-2 flex-shrink-0">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={user ? 'Describe your issue…' : 'Sign in to chat with support'}
                    disabled={!user || loading}
                    className="flex-1 text-[15px] bg-[#F9F9F9] border border-[#E5E5E5] rounded-sm px-4 py-2.5 focus:outline-none focus:border-black transition-colors placeholder:text-[#999] disabled:opacity-50"
                  />
                  <button
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || !user || loading}
                    aria-label="Send message"
                    className="w-10 h-10 flex items-center justify-center bg-black text-white rounded-sm hover:bg-[#1A1A1A] transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
                  >
                    {loading ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* Footer note */}
                <div className="px-3 py-1.5 bg-white border-t border-[#F0F0F0] flex items-center justify-between">
                  <p className="text-[9px] text-[#CCC]">Powered by Groq LLM · Team D15</p>
                  <a href="/support" className="text-[9px] text-[#999] hover:text-black flex items-center gap-0.5 transition-colors">
                    Support Dashboard <ArrowUpRight className="w-2.5 h-2.5" />
                  </a>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
