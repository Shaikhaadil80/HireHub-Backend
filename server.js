const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const connectDB = require('./config/database');

// Route files
const auth = require('./routes/auth');
const users = require('./routes/users');

// Connect to database
connectDB();

const app = express();

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// CORS
app.use(cors()); 
// app.use(cors({
//   origin: [
//     'http://10.94.120.158:5000',
//     'http://localhost:8081',
//     'http://192.168.1.100:3000', // Your React Native dev server
//     'http://192.168.1.100:5000', // Your backend
//     'exp://192.168.1.100:19000', // Expo
//     // Add your specific IPs here
//   ],
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
// }));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false }));

// Mount routers
app.use('/api/auth', auth);
app.use('/api/users', users);
app.use('/api/public', require('./routes/public'));

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'HireHub API is running',
    timestamp: new Date().toISOString()
  });
});

// Handle undefined routes
app.all('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.originalUrl} not found`
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);

  let err = { ...error };
  err.message = error.message;

  // Mongoose bad ObjectId
  if (error.name === 'CastError') {
    const message = 'Resource not found';
    err = { message, statusCode: 404 };
  }

  // Mongoose duplicate key
  if (error.code === 11000) {
    const message = 'Duplicate field value entered';
    err = { message, statusCode: 400 };
  }

  // Mongoose validation error
  if (error.name === 'ValidationError') {
    const message = Object.values(error.errors).map(val => val.message);
    err = { message, statusCode: 400 };
  }

  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Server Error'
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log('Unhandled Rejection at:', promise, 'Reason:', err);
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

module.exports = app;

// {
//   "name": "hirehub-backend",
//   "version": "1.0.0",
//   "description": "",
//   "main": "index.js",
//   "scripts": {
//     "test": "echo \"Error: no test specified\" && exit 1"
//   },
//   "keywords": [],
//   "author": "",
//   "license": "ISC"
// }