# Implantação da Editoria Studio no Easypanel

Esta configuração deixa a Editoria Studio independente, usando **PostgreSQL**, **Clerk**, **Cloudflare R2** e **OpenRouter**. A aplicação deve ser implantada a partir do repositório GitHub conectado.

## 1. Criar os serviços

No Easypanel, crie um projeto chamado `editoria-studio`. Dentro dele, crie um serviço **Postgres** e copie a URL de conexão **interna** disponível nas credenciais do serviço. Ela será usada como `DATABASE_URL` pela aplicação. O PostgreSQL permanece privado dentro da rede do projeto, que é o cenário mais seguro e recomendado pela documentação do Easypanel.

Em seguida, crie um serviço **App** apontando para este repositório GitHub, branch `main`, com *Build Path* `/`. Selecione **Railpack** como construtor. O arquivo `railpack.json` já informa a instalação, compilação e o comando de inicialização.

## 2. Criar o banco PostgreSQL

Abra o terminal `psql` do serviço Postgres no Easypanel e rode, uma única vez:

```bash
psql "$DATABASE_URL" -f external/sql/001_init_postgres.sql
```

Se preferir, copie o conteúdo de `external/sql/001_init_postgres.sql` para o editor SQL do seu cliente PostgreSQL e execute-o. Não inicie a aplicação em produção antes de criar esse esquema.

## 3. Configurar variáveis do serviço App

Copie todas as chaves de `.env.easypanel.example` para a aba **Environment** do serviço App e substitua os exemplos pelos valores reais. Nunca suba um arquivo `.env` no GitHub.

| Variável | Origem | Uso |
|---|---|---|
| `DATABASE_URL` | Serviço Postgres do Easypanel | Conexão interna do banco. |
| `VITE_CLERK_PUBLISHABLE_KEY` e `CLERK_SECRET_KEY` | Clerk Dashboard | Sessão e contas da plataforma. |
| `OPENROUTER_API_KEY` | OpenRouter | Assistente editorial e variações de conteúdo. |
| `R2_*` | Cloudflare R2 | Upload e exibição de moodboards e mídias. |
| `APP_URL` | Seu domínio público | Atribuição segura das chamadas de IA. |

No Clerk, inclua o domínio público da aplicação em **Allowed origins** e configure as URLs de redirecionamento de entrada e saída. No Cloudflare R2, crie um bucket, um token com acesso **Object Read & Write** apenas para esse bucket e um domínio público para os arquivos. Se optar por upload direto no navegador, configure o CORS do bucket para aceitar `PUT` apenas do domínio da aplicação.

## 4. Migrar os dados existentes

Faça uma cópia local do repositório em uma máquina que tenha acesso ao banco atual e ao novo PostgreSQL.

```bash
SOURCE_MYSQL_URL='mysql://...' pnpm node external/scripts/export-mysql.mjs
DATABASE_URL='postgres://...' CLERK_OWNER_USER_ID='user_xxx' pnpm node external/scripts/import-postgres.mjs
```

O primeiro comando gera `external/data/editoria-export.json`, que contém dados privados e não deve ser enviado ao GitHub. Antes do segundo comando, entre uma vez na aplicação Clerk e copie o seu **User ID** (no formato `user_xxx`) para `CLERK_OWNER_USER_ID`; assim, seus projetos importados continuam vinculados à sua nova conta. O segundo comando importa projetos, pilares, roteiros, calendário e metadados de moodboards. Arquivos que hoje residem no armazenamento gerenciado precisam ser reenviados ao R2, pois os caminhos antigos não serão servidos pelo novo ambiente.

## 5. Implantar e validar

Na aba **Domains**, conecte o domínio e direcione-o para a porta interna `3000`. Em seguida, clique em **Deploy**. Após abrir o domínio, crie ou entre em uma conta Clerk, crie um projeto, faça um upload de teste e gere uma sugestão editorial. Só depois redirecione o domínio definitivo.

> O Easypanel permite construir uma aplicação a partir do GitHub, aplicar variáveis de ambiente e expor um domínio para o serviço. Consulte as referências oficiais caso a interface mude: [App Service](https://easypanel.io/docs/services/app), [Postgres Service](https://easypanel.io/docs/services/postgres), [Clerk React](https://clerk.com/docs/react/getting-started/quickstart), [Cloudflare R2](https://developers.cloudflare.com/r2/get-started/s3/) e [OpenRouter](https://openrouter.ai/docs/quickstart).
