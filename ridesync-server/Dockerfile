FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --omit=dev
COPY tsconfig.json ./
COPY src ./src
RUN npx tsc -b
ENV NODE_ENV=production
EXPOSE 4000
CMD ["node", "dist/index.js"]
