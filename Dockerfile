# Use Node.js 20 slim for better Prisma compatibility
FROM node:20-slim

# Install OpenSSL for Prisma
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files and backend prisma schema
COPY package*.json ./
COPY backend/prisma/ ./backend/prisma/

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code (frontend and backend)
COPY frontend/ ./frontend/
COPY backend/ ./backend/

# Build the application (frontend build)
RUN npm run build

# Expose the port (Railway will set PORT env var dynamically)
EXPOSE 3001

# Generate Prisma client, sync database schema, and start the backend server
CMD ["sh", "-c", "cd backend && npx prisma generate && npx prisma db push --accept-data-loss && node server.js"]