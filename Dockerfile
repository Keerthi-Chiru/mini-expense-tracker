# Multi-stage Dockerfile for Mini Expense Tracker
FROM node:20-alpine AS builder

WORKDIR /app

# Build Frontend
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install
COPY frontend/ ./frontend/
RUN cd frontend && npm run build

# Install Backend Production Dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm install --omit=dev

# Production Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/backend ./backend
COPY --from=builder /app/frontend/dist ./frontend/dist

EXPOSE 5001

CMD ["node", "backend/src/index.js"]
