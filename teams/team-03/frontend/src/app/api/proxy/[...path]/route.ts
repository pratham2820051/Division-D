import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const url = `${API_URL}/${path.join("/")}${request.nextUrl.search}`;

  const response = await fetch(url, {
    headers: request.headers,
  });

  return new NextResponse(response.body, {
    status: response.status,
    headers: response.headers,
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const url = `${API_URL}/${path.join("/")}${request.nextUrl.search}`;

  const response = await fetch(url, {
    method: "POST",
    headers: request.headers,
    body: request.body,
    duplex: "half",
  } as RequestInit);

  return new NextResponse(response.body, {
    status: response.status,
    headers: response.headers,
  });
}
