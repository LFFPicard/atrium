FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm ci
RUN npm run build
VOLUME ["/app/data"]
EXPOSE 3000
CMD ["npm", "start"]
