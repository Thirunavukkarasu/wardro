# syntax=docker/dockerfile:1

# Cloud Run runs the API directly on Bun. Bun executes TypeScript and resolves
# the `@/*` path aliases from tsconfig.json, so the image does not need a
# separate bundle step.
FROM oven/bun:1.4.2-slim AS deps
WORKDIR /app

COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile --production

FROM oven/bun:1.4.2-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080
ENV HOME=/home/bun

COPY package.json tsconfig.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY src ./src

USER bun
EXPOSE 8080

CMD ["bun", "src/index.ts"]
