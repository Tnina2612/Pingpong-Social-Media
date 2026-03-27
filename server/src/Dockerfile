# /backend/Dockerfile
FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

# Generate the Prisma client so it has access to the pgvector types
RUN npx prisma generate