# Build stage
FROM oven/bun:1-alpine as builder
WORKDIR /app

# Install dependencies including ffmpeg for voice processing
RUN apk add --no-cache ffmpeg

# Copy package files
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Generate database migrations
RUN bun run db:generate

# Build the application
RUN bun build --compile src/index.ts --target bun --outfile dist/bot

# Production stage
FROM alpine:latest
WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache ffmpeg libstdc++ libgcc

# Copy built application
COPY --from=builder /app/dist/bot ./bot
COPY --from=builder /app/drizzle ./drizzle

# Create data directory
RUN mkdir -p ./data

# Run the bot
CMD ["./bot"]