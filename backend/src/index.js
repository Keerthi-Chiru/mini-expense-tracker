require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const expenseRoutes = require('./routes/expenses');

const app = express();
const PORT = process.env.PORT || 5001;

// Middlewares
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Expenses API
app.use('/expenses', expenseRoutes);

// Serve frontend in production if dist directory exists
const distPath = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  // 404 handler for unknown routes in standalone API mode
  app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
  });
}

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Expense Tracker Backend is running on http://localhost:${PORT}`);
});

module.exports = app;
