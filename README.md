# Reditto - Plataforma de Correção de Redação 

Uma plataforma moderna para correção automática de redações, integrada com IA própria hospedada na VPS Hostinger.

## 🚀 Funcionalidades

- **Sistema de Login**: Autenticação completa com Supabase + opção visitante
- **Envio por Texto**: Cole diretamente o texto da redação
- **Envio por Imagem**: Upload e OCR automático de imagens de redação
- **Correção com IA**: Análise completa das 5 competências do ENEM
- **Feedback Detalhado**: Pontuação, melhorias e parabenizações
- **Histórico de Redações**: Acompanhamento do progresso do usuário

## 🤖 Tecnologias

- **Next.js 14** - Framework React moderno
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização utilitária
- **Open WebUI** - IA própria na VPS Hostinger
- **Gemma3:12b** - Modelo de linguagem para correção
- **Supabase** - Backend e autenticação

## 🔧 Instalação

1. **Clone o repositório:**
```bash
git clone <url-do-repositorio>
cd reditto-next
```

2. **Instale as dependências:**
```bash
npm install
```

3. **Configure as variáveis de ambiente:**
```bash
cp env.example .env.local
```

4. **Edite o `.env.local` com suas credenciais:**
```env
# Open WebUI (EasyPanel)
OPEN_WEBUI_BASE_URL=https://reditto-ollama-web.afeavy.easypanel.host
OPEN_WEBUI_API_KEY=ssk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPEN_WEBUI_MODEL=gemma3:4b
OPEN_WEBUI_JWT_TOKEN=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=sua_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_publica_supabase
SUPABASE_SERVICE_ROLE_KEY=sua_chave_servico_supabase
```

5. **Teste a integração com Open WebUI:**
```bash
node scripts/test-openwebui.js
```

6. **Inicie o servidor de desenvolvimento:**
```bash
npm run dev
```

7. **Acesse:** `http://localhost:3000`

## 📱 Como Usar

### 🔐 Página Inicial (/)
- **Criar Conta**: Cadastro com email e senha
- **Entrar com Email**: Login com credenciais existentes
- **Entrar como Visitante**: Acesso sem cadastro

### 📝 Página de Envio (/envio)
- **Tema**: Campo opcional para especificar o tema da redação
- **Método de Envio**: 
  - **📄 Texto**: Cole diretamente o texto da redação (200-5000 caracteres)
  - **📷 Imagem**: Upload de foto da redação (JPG, PNG, WEBP até 10MB)
- **Processamento**: Correção automática com IA Gemma3:12b

### 🎯 Página de Resultados (/resultados)
- **Nota Final**: Pontuação de 0 a 1000 (critérios ENEM)
- **5 Competências**: Análise detalhada de cada competência
- **Feedback Completo**:
  - ✅ **Pontos Positivos**: Aspectos que devem ser mantidos
  - ⚠️ **Pontos de Atenção**: Áreas que precisam de cuidado
  - 📈 **Melhorias**: Sugestões específicas de aprimoramento
- **Ações**: Nova redação ou visualizar histórico

## 🏗️ Estrutura do Projeto

```
src/
├── app/
│   ├── api/
│   │   ├── openwebui/           # API genérica Open WebUI
│   │   ├── correct-essay/       # Correção de redações
│   │   └── extract-text/        # OCR de imagens
│   ├── envio/page.tsx           # Página de envio
│   ├── resultados/page.tsx      # Página de resultados
│   ├── historico/page.tsx       # Histórico de redações
│   └── page.tsx                 # Página inicial
├── components/                  # Componentes reutilizáveis
├── contexts/                    # Contextos React (Auth)
├── lib/                         # Utilitários (Supabase, etc)
└── types/                       # Definições TypeScript
```

## 🛡️ Segurança Implementada

### 🔒 **Proteção de Credenciais**
- Todas as credenciais armazenadas server-side apenas
- API Keys nunca expostas no frontend
- JWT Token para autenticação adicional
- Logs mascarados (não vazam informações sensíveis)

### ✅ **Validações e Sanitização**
- Validação rigorosa de tipos MIME para imagens
- Sanitização de entrada de texto
- Limites de tamanho (texto: 200-5000 chars, imagem: 10MB)
- Headers de segurança em todas as respostas

### 🛠️ **Headers de Segurança**
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Cache-Control: no-store, no-cache, must-revalidate
```

### ⚡ **Performance e Confiabilidade**
- Timeout de 60 segundos por requisição
- Rate limiting configurado
- Tratamento completo de erros
- Logs detalhados para debugging

## 🤖 Integração com Open WebUI

### 📍 **Configuração do Open WebUI (EasyPanel)**
- **Servidor**: `https://reditto-ollama-web.afeavy.easypanel.host`
- **Modelo IA**: `gemma3:4b`
- **API**: Compatível com OpenAI Chat Completions
- **Autenticação**: API Key + JWT Token duplo

### 🔄 **Fluxo de Correção**
1. **Usuário envia** texto ou imagem
2. **Se imagem**: OCR automático extrai texto
3. **IA Gemma3** analisa as 5 competências ENEM
4. **Retorna** feedback estruturado e nota final
5. **Salva** no histórico do usuário (Supabase)

### ⚙️ **APIs Implementadas**
- `/api/openwebui` - Comunicação genérica com Open WebUI
- `/api/correct-essay` - Correção específica de redações
- `/api/extract-text` - OCR de imagens para texto

## 🎯 Critérios de Correção (ENEM)

### **Competência I** - Domínio da modalidade escrita (0-200)
- Gramática, ortografia, acentuação
- Registro formal da língua portuguesa

### **Competência II** - Compreensão da proposta (0-200)
- Desenvolvimento do tema proposto
- Tipo textual dissertativo-argumentativo

### **Competência III** - Seleção de informações (0-200)
- Organização e coerência dos argumentos
- Repertório sociocultural

### **Competência IV** - Coesão e coerência (0-200)
- Articulação entre partes do texto
- Recursos coesivos adequados

### **Competência V** - Proposta de intervenção (0-200)
- Soluções viáveis para o problema
- Detalhamento dos meios de realização

## 📊 Testes e Monitoramento

### 🧪 **Script de Teste**
```bash
# Testar conectividade com VPS
node scripts/test-openwebui.js
```

### 📈 **Logs Disponíveis**
- Requisições para Open WebUI
- Tempos de resposta
- Erros e debugging
- Uso de tokens/caracteres

## 🚀 Deploy e Produção

### **Variáveis de Ambiente Necessárias:**
```env
# Open WebUI (EasyPanel)
OPEN_WEBUI_BASE_URL=https://reditto-ollama-web.afeavy.easypanel.host
OPEN_WEBUI_API_KEY=sua_api_key_aqui
OPEN_WEBUI_MODEL=gemma3:4b
OPEN_WEBUI_JWT_TOKEN=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## 📞 Suporte

Para configuração completa, consulte:
- [`CONFIGURACAO_OPEN_WEBUI.md`](./CONFIGURACAO_OPEN_WEBUI.md) - Setup detalhado
- [`CONFIGURACAO_SUPABASE_COMPLETA.md`](./CONFIGURACAO_SUPABASE_COMPLETA.md) - Banco de dados
- Script de teste: `scripts/test-openwebui.js`

---

**Desenvolvido com ❤️ usando Next.js + Open WebUI + Gemma3:12b**

🎯 **100% funcional** | 🔒 **Totalmente seguro** | 🤖 **IA própria**