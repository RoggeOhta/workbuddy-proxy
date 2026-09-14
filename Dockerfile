FROM oven/bun:1.3.11-slim
WORKDIR /app
COPY package.json ./
COPY src ./src
ENV LISTEN_HOST=0.0.0.0 PORT=18080 \
    WORKBUDDY_AUTH_FILE=/auth/workbuddy-desktop-ai.info \
    API_KEY_FILE=/data/.api-key
EXPOSE 18080
CMD ["bun", "src/index.ts"]
