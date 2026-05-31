'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Inbox,
  FileText,
  Activity,
  Brain,
  Search,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  User,
  Send,
  Zap,
  ChevronRight,
  Database,
  Copy,
  Sparkles,
  ArrowRightLeft,
  X,
  Plus,
  MessageCircle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { type ChatTicket, loadChatTickets } from '@/components/common/ChatWidget';

// Helper for formatting date
function formatDateStr(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function SupportAdminDashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Tab State: 'overview' | 'queue' | 'detail' | 'simulation' | 'performance'
  const [activeTab, setActiveTab] = useState<'overview' | 'queue' | 'detail' | 'simulation' | 'performance'>('overview');

  // Unified Tickets State initialized with 15 tickets matching mockup proportions:
  // - 9 Tier-1 Resolved tickets
  // - 6 Tier-2 Escalated/Pending tickets (Average confidence around 0.87)
  const [tickets, setTickets] = useState<any[]>(() => [
    {
      id: "T001",
      customerName: "Amogh K.",
      customerEmail: "amogh.k@wearix.com",
      orderId: "#ORD-8821",
      tier: "Tier-1",
      intent: "cancel_order",
      department: "orders",
      confidence: 0.91,
      status: "Resolved",
      createdAt: "2024-01-14T10:30:00Z",
      issueText: "I want to cancel my order immediately before it ships.",
      draftResponse: "Dear Amogh K., we have processed your request to cancel order #ORD-8821. The cancellation is now complete and a confirmation has been sent to your email.",
      brief: {
        sentiment: "Neutral",
        urgency: "Medium",
        department: "Orders Team",
        sla: "Respond within 24 hours",
        summary: "Customer requested cancellation of order #ORD-8821 before shipment.",
        recommended: "Confirm cancellation, release items, issue full refund."
      }
    },
    {
      id: "T002",
      customerName: "Ananya H.",
      customerEmail: "ananya.h@wearix.com",
      orderId: "#ORD-8823",
      tier: "Tier-2",
      intent: "payment_issue",
      department: "billing",
      confidence: 0.83,
      status: "Escalated",
      createdAt: "2024-01-15T09:15:00Z",
      issueText: "I was charged twice for the same order. This is completely unacceptable and I want it resolved.",
      draftResponse: "Dear Ananya, we sincerely apologize for the duplicate charge on your account. Our billing team has been notified and will resolve this within 24 hours, processing a refund immediately.",
      brief: {
        sentiment: "Frustrated",
        urgency: "High",
        department: "Billing Team",
        sla: "Respond within 2 hours",
        summary: "Customer charged twice for order #ORD-8823. Requires immediate billing review.",
        recommended: "Issue full refund + send apology"
      }
    },
    {
      id: "T003",
      customerName: "Vachanshree",
      customerEmail: "vachan@wearix.com",
      orderId: "#ORD-8825",
      tier: "Tier-1",
      intent: "track_order",
      department: "shipping",
      confidence: 0.95,
      status: "Resolved",
      createdAt: "2024-01-15T11:45:00Z",
      issueText: "Where is my order? It has been 5 days and I haven't received any tracking update.",
      draftResponse: "Dear Vachanshree, thank you for your query. Order #ORD-8825 is currently shipped. Tracking number: TRK-99238. You can track it on our carrier page.",
      brief: {
        sentiment: "Neutral",
        urgency: "Medium",
        department: "Logistics Team",
        sla: "Respond within 24 hours",
        summary: "Customer requesting status update and tracking details for order #ORD-8825.",
        recommended: "Provide carrier details and tracking link."
      }
    },
    {
      id: "T004",
      customerName: "Anusha S.",
      customerEmail: "anusha.s@wearix.com",
      orderId: "#ORD-8827",
      tier: "Tier-2",
      intent: "complaint",
      department: "escalat",
      confidence: 0.88,
      status: "Pending",
      createdAt: "2024-01-15T14:20:00Z",
      issueText: "The package arrived damaged, and two items are missing. I am extremely disappointed with this delivery.",
      draftResponse: "Dear Anusha S., we are extremely sorry that your package arrived damaged. We will dispatch replacement items immediately.",
      brief: {
        sentiment: "Frustrated",
        urgency: "High",
        department: "Escalation Team",
        sla: "Respond within 4 hours",
        summary: "Damaged box received, customer claims items are missing.",
        recommended: "Verify package weight, ship replacement items immediately."
      }
    },
    {
      id: "T005",
      customerName: "Rohan M.",
      customerEmail: "rohan@wearix.com",
      orderId: "#ORD-8829",
      tier: "Tier-1",
      intent: "product_inquiry",
      department: "accounts",
      confidence: 0.92,
      status: "Resolved",
      createdAt: "2024-01-12T16:00:00Z",
      issueText: "Is the black trench coat going to be restocked soon?",
      draftResponse: "Dear Rohan, the structured trench coat is restocking next week. You can sign up on the product page for alert notifications.",
      brief: {
        sentiment: "Neutral",
        urgency: "Low",
        department: "Support Team",
        sla: "Respond within 24 hours",
        summary: "Customer inquiring about structural trench coat stock.",
        recommended: "Advise on restocking timeline and alert options."
      }
    },
    {
      id: "T006",
      customerName: "Priya P.",
      customerEmail: "priya@wearix.com",
      orderId: "#ORD-8831",
      tier: "Tier-1",
      intent: "track_order",
      department: "shipping",
      confidence: 0.89,
      status: "Resolved",
      createdAt: "2024-01-13T10:15:00Z",
      issueText: "Can I get the tracking link for order ORD-8831?",
      draftResponse: "Dear Priya, your package has been shipped. The tracking link is: DHL-882348.",
      brief: { sentiment: "Neutral", urgency: "Low", department: "Shipping", sla: "24h", summary: "Tracking request", recommended: "Send link" }
    },
    {
      id: "T007",
      customerName: "Vikram S.",
      customerEmail: "vikram@wearix.com",
      orderId: "#ORD-8833",
      tier: "Tier-2",
      intent: "refund_request",
      department: "billing",
      confidence: 0.81,
      status: "Escalated",
      createdAt: "2024-01-13T14:45:00Z",
      issueText: "I want a refund for the broken zipper on my new jacket.",
      brief: { sentiment: "Frustrated", urgency: "High", department: "Billing", sla: "2h", summary: "Refund request due to defect", recommended: "Issue refund" }
    },
    {
      id: "T008",
      customerName: "Meera J.",
      customerEmail: "meera@wearix.com",
      orderId: "#ORD-8835",
      tier: "Tier-1",
      intent: "change_shipping",
      department: "shipping",
      confidence: 0.87,
      status: "Resolved",
      createdAt: "2024-01-14T09:00:00Z",
      issueText: "Please change my address to Apt 4B instead of Apt 4A.",
      brief: { sentiment: "Neutral", urgency: "Medium", department: "Shipping", sla: "12h", summary: "Address change", recommended: "Update records" }
    },
    {
      id: "T009",
      customerName: "Kabir G.",
      customerEmail: "kabir@wearix.com",
      orderId: "#ORD-8837",
      tier: "Tier-2",
      intent: "payment_issue",
      department: "billing",
      confidence: 0.79,
      status: "Escalated",
      createdAt: "2024-01-14T11:20:00Z",
      issueText: "My bank says the payment failed but money was deducted.",
      brief: { sentiment: "Frustrated", urgency: "High", department: "Finance", sla: "2h", summary: "Failed transaction fee", recommended: "Verify settlement" }
    },
    {
      id: "T010",
      customerName: "Sneha R.",
      customerEmail: "sneha@wearix.com",
      orderId: "#ORD-8839",
      tier: "Tier-1",
      intent: "product_inquiry",
      department: "accounts",
      confidence: 0.94,
      status: "Resolved",
      createdAt: "2024-01-14T15:10:00Z",
      issueText: "Do you have a size guide for kids overalls?",
      brief: { sentiment: "Neutral", urgency: "Low", department: "Support", sla: "24h", summary: "Size chart info", recommended: "Send size guide link" }
    },
    {
      id: "T011",
      customerName: "Arjun V.",
      customerEmail: "arjun@wearix.com",
      orderId: "#ORD-8841",
      tier: "Tier-1",
      intent: "cancel_order",
      department: "orders",
      confidence: 0.90,
      status: "Resolved",
      createdAt: "2024-01-14T16:30:00Z",
      issueText: "Please cancel order ORD-8841 as I clicked double.",
      brief: { sentiment: "Neutral", urgency: "Medium", department: "Orders", sla: "12h", summary: "Cancellation", recommended: "Cancel order" }
    },
    {
      id: "T012",
      customerName: "Divya T.",
      customerEmail: "divya@wearix.com",
      orderId: "#ORD-8843",
      tier: "Tier-2",
      intent: "complaint",
      department: "escalat",
      confidence: 0.82,
      status: "Pending",
      createdAt: "2024-01-15T08:00:00Z",
      issueText: "The delivery guy was rude and left the box in the rain.",
      brief: { sentiment: "Frustrated", urgency: "High", department: "Escalation", sla: "4h", summary: "Courier delivery feedback", recommended: "Lodge courier ticket" }
    },
    {
      id: "T013",
      customerName: "Aditya B.",
      customerEmail: "aditya@wearix.com",
      orderId: "#ORD-8845",
      tier: "Tier-1",
      intent: "track_order",
      department: "shipping",
      confidence: 0.91,
      status: "Resolved",
      createdAt: "2024-01-15T10:10:00Z",
      issueText: "Where is order ORD-8845?",
      brief: { sentiment: "Neutral", urgency: "Low", department: "Shipping", sla: "24h", summary: "Status request", recommended: "Provide status" }
    },
    {
      id: "T014",
      customerName: "Kiara N.",
      customerEmail: "kiara@wearix.com",
      orderId: "#ORD-8847",
      tier: "Tier-1",
      intent: "change_shipping",
      department: "shipping",
      confidence: 0.86,
      status: "Resolved",
      createdAt: "2024-01-15T12:00:00Z",
      issueText: "Please update the postal code to 10001.",
      brief: { sentiment: "Neutral", urgency: "Medium", department: "Shipping", sla: "12h", summary: "Zip update", recommended: "Update shipping info" }
    },
    {
      id: "T015",
      customerName: "Siddharth K.",
      customerEmail: "sid@wearix.com",
      orderId: "#ORD-8849",
      tier: "Tier-2",
      intent: "refund_request",
      department: "billing",
      confidence: 0.85,
      status: "Escalated",
      createdAt: "2024-01-15T13:30:00Z",
      issueText: "I want to return the sweater, it is too itchy.",
      brief: { sentiment: "Neutral", urgency: "High", department: "Billing", sla: "2h", summary: "Quality return refund request", recommended: "Provide return label" }
    }
  ]);

  // Active Selected Ticket ID for Ticket Detail tab
  const [selectedTicketId, setSelectedTicketId] = useState<string>('T002');

  // ── Load chat tickets from localStorage and merge ─────────────────────────
  useEffect(() => {
    // Convert a ChatTicket into the dashboard ticket shape
    const convertChatTicket = (ct: ChatTicket) => ({
      id: ct.id,
      customerName: ct.customerName,
      customerEmail: ct.customerEmail,
      orderId:
        ct.messages
          .map((m) => m.text.match(/ORD-\d+/i)?.[0])
          .find(Boolean) ?? 'N/A',
      tier: ct.tier,
      intent: ct.intent,
      department: ct.department,
      confidence: ct.confidence,
      status: ct.status,
      createdAt: ct.createdAt,
      issueText: ct.issueText,
      draftResponse: ct.draftResponse,
      brief: ct.brief
        ? {
            sentiment: ct.brief.sentiment ?? 'Neutral',
            urgency: ct.brief.priority ?? 'Medium',
            department: ct.brief.department ?? ct.department,
            sla: ct.brief.sla ?? '24 hours',
            summary: ct.brief.issue_summary ?? ct.issueText,
            recommended: ct.brief.recommended_actions ?? '',
          }
        : {
            sentiment: 'Neutral',
            urgency: 'Low',
            department: ct.department,
            sla: '24 hours',
            summary: ct.issueText,
            recommended: '',
          },
      chatMessages: ct.messages,
      source: 'chat' as const,
    });

    const merge = () => {
      const chatTickets = loadChatTickets();
      setTickets((prev) => {
        // Keep all non-chat tickets, then prepend fresh chat tickets
        const staticOnly = prev.filter((t) => t.source !== 'chat');
        const converted = chatTickets.map(convertChatTicket);
        return [...converted, ...staticOnly];
      });
    };

    // Run immediately on mount
    merge();

    // Listen for same-tab updates (dispatched by ChatWidget after every save)
    window.addEventListener('wearix_chat_updated', merge);

    // Also listen for cross-tab updates via storage event
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'wearix_chat_tickets') merge();
    };
    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('wearix_chat_updated', merge);
      window.removeEventListener('storage', onStorage);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — merge uses setTickets(prev=>) so no stale closure

  // Search & Filter State for Queue
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState<'All' | 'Tier-1' | 'Tier-2'>('All');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Resolved' | 'Escalated' | 'Pending'>('All');

  // Simulator Form State
  const [simName, setSimName] = useState('');
  const [simOrderId, setSimOrderId] = useState('');
  const [simIssue, setSimIssue] = useState('');
  const [simProgress, setSimProgress] = useState<{ step: number; isRunning: boolean; logs: string[] }>({
    step: 0,
    isRunning: false,
    logs: []
  });
  const [lastSimulatedId, setLastSimulatedId] = useState<string | null>(null);

  // Authenticate user check
  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'support')) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // Derived stats for Page 1: Overview
  const stats = useMemo(() => {
    const total = tickets.length;
    const tier1 = tickets.filter(t => t.tier === 'Tier-1');
    const tier1ResolvedCount = tier1.filter(t => t.status === 'Resolved').length;
    const tier1Percent = total > 0 ? Math.round((tier1ResolvedCount / total) * 100) : 0;

    const tier2 = tickets.filter(t => t.tier === 'Tier-2');
    const tier2Count = tier2.length;
    const tier2Percent = total > 0 ? Math.round((tier2Count / total) * 100) : 0;

    const sumConf = tickets.reduce((acc, t) => acc + t.confidence, 0);
    const avgConf = total > 0 ? (sumConf / total).toFixed(2) : '0.00';

    const liveChatCount = tickets.filter(t => t.source === 'chat').length;

    // Counts by department — normalise to lowercase for matching
    const deptCounts = {
      orders:   tickets.filter(t => (t.department ?? '').toLowerCase().includes('order')).length,
      billing:  tickets.filter(t => (t.department ?? '').toLowerCase().includes('bill') || (t.department ?? '').toLowerCase().includes('financ')).length,
      shipping: tickets.filter(t => (t.department ?? '').toLowerCase().includes('ship') || (t.department ?? '').toLowerCase().includes('logist')).length,
      accounts: tickets.filter(t => (t.department ?? '').toLowerCase().includes('account') || (t.department ?? '').toLowerCase().includes('support')).length,
      escalat:  tickets.filter(t => (t.department ?? '').toLowerCase().includes('escalat') || (t.department ?? '').toLowerCase().includes('relation')).length,
    };

    return {
      total,
      tier1ResolvedCount,
      tier1Percent,
      tier2Count,
      tier2Percent,
      avgConf,
      liveChatCount,
      deptCounts,
    };
  }, [tickets]);

  // Filtered tickets for Page 2: Queue
  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const matchesSearch = searchQuery === '' || 
        t.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.orderId && t.orderId.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesTier = filterTier === 'All' || t.tier === filterTier;
      const matchesStatus = filterStatus === 'All' || t.status === filterStatus;

      return matchesSearch && matchesTier && matchesStatus;
    });
  }, [tickets, searchQuery, filterTier, filterStatus]);

  // Selected Ticket Object for Detail View
  const selectedTicket = useMemo(() => {
    return tickets.find(t => t.id === selectedTicketId) || tickets[0];
  }, [tickets, selectedTicketId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-black border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user || user.role !== 'support') return null;

  // quick fill issue templates
  const fillSimulator = (name: string, orderId: string, issue: string) => {
    setSimName(name);
    setSimOrderId(orderId);
    setSimIssue(issue);
  };

  // Run the Pipeline simulation
  const startSimulation = () => {
    if (!simName || !simIssue) return;
    setSimProgress({ step: 0, isRunning: true, logs: ["📥 Intake Agent: Ingesting ticket text..."] });
    setLastSimulatedId(null);

    // Predict Intent and Details
    const text = simIssue.toLowerCase();
    let intent = "product_inquiry";
    let department = "accounts";
    let tier = "Tier-1";
    let confidence = 0.88;
    let status = "Resolved";
    let response = "";
    let brief = { sentiment: "Neutral", urgency: "Medium", department: "Accounts", sla: "24 hours", summary: "", recommended: "" };

    if (text.includes("cancel")) {
      intent = "cancel_order";
      department = "orders";
      tier = "Tier-1";
      confidence = 0.91;
      status = "Resolved";
      response = `Dear ${simName}, we have received your request to cancel order ${simOrderId || '#ORD-9912'}. Your order has been cancelled and a refund is being processed.`;
      brief = {
        sentiment: "Neutral",
        urgency: "Medium",
        department: "Orders Team",
        sla: "Respond within 24 hours",
        summary: `Cancellation request for order ${simOrderId || '#ORD-9912'}.`,
        recommended: "Confirm cancellation, release items, issue full refund."
      };
    } else if (text.includes("charged") || text.includes("double") || text.includes("twice") || text.includes("payment")) {
      intent = "payment_issue";
      department = "billing";
      tier = "Tier-2";
      confidence = 0.83;
      status = "Escalated";
      response = `Dear ${simName}, we sincerely apologize for the duplicate charge on your account for order ${simOrderId || '#ORD-8823'}. Our billing team has been notified and will resolve this within 24 hours, processing a refund immediately.`;
      brief = {
        sentiment: "Frustrated",
        urgency: "High",
        department: "Billing Team",
        sla: "Respond within 2 hours",
        summary: `Customer charged twice for order ${simOrderId || '#ORD-8823'}. Requires immediate billing review.`,
        recommended: "Issue full refund + send apology"
      };
    } else if (text.includes("track") || text.includes("where is") || text.includes("ship")) {
      intent = "track_order";
      department = "shipping";
      tier = "Tier-1";
      confidence = 0.95;
      status = "Resolved";
      response = `Dear ${simName}, thank you for your query. Order ${simOrderId || '#ORD-8825'} has shipped and is in transit. Tracking number: TRK-99238.`;
      brief = {
        sentiment: "Neutral",
        urgency: "Medium",
        department: "Logistics Team",
        sla: "Respond within 24 hours",
        summary: `Tracking request for order ${simOrderId || '#ORD-8825'}.`,
        recommended: "Provide carrier details and tracking link."
      };
    } else {
      intent = "complaint";
      department = "escalat";
      tier = "Tier-2";
      confidence = 0.88;
      status = "Pending";
      response = `Dear ${simName}, we apologize for the inconvenience. An escalation manager has been assigned and is reviewing your concern. We will respond within 4 hours.`;
      brief = {
        sentiment: "Frustrated",
        urgency: "High",
        department: "Escalation Team",
        sla: "Respond within 4 hours",
        summary: `Customer complaint regarding service/order ${simOrderId || 'N/A'}.`,
        recommended: "Verify details, contact customer directly."
      };
    }

    const nextId = `T0${tickets.length + 1}`;

    // Timed pipeline simulation
    setTimeout(() => {
      // Step 1 done -> Step 2
      setSimProgress(p => ({
        step: 1,
        isRunning: true,
        logs: [...p.logs, "✅ Intake Agent: Parsed customer name & order ID details", `🔍 Classifier: Analyzing intent using ML model...`]
      }));

      setTimeout(() => {
        // Step 2 done -> Step 3
        setSimProgress(p => ({
          step: 2,
          isRunning: true,
          logs: [...p.logs, `✅ Classifier: Classified intent as '${intent}' (Confidence: ${confidence})`, `⚡ Escalation Agent: Generating briefs and drafts...`]
        }));

        setTimeout(() => {
          // Step 3 done -> Step 4
          setSimProgress(p => ({
            step: 3,
            isRunning: true,
            logs: [...p.logs, `✅ Escalation Agent: Generated response draft & agent brief`, `💾 Status Tracker: Committing record to database...`]
          }));

          setTimeout(() => {
            // All complete
            const newTicket = {
              id: nextId,
              customerName: simName,
              customerEmail: `${simName.toLowerCase().replace(/\s+/g, '')}@wearix.com`,
              orderId: simOrderId || '#ORD-9912',
              tier,
              intent,
              department,
              confidence,
              status,
              createdAt: new Date().toISOString(),
              issueText: simIssue,
              draftResponse: response,
              brief,
              source: 'simulator' as const,
            };

            setTickets(prev => [...prev, newTicket]);
            setLastSimulatedId(nextId);
            setSimProgress(p => ({
              step: 4,
              isRunning: false,
              logs: [...p.logs, `✅ Status Tracker: Saved to DB as Ticket #${nextId} (${status})`, "🎉 Ticket pipeline process completed!"]
            }));
            
            // Reset fields
            setSimName('');
            setSimOrderId('');
            setSimIssue('');
          }, 800);
        }, 800);
      }, 800);
    }, 800);
  };

  const handleResolveFromDetail = (id: string) => {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status: 'Resolved' } : t));
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col md:flex-row">
      {/* ── Sidebar Navigation ── */}
      <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-[#E5E5E5] flex flex-col shrink-0">
        <div className="p-6 border-b border-[#E5E5E5]">
          <span className="text-xl font-bold tracking-widest text-black">WEARIX</span>
          <span className="block text-[10px] text-[#888] font-medium uppercase mt-0.5 tracking-wider">Support Administration</span>
        </div>
        
        {/* Navigation Items */}
        <nav className="p-4 space-y-1 flex-1 hidden md:block">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'overview' ? 'bg-black text-white' : 'text-[#666] hover:bg-[#F5F5F5] hover:text-[#1A1A1A]'
            }`}
          >
            <LayoutDashboard size={18} />
            Overview / Home
          </button>
          
          <button
            onClick={() => setActiveTab('queue')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'queue' ? 'bg-black text-white' : 'text-[#666] hover:bg-[#F5F5F5] hover:text-[#1A1A1A]'
            }`}
          >
            <Inbox size={18} />
            Ticket Queue
            <div className="ml-auto flex items-center gap-1">
              {stats.liveChatCount > 0 && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${activeTab === 'queue' ? 'bg-blue-400 text-white' : 'bg-blue-100 text-blue-600'}`}>
                  {stats.liveChatCount} live
                </span>
              )}
              <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === 'queue' ? 'bg-white/20 text-white' : 'bg-[#F0F0F0] text-black'}`}>
                {tickets.length}
              </span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('detail')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'detail' ? 'bg-black text-white' : 'text-[#666] hover:bg-[#F5F5F5] hover:text-[#1A1A1A]'
            }`}
          >
            <FileText size={18} />
            Ticket Detail View
          </button>

          <button
            onClick={() => setActiveTab('simulation')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'simulation' ? 'bg-black text-white animate-pulse' : 'text-[#666] hover:bg-[#F5F5F5] hover:text-[#1A1A1A]'
            }`}
          >
            <Activity size={18} />
            Live Simulation
          </button>

          <button
            onClick={() => setActiveTab('performance')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'performance' ? 'bg-black text-white' : 'text-[#666] hover:bg-[#F5F5F5] hover:text-[#1A1A1A]'
            }`}
          >
            <Brain size={18} />
            ML Model Performance
          </button>
        </nav>

        {/* Mobile Tab Bar Header */}
        <div className="flex md:hidden overflow-x-auto whitespace-nowrap px-4 py-2.5 gap-2 border-b border-[#E5E5E5] bg-white">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-full text-xs font-semibold ${activeTab === 'overview' ? 'bg-black text-white' : 'bg-[#F5F5F5] text-[#666]'}`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1 ${activeTab === 'queue' ? 'bg-black text-white' : 'bg-[#F5F5F5] text-[#666]'}`}
          >
            Queue ({tickets.length})
            {stats.liveChatCount > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('detail')}
            className={`px-4 py-2 rounded-full text-xs font-semibold ${activeTab === 'detail' ? 'bg-black text-white' : 'bg-[#F5F5F5] text-[#666]'}`}
          >
            Detail
          </button>
          <button
            onClick={() => setActiveTab('simulation')}
            className={`px-4 py-2 rounded-full text-xs font-semibold ${activeTab === 'simulation' ? 'bg-black text-white' : 'bg-[#F5F5F5] text-[#666]'}`}
          >
            Simulator
          </button>
          <button
            onClick={() => setActiveTab('performance')}
            className={`px-4 py-2 rounded-full text-xs font-semibold ${activeTab === 'performance' ? 'bg-black text-white' : 'bg-[#F5F5F5] text-[#666]'}`}
          >
            ML Performance
          </button>
        </div>

        {/* Agent Info footer */}
        <div className="p-4 border-t border-[#E5E5E5] mt-auto hidden md:block">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-black text-white font-bold flex items-center justify-center text-sm">
              ST
            </div>
            <div>
              <p className="text-xs font-semibold text-[#1A1A1A]">{user.name}</p>
              <span className="inline-flex items-center text-[10px] text-emerald-600 font-medium mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" /> Support Admin
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <main className="flex-1 overflow-y-auto p-6 md:p-10 max-w-7xl mx-auto w-full">
        
        {/* Dynamic header */}
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-[#1A1A1A] tracking-tight capitalize">
              {activeTab === 'overview' && 'System Analytics'}
              {activeTab === 'queue' && 'Active Ticket Queue'}
              {activeTab === 'detail' && 'Support Ticket details'}
              {activeTab === 'simulation' && 'Live Pipeline Simulator'}
              {activeTab === 'performance' && 'ML Classifier Metrics'}
            </h1>
            <p className="text-sm text-[#666] mt-1">
              {activeTab === 'overview' && 'Real-time performance metrics and department load summaries.'}
              {activeTab === 'queue' && 'Monitor, query, and edit active support tickets.'}
              {activeTab === 'detail' && 'View raw ticket text, ML intent classifications, and agent response drafts.'}
              {activeTab === 'simulation' && 'Submit custom issues and visualize the real-time classification pipeline flow.'}
              {activeTab === 'performance' && 'Detailed confusion matrices and per-intent F1 scores from model training.'}
            </p>
          </div>
          
          <div className="flex items-center gap-2 bg-white border border-[#E5E5E5] px-4 py-2 rounded-lg text-xs font-medium text-[#666] shadow-sm shrink-0">
            <Database size={13} className="text-black" />
            <span>DB: <strong className="text-black">{tickets.length} tickets</strong></span>
            {stats.liveChatCount > 0 && (
              <>
                <span className="text-[#E5E5E5]">·</span>
                <MessageCircle size={12} className="text-blue-500" />
                <span className="text-blue-600 font-bold">{stats.liveChatCount} live</span>
              </>
            )}
          </div>
        </header>

        {/* ── Tab Views ── */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              {/* Cards Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white border border-[#E5E5E5] rounded-2xl p-6 shadow-sm">
                  <span className="text-xs font-semibold text-[#888] uppercase tracking-wider">Total Tickets</span>
                  <p className="text-3xl font-black text-black mt-2">{stats.total}</p>
                  <span className="text-xs text-[#666] mt-2 block">All sources combined</span>
                </div>
                
                <div className="bg-white border border-[#E5E5E5] rounded-2xl p-6 shadow-sm">
                  <span className="text-xs font-semibold text-[#888] uppercase tracking-wider">Tier-1 Resolved</span>
                  <p className="text-3xl font-black text-emerald-600 mt-2">
                    {stats.tier1ResolvedCount} <span className="text-sm font-medium text-[#666]">({stats.tier1Percent}%)</span>
                  </p>
                  <span className="text-xs text-[#666] mt-2 block">Auto-responded & closed</span>
                </div>
                
                <div className="bg-white border border-[#E5E5E5] rounded-2xl p-6 shadow-sm">
                  <span className="text-xs font-semibold text-[#888] uppercase tracking-wider">Tier-2 Escalated</span>
                  <p className="text-3xl font-black text-red-600 mt-2">
                    {stats.tier2Count} <span className="text-sm font-medium text-[#666]">({stats.tier2Percent}%)</span>
                  </p>
                  <span className="text-xs text-[#666] mt-2 block">Flagged for human agents</span>
                </div>
                
                <div className="bg-white border border-[#E5E5E5] rounded-2xl p-6 shadow-sm">
                  <span className="text-xs font-semibold text-[#888] uppercase tracking-wider">Avg Confidence</span>
                  <p className="text-3xl font-black text-black mt-2">{stats.avgConf}</p>
                  <span className="text-xs text-[#666] mt-2 block">Mean classifier certainty</span>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                  <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider flex items-center gap-1">
                    <MessageCircle size={11} /> Live Chat
                  </span>
                  <p className="text-3xl font-black text-blue-700 mt-2">{stats.liveChatCount}</p>
                  <span className="text-xs text-blue-500 mt-2 block">From chat widget</span>
                  {stats.liveChatCount > 0 && (
                    <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                  )}
                </div>
              </div>

              {/* Live Chat Tickets — from localStorage */}
              {stats.liveChatCount > 0 && (
                <div className="bg-white border border-blue-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-blue-100 bg-blue-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageCircle size={16} className="text-blue-600" />
                      <h3 className="text-sm font-bold text-blue-800">Live Chat Tickets</h3>
                      <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold">
                        {stats.liveChatCount} new
                      </span>
                    </div>
                    <button
                      onClick={() => setActiveTab('queue')}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
                    >
                      View all in Queue <ChevronRight size={13} />
                    </button>
                  </div>
                  <div className="divide-y divide-[#F0F0F0]">
                    {tickets
                      .filter(t => t.source === 'chat')
                      .slice(0, 5)
                      .map((ticket) => (
                        <div
                          key={ticket.id}
                          className="px-6 py-4 flex items-start justify-between gap-4 hover:bg-[#FAFAFA] cursor-pointer transition-colors"
                          onClick={() => { setSelectedTicketId(ticket.id); setActiveTab('detail'); }}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold text-black">{ticket.customerName}</span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                ticket.tier === 'Tier-1' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                              }`}>{ticket.tier}</span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                ticket.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700' :
                                ticket.status === 'Escalated' ? 'bg-red-50 text-red-700' :
                                'bg-amber-50 text-amber-700'
                              }`}>{ticket.status}</span>
                            </div>
                            <p className="text-xs text-[#666] truncate">{ticket.issueText}</p>
                            <p className="text-[10px] text-[#999] mt-0.5 capitalize">
                              {ticket.intent.replace(/_/g, ' ')} · {ticket.department} · conf: {ticket.confidence.toFixed(2)}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-[10px] text-[#999]">
                              {new Date(ticket.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                            </p>
                            <button className="text-[10px] font-semibold text-blue-600 hover:underline mt-1 flex items-center gap-0.5">
                              Inspect <ChevronRight size={10} />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Tier-1 vs Tier-2 Pie Chart */}
                <div className="bg-white border border-[#E5E5E5] rounded-2xl p-6 shadow-sm flex flex-col">
                  <h3 className="text-base font-bold text-black mb-4">Tier-1 vs Tier-2 Classification</h3>
                  <div className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-8 py-4">
                    {/* SVG Pie Chart */}
                    <div className="relative w-44 h-44">
                      <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                        {/* Donut Chart Background */}
                        <circle cx="50" cy="50" r="40" fill="transparent" stroke="#F5F5F5" strokeWidth="12" />
                        {/* Tier-1 Segment (Green) */}
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="transparent"
                          stroke="#10B981"
                          strokeWidth="12"
                          strokeDasharray={`${stats.tier1Percent * 2.51} 251.2`}
                        />
                        {/* Tier-2 Segment (Black) */}
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="transparent"
                          stroke="#1A1A1A"
                          strokeWidth="12"
                          strokeDasharray={`${stats.tier2Percent * 2.51} 251.2`}
                          strokeDashoffset={`-${stats.tier1Percent * 2.51}`}
                        />
                      </svg>
                      {/* Center label */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-black text-black">{stats.total}</span>
                        <span className="text-[10px] text-[#666] font-medium uppercase tracking-wide">Tickets</span>
                      </div>
                    </div>
                    {/* Legend */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3.5 h-3.5 rounded bg-[#10B981]" />
                        <div>
                          <span className="text-sm font-bold text-[#1A1A1A]">Tier-1 Resolved ({stats.tier1Percent}%)</span>
                          <p className="text-xs text-[#666]">{stats.tier1ResolvedCount} tickets resolved automatically</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3.5 h-3.5 rounded bg-[#1A1A1A]" />
                        <div>
                          <span className="text-sm font-bold text-[#1A1A1A]">Tier-2 Escalated ({stats.tier2Percent}%)</span>
                          <p className="text-xs text-[#666]">{stats.tier2Count} tickets flagged for review</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tickets by Department Bar Chart */}
                <div className="bg-white border border-[#E5E5E5] rounded-2xl p-6 shadow-sm flex flex-col">
                  <h3 className="text-base font-bold text-black mb-4">Tickets by Department</h3>
                  <div className="flex-1 space-y-4 py-2">
                    {[
                      { name: 'orders', count: stats.deptCounts.orders, color: 'bg-black' },
                      { name: 'billing', count: stats.deptCounts.billing, color: 'bg-black' },
                      { name: 'shipping', count: stats.deptCounts.shipping, color: 'bg-black' },
                      { name: 'accounts', count: stats.deptCounts.accounts, color: 'bg-black' },
                      { name: 'escalat / support', count: stats.deptCounts.escalat, color: 'bg-emerald-500' }
                    ].map((dept) => {
                      const percentage = stats.total > 0 ? (dept.count / stats.total) * 100 : 0;
                      return (
                        <div key={dept.name} className="space-y-1">
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span className="text-black uppercase tracking-wider">{dept.name}</span>
                            <span className="text-[#666]">{dept.count} ticket{dept.count !== 1 ? 's' : ''}</span>
                          </div>
                          <div className="w-full h-3 bg-[#F5F5F5] rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ duration: 0.8, ease: 'easeOut' }}
                              className={`h-full rounded-full ${dept.color}`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Resolution Rate Over Time */}
                <div className="bg-white border border-[#E5E5E5] rounded-2xl p-6 shadow-sm flex flex-col">
                  <h3 className="text-base font-bold text-black mb-2">Resolution Rate Over Time</h3>
                  <p className="text-xs text-[#666] mb-6">Percentage of automated tier-1 tickets resolved instantly.</p>
                  
                  <div className="flex-1 h-44 relative mt-2">
                    <svg viewBox="0 0 700 180" className="w-full h-full">
                      {/* Grid Lines */}
                      <line x1="0" y1="40" x2="700" y2="40" stroke="#F5F5F5" strokeWidth="1" />
                      <line x1="0" y1="90" x2="700" y2="90" stroke="#F5F5F5" strokeWidth="1" />
                      <line x1="0" y1="140" x2="700" y2="140" stroke="#F5F5F5" strokeWidth="1" />
                      
                      {/* Smooth line */}
                      <path
                        d="M 50 140 Q 150 110 250 85 T 450 60 T 650 30"
                        fill="none"
                        stroke="black"
                        strokeWidth="3.5"
                      />
                      
                      {/* Data nodes */}
                      {[
                        { x: 50, y: 140, rate: '85%' },
                        { x: 170, y: 115, rate: '88%' },
                        { x: 290, y: 92, rate: '91%' },
                        { x: 410, y: 72, rate: '93%' },
                        { x: 530, y: 50, rate: '95%' },
                        { x: 650, y: 30, rate: '97%' }
                      ].map((node, i) => (
                        <g key={i} className="group cursor-pointer">
                          <circle cx={node.x} cy={node.y} r="5" fill="black" stroke="white" strokeWidth="2" />
                          <circle cx={node.x} cy={node.y} r="8" fill="black" className="opacity-0 group-hover:opacity-20 transition-opacity" />
                          <text x={node.x} y={node.y - 12} textAnchor="middle" className="text-[10px] font-bold fill-black">
                            {node.rate}
                          </text>
                        </g>
                      ))}
                    </svg>
                    
                    <div className="flex items-center justify-between text-[10px] font-bold text-[#888] uppercase tracking-wider px-4 mt-2">
                      <span>Mon</span>
                      <span>Tue</span>
                      <span>Wed</span>
                      <span>Thu</span>
                      <span>Fri</span>
                      <span>Sat / Sun</span>
                    </div>
                  </div>
                </div>

                {/* Confidence Score Distribution */}
                <div className="bg-white border border-[#E5E5E5] rounded-2xl p-6 shadow-sm flex flex-col">
                  <h3 className="text-base font-bold text-black mb-2">Confidence Score Distribution</h3>
                  <p className="text-xs text-[#666] mb-6">Quantity of classifier instances by certainty percentile.</p>
                  
                  <div className="flex-grow flex items-end justify-between h-44 gap-3 py-2 border-b border-[#F0F0F0]">
                    {[
                      { range: '0.5-0.6', count: 1, height: 'h-[15%]' },
                      { range: '0.6-0.7', count: 2, height: 'h-[25%]' },
                      { range: '0.7-0.8', count: 3, height: 'h-[45%]' },
                      { range: '0.8-0.9', count: 6, height: 'h-[90%]' },
                      { range: '0.9-1.0', count: 5, height: 'h-[75%]' }
                    ].map((bin, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                        <span className="text-[10px] font-bold text-black opacity-0 group-hover:opacity-100 transition-opacity">
                          {bin.count}
                        </span>
                        <div className={`w-full ${bin.height} bg-[#F5F5F5] hover:bg-black rounded-t-lg transition-all duration-300 relative`} />
                        <span className="text-[9px] font-bold text-[#888] tracking-wider whitespace-nowrap mt-1">{bin.range}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'queue' && (
            <motion.div
              key="queue"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {/* Filter Bar */}
              <div className="bg-white border border-[#E5E5E5] rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
                {/* Search */}
                <div className="relative w-full sm:w-80">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#888]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by customer name or ticket ID..."
                    className="w-full pl-10 pr-4 py-2.5 text-xs bg-[#F5F5F5] hover:bg-[#EAEAEA] focus:bg-white focus:border-[#1A1A1A] border border-transparent rounded-full outline-none transition-all placeholder-[#888]"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#888] hover:text-black">
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Filters */}
                <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto py-1">
                  <div className="flex items-center gap-1.5 bg-[#F5F5F5] p-1 rounded-full border">
                    {['All', 'Tier-1', 'Tier-2'].map((tier) => (
                      <button
                        key={tier}
                        onClick={() => setFilterTier(tier as any)}
                        className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                          filterTier === tier ? 'bg-white text-black shadow-sm' : 'text-[#666] hover:text-black'
                        }`}
                      >
                        {tier}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5 bg-[#F5F5F5] p-1 rounded-full border">
                    {['All', 'Resolved', 'Escalated', 'Pending'].map((status) => (
                      <button
                        key={status}
                        onClick={() => setFilterStatus(status as any)}
                        className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                          filterStatus === status ? 'bg-white text-black shadow-sm' : 'text-[#666] hover:text-black'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="bg-white border border-[#E5E5E5] rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#F0F0F0] bg-[#FAFAFA]">
                        {['ID', 'Customer', 'Tier', 'Intent', 'Dept', 'Conf', 'Status', 'Action'].map((h) => (
                          <th key={h} className="text-left text-[10px] font-bold text-[#888] uppercase tracking-wider px-6 py-4">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0F0F0]">
                      <AnimatePresence>
                        {filteredTickets.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="text-center py-16 text-[#888] text-sm">
                              No tickets match your filters.
                            </td>
                          </tr>
                        ) : (
                          filteredTickets.map((ticket) => (
                            <motion.tr
                              key={ticket.id}
                              whileHover={{ backgroundColor: '#FCFCFC' }}
                              className="group transition-colors cursor-pointer"
                              onClick={() => {
                                setSelectedTicketId(ticket.id);
                                setActiveTab('detail');
                              }}
                            >
                              <td className="px-6 py-4 text-xs font-mono font-bold text-black">
                                <div className="flex items-center gap-1.5">
                                  {ticket.id}
                                  {ticket.source === 'chat' && (
                                    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                                      <MessageCircle size={8} /> LIVE
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div>
                                  <p className="text-xs font-bold text-black">{ticket.customerName}</p>
                                  <span className="text-[10px] text-[#888]">{ticket.customerEmail}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded ${
                                  ticket.tier === 'Tier-1' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                                }`}>
                                  {ticket.tier}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-xs font-medium text-[#444] capitalize">{ticket.intent.replace('_', ' ')}</td>
                              <td className="px-6 py-4 text-xs text-[#666] uppercase tracking-wide">{ticket.department}</td>
                              <td className="px-6 py-4 text-xs font-semibold text-black">{ticket.confidence.toFixed(2)}</td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                                  ticket.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                  ticket.status === 'Escalated' ? 'bg-red-50 text-red-700 border-red-200' :
                                  'bg-amber-50 text-amber-700 border-amber-200'
                                }`}>
                                  {ticket.status === 'Resolved' && '✅ RESOLVED'}
                                  {ticket.status === 'Escalated' && '🔴 ESCALATED'}
                                  {ticket.status === 'Pending' && '⏳ PENDING'}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <button className="text-xs font-semibold text-black hover:underline flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                  Inspect <ChevronRight size={13} />
                                </button>
                              </td>
                            </motion.tr>
                          ))
                        )}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
                <div className="p-4 border-t border-[#F0F0F0] bg-[#FAFAFA] flex items-center justify-between text-xs text-[#888]">
                  <span>Showing <strong>{filteredTickets.length}</strong> of <strong>{tickets.length}</strong> entries</span>
                  <span>Click any row to open full classification and briefing profiles.</span>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'detail' && (
            <motion.div
              key="detail"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {/* Ticket selector drop */}
              <div className="bg-white border border-[#E5E5E5] rounded-xl p-4 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-[#666]">Inspecting Ticket:</span>
                  <select
                    value={selectedTicketId}
                    onChange={(e) => setSelectedTicketId(e.target.value)}
                    className="bg-[#F5F5F5] border border-[#E5E5E5] rounded-lg px-3 py-1.5 text-xs font-bold text-black focus:outline-none"
                  >
                    {tickets.map(t => (
                      <option key={t.id} value={t.id}>{t.id} - {t.customerName} ({t.intent})</option>
                    ))}
                  </select>
                </div>
                
                {selectedTicket.status !== 'Resolved' && (
                  <button
                    onClick={() => handleResolveFromDetail(selectedTicket.id)}
                    className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-full transition-all"
                  >
                    <CheckCircle size={13} /> Mark as Resolved
                  </button>
                )}
              </div>

              {/* Detail Grid */}
              <div className="bg-white border border-[#E5E5E5] rounded-2xl shadow-sm overflow-hidden flex flex-col">
                {/* Header row */}
                <div className="border-b border-[#E5E5E5] bg-[#FAFAFA] px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-black text-black">Ticket #{selectedTicket.id}</span>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                      selectedTicket.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      selectedTicket.status === 'Escalated' ? 'bg-red-50 text-red-700 border-red-200' :
                      'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {selectedTicket.status.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-[#666]">{formatDateStr(selectedTicket.createdAt)}</span>
                </div>

                {/* Sub columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 border-b border-[#E5E5E5]">
                  {/* Left Column: Original Text */}
                  <div className="p-6 border-b md:border-b-0 md:border-r border-[#E5E5E5]">
                    <h4 className="text-xs font-bold text-[#888] uppercase tracking-wider mb-3">Original Ticket Text</h4>
                    <div className="bg-[#F9F9F9] border rounded-xl p-5 min-h-[160px] flex flex-col justify-between">
                      <p className="text-sm text-[#1A1A1A] italic leading-relaxed">
                        "{selectedTicket.issueText}"
                      </p>
                      <div className="mt-6 flex items-center justify-between border-t border-[#E5E5E5] pt-3 text-[11px] text-[#666]">
                        <span>Customer ID: {selectedTicket.customerEmail}</span>
                        <span>Order ID: {selectedTicket.orderId || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Classification */}
                  <div className="p-6">
                    <h4 className="text-xs font-bold text-[#888] uppercase tracking-wider mb-3">ML Classification Result</h4>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-[#FAFAFA] border rounded-lg p-3">
                          <span className="text-[10px] text-[#666] font-semibold block uppercase">Intent</span>
                          <strong className="text-sm text-black block mt-0.5 capitalize">{selectedTicket.intent.replace('_', ' ')}</strong>
                        </div>
                        <div className="bg-[#FAFAFA] border rounded-lg p-3">
                          <span className="text-[10px] text-[#666] font-semibold block uppercase">Routing Tier</span>
                          <strong className="text-sm text-black block mt-0.5">{selectedTicket.tier}</strong>
                        </div>
                        <div className="bg-[#FAFAFA] border rounded-lg p-3">
                          <span className="text-[10px] text-[#666] font-semibold block uppercase">Department</span>
                          <strong className="text-sm text-black block mt-0.5 uppercase tracking-wide">{selectedTicket.department}</strong>
                        </div>
                        <div className="bg-[#FAFAFA] border rounded-lg p-3">
                          <span className="text-[10px] text-[#666] font-semibold block uppercase">Confidence</span>
                          <strong className="text-sm text-black block mt-0.5">{(selectedTicket.confidence * 100).toFixed(1)}%</strong>
                        </div>
                      </div>
                      
                      <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-3 flex items-center justify-between">
                        <span className="text-xs text-emerald-800 font-medium">Forced Escalation Bypass</span>
                        <strong className="text-xs text-emerald-900 font-bold uppercase">No</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chat Message Thread — only for chat-sourced tickets */}
                {selectedTicket.source === 'chat' && selectedTicket.chatMessages?.length > 0 && (
                  <div className="p-6 border-b border-[#E5E5E5]">
                    <h4 className="text-xs font-bold text-[#888] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <MessageCircle size={14} className="text-black" />
                      Live Chat Transcript
                      <span className="ml-auto text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                        From Chat Widget
                      </span>
                    </h4>
                    <div className="bg-[#F9F9F9] border border-[#E5E5E5] rounded-xl p-4 max-h-64 overflow-y-auto space-y-3">
                      {selectedTicket.chatMessages.map((msg: { role: string; text: string; timestamp: string }, i: number) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          {msg.role === 'support' && (
                            <div className="w-6 h-6 rounded-full bg-black text-white text-[9px] font-bold flex items-center justify-center mr-2 mt-1 flex-shrink-0">W</div>
                          )}
                          <div className={`max-w-[75%] px-3 py-2 rounded-sm text-xs leading-relaxed ${
                            msg.role === 'user'
                              ? 'bg-black text-white'
                              : 'bg-white border border-[#E5E5E5] text-[#1A1A1A]'
                          }`}>
                            <p className="whitespace-pre-wrap">{msg.text}</p>
                            <p className={`text-[9px] mt-1 ${msg.role === 'user' ? 'text-white/50' : 'text-[#999]'}`}>
                              {new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bottom Row 1: Draft Response */}
                <div className="p-6 border-b border-[#E5E5E5]">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-[#888] uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles size={14} className="text-black" />
                      Customer Response Draft (Groq Agent)
                    </h4>
                    <button
                      onClick={() => navigator.clipboard.writeText(selectedTicket.draftResponse || '')}
                      className="text-[11px] font-semibold text-[#666] hover:text-black flex items-center gap-1 px-2.5 py-1 bg-[#F5F5F5] hover:bg-[#EAEAEA] rounded transition-all"
                    >
                      <Copy size={11} /> Copy Draft
                    </button>
                  </div>
                  <div className="bg-[#FAFAFA] border border-[#E5E5E5] rounded-xl p-4 text-sm text-[#1A1A1A] leading-relaxed font-mono">
                    {selectedTicket.draftResponse || `Dear ${selectedTicket.customerName}, we have received your request and our support teams are actively working to resolve it.`}
                  </div>
                </div>

                {/* Bottom Row 2: Escalation Brief */}
                <div className="p-6 bg-[#FAFAFA]">
                  <h4 className="text-xs font-bold text-[#888] uppercase tracking-wider mb-4">Escalation Brief (Tier-2 Agent)</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white border rounded-lg p-3.5">
                      <span className="text-[10px] text-[#888] font-semibold block uppercase">Sentiment</span>
                      <strong className={`text-xs font-bold block mt-1 ${
                        selectedTicket.brief?.sentiment === 'Frustrated' ? 'text-red-600' : 'text-slate-800'
                      }`}>{selectedTicket.brief?.sentiment || 'Neutral'}</strong>
                    </div>
                    
                    <div className="bg-white border rounded-lg p-3.5">
                      <span className="text-[10px] text-[#888] font-semibold block uppercase">Urgency</span>
                      <strong className={`text-xs font-bold block mt-1 ${
                        selectedTicket.brief?.urgency === 'High' ? 'text-red-600 animate-pulse' : 'text-slate-800'
                      }`}>{selectedTicket.brief?.urgency || 'Medium'}</strong>
                    </div>

                    <div className="bg-white border rounded-lg p-3.5">
                      <span className="text-[10px] text-[#888] font-semibold block uppercase">Department</span>
                      <strong className="text-xs font-bold text-slate-800 block mt-1 uppercase">{selectedTicket.brief?.department || selectedTicket.department}</strong>
                    </div>

                    <div className="bg-white border rounded-lg p-3.5">
                      <span className="text-[10px] text-[#888] font-semibold block uppercase">SLA Timer</span>
                      <strong className="text-xs font-bold text-slate-800 block mt-1">{selectedTicket.brief?.sla || '24 hours'}</strong>
                    </div>
                  </div>

                  <div className="mt-4 bg-white border rounded-xl p-4 space-y-2">
                    <p className="text-xs text-[#666]">
                      <strong className="text-black font-semibold uppercase">Summary: </strong>
                      {selectedTicket.brief?.summary || 'N/A'}
                    </p>
                    <p className="text-xs text-[#666] border-t border-[#F0F0F0] pt-2">
                      <strong className="text-emerald-700 font-semibold uppercase">Recommended Action: </strong>
                      {selectedTicket.brief?.recommended || 'Follow standard support protocols.'}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'simulation' && (
            <motion.div
              key="simulation"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              {/* Form Input */}
              <div className="bg-white border border-[#E5E5E5] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-black mb-4 flex items-center gap-1.5">
                    <Activity size={18} className="text-black" />
                    🎫 Submit New Support Ticket
                  </h3>
                  
                  {/* Quick-fill chips */}
                  <div className="mb-6 space-y-2">
                    <span className="text-[10px] font-bold text-[#888] uppercase tracking-wider block">Quick-fill Demo Scenarios</span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => fillSimulator("Amogh K.", "#ORD-8821", "I want to cancel my order immediately before it ships.")}
                        className="text-[10px] bg-[#F5F5F5] hover:bg-black hover:text-white px-3 py-1.5 rounded-full border transition-all text-[#666]"
                      >
                        Cancel Order (Tier 1)
                      </button>
                      <button
                        onClick={() => fillSimulator("Ananya H.", "#ORD-8823", "I was charged twice for the same order. This is completely unacceptable and I want it resolved.")}
                        className="text-[10px] bg-[#F5F5F5] hover:bg-black hover:text-white px-3 py-1.5 rounded-full border transition-all text-[#666]"
                      >
                        Double Payment (Tier 2)
                      </button>
                      <button
                        onClick={() => fillSimulator("Vachanshree", "#ORD-8825", "Where is my shipment? It is delayed and tracking is not updating.")}
                        className="text-[10px] bg-[#F5F5F5] hover:bg-black hover:text-white px-3 py-1.5 rounded-full border transition-all text-[#666]"
                      >
                        Delay Tracker (Tier 1)
                      </button>
                      <button
                        onClick={() => fillSimulator("Anusha S.", "#ORD-8827", "The package box arrived crushed and wet. The blazer inside is stained. Terrible customer service.")}
                        className="text-[10px] bg-[#F5F5F5] hover:bg-black hover:text-white px-3 py-1.5 rounded-full border transition-all text-[#666]"
                      >
                        Damaged Goods (Tier 2)
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#666] uppercase tracking-wider mb-1.5">Customer Name</label>
                      <input
                        type="text"
                        value={simName}
                        onChange={(e) => setSimName(e.target.value)}
                        placeholder="e.g. Amogh K."
                        className="w-full px-4 py-2.5 text-xs bg-[#F5F5F5] focus:bg-white border rounded-lg focus:border-black outline-none transition-all placeholder-[#999]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#666] uppercase tracking-wider mb-1.5">Order ID</label>
                      <input
                        type="text"
                        value={simOrderId}
                        onChange={(e) => setSimOrderId(e.target.value)}
                        placeholder="e.g. #ORD-8823"
                        className="w-full px-4 py-2.5 text-xs bg-[#F5F5F5] focus:bg-white border rounded-lg focus:border-black outline-none transition-all placeholder-[#999]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#666] uppercase tracking-wider mb-1.5">Issue Text</label>
                      <textarea
                        rows={4}
                        value={simIssue}
                        onChange={(e) => setSimIssue(e.target.value)}
                        placeholder="Describe the problem here..."
                        className="w-full px-4 py-2.5 text-xs bg-[#F5F5F5] focus:bg-white border rounded-lg focus:border-black outline-none transition-all placeholder-[#999]"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <button
                    disabled={!simName || !simIssue || simProgress.isRunning}
                    onClick={startSimulation}
                    className="w-full flex items-center justify-center gap-2 bg-black hover:bg-black/95 text-white disabled:opacity-50 font-bold py-3.5 rounded-full text-xs uppercase tracking-wider transition-all"
                  >
                    Process Ticket ▶
                  </button>
                </div>
              </div>

              {/* Progress Console */}
              <div className="bg-[#1A1A1A] text-white border border-[#2A2A2A] rounded-2xl p-6 shadow-xl flex flex-col">
                <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-4 mb-4">
                  <span className="text-xs font-semibold text-[#888] uppercase tracking-wider">Pipeline Progress Console</span>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-900/50 px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active Pipeline
                  </div>
                </div>

                {/* Progress Visualizer */}
                <div className="space-y-4 flex-1">
                  {[
                    { label: 'Intake Agent', desc: 'Parsed ticket text', stepNum: 0 },
                    { label: 'Classifier Agent', desc: 'Determines Intent & confidence', stepNum: 1 },
                    { label: 'Escalation Agent', desc: 'Sentiment check & draft briefs', stepNum: 2 },
                    { label: 'Status Tracker', desc: 'Saves record into local DB', stepNum: 3 }
                  ].map((step) => {
                    const isCompleted = simProgress.step > step.stepNum;
                    const isActive = simProgress.isRunning && simProgress.step === step.stepNum;

                    return (
                      <div key={step.stepNum} className="flex items-start gap-4">
                        <div className="relative mt-1">
                          {isCompleted ? (
                            <div className="w-5 h-5 rounded-full bg-emerald-500 text-black flex items-center justify-center text-[10px] font-bold">
                              ✓
                            </div>
                          ) : isActive ? (
                            <div className="w-5 h-5 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
                          ) : (
                            <div className="w-5 h-5 rounded-full border border-gray-700 bg-transparent flex items-center justify-center text-[9px] text-gray-500 font-bold">
                              {step.stepNum + 1}
                            </div>
                          )}
                          
                          {/* Dotted link line */}
                          {step.stepNum < 3 && (
                            <div className={`absolute top-5 left-2.5 w-px h-10 border-l border-dashed ${
                              isCompleted ? 'border-emerald-500' : 'border-gray-800'
                            }`} />
                          )}
                        </div>
                        <div>
                          <span className={`text-xs font-bold block ${isCompleted || isActive ? 'text-white' : 'text-gray-500'}`}>
                            {step.label}
                          </span>
                          <span className="text-[10px] text-gray-400 mt-0.5 block">{step.desc}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Simulated Logs Terminal */}
                <div className="mt-8 bg-[#0F0F0F] rounded-xl p-4 border border-[#2A2A2A] min-h-[140px] flex flex-col font-mono text-[10px] text-[#A1A1A1] justify-end">
                  {simProgress.logs.length === 0 ? (
                    <span className="text-gray-600 block text-center py-8">Console idle. Submit a ticket to initiate flow.</span>
                  ) : (
                    <div className="space-y-1.5 overflow-y-auto max-h-[120px]">
                      {simProgress.logs.map((log, i) => (
                        <p key={i} className={
                          log.startsWith('✅') ? 'text-emerald-400' :
                          log.startsWith('🎉') ? 'text-amber-400 font-bold' :
                          'text-[#AAA]'
                        }>
                          {log}
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                {lastSimulatedId && (
                  <button
                    onClick={() => {
                      setSelectedTicketId(lastSimulatedId);
                      setActiveTab('detail');
                    }}
                    className="mt-6 flex items-center justify-center gap-1.5 w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all"
                  >
                    View Ticket in Detail Tab ➔
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'performance' && (
            <motion.div
              key="performance"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              {/* Header metrics card */}
              <div className="bg-white border border-[#E5E5E5] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="text-base font-bold text-black">Classifier Specifications</h3>
                  <span className="text-xs text-[#666] mt-1 block">Trained on TF-IDF word vectors + Logistic Regression classification.</span>
                </div>
                <div className="flex flex-wrap gap-4 text-xs font-medium text-[#666]">
                  <div className="border border-[#E5E5E5] rounded-lg px-3 py-2 bg-[#FAFAFA]">
                    Training Samples: <strong className="text-black ml-1">21,497</strong>
                  </div>
                  <div className="border border-[#E5E5E5] rounded-lg px-3 py-2 bg-[#FAFAFA]">
                    Test Samples: <strong className="text-black ml-1">5,375</strong>
                  </div>
                  <div className="border border-[#E5E5E5] rounded-lg px-3 py-2 bg-[#FAFAFA]">
                    Accuracy: <strong className="text-emerald-600 ml-1">99.46%</strong>
                  </div>
                  <div className="border border-[#E5E5E5] rounded-lg px-3 py-2 bg-[#FAFAFA]">
                    F1 Score: <strong className="text-emerald-600 ml-1">0.9946</strong>
                  </div>
                </div>
              </div>

              {/* Matrix + Bar graph layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Confusion Matrix Heatmap */}
                <div className="bg-white border border-[#E5E5E5] rounded-2xl p-6 shadow-sm flex flex-col">
                  <h4 className="text-sm font-bold text-black mb-1">Confusion Matrix Heatmap</h4>
                  <p className="text-xs text-[#666] mb-6">Actual vs Predicted classification counts on test sets.</p>
                  
                  {/* Heatmap Grid */}
                  <div className="flex-1 flex flex-col items-center justify-center p-2">
                    <div className="relative flex flex-col items-end">
                      {/* Predicted label header */}
                      <span className="text-[10px] font-bold text-[#888] uppercase tracking-wider mb-2 self-center mr-[-40px]">Predicted Classes</span>
                      
                      <div className="flex">
                        {/* Actual label vertical header */}
                        <div className="flex flex-col justify-between text-right pr-3 text-[9px] font-bold text-[#888] uppercase tracking-wider py-5 h-64 select-none">
                          <span className="rotate-[-90] origin-center -translate-y-4">Actual Classes</span>
                          <span className="text-[8px] tracking-normal">Cancel</span>
                          <span className="text-[8px] tracking-normal">Pay</span>
                          <span className="text-[8px] tracking-normal">Track</span>
                          <span className="text-[8px] tracking-normal">Refund</span>
                          <span className="text-[8px] tracking-normal">Addr</span>
                          <span className="text-[8px] tracking-normal">Inqr</span>
                        </div>
                        
                        {/* Matrix Blocks */}
                        <div className="grid grid-cols-6 gap-1 w-64 h-64">
                          {/* Row 1: cancel_order */}
                          <div className="bg-emerald-950 text-emerald-200 text-[9px] font-bold flex items-center justify-center rounded cursor-pointer hover:scale-105 transition-transform" title="Actual: Cancel, Pred: Cancel. Count: 945">945</div>
                          <div className="bg-emerald-50 text-emerald-900 text-[9px] flex items-center justify-center rounded cursor-pointer" title="Count: 2">2</div>
                          <div className="bg-white border text-gray-300 text-[9px] flex items-center justify-center rounded cursor-pointer" title="Count: 0">0</div>
                          <div className="bg-white border text-gray-300 text-[9px] flex items-center justify-center rounded cursor-pointer" title="Count: 0">0</div>
                          <div className="bg-white border text-gray-300 text-[9px] flex items-center justify-center rounded cursor-pointer" title="Count: 0">0</div>
                          <div className="bg-[#FAF5F5] text-red-500 text-[9px] flex items-center justify-center rounded cursor-pointer" title="Count: 1">1</div>

                          {/* Row 2: payment_issue */}
                          <div className="bg-emerald-50 text-emerald-900 text-[9px] flex items-center justify-center rounded cursor-pointer" title="Count: 1">1</div>
                          <div className="bg-emerald-900 text-emerald-100 text-[9px] font-bold flex items-center justify-center rounded cursor-pointer hover:scale-105 transition-transform" title="Actual: Pay, Pred: Pay. Count: 878">878</div>
                          <div className="bg-white border text-gray-300 text-[9px] flex items-center justify-center rounded cursor-pointer" title="Count: 0">0</div>
                          <div className="bg-emerald-100 text-emerald-800 text-[9px] flex items-center justify-center rounded cursor-pointer" title="Count: 4">4</div>
                          <div className="bg-white border text-gray-300 text-[9px] flex items-center justify-center rounded cursor-pointer" title="Count: 0">0</div>
                          <div className="bg-white border text-gray-300 text-[9px] flex items-center justify-center rounded cursor-pointer" title="Count: 0">0</div>

                          {/* Row 3: track_order */}
                          <div className="bg-white border text-gray-300 text-[9px] flex items-center justify-center rounded cursor-pointer" title="Count: 0">0</div>
                          <div className="bg-white border text-gray-300 text-[9px] flex items-center justify-center rounded cursor-pointer" title="Count: 0">0</div>
                          <div className="bg-emerald-950 text-emerald-200 text-[9px] font-bold flex items-center justify-center rounded cursor-pointer hover:scale-105 transition-transform" title="Actual: Track, Pred: Track. Count: 1022">1022</div>
                          <div className="bg-white border text-gray-300 text-[9px] flex items-center justify-center rounded cursor-pointer" title="Count: 0">0</div>
                          <div className="bg-emerald-100 text-emerald-800 text-[9px] flex items-center justify-center rounded cursor-pointer" title="Count: 3">3</div>
                          <div className="bg-white border text-gray-300 text-[9px] flex items-center justify-center rounded cursor-pointer" title="Count: 0">0</div>

                          {/* Row 4: refund_request */}
                          <div className="bg-white border text-gray-300 text-[9px] flex items-center justify-center rounded cursor-pointer" title="Count: 0">0</div>
                          <div className="bg-emerald-50 text-emerald-900 text-[9px] flex items-center justify-center rounded cursor-pointer" title="Count: 2">2</div>
                          <div className="bg-white border text-gray-300 text-[9px] flex items-center justify-center rounded cursor-pointer" title="Count: 0">0</div>
                          <div className="bg-emerald-900 text-emerald-100 text-[9px] font-bold flex items-center justify-center rounded cursor-pointer hover:scale-105 transition-transform" title="Actual: Refund, Pred: Refund. Count: 915">915</div>
                          <div className="bg-white border text-gray-300 text-[9px] flex items-center justify-center rounded cursor-pointer" title="Count: 0">0</div>
                          <div className="bg-white border text-gray-300 text-[9px] flex items-center justify-center rounded cursor-pointer" title="Count: 0">0</div>

                          {/* Row 5: change_shipping */}
                          <div className="bg-white border text-gray-300 text-[9px] flex items-center justify-center rounded cursor-pointer" title="Count: 0">0</div>
                          <div className="bg-white border text-gray-300 text-[9px] flex items-center justify-center rounded cursor-pointer" title="Count: 0">0</div>
                          <div className="bg-emerald-50 text-emerald-900 text-[9px] flex items-center justify-center rounded cursor-pointer" title="Count: 1">1</div>
                          <div className="bg-white border text-gray-300 text-[9px] flex items-center justify-center rounded cursor-pointer" title="Count: 0">0</div>
                          <div className="bg-emerald-900 text-emerald-100 text-[9px] font-bold flex items-center justify-center rounded cursor-pointer hover:scale-105 transition-transform" title="Actual: Addr, Pred: Addr. Count: 856">856</div>
                          <div className="bg-white border text-gray-300 text-[9px] flex items-center justify-center rounded cursor-pointer" title="Count: 0">0</div>

                          {/* Row 6: product_inquiry */}
                          <div className="bg-[#FAF5F5] text-red-500 text-[9px] flex items-center justify-center rounded cursor-pointer" title="Count: 1">1</div>
                          <div className="bg-white border text-gray-300 text-[9px] flex items-center justify-center rounded cursor-pointer" title="Count: 0">0</div>
                          <div className="bg-[#FAF5F5] text-red-500 text-[9px] flex items-center justify-center rounded cursor-pointer" title="Count: 2">2</div>
                          <div className="bg-white border text-gray-300 text-[9px] flex items-center justify-center rounded cursor-pointer" title="Count: 0">0</div>
                          <div className="bg-white border text-gray-300 text-[9px] flex items-center justify-center rounded cursor-pointer" title="Count: 0">0</div>
                          <div className="bg-emerald-900 text-emerald-100 text-[9px] font-bold flex items-center justify-center rounded cursor-pointer hover:scale-105 transition-transform" title="Actual: Inqr, Pred: Inqr. Count: 759">759</div>
                        </div>
                      </div>
                      
                      {/* Predicted bottom label tags */}
                      <div className="flex justify-between w-64 text-[8px] font-bold text-[#888] uppercase tracking-wider mt-2 pl-[1px]">
                        <span>Cancel</span>
                        <span>Pay</span>
                        <span>Track</span>
                        <span>Refund</span>
                        <span>Addr</span>
                        <span>Inqr</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Per-Intent F1 Scores */}
                <div className="bg-white border border-[#E5E5E5] rounded-2xl p-6 shadow-sm flex flex-col">
                  <h4 className="text-sm font-bold text-black mb-1">Per-Intent F1 Scores</h4>
                  <p className="text-xs text-[#666] mb-6">Harmonic mean of precision and recall for individual categories.</p>
                  
                  <div className="flex-grow space-y-4 py-2">
                    {[
                      { name: 'cancel_order', score: 0.99 },
                      { name: 'payment_issue', score: 0.99 },
                      { name: 'track_order', score: 0.99 },
                      { name: 'refund_request', score: 0.98 },
                      { name: 'change_shipping', score: 0.97 },
                      { name: 'product_inquiry', score: 0.99 }
                    ].map((intent) => {
                      const pct = intent.score * 100;
                      return (
                        <div key={intent.name} className="space-y-1">
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span className="text-[#1A1A1A] capitalize">{intent.name.replace('_', ' ')}</span>
                            <span className="text-emerald-600 font-bold">{intent.score.toFixed(2)}</span>
                          </div>
                          <div className="w-full h-2.5 bg-[#F5F5F5] rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.8, ease: 'easeOut' }}
                              className="h-full bg-black rounded-full"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
