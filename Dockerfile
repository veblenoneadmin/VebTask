# Use Node.js 18 Alpine for smaller image size
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose the port (Railway will set PORT env var dynamically)
EXPOSE 3001

# Initialize database and start the server
CMD ["sh", "-c", "node init-db.js && node server.js"]