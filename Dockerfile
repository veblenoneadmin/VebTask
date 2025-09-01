# Use Node.js 20 Alpine for better package compatibility
FROM node:20-alpine

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
CMD ["sh", "-c", "npx prisma db push --force-reset && node server.js"]