FROM node:18-alpine

WORKDIR /usr/src/app

# Copy dependency files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy application source code
COPY . .

# Expose Express server port
EXPOSE 3000

# Set default production environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_PATH=/usr/src/app/src/database/jokes.db
ENV LOG_LEVEL=info

# Start the application
CMD [ "node", "src/app.js" ]
