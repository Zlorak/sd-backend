const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const database = require('./database/connection');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const computersRoutes = require('./routes/computers');
const peripheralsRoutes = require('./routes/peripherals');
const printerItemsRoutes = require('./routes/printer-items');
const restockRequestsRoutes = require('./routes/restock-requests');
const auditLogRoutes = require('./routes/audit-log');
const reportsRoutes = require('./routes/reports');
const makesRoutes = require('./routes/makes');
const modelsRoutes = require('./routes/models');

const app = express();
const PORT = process.env.PORT || 3001;

const corsOptions = {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
    optionsSuccessStatus: 200
};

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: {
        success: false,
        error: 'Too many requests',
        message: 'Please try again later'
    }
});

app.use(helmet({
    contentSecurityPolicy: {
        useDefaults: true,
        directives: {
            "default-src": ["'self'"],
            "script-src": ["'self'"],
            "style-src": ["'self'", "'unsafe-inline'"],
            "img-src": ["'self'", "data:", "https:"]
        }
    },
    crossOriginEmbedderPolicy: false
}));

app.use(cors(corsOptions));
app.use(compression());
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`, {
        query: req.query,
        body: req.method !== 'GET' ? req.body : undefined
    });
    next();
});

app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'SD Inventory API is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'SD Inventory API is healthy',
        database: 'connected',
        timestamp: new Date().toISOString()
    });
});

app.use('/api/computers', computersRoutes);
app.use('/api/peripherals', peripheralsRoutes);
app.use('/api/printer-items', printerItemsRoutes);
app.use('/api/restock-requests', restockRequestsRoutes);
app.use('/api/audit-log', auditLogRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/makes', makesRoutes);
app.use('/api/models', modelsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

async function startServer() {
    try {
        console.log('Connecting to database...');
        await database.connect();
        await database.initialize();
        
        app.listen(PORT, () => {
            console.log(`🚀 SD Inventory API server running on port ${PORT}`);
            console.log(`📊 Health check: http://localhost:${PORT}/health`);
            console.log(`🔗 API base URL: http://localhost:${PORT}/api`);
            console.log(`🏢 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🌐 CORS origin: ${corsOptions.origin}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

process.on('SIGTERM', async () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    await database.close();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('Received SIGINT, shutting down gracefully...');
    await database.close();
    process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

startServer();