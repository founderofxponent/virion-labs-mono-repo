# Use the official Node.js 18 image as the base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies for building native modules
RUN apk add --no-cache \
    build-base \
    python3 \
    py3-pip \
    make \
    g++ \
    libc6-compat

# Copy package.json and yarn.lock first to leverage Docker cache
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile --production=false

# Copy the rest of the application code
COPY . .

# Build the Strapi application
RUN yarn build

# Remove dev dependencies to reduce image size
RUN yarn install --frozen-lockfile --production=true --ignore-scripts --prefer-offline

# Create a non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S strapi -u 1001

# Change ownership of the app directory to the strapi user
RUN chown -R strapi:nodejs /app

# Switch to the non-root user
USER strapi

# Expose the port that Strapi runs on
EXPOSE 1337

# Set environment variable for production
ENV NODE_ENV=production

# Start the Strapi application
CMD ["yarn", "start"]