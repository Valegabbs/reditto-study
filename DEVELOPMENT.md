# Reditto em next - Configuração de Desenvolvimento

## Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Constrói o projeto para produção
- `npm run start` - Inicia o servidor de produção
- `npm run lint` - Executa o linter (se configurado)

## Estrutura do Projeto

```
reditto-next/
├── src/
│   ├── app/                    # App Router do Next.js
│   │   ├── api/                # APIs do lado do servidor
│   │   ├── envio/              # Página de envio
│   │   ├── resultados/         # Página de resultados
│   │   └── page.tsx            # Página inicial
│   ├── components/             # Componentes reutilizáveis
│   └── types/                  # Definições de tipos TypeScript
├── public/                     # Arquivos estáticos
└── README.md                   # Documentação principal
```

## Desenvolvimento

1. Instale as dependências: `npm install`
2. Execute: `npm run dev`
3. Acesse: http://localhost:3000

## Deploy

Para fazer deploy no Vercel:

1. Conecte seu repositório
2. Configure as variáveis de ambiente
3. Deploy automático será executado

## Tecnologias Utilizadas

- **Next.js 15** - Framework React
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **Lucide React** - Ícones