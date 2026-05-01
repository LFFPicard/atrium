FROM node:20-alpine
LABEL org.opencontainers.image.title="Atrium"
LABEL org.opencontainers.image.description="A modern, modular self-hosted homelab portal"
LABEL org.opencontainers.image.url="https://github.com/LFFPicard/atrium"
LABEL org.opencontainers.image.source="https://github.com/LFFPicard/atrium"
LABEL org.opencontainers.image.licenses="GPL-3.0"
WORKDIR /app
COPY . .
RUN npm ci
RUN npm run build
VOLUME ["/app/data"]
EXPOSE 3000
CMD ["npm", "start"]
