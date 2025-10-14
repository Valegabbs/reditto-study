# Configuração do Reditto Study

## Resumo das Mudanças Implementadas

O projeto foi completamente transformado de "Reditto" (correção de redações) para "Reditto Study" (plataforma de estudo com IA para tirar dúvidas).

### Principais Mudanças:

1. **Renomeação Completa**: Todas as referências de "Reditto" foram alteradas para "Reditto Study"
2. **Novo Fluxo de Navegação**: 
   - Login → Histórico (com botão "Tirar Dúvida!")
   - Histórico → Hub de Matérias
   - Hub de Matérias → Página de Dúvida
   - Página de Dúvida → Resultados
3. **Novas Páginas Criadas**:
   - `/materias` - Hub de seleção de matérias
   - `/duvida` - Página para enviar dúvidas
   - API `/api/duvida` - Processamento de dúvidas
4. **Novo Banco de Dados**: Estrutura adaptada para dúvidas em vez de redações

## Configuração do Banco de Dados Supabase

### 1. Criar Novo Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto chamado "reditto-study"
3. Anote as credenciais:
   - URL do projeto
   - Chave anônima (anon key)
   - Chave de serviço (service role key)

### 2. Executar Script SQL

Execute o script `database-setup-reditto-study.sql` no SQL Editor do Supabase para criar as tabelas necessárias.

### 3. Configurar Variáveis de Ambiente

Crie/atualize o arquivo `.env.local` com as novas credenciais:

```env
# Supabase - Reditto Study
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
SUPABASE_SERVICE_ROLE_KEY=sua_chave_de_servico

# N8N Webhook (mantenha as existentes)
NEXT_PUBLIC_N8N_WEBHOOK_URL=sua_url_do_webhook
NEXT_PUBLIC_N8N_API_KEY=sua_api_key
```

## Estrutura do Novo Banco de Dados

### Tabela `doubts`
- `id` - UUID primário
- `user_id` - Referência ao usuário
- `subject` - Matéria (ex: "Matemática", "Português")
- `doubt_text` - Texto da dúvida (obrigatório, mínimo 30 caracteres)
- `doubt_image_url` - URL da imagem (opcional)
- `ai_response` - Resposta da IA
- `created_at` - Data de criação

### Tabela `doubt_scores`
- `id` - UUID primário
- `doubt_id` - Referência à dúvida
- `user_id` - Referência ao usuário
- `subject` - Matéria
- `created_at` - Data de criação

## Configuração do Webhook N8N

### Estrutura do Payload

O webhook deve receber os seguintes dados:

```json
{
  "doubtText": "Texto da dúvida (obrigatório, mínimo 30 caracteres)",
  "Topic": "Matéria selecionada (ex: 'Português', 'Física')",
  "Mat": "Matemática (apenas quando matéria = 'matematica')",
  "imageBase64": "data:image/jpeg;base64,... (opcional)"
}
```

### Cenários de Envio

1. **Apenas Texto**: `doubtText` + `Topic` (ou `Mat` para matemática)
2. **Texto + Imagem**: `doubtText` + `Topic` (ou `Mat`) + `imageBase64`
3. **Apenas Imagem**: ❌ **NÃO PERMITIDO** - Retorna erro

### Resposta Esperada

O webhook deve retornar:

```json
{
  "aiResponse": "Resposta da IA para a dúvida",
  "originalDoubt": "Texto da dúvida original",
  "doubtImageUrl": "URL da imagem (se enviada)"
}
```

## Funcionalidades Implementadas

### 1. Hub de Matérias (`/materias`)
- Grid responsivo com 12 matérias disponíveis
- Design moderno com gradientes e ícones
- Navegação para página de dúvida com matéria selecionada

### 2. Página de Dúvida (`/duvida`)
- Campo de texto obrigatório (mínimo 30 caracteres)
- Upload de imagem opcional (máximo 10MB)
- Validação de segurança
- Integração com webhook N8N

### 3. Página de Resultados (`/resultados`)
- Exibição da dúvida original
- Prévia da imagem (se enviada)
- Resposta da IA em destaque
- Botões para nova dúvida e impressão

### 4. Histórico Atualizado (`/historico`)
- Botão "Tirar Dúvida!" no canto superior direito
- Redirecionamento para hub de matérias
- Adaptado para mostrar dúvidas em vez de redações

## Segurança Implementada

1. **Validação de Entrada**:
   - Texto mínimo de 30 caracteres
   - Texto máximo de 2.000 caracteres
   - Imagem máxima de 10MB
   - Sanitização de dados

2. **Headers de Segurança**:
   - X-Content-Type-Options: nosniff
   - X-Frame-Options: DENY
   - X-XSS-Protection: 1; mode=block

3. **Autenticação**:
   - Row Level Security (RLS) no Supabase
   - Políticas de acesso por usuário
   - Validação de sessão

## Responsividade

Todas as páginas foram desenvolvidas com design responsivo:
- Mobile-first approach
- Grid adaptativo
- Componentes flexíveis
- Navegação otimizada para mobile

## Próximos Passos

1. **Configurar Supabase**: Execute o script SQL e configure as variáveis
2. **Testar Webhook**: Configure o N8N para processar dúvidas
3. **Deploy**: Faça deploy da aplicação com as novas configurações
4. **Testes**: Teste todos os fluxos de usuário

## Estrutura de Arquivos Modificados

```
src/
├── app/
│   ├── materias/page.tsx          # Novo: Hub de matérias
│   ├── duvida/page.tsx            # Novo: Página de dúvida
│   ├── api/duvida/route.ts        # Novo: API para dúvidas
│   ├── historico/page.tsx         # Atualizado: Histórico de dúvidas
│   ├── resultados/page.tsx        # Atualizado: Resultados de dúvidas
│   ├── components/Sidebar.tsx     # Atualizado: Navegação
│   └── page.tsx                   # Atualizado: Redirecionamento
├── database-setup-reditto-study.sql # Novo: Script do banco
└── CONFIGURACAO_REDITTO_STUDY.md   # Este arquivo
```

## Suporte

Para dúvidas sobre a implementação, consulte:
- Documentação do Supabase
- Documentação do N8N
- Código fonte comentado
- Logs do console do navegador
