# UNHACKABLE: minimal reproducible image — pin digest in prod CI, run as non-root below
FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY src ./src
ENV NODE_ENV=production
ENV PORT=3001
USER node
EXPOSE 3001
CMD ["node", "src/server.js"]
