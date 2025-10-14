#!/usr/bin/env node

/**
 * Script de Verificação de Segurança - Reditto MVP
 * 
 * Este script verifica se todas as configurações de segurança estão corretas
 * antes de iniciar o servidor em produção.
 */

const fs = require('fs');
const path = require('path');

console.log('🔒 === VERIFICAÇÃO DE SEGURANÇA - REDITTO MVP ===\n');

// Verificar se arquivo .env.local existe
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('❌ Arquivo .env.local não encontrado!');
  console.error('   Crie o arquivo .env.local na raiz do projeto.');
  process.exit(1);
}

// Ler arquivo .env.local
const envContent = fs.readFileSync(envPath, 'utf8');
const envLines = envContent.split('\n');

let hasOpenRouterKey = false;
let hasValidOpenRouterKey = false;
let hasSupabaseConfig = false;

envLines.forEach(line => {
  const trimmedLine = line.trim();
  
  if (trimmedLine.startsWith('OPENROUTER_API_KEY=')) {
    hasOpenRouterKey = true;
    const key = trimmedLine.split('=')[1];
    
    if (key && key !== 'your_openrouter_api_key_here') {
      if (key.length >= 20 && key.startsWith('sk-or-')) {
        hasValidOpenRouterKey = true;
        console.log('✅ API Key do OpenRouter configurada e válida');
      } else {
        console.error('❌ API Key do OpenRouter inválida');
        console.error('   Formato esperado: sk-or-v1-...');
      }
    } else {
      console.error('❌ API Key do OpenRouter não configurada');
      console.error('   Substitua "your_openrouter_api_key_here" pela sua chave real');
    }
  }
  
  if (trimmedLine.startsWith('NEXT_PUBLIC_SUPABASE_URL=') && !trimmedLine.includes('your_supabase')) {
    hasSupabaseConfig = true;
    console.log('✅ Configuração do Supabase encontrada');
  }
});

// Verificações de segurança
console.log('\n🛡️ VERIFICAÇÕES DE SEGURANÇA:');

// Verificar se .env.local está no .gitignore
const gitignorePath = path.join(process.cwd(), '.gitignore');
if (fs.existsSync(gitignorePath)) {
  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  if (gitignoreContent.includes('.env') || gitignoreContent.includes('.env*')) {
    console.log('✅ Arquivos .env estão no .gitignore');
  } else {
    console.error('❌ Arquivos .env NÃO estão no .gitignore!');
    console.error('   Adicione ".env*" ao arquivo .gitignore');
  }
} else {
  console.error('❌ Arquivo .gitignore não encontrado!');
}

// Verificar se middleware de segurança existe
const middlewarePath = path.join(process.cwd(), 'src', 'middleware.ts');
if (fs.existsSync(middlewarePath)) {
  console.log('✅ Middleware de segurança encontrado');
} else {
  console.error('❌ Middleware de segurança não encontrado!');
}

// Verificar APIs de segurança
const correctEssayPath = path.join(process.cwd(), 'src', 'app', 'api', 'correct-essay', 'route.ts');
const extractTextPath = path.join(process.cwd(), 'src', 'app', 'api', 'extract-text', 'route.ts');

if (fs.existsSync(correctEssayPath)) {
  console.log('✅ API de correção encontrada');
} else {
  console.error('❌ API de correção não encontrada!');
}

if (fs.existsSync(extractTextPath)) {
  console.log('✅ API de OCR encontrada');
} else {
  console.error('❌ API de OCR não encontrada!');
}

// Resultado final
console.log('\n📊 RESULTADO FINAL:');

if (hasValidOpenRouterKey && hasSupabaseConfig) {
  console.log('🎉 TODAS AS CONFIGURAÇÕES ESTÃO CORRETAS!');
  console.log('   Seu Reditto MVP está pronto para uso.');
  console.log('\n🚀 Para iniciar o servidor:');
  console.log('   npm run dev');
} else {
  console.log('⚠️  CONFIGURAÇÕES INCOMPLETAS:');
  
  if (!hasValidOpenRouterKey) {
    console.log('   - Configure sua API Key do OpenRouter');
    console.log('   - Acesse: https://openrouter.ai/keys');
  }
  
  if (!hasSupabaseConfig) {
    console.log('   - Configure o Supabase (opcional para MVP)');
  }
  
  console.log('\n📖 Consulte: CONFIGURACAO_API_KEY_SEGURA.md');
  process.exit(1);
}
