import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function handleProxy(req: NextRequest) {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';
  const targetUrl = `${backendUrl}${req.nextUrl.pathname}${req.nextUrl.search}`;

  // Extract client headers
  const headers = new Headers();
  req.headers.forEach((value, key) => {
    // Avoid setting host/connection headers to prevent upstream proxy issues
    if (!['host', 'connection', 'content-length'].includes(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  try {
    const body = req.method !== 'GET' && req.method !== 'HEAD'
      ? await req.arrayBuffer()
      : undefined;

    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
      // Do not follow redirects automatically, let the browser handle them
      redirect: 'manual',
    });

    // Create the response object
    const resBody = await response.arrayBuffer();
    const resHeaders = new Headers();

    // Copy all response headers from backend
    response.headers.forEach((value, key) => {
      resHeaders.set(key, value);
    });

    // In Next.js/Vercel edge, fetch might merge multiple Set-Cookie headers.
    // Use getSetCookie() if available to split and preserve them properly.
    if (typeof response.headers.getSetCookie === 'function') {
      const setCookies = response.headers.getSetCookie();
      resHeaders.delete('set-cookie');
      setCookies.forEach((cookieStr) => {
        resHeaders.append('set-cookie', cookieStr);
      });
    }

    return new NextResponse(resBody, {
      status: response.status,
      statusText: response.statusText,
      headers: resHeaders,
    });
  } catch (error: any) {
    console.error('API Proxy Error:', error);
    return NextResponse.json(
      { success: false, message: 'API Proxy Gateway Error', error: error.message },
      { status: 502 }
    );
  }
}

export async function GET(req: NextRequest) { return handleProxy(req); }
export async function POST(req: NextRequest) { return handleProxy(req); }
export async function PUT(req: NextRequest) { return handleProxy(req); }
export async function PATCH(req: NextRequest) { return handleProxy(req); }
export async function DELETE(req: NextRequest) { return handleProxy(req); }
export async function OPTIONS(req: NextRequest) { return handleProxy(req); }
