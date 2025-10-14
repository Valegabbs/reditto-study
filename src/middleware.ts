import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Rate limiting simple (em produção, use Redis)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

function cleanupOldEntries() {
  const now = Date.now();
  for (const [key, value] of requestCounts.entries()) {
    if (now > value.resetTime) {
      requestCounts.delete(key);
    }
  }
}

function isRateLimited(ip: string, limit: number = 20, windowMs: number = 60000): boolean {
  cleanupOldEntries();
  
  const now = Date.now();
  const record = requestCounts.get(ip);
  
  if (!record) {
    requestCounts.set(ip, { count: 1, resetTime: now + windowMs });
    return false;
  }
  
  if (now > record.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + windowMs });
    return false;
  }
  
  if (record.count >= limit) {
    return true;
  }
  
  record.count++;
  return false;
}

// Função para verificar autenticação
async function checkAuth(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  } catch (error) {
    console.error('Erro ao verificar sessão:', error);
    return null;
  }
}

export function middleware(request: NextRequest) {
  // Aplicar rate limiting nas APIs
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    
    // Rate limit padrão para todas as APIs
    const limit = 20;
    
    if (isRateLimited(ip, limit)) {
      return NextResponse.json(
        { error: 'Muitas requisições. Tente novamente em alguns minutos.' },
        { status: 429 }
      );
    }
  }
  
  // Headers de segurança para todas as rotas
  const response = NextResponse.next();
  
  // Headers de segurança adicionais
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // CSP (Content Security Policy) básico
  let resolvedSupabaseUrl: URL
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl) {
      console.warn('⚠️ NEXT_PUBLIC_SUPABASE_URL não configurada')
      return NextResponse.next()
    }
    resolvedSupabaseUrl = new URL(supabaseUrl)
  } catch {
    console.warn('⚠️ URL do Supabase inválida')
    return NextResponse.next()
  }
  const supabaseDomain = resolvedSupabaseUrl.origin
  const supabaseHost = resolvedSupabaseUrl.host

  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self'",
      `connect-src 'self' ${supabaseDomain} ${supabaseDomain.replace('.supabase.co','.supabase.in')} wss://${supabaseHost} https://${supabaseHost}`,
      "media-src 'none'",
      "object-src 'none'",
      "base-uri 'self'"
    ].join('; ')
  );
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};