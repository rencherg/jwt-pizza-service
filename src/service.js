const express = require('express');
const { authRouter, setAuthUser } = require('./routes/authRouter.js');
const orderRouter = require('./routes/orderRouter.js');
const franchiseRouter = require('./routes/franchiseRouter.js');
const version = require('./version.json');
const config = require('./config.js');
const metrics = require('./metrics.js');
const logger = require('./logger');

const app = express();
app.use(express.json());
app.use(setAuthUser);
const apiRouter = express.Router();

app.use(metrics.trackHttpRequests());
app.use(logger.httpLogger);

// Middleware to measure latency
app.use((req, res, next) => {
  const start = process.hrtime();

  res.on('finish', () => {
    const [seconds, nanoseconds] = process.hrtime(start);
    const latencyMs = (seconds * 1000) + (nanoseconds / 1e6);

    metrics.updateServiceLatency(latencyMs);
  });

  next();
});

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  next();
});

app.use('/api', apiRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/order', orderRouter);
apiRouter.use('/franchise', franchiseRouter);

apiRouter.use('/docs', (req, res) => {
  res.json({
    version: version.version,
    endpoints: [...authRouter.endpoints, ...orderRouter.endpoints, ...franchiseRouter.endpoints],
    config: { factory: config.factory.url, db: config.db.connection.host },
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'welcome to JWT Pizza',
    version: version.version,
  });
});

app.use('*', (req, res) => {
  res.status(404).json({
    message: 'unknown endpoint',
  });
});

app.use((err, req, res, next) => {
  logger.logError(`Error: ${err.message}`, { stack: err.stack });
  res.status(err.statusCode ?? 500).json({ message: err.message, stack: err.stack });
  next();
});

process.on('uncaughtException', (error) => {
  logger.logError(`Uncaught Exception: ${error.message}`, { stack: error.stack });
});

module.exports = app;
