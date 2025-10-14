import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

// Verificar se as variáveis de ambiente estão configuradas (sem defaults enganosos)
const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
let supabaseUrl = ''
try {
  supabaseUrl = rawSupabaseUrl ? new URL(rawSupabaseUrl).toString() : ''
} catch {
  supabaseUrl = ''
}

const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

console.log('🔍 Verificando configuração do Supabase:', {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey,
  urlValue: supabaseUrl || '(vazio)',
  keyLength: supabaseAnonKey ? String(supabaseAnonKey.length) : '0'
})

// Criar cliente Supabase
export const supabase = createClient<Database>(
  supabaseUrl || 'http://localhost', 
  supabaseAnonKey || 'invalid', 
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
)

// Cliente para operações server-side
export const createServerClient = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase não configurado. Configure as variáveis de ambiente.')
  }
  
  return createClient<Database>(supabaseUrl, serviceRoleKey)
}

// Função para verificar se o Supabase está configurado e funcionando
export const isSupabaseConfigured = () => {
  // Verificar se as variáveis estão definidas
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('❌ Supabase não configurado:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
      urlValue: supabaseUrl
    })
    return false
  }
  
  // Verificar se a URL é válida
  try {
    const url = new URL(supabaseUrl)
    if (!url.hostname.endsWith('.supabase.co')) {
      console.log('❌ URL do Supabase inválida:', supabaseUrl)
      return false
    }
    // Verificar se a anon key tem formato JWT (3 partes)
    const parts = supabaseAnonKey.split('.')
    if (parts.length !== 3) {
      console.log('❌ Anon Key inválida (formato não JWT)')
      return false
    }
    console.log('✅ Supabase configurado corretamente:', supabaseUrl)
    return true
  } catch (error) {
    console.log('❌ Erro ao validar URL do Supabase:', error)
    return false
  }
}

// Função para testar conectividade com Supabase
export const testSupabaseConnection = async () => {
  if (!isSupabaseConfigured()) {
    console.log('❌ Supabase não configurado para teste de conexão')
    return false
  }
  
  try {
    console.log('🔄 Testando conexão com Supabase...')
    // Tentar uma operação simples para testar conectividade
    const { data, error } = await supabase.auth.getSession()
    
    if (error) {
      console.log('❌ Erro na conexão:', error.message)
      return false
    }
    
    console.log('✅ Conexão com Supabase funcionando')
    return true
  } catch (error) {
    console.log('❌ Erro inesperado na conexão:', error)
    return false
  }
}