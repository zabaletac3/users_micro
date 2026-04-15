FROM node:22-alpine AS deps

RUN apk add --no-cache python3 make g++ libc6-compat && rm -rf /var/cache/apk/*
RUN npm install -g pnpm@10.10.0

WORKDIR /build-app
COPY package.json pnpm-lock.yaml .npmrc ./
RUN pnpm install --frozen-lockfile && rm -f .npmrc

FROM node:22-alpine AS builder

RUN npm install -g pnpm@10.10.0
WORKDIR /build-app
COPY --from=deps /build-app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM node:22-alpine AS production

RUN apk add --no-cache libc6-compat && rm -rf /var/cache/apk/*
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001
RUN npm install -g pnpm@10.10.0

WORKDIR /prod-app
COPY --from=builder --chown=nestjs:nodejs /build-app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /build-app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /build-app/package.json ./package.json
COPY --from=builder --chown=nestjs:nodejs /build-app/pnpm-lock.yaml ./pnpm-lock.yaml
RUN npm cache clean --force && rm -rf /tmp/* /var/cache/apk/*

USER nestjs

EXPOSE 5500 50052

ENV NODE_ENV=production
ENV PORT=5500
ENV PORT_GRPC=50052

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5500/api/healthcheck', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

CMD ["pnpm", "start:prod"]
