# ---- 1. Build Stage ----
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

# Build vaxtı koda gömüləcək dəyişənlər
ENV NEXT_PUBLIC_API_BASE_URL=https://dune-flame-backend-180239181668.me-central1.run.app
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51SoLc82zD7Va1EOdHa2o9HM77JFzxefUwmNbB0zZFmVtDcqVWxQ65cWLlt7KO9VzvuGBvlSxng8b6q49OFUCDK8j00vHuVme3s
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=180239181668-arghe0o2lubngimr5eoh5o70m83simov.apps.googleusercontent.com
ENV NODE_TLS_REJECT_UNAUTHORIZED=1

RUN npm run build

# ---- 2. Runner Stage ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]