# /backend/Dockerfile
FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

# Generate the Prisma client so it has access to the pgvector types
RUN npx prisma generate

# Build the NestJS application
RUN npm run build

# Expose the NestJS default port
EXPOSE 3000

# Start the application in production mode
CMD ["npm", "run", "start:prod"]