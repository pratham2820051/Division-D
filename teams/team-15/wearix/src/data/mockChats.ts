export interface ChatMessage {
  id: string;
  chatId: string;
  sender: 'user' | 'agent' | 'bot';
  message: string;
  timestamp: string;
}

export interface SupportTicket {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  subject: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  tier: 'Tier-1' | 'Tier-2';
  department?: string;
  createdAt: string;
  resolvedAt?: string;
  agentId?: string;
  agentName?: string;
  messages: ChatMessage[];
  resolution?: string;
  rating?: number;
  tags: string[];
}

export interface ActiveChat {
  id: string;
  customerId: string;
  customerName: string;
  customerAvatar: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  status: 'active' | 'waiting' | 'resolved';
  messages: ChatMessage[];
}

export const mockTickets: SupportTicket[] = [
  {
    id: "TKT-001",
    customerId: "buyer1",
    customerName: "John Doe",
    customerEmail: "john.doe@email.com",
    subject: "Order not delivered after 2 weeks",
    priority: "High",
    status: "In Progress",
    tier: "Tier-2",
    department: "Logistics",
    createdAt: "2026-05-28T09:00:00Z",
    agentId: "agent1",
    agentName: "Sarah Thompson",
    messages: [
      { id: "m1", chatId: "TKT-001", sender: "user", message: "My order ORD-12346 was supposed to arrive 10 days ago but I still haven't received it.", timestamp: "2026-05-28T09:00:00Z" },
      { id: "m2", chatId: "TKT-001", sender: "bot", message: "I understand your frustration. Let me check on your order status right away.", timestamp: "2026-05-28T09:00:10Z" },
      { id: "m3", chatId: "TKT-001", sender: "agent", message: "Hi John, I'm Sarah from the support team. I've escalated this to our logistics department. We'll investigate and get back to you within 24 hours.", timestamp: "2026-05-28T09:15:00Z" }
    ],
    tags: ["shipping", "delayed", "escalated"]
  },
  {
    id: "TKT-002",
    customerId: "buyer2",
    customerName: "Sarah Smith",
    customerEmail: "sarah.smith@email.com",
    subject: "Wrong size received",
    priority: "Medium",
    status: "Resolved",
    tier: "Tier-1",
    createdAt: "2026-05-26T14:00:00Z",
    resolvedAt: "2026-05-26T14:30:00Z",
    agentId: "agent2",
    agentName: "Mike Chen",
    messages: [
      { id: "m4", chatId: "TKT-002", sender: "user", message: "I ordered a Medium but received a Small. This is not what I ordered.", timestamp: "2026-05-26T14:00:00Z" },
      { id: "m5", chatId: "TKT-002", sender: "bot", message: "I'm sorry to hear that! I can process an exchange for the correct size. Would you like a Medium in the same style?", timestamp: "2026-05-26T14:00:15Z" },
      { id: "m6", chatId: "TKT-002", sender: "user", message: "Yes please!", timestamp: "2026-05-26T14:01:00Z" },
      { id: "m7", chatId: "TKT-002", sender: "bot", message: "Exchange processed! You'll receive a prepaid return label via email. Your replacement will ship within 2 business days.", timestamp: "2026-05-26T14:30:00Z" }
    ],
    resolution: "Processed size exchange. Replacement shipped.",
    rating: 5,
    tags: ["sizing", "exchange", "resolved-quickly"]
  },
  {
    id: "TKT-003",
    customerId: "buyer3",
    customerName: "Emily Chen",
    customerEmail: "emily.chen@email.com",
    subject: "Refund request - quality issue",
    priority: "High",
    status: "Open",
    tier: "Tier-2",
    department: "Quality Assurance",
    createdAt: "2026-05-29T11:00:00Z",
    messages: [
      { id: "m8", chatId: "TKT-003", sender: "user", message: "The stitching on my blazer came apart after just one wear. I want a full refund.", timestamp: "2026-05-29T11:00:00Z" },
      { id: "m9", chatId: "TKT-003", sender: "bot", message: "We sincerely apologize for the quality issue. Could you please share photos of the defect? This will help us process your refund faster.", timestamp: "2026-05-29T11:00:20Z" }
    ],
    tags: ["quality", "defect", "refund", "priority"]
  },
  {
    id: "TKT-004",
    customerId: "buyer4",
    customerName: "Michael Johnson",
    customerEmail: "michael.j@email.com",
    subject: "Track my order",
    priority: "Low",
    status: "Resolved",
    tier: "Tier-1",
    createdAt: "2026-05-27T16:00:00Z",
    resolvedAt: "2026-05-27T16:05:00Z",
    messages: [
      { id: "m10", chatId: "TKT-004", sender: "user", message: "Where is my order ORD-22003?", timestamp: "2026-05-27T16:00:00Z" },
      { id: "m11", chatId: "TKT-004", sender: "bot", message: "Your order ORD-22003 has been delivered on May 26th. Tracking number: TRK777888999. Was your order received?", timestamp: "2026-05-27T16:00:05Z" },
      { id: "m12", chatId: "TKT-004", sender: "user", message: "Oh yes, I found it! Thanks.", timestamp: "2026-05-27T16:05:00Z" }
    ],
    resolution: "Order located and confirmed delivered.",
    rating: 5,
    tags: ["tracking", "auto-resolved"]
  },
  {
    id: "TKT-005",
    customerId: "buyer5",
    customerName: "David Williams",
    customerEmail: "david.w@email.com",
    subject: "Payment charged twice",
    priority: "High",
    status: "In Progress",
    tier: "Tier-2",
    department: "Finance",
    createdAt: "2026-05-29T09:30:00Z",
    agentId: "agent1",
    agentName: "Sarah Thompson",
    messages: [
      { id: "m13", chatId: "TKT-005", sender: "user", message: "I was charged twice for my order. Please fix this immediately!", timestamp: "2026-05-29T09:30:00Z" },
      { id: "m14", chatId: "TKT-005", sender: "agent", message: "Hi David, I can see this is urgent. I've flagged this to our finance team and they'll investigate the duplicate charge. Expect resolution within 2-3 business days.", timestamp: "2026-05-29T09:45:00Z" }
    ],
    tags: ["payment", "duplicate-charge", "urgent", "finance"]
  }
];

