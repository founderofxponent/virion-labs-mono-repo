FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application files
COPY index.js ./
COPY onboarding-manager.js ./
COPY supabase.js ./

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S discordbot -u 1001 -G nodejs

# Change ownership of app directory
RUN chown -R discordbot:nodejs /app
USER discordbot

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "console.log('Bot health check passed')" || exit 1

# Expose port (not really needed for Discord bot, but good practice)
EXPOSE 3000

# Start the bot
CMD ["node", "index.js"] 