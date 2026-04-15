FROM node:20-alpine AS builder

WORKDIR /app

COPY .npmrc* ./
COPY package.json pnpm-lock.yaml ./

RUN corepack enable && corepack prepare pnpm@10.10.0 --activate
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

RUN pnpm prune --prod --ignore-scripts

FROM node:20-alpine AS runner

WORKDIR /app

COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/package.json ./
COPY --from=builder --chown=node:node /app/.env* ./

RUN mkdir -p /app/logs /var/log/elk-logs && chown -R node:node /app/logs /var/log/elk-logs

USER node

EXPOSE 3000

CMD ["node", "dist/main.js"]
