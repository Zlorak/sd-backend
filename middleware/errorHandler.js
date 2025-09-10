const errorHandler = (err, req, res, _next) => {
    console.error('Error occurred:', {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        body: req.body,
        params: req.params,
        query: req.query
    });

    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return res.status(400).json({
            success: false,
            error: 'Duplicate entry',
            message: 'A record with this value already exists'
        });
    }

    if (err.code === 'SQLITE_CONSTRAINT_CHECK') {
        return res.status(400).json({
            success: false,
            error: 'Constraint violation',
            message: 'Invalid value provided'
        });
    }

    if (err.code === 'SQLITE_CONSTRAINT_FOREIGN_KEY') {
        return res.status(400).json({
            success: false,
            error: 'Foreign key constraint',
            message: 'Referenced record does not exist'
        });
    }

    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            error: 'Validation error',
            message: err.message
        });
    }

    if (err.status && err.status < 500) {
        return res.status(err.status).json({
            success: false,
            error: err.message || 'Bad request'
        });
    }

    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
};

const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found',
        message: `Cannot ${req.method} ${req.originalUrl}`
    });
};

module.exports = {
    errorHandler,
    notFoundHandler
};