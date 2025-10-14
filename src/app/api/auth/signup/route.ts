import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    const { email, password, name } = body || {}

    if (!email || !password) {
      return NextResponse.json({ error: 'Email e senha são obrigatórios' }, { status: 400 })
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    if (!url || !serviceKey) {
      return NextResponse.json({ error: 'Supabase não configurado' }, { status: 500 })
    }

    const admin = createClient(url, serviceKey)

    // Criar usuário com email_confirm true para dispensar verificação de email
    const { data: userData, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name || (email as string).split('@')[0] }
    })

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 })
    }

    // Por razões de segurança e compatibilidade com o fluxo client-side do SDK,
    // não tentamos criar uma sessão server-side com a service role key.
    // Em vez disso, informamos ao cliente que precisa realizar o login imediatamente
    // usando o método padrão `signInWithPassword`, garantindo que a sessão seja
    // criada e persistida no cliente.
    return NextResponse.json({ user: userData.user, requiresClientLogin: true })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

