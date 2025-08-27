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

# Start the auth server (which will serve API routes)
# The frontend will be built and can be served statically or via proxy
CMD ["node", "server.js"]