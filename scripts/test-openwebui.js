// Script de teste para verificar a integração com Open WebUI
// Execute com: node scripts/test-openwebui.js

require('dotenv').config({ path: '.env.local' });

const OPEN_WEBUI_BASE_URL = process.env.OPEN_WEBUI_BASE_URL;
const OPEN_WEBUI_API_KEY = process.env.OPEN_WEBUI_API_KEY;
const OPEN_WEBUI_MODEL = process.env.OPEN_WEBUI_MODEL || 'gemma3:4b';
const OPEN_WEBUI_JWT_TOKEN = process.env.OPEN_WEBUI_JWT_TOKEN;
const OPEN_WEBUI_API_PATH = process.env.OPEN_WEBUI_API_PATH || '/api/chat/completions';

console.log('🤖 === TESTE DE INTEGRAÇÃO OPEN WEBUI ===\n');

// Verificar configuração
console.log('🔍 Verificando configuração...');
console.log('Base URL:', OPEN_WEBUI_BASE_URL || '❌ NÃO CONFIGURADA');
console.log('API Key:', OPEN_WEBUI_API_KEY ? `✅ Configurada (${OPEN_WEBUI_API_KEY.substring(0, 15)}...)` : '❌ NÃO CONFIGURADA');
console.log('Modelo:', OPEN_WEBUI_MODEL || '❌ NÃO CONFIGURADO');
console.log('JWT Token:', OPEN_WEBUI_JWT_TOKEN ? `✅ Configurado (${OPEN_WEBUI_JWT_TOKEN.substring(0, 20)}...)` : '⚠️ Opcional / NÃO CONFIGURADO');
console.log('API Path:', OPEN_WEBUI_API_PATH);

if (!OPEN_WEBUI_BASE_URL) {
  console.log('\n❌ OPEN_WEBUI_BASE_URL não configurada! Configure no arquivo .env.local');
  process.exit(1);
}

async function tryRequest(path, headersVariant) {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'Reditto-Test/1.0',
    ...headersVariant,
  };
  const response = await fetch(`${OPEN_WEBUI_BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: OPEN_WEBUI_MODEL,
      messages: [{ role: 'user', content: 'Diga apenas: Conectado com sucesso!' }],
      max_tokens: 50,
      temperature: 0.1,
      stream: false
    })
  });
  return response;
}

const headerVariants = [];
if (OPEN_WEBUI_API_KEY) headerVariants.push({ Authorization: `Bearer ${OPEN_WEBUI_API_KEY}` });
if (OPEN_WEBUI_API_KEY) headerVariants.push({ 'X-API-KEY': OPEN_WEBUI_API_KEY });
if (OPEN_WEBUI_JWT_TOKEN) headerVariants.push({ Authorization: `Bearer ${OPEN_WEBUI_JWT_TOKEN}` });
if (OPEN_WEBUI_JWT_TOKEN) headerVariants.push({ 'X-JWT-Token': OPEN_WEBUI_JWT_TOKEN });
if (headerVariants.length === 0) headerVariants.push({});

const candidatePaths = [
  OPEN_WEBUI_API_PATH,
  OPEN_WEBUI_API_PATH === '/api/chat/completions' ? '/v1/chat/completions' : '/api/chat/completions',
  '/openai/v1/chat/completions'
];

// Teste de conectividade
async function testConnection() {
  console.log('🔗 Testando conectividade com Open WebUI...');
  for (const path of candidatePaths) {
    for (const hv of headerVariants) {
      try {
        const response = await tryRequest(path, hv);
        console.log(`📊 ${path} com headers [${Object.keys(hv).join(',') || 'none'}]:`, response.status);
        if (response.ok) {
          const data = await response.json();
          console.log('✅ OK:', data.choices?.[0]?.message?.content || '(sem conteúdo)');
          return true;
        }
      } catch (e) {
        console.log(`❌ Erro em ${path} [${Object.keys(hv).join(',') || 'none'}]:`, e.message);
      }
    }
  }
  return false;
}

// Teste de endpoint local
async function testLocalEndpoint() {
  console.log('\n🔗 Testando endpoint local /api/openwebui...');
  try {
    const response = await fetch('http://localhost:3000/api/openwebui', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'Endpoint funcionando!' }] })
    });
    console.log('📊 Status da resposta local:', response.status);
    if (!response.ok) return false;
    const data = await response.json();
    console.log('✅ Endpoint local OK:', data.choices?.[0]?.message?.content || '(sem conteúdo)');
    return true;
  } catch (error) {
    console.log('❌ Erro no endpoint local:', error.message);
    return false;
  }
}

// Executar testes
async function runTests() {
  const directTest = await testConnection();
  const localTest = await testLocalEndpoint();
  
  console.log('\n🎯 === RESULTADOS DOS TESTES ===');
  console.log('Conexão direta com VPS:', directTest ? '✅ SUCESSO' : '❌ FALHOU');
  console.log('Endpoint local:', localTest ? '✅ SUCESSO' : '❌ FALHOU');
  
  if (directTest && localTest) {
    console.log('\n🎉 INTEGRAÇÃO FUNCIONANDO PERFEITAMENTE!');
    console.log('Você pode usar o projeto normalmente.');
  } else {
    console.log('\n⚠️ PROBLEMAS DETECTADOS:');
    if (!directTest) {
      console.log('- Verifique se seu Open WebUI (EasyPanel) está online e acessível');
      console.log('- Confirme as credenciais no arquivo .env.local');
      console.log('- Teste o acesso direto:', OPEN_WEBUI_BASE_URL);
    }
    if (!localTest) {
      console.log('- Verifique se o servidor Next.js está rodando');
      console.log('- Execute: npm run dev');
    }
  }
}

runTests().catch(console.error);
