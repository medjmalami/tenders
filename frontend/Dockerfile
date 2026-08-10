FROM node:22-alpine

WORKDIR /app

COPY package.json bun.lock* ./
RUN npm install -g bun && bun install --frozen-lockfile

COPY . .

ENV NEXT_PUBLIC_API_URL=http://localhost:8000
ENV NEXT_TELEMETRY_DISABLED=1

RUN bun run build

EXPOSE 3000

CMD ["bun", "run", "start"]
