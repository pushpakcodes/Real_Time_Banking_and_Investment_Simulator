const express = require('express');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./src/config/db');

const authRoutes = require('./src/routes/authRoutes');
const bankRoutes = require('./src/routes/bankRoutes');
const simulationRoutes = require('./src/routes/simulationRoutes');
const stockRoutes = require('./src/routes/stockRoutes');
const fdRoutes = require('./src/routes/fdRoutes');
const loanRoutes = require('./src/routes/loanRoutes');
const creditCardRoutes = require('./src/routes/creditCardRoutes');
const analyticsRoutes = require('./src/routes/analyticsRoutes');
const financialGoalRoutes = require('./src/routes/financialGoalRoutes');

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(cors()); // Allow all origins for development
app.use(helmet());
app.use(morgan('dev'));

// Global Error Handler for Uncaught Exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥', err);
});

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥', err);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/bank', bankRoutes);
app.use('/api/simulate', simulationRoutes);
app.use('/api/stocks', stockRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/credit-cards', creditCardRoutes);
app.use('/api/fds', fdRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/goals', financialGoalRoutes);

// Basic route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Routes will be mounted here
// app.use('/api/auth', authRoutes);
// app.use('/api/bank', bankRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
