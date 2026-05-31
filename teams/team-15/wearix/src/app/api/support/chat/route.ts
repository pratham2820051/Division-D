/**
 * POST /api/support/chat
 *
 * Proxies a customer message to the FastAPI agent pipeline.
 * Falls back to a smart keyword-based response if the Python
 * server is not running (so the frontend always works).
 */

import { NextRequest, NextResponse } from 'next/server';

const AGENT_API = process.env.AGENT_API_URL ?? 'http://localhost:8000';

// ── Fallback responses when FastAPI is offline ────────────────────────────────
const FALLBACK_RULES: Array<{ keywords: string[]; response: string; tier: string; intent: string }> = [
  {
    keywords: ['cancel', 'cancellation'],
    tier: 'Tier-1', intent: 'cancel_order',
    response: "I can help you cancel your order. If it hasn't shipped yet, cancellations are processed immediately and a full refund will be issued within 5–7 business days. Please share your order ID and I'll get that started for you.",
  },
  {
    keywords: ['track', 'where is', 'status', 'shipped', 'delivery'],
    tier: 'Tier-1', intent: 'track_order',
    response: "I can check your order status right away! Please share your order ID (e.g. ORD-12345) and I'll pull up the latest tracking information for you.",
  },
  {
    keywords: ['refund', 'return', 'money back'],
    tier: 'Tier-1', intent: 'track_refund',
    response: "Refunds are typically processed within 5–10 business days after we receive your return. You'll get an email confirmation once it's issued. Would you like me to check the status of a specific return?",
  },
  {
    keywords: ['charged twice', 'double charge', 'duplicate', 'overcharged'],
    tier: 'Tier-2', intent: 'payment_issue',
    response: "I'm escalating this to our Finance & Billing team right away — duplicate charges are treated as high priority. Please expect a resolution within 8 business hours. I'm sorry for the inconvenience.",
  },
  {
    keywords: ['damaged', 'broken', 'wrong item', 'missing'],
    tier: 'Tier-2', intent: 'complaint',
    response: "I'm so sorry to hear that! This has been escalated to our Customer Relations team as high priority. They'll reach out within 8 business hours to arrange a replacement or compensation.",
  },
  {
    keywords: ['invoice', 'receipt', 'bill'],
    tier: 'Tier-1', intent: 'get_invoice',
    response: "You can download your invoice from your account under Order History → select the order → Download Invoice. If you need it emailed, just let me know the order ID.",
  },
  {
    keywords: ['password', 'login', 'sign in', 'account', 'crash'],
    tier: 'Tier-1', intent: 'registration_problems',
    response: "For login issues, try resetting your password via the 'Forgot Password' link. If the app is crashing, please try clearing the cache or reinstalling. Still having trouble? I can escalate to our Engineering team.",
  },
  {
    keywords: ['supervisor', 'manager', 'human', 'agent', 'person'],
    tier: 'Tier-2', intent: 'contact_human_agent',
    response: "Connecting you with a live support agent now. Typical wait time is 2–5 minutes. A member of our team will be with you shortly.",
  },
  {
    keywords: ['size', 'sizing', 'fit', 'measurement'],
    tier: 'Tier-1', intent: 'product_inquiry',
    response: "Our size guide is available on every product page. Generally: XS=32\", S=34\", M=36\", L=38\", XL=40\", XXL=42\" chest. Need help with a specific item?",
  },
  {
    keywords: ['unsubscribe', 'newsletter', 'email', 'marketing'],
    tier: 'Tier-1', intent: 'newsletter_subscription',
    response: "You can unsubscribe from marketing emails by clicking 'Unsubscribe' at the bottom of any email, or I can do it for you right now. Just confirm and you'll be removed within 24 hours.",
  },
];

function getFallbackResponse(message: string): {
  response: string; tier: string; intent: string; confidence: number; fallback: true;
} {
  const lower = message.toLowerCase();
  for (const rule of FALLBACK_RULES) {
    if (rule.keywords.some((kw) => lower.includes(kw))) {
      return { response: rule.response, tier: rule.tier, intent: rule.intent, confidence: 0.75, fallback: true };
    }
  }
  return {
    response: "Thanks for reaching out to Wearix Support! I'm here to help with orders, returns, shipping, payments, and more. Could you tell me a bit more about your issue?",
    tier: 'Tier-1',
    intent: 'contact_customer_service',
    confidence: 0.5,
    fallback: true,
  };
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  let body: { message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const message = (body.message ?? '').trim();
  if (!message) {
    return NextResponse.json({ error: 'message is required' }, { status: 400 });
  }

  // Try FastAPI first
  try {
    const upstream = await fetch(`${AGENT_API}/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message }),
      signal: AbortSignal.timeout(8000), // 8s timeout
    });

    if (upstream.ok) {
      const data = await upstream.json();
      const agent = data.agent ?? {};
      const classification = data.classification ?? {};
      const intake = data.intake ?? {};

      const isResolved = agent.status === 'RESOLVED';
      const brief = agent.brief ?? {};

      return NextResponse.json({
        response: isResolved
          ? agent.response
          : `Your request has been escalated to our ${brief.department ?? 'support'} team. Priority: ${brief.priority ?? 'high'}. Expected response within ${brief.sla ?? '8 business hours'}.`,
        tier: classification.tier ?? 'Tier-1',
        intent: classification.intent ?? 'unknown',
        confidence: classification.confidence ?? 0,
        status: agent.status ?? 'PENDING',
        brief: isResolved ? null : brief,
        customerName: intake.customer_name,
        orderId: intake.order_id,
        fallback: false,
      });
    }
  } catch {
    // FastAPI offline — use fallback
  }

  // Fallback
  const fallback = getFallbackResponse(message);
  return NextResponse.json(fallback);
}
