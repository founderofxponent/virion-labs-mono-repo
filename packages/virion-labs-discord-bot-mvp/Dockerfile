FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S discordbot -u 1001

# Change to non-root user
USER discordbot

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "
const http = require('http');
const options = {
  host: 'localhost',
  port: 8080,
  path: '/health',
  timeout: 2000,
};
const request = http.request(options, (res) => {
  if (res.statusCode == 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});
request.on('error', function(err) {
  process.exit(1);
});
request.end();
"

# Start the application
CMD ["npm", "start"]