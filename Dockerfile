# Build em dois estágios.
#
# O railpack falhou no painel em 2026-08-21 — `prepare` com exit 1, e nenhuma
# das outras 8 aplicações usa railpack, então seria o primeiro deste servidor.
# Um Dockerfile tira essa incógnita do caminho: a versão do node, do pnpm e a
# ordem dos passos passam a ser deste arquivo, não da detecção do builder.
#
# node 22: o `build` usa `import.meta.dirname` no vite.config.ts, que exige 20.11+.
FROM node:22-alpine AS build
WORKDIR /app

# corepack fixa o pnpm em 10.4.1 pelo campo packageManager do package.json.
# Importa: o lockfile é formato v10 e há um patch em wouter@3.7.1 — um pnpm
# mais antigo recusa os dois.
RUN corepack enable

# Manifests primeiro: enquanto eles não mudam, a camada de instalação é cache.
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches
RUN pnpm install --frozen-lockfile

COPY . .

# As VITE_* são embutidas no bundle AQUI, e não em runtime. Precisam existir no
# momento do build ou o cliente sobe sem tela de login, silenciosamente
# (client/src/main.tsx:35).
ARG VITE_APP_RUNTIME
ARG VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_APP_RUNTIME=$VITE_APP_RUNTIME
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY

RUN pnpm run build

# ---------------------------------------------------------------------------
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable

# SEM `--prod`, e isso não é desleixo.
#
# O esbuild empacota o servidor com `--packages=external`, então todo import
# sobrevive no dist/index.js e o Node o resolve no carregamento. E
# server/_core/index.ts importa `./vite` ESTATICAMENTE — que por sua vez importa
# `vite`, uma devDependency. A função só é chamada quando NODE_ENV=development,
# mas o import acontece sempre.
#
# Com `--prod` o contêiner sobe e morre na hora:
#   Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'vite'
#
# Railpack e nixpacks não tropeçam porque deixam o node_modules inteiro. A
# correção de verdade é no código da aplicação — trocar por `await import()`
# dentro do ramo de desenvolvimento — e enquanto ela não vem, instalar tudo.
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches
RUN pnpm install --frozen-lockfile

COPY --from=build /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/index.js"]
