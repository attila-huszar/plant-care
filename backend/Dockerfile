FROM oven/bun:alpine

RUN apk update && apk upgrade --no-cache

RUN apk add --no-cache sqlite

WORKDIR /app

# Install deps (including local @plant-care/shared) with good layer caching
COPY backend/package.json ./backend/package.json
COPY shared ./shared

WORKDIR /app/backend
RUN bun install

COPY backend/. ./

CMD ["bun", "src/app.ts"]
