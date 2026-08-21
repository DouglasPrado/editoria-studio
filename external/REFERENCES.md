# Referências de Implantação Externa

| Serviço | Referência oficial | Decisão aplicada |
|---|---|---|
| Easypanel App | https://easypanel.io/docs/services/app | Serviço App a partir do GitHub, porta interna 3000, variáveis via Environment. |
| Easypanel Builders | https://easypanel.io/docs/builders | Railpack com comandos declarados em `railpack.json`. |
| Easypanel Postgres | https://easypanel.io/docs/services/postgres | PostgreSQL privado na rede interna do projeto e URL interna em `DATABASE_URL`. |
| Clerk React | https://clerk.com/docs/react/getting-started/quickstart | `ClerkProvider` no cliente e rota `/sign-in`. |
| Clerk Express | https://clerk.com/docs/expressjs/getting-started/quickstart | `clerkMiddleware()` no servidor e validação da sessão no contexto tRPC. |
| Cloudflare R2 | https://developers.cloudflare.com/r2/get-started/s3/ | Cliente S3 com endpoint R2 e credenciais de bucket restritas. |
| URLs assinadas R2 | https://developers.cloudflare.com/r2/api/s3/presigned-urls/ | Acesso temporário a objetos privados sem expor a chave R2. |
| OpenRouter | https://openrouter.ai/docs/quickstart | Chamadas server-side para `/api/v1/chat/completions`. |
| Saídas estruturadas OpenRouter | https://openrouter.ai/docs/guides/features/structured-outputs | Preservação do JSON Schema para variações de conteúdo. |
