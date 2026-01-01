FROM oven/bun:1-alpine
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile --ignore-scripts
COPY . .
EXPOSE 8080
CMD ["bun", "src/index.js"]