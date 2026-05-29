import type { NextRequest } from 'next/server';

const BACKEND = 'http://localhost:3000';

async function proxy(request: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const path = slug.join('/');
  const search = request.nextUrl.search;
  const url = `${BACKEND}/api/admin/${path}${search}`;

  const headers = new Headers(request.headers);
  headers.delete('host');

  const init: RequestInit = { method: request.method, headers };
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = request.body;
    (init as RequestInit & { duplex: string }).duplex = 'half';
  }

  const res = await fetch(url, init);
  return new Response(res.body, {
    status: res.status,
    headers: res.headers,
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
