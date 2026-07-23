FROM node:22-alpine AS base
# Just enable corepack — it'll pick up the exact pnpm version from
# package.json's `packageManager` field on first invocation. Hardcoding
# a version here is misleading because corepack will auto-switch when
# the field disagrees (which it always does when we bump pnpm).
RUN corepack enable
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
# pnpm-workspace.yaml carries the allowBuilds list AND the supply-chain
# hardening settings (minimumReleaseAge, dangerouslyAllowAllBuilds=false,
# etc.). Must be copied BEFORE `pnpm install` runs, or pnpm in the
# container won't see the allowlist and will refuse to run @swc/core /
# sharp / esbuild / etc. install scripts with ERR_PNPM_IGNORED_BUILDS.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm i --frozen-lockfile
# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml next.config.js next-i18next.config.js tsconfig.json next-env.d.ts next.d.ts ./
COPY src ./src
COPY public ./public
COPY gen ./gen
# Browser-side OTel exporter values. Next.js bakes NEXT_PUBLIC_* into the JS
# bundle at build time, so these must be set as ENV before `pnpm run build`.
# Defaults match local dev so an unconfigured build is harmless.
ARG NEXT_PUBLIC_OTEL_ENABLED=false
ARG NEXT_PUBLIC_OTEL_ENDPOINT=http://localhost:4318/v1/traces
ARG NEXT_PUBLIC_APP_VERSION=dev
ENV NEXT_PUBLIC_OTEL_ENABLED=$NEXT_PUBLIC_OTEL_ENABLED \
    NEXT_PUBLIC_OTEL_ENDPOINT=$NEXT_PUBLIC_OTEL_ENDPOINT \
    NEXT_PUBLIC_APP_VERSION=$NEXT_PUBLIC_APP_VERSION
ENV NEXT_TELEMETRY_DISABLED=1
RUN --mount=type=cache,target=/app/.next/cache \
    pnpm run build
# Production image, copy all the files and run next
FROM base AS runner
LABEL org.opencontainers.image.source=https://github.com/inspiration-particle/utro
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
# Ensure next-i18next can find its config at runtime.
COPY --from=builder /app/next-i18next.config.js ./next-i18next.config.js
COPY --from=builder /app/next.config.js ./next.config.js
# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next
# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
CMD ["node", "server.js"]