export const mockActiveChats: ActiveChat[] = [
  {
    id: "chat_001",
    customerId: "buyer6",
    customerName: "Jennifer Davis",
    customerAvatar: "JD",
    lastMessage: "I need help with my return",
    lastMessageTime: "2 min ago",
    unreadCount: 2,
    status: "active",
    messages: [
      { id: "cm1", chatId: "chat_001", sender: "user", message: "Hi, I need help with returning an item", timestamp: "2026-05-30T20:50:00Z" },
      { id: "cm2", chatId: "chat_001", sender: "bot", message: "Of course! We offer 30-day returns for unworn items. Would you like me to start the return process?", timestamp: "2026-05-30T20:50:15Z" },
      { id: "cm3", chatId: "chat_001", sender: "user", message: "Yes please, order ORD-22005", timestamp: "2026-05-30T20:52:00Z" }
    ]
  },
  {
    id: "chat_002",
    customerId: "buyer7",
    customerName: "Robert Martinez",
    customerAvatar: "RM",
    lastMessage: "What sizes do you have in the cashmere sweater?",
    lastMessageTime: "5 min ago",
    unreadCount: 0,
    status: "waiting",
    messages: [
      { id: "cm4", chatId: "chat_002", sender: "user", message: "What sizes do you have in the cashmere sweater?", timestamp: "2026-05-30T20:45:00Z" },
      { id: "cm5", chatId: "chat_002", sender: "bot", message: "The Cashmere Blend Sweater is available in XS, S, M, and L. All sizes are currently in stock!", timestamp: "2026-05-30T20:45:10Z" }
    ]
  },
  {
    id: "chat_003",
    customerId: "buyer8",
    customerName: "Lisa Thompson",
    customerAvatar: "LT",
    lastMessage: "The discount code isn't working",
    lastMessageTime: "12 min ago",
    unreadCount: 1,
    status: "active",
    messages: [
      { id: "cm6", chatId: "chat_003", sender: "user", message: "I'm trying to use the code SUMMER20 but it's saying invalid", timestamp: "2026-05-30T20:38:00Z" },
      { id: "cm7", chatId: "chat_003", sender: "bot", message: "I'm sorry about that! Let me check the code status for you.", timestamp: "2026-05-30T20:38:15Z" }
    ]
  }
];

export const botResponses: Record<string, string> = {
  "track order": "Please provide your order ID (e.g., ORD-12345) and I'll check the status for you right away!",
  "return policy": "We offer hassle-free 30-day returns for all unworn items with original tags attached. Return shipping is free! Would you like me to start a return for you?",
  "product info": "I'd be happy to help with product information! Which item are you interested in? You can share the product name or ID.",
  "contact human": "Connecting you with a live agent now. Typical wait time is 2-5 minutes. 🟢 Agent is typing...",
  "shipping": "Standard shipping takes 5-7 business days. Express shipping (2-3 days) is available for ₹199. Free shipping on orders over ₹5,000!",
  "payment": "We accept all major credit cards, PayPal, and Apple Pay. All transactions are secured with 256-bit SSL encryption.",
  "size guide": "Our size guide is available on each product page. For general guidance: S=36\", M=38\", L=40\", XL=42\" chest measurement.",
  "default": "Thank you for reaching out to Wearix Support! How can I help you today? You can ask about orders, returns, shipping, or product information."
};

export const quickReplies = [
  "Track Order",
  "Return Policy",
  "Product Info",
  "Contact Human"
];
