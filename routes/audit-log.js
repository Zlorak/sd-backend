const express = require('express');
const AuditLog = require('../models/AuditLog');
const { auditLogQuerySchema } = require('../validators/schemas');
const { validate } = require('../middleware/validation');

const router = express.Router();

router.get('/', validate(auditLogQuerySchema, 'query'), async (req, res) => {
    try {
        const { office, table_name, limit } = req.query;
        const logs = await AuditLog.findAll(office, table_name, limit);

        res.json({
            success: true,
            data: logs,
            count: logs.length
        });
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch audit logs',
            message: error.message
        });
    }
});

router.get('/recent', validate(auditLogQuerySchema, 'query'), async (req, res) => {
    try {
        const { office, days = 7, limit = 50 } = req.query;
        const logs = await AuditLog.getRecentActivity(office, days, limit);

        res.json({
            success: true,
            data: logs,
            count: logs.length
        });
    } catch (error) {
        console.error('Error fetching recent audit logs:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch recent audit logs',
            message: error.message
        });
    }
});

router.get('/action-counts', validate(auditLogQuerySchema, 'query'), async (req, res) => {
    try {
        const { office, days = 30 } = req.query;
        const counts = await AuditLog.getActionCounts(office, days);
        
        res.json({
            success: true,
            data: counts
        });
    } catch (error) {
        console.error('Error fetching audit log action counts:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch audit log action counts',
            message: error.message
        });
    }
});

router.get('/table-activity', validate(auditLogQuerySchema, 'query'), async (req, res) => {
    try {
        const { office, days = 30 } = req.query;
        const activity = await AuditLog.getTableActivity(office, days);
        
        res.json({
            success: true,
            data: activity
        });
    } catch (error) {
        console.error('Error fetching audit log table activity:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch audit log table activity',
            message: error.message
        });
    }
});

router.get('/:tableName/:recordId', async (req, res) => {
    try {
        const { tableName, recordId } = req.params;
        const logs = await AuditLog.findByRecord(tableName, recordId);

        res.json({
            success: true,
            data: logs,
            count: logs.length
        });
    } catch (error) {
        console.error('Error fetching audit logs for record:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch audit logs for record',
            message: error.message
        });
    }
});

module.exports = router;