require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');

const routes = require('./routes');
const { requireApiKey } = require("./middlewares/apiKey.middleware");

// swagger
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");

const app = express();

// Middleware
app.use(helmet());

app.use(cors({
  origin: process.env.NODE_ENV === 'development' ? true : ['http://localhost:3000'],
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));

// Health check (public)
app.get('/health', (req, res) => {
  res.json({ 
    ok: true,
    timestamp: new Date().toISOString()
  });
});

// Swagger docs (public)
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API routes (protected by x-api-key)
app.use('/api', requireApiKey, routes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(status).json({
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

module.exports = app;