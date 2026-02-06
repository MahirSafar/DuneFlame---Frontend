# ---- Build Stage ----
FROM node:20-alpine AS builder
WORKDIR /app
ENV NEXT_PUBLIC_API_URL=https://duneflame-backend-180239181668.me-central1.run.app
COPY . .
RUN npm install --frozen-lockfile && npm run build

# ---- Runner Stage ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_PUBLIC_API_BASE_URL=https://duneflame-backend-180239181668.me-central1.run.app

# Copy only necessary files
COPY --from=builder /app/.next/standalone .
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
