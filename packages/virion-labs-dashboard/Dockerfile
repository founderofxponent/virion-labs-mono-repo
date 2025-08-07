# Use Node.js 18 LTS
FROM node:18-alpine

# Install dependencies
RUN apk add --no-cache libc6-compat

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies (this will update yarn.lock)
RUN yarn install

# Copy source code
COPY . .

# Accept build arguments
ARG NODE_ENV=production
ARG NEXT_TELEMETRY_DISABLED=1
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_BUSINESS_LOGIC_API_URL

# Set environment variables for build
ENV NODE_ENV=$NODE_ENV
ENV NEXT_TELEMETRY_DISABLED=$NEXT_TELEMETRY_DISABLED
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_BUSINESS_LOGIC_API_URL=$NEXT_PUBLIC_BUSINESS_LOGIC_API_URL

# Build the application
RUN yarn build

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    chown -R nextjs:nodejs /app

USER nextjs

# Expose the port
EXPOSE 3000

ENV PORT=3000

# Start the application
CMD ["yarn", "start"]