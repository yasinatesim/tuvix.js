FROM node:20-alpine AS builder
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY chatbot/package.json ./chatbot/
RUN corepack enable && pnpm install --frozen-lockfile --filter chatbot
COPY chatbot/ ./chatbot/
RUN pnpm --filter chatbot build
RUN pnpm --filter @tuvix.js/chatbot deploy --prod /app/deploy

FROM node:20-alpine
RUN corepack enable
WORKDIR /app
COPY --from=builder /app/deploy .
COPY --from=builder /app/chatbot/data ./data
COPY --from=builder /app/chatbot/src ./src
RUN npm install -g tsx
EXPOSE 3001
CMD ["tsx", "src/server.ts"]
