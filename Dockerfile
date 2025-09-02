# Use Node.js 20 slim for better Prisma compatibility
FROM node:20-slim

# Install OpenSSL for Prisma
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files and Prisma schema
COPY package*.json ./
COPY prisma/ ./prisma/

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose the port (Railway will set PORT env var dynamically)
EXPOSE 3001

# Initialize database and start the server
CMD ["sh", "-c", "sleep 5 && npx prisma generate && npx prisma db push && node server.js"]