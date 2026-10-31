# Construído a partir da raiz do repositório: docker build -f apps/caqui/Dockerfile .
FROM node:22-alpine AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH NEXT_TELEMETRY_DISABLED=1
RUN corepack enable
WORKDIR /repo

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/caqui/package.json apps/caqui/
COPY packages/nucleo/package.json packages/nucleo/
COPY packages/motivos/package.json packages/motivos/
COPY ferramentas/package.json ferramentas/
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY . .
RUN pnpm --filter caqui build

FROM node:22-alpine AS runner
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0 PORT=3000
WORKDIR /app
RUN addgroup -S caqui && adduser -S caqui -G caqui
# O standalone já traz dados/ e as skills (outputFileTracingIncludes em next.config.ts).
COPY --from=build --chown=caqui:caqui /repo/apps/caqui/.next/standalone ./
COPY --from=build --chown=caqui:caqui /repo/apps/caqui/.next/static ./apps/caqui/.next/static
USER caqui
EXPOSE 3000
CMD ["node", "apps/caqui/server.js"]
