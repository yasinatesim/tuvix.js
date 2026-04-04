FROM node:20-alpine AS builder
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY chatbot/package.json ./chatbot/
RUN corepack enable && pnpm install --frozen-lockfile --filter chatbot
COPY chatbot/ ./chatbot/
RUN pnpm --filter chatbot build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/chatbot/dist ./dist
COPY --from=builder /app/chatbot/data ./data
COPY --from=builder /app/chatbot/node_modules ./node_modules
EXPOSE 3001
CMD ["node", "dist/server.js"]
