/**
 * GET  /api/support/tickets   — fetch all tickets
 * POST /api/support/tickets   — create + process a new ticket
 *
 * Proxies to FastAPI. Falls back to sample_outputs.json if offline.
 */

import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

const AGENT_API = process.env.AGENT_API_URL ?? 'http://localhost:8000';

// ── Sample data fallback ──────────────────────────────────────────────────────
function loadSampleTickets() {
  try {
    const filePath = path.join(process.cwd(), 'agents', 'agents', 'sample_outputs.json');
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw);
    return (data.records ?? []).map((r: Record<string, unknown>, i: number) => {
      const out = (r.output ?? {}) as Record<string, unknown>;
      const brief = (out.brief ?? {}) as Record<string, unknown>;
      const input = (r.input ?? {}) as Record<string, unknown>;
      return {
        id: i + 1,
        text: input.text ?? '',
        intent: out.intent ?? input.intent ?? 'unknown',
        tier: out.tier ?? r.tier ?? 'Tier-1',
        department: brief.department ?? '—',
        confidence: 0.87,
        status: out.status ?? 'PENDING',
        response: out.response ?? null,
        sentiment: brief.sentiment ?? null,
        priority: brief.priority ?? null,
        sla: brief.sla ?? null,
        issue_summary: brief.issue_summary ?? null,
        recommended_actions: brief.recommended_actions ?? null,
        created_at: new Date().toISOString(),
      };
    });
  } catch {
    return [];
  }
}

// ── GET ───────────────────────────────────────────────────────────────────────
export async function GET() {
  try {
    const res = await fetch(`${AGENT_API}/tickets`, {
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch {
    // FastAPI offline
  }

  // Fallback to sample outputs
  return NextResponse.json(loadSampleTickets());
}

// ── POST ──────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  let body: { text?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const text = (body.text ?? '').trim();
  if (!text) {
    return NextResponse.json({ error: 'text is required' }, { status: 400 });
  }

  try {
    const res = await fetch(`${AGENT_API}/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(15000), // pipeline can take a few seconds
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data, { status: 201 });
    }

    const err = await res.text();
    return NextResponse.json({ error: err }, { status: res.status });
  } catch (e) {
    return NextResponse.json(
      { error: 'Agent API unavailable. Start the FastAPI server with: uvicorn api:app --reload --port 8000' },
      { status: 503 }
    );
  }
}
