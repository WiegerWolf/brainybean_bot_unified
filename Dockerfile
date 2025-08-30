FROM oven/bun:1-alpine as base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

# Build application
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run db:generate && \
    bun run db:migrate && \
    bun run build

# Production image
FROM base AS runtime
COPY --from=build /app/dist/bot ./bot
COPY --from=build /app/data ./data
CMD ["./bot"]