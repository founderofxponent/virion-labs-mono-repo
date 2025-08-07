# Use Node.js 18 LTS
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile --production

# Copy application code
COPY src/ ./src/

# Create a non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S discord-bot -u 1001 && \
    chown -R discord-bot:nodejs /app

# Switch to non-root user
USER discord-bot

# Discord bots don't need to expose ports, but Cloud Run requires one
EXPOSE 8080

# Set environment for production
ENV NODE_ENV=production

# Start the bot
CMD ["node", "src/index.js"]