const express = require('express');
const database = require('../database/connection');
const { validate } = require('../middleware/validation');
const { querySchema } = require('../validators/schemas');

const router = express.Router();

// Inventory summary report
router.get('/inventory-summary', validate(querySchema, 'query'), async (req, res) => {
    try {
        const { office } = req.query;

        // Build office filter
        const officeFilter = office ? 'WHERE office = ?' : '';
        const params = office ? [office] : [];

        // Get counts for each inventory type
        const computers = await database.all(`
            SELECT 
                office,
                COUNT(*) as total_items,
                SUM(quantity) as total_quantity,
                COUNT(CASE WHEN status = 'active' THEN 1 END) as active_items
            FROM computers 
            ${officeFilter}
            GROUP BY office
        `, params);

        const peripherals = await database.all(`
            SELECT 
                office,
                COUNT(*) as total_items,
                SUM(quantity) as total_quantity,
                COUNT(CASE WHEN status = 'active' THEN 1 END) as active_items
            FROM peripherals 
            ${officeFilter}
            GROUP BY office
        `, params);

        const printerItems = await database.all(`
            SELECT 
                office,
                COUNT(*) as total_items,
                SUM(quantity) as total_quantity,
                COUNT(CASE WHEN status = 'active' THEN 1 END) as active_items
            FROM printer_items 
            ${officeFilter}
            GROUP BY office
        `, params);

        // Get overall totals
        const totalCounts = await database.all(`
            SELECT 
                'computers' as category,
                office,
                COUNT(*) as total_items,
                SUM(quantity) as total_quantity
            FROM computers ${officeFilter}
            GROUP BY office
            UNION ALL
            SELECT 
                'peripherals' as category,
                office,
                COUNT(*) as total_items,
                SUM(quantity) as total_quantity
            FROM peripherals ${officeFilter}
            GROUP BY office
            UNION ALL
            SELECT 
                'printer_items' as category,
                office,
                COUNT(*) as total_items,
                SUM(quantity) as total_quantity
            FROM printer_items ${officeFilter}
            GROUP BY office
        `, params);

        res.json({
            success: true,
            data: {
                computers: computers || [],
                peripherals: peripherals || [],
                printer_items: printerItems || [],
                totals: totalCounts || []
            }
        });
    } catch (error) {
        console.error('Error generating inventory summary:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate inventory summary',
            message: error.message
        });
    }
});

// Restock requests report
router.get('/restock-requests', validate(querySchema, 'query'), async (req, res) => {
    try {
        const { office } = req.query;

        const officeFilter = office ? 'WHERE office = ?' : '';
        const params = office ? [office] : [];

        // Get restock request statistics
        const restockStats = await database.all(`
            SELECT 
                status,
                priority,
                office,
                COUNT(*) as count,
                SUM(quantity_requested) as total_quantity
            FROM restock_requests 
            ${officeFilter}
            GROUP BY status, priority, office
            ORDER BY office, priority DESC, status
        `, params);

        // Get recent restock requests
        const recentRequests = await database.all(`
            SELECT 
                id,
                item_category,
                item_description,
                quantity_requested,
                office,
                priority,
                status,
                requested_by,
                created_at
            FROM restock_requests 
            ${officeFilter}
            ORDER BY created_at DESC 
            LIMIT 20
        `, params);

        res.json({
            success: true,
            data: {
                statistics: restockStats,
                recent_requests: recentRequests
            }
        });
    } catch (error) {
        console.error('Error generating restock report:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate restock report',
            message: error.message
        });
    }
});

// Activity report (audit log)
router.get('/activity', validate(querySchema, 'query'), async (req, res) => {
    try {
        const { office } = req.query;

        const officeFilter = office ? 'WHERE office = ?' : '';
        const params = office ? [office] : [];

        // Get recent activity
        const recentActivity = await database.all(`
            SELECT 
                table_name,
                action,
                office,
                timestamp,
                COUNT(*) as count
            FROM audit_log 
            ${officeFilter}
            WHERE timestamp >= datetime('now', '-30 days')
            GROUP BY table_name, action, office, date(timestamp)
            ORDER BY timestamp DESC 
            LIMIT 50
        `, params);

        // Get activity summary by table
        const activitySummary = await database.all(`
            SELECT 
                table_name,
                action,
                office,
                COUNT(*) as count,
                MAX(timestamp) as last_activity
            FROM audit_log 
            ${officeFilter}
            WHERE timestamp >= datetime('now', '-30 days')
            GROUP BY table_name, action, office
            ORDER BY table_name, office
        `, params);

        res.json({
            success: true,
            data: {
                recent_activity: recentActivity,
                summary: activitySummary
            }
        });
    } catch (error) {
        console.error('Error generating activity report:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate activity report',
            message: error.message
        });
    }
});

// Office comparison report
router.get('/office-comparison', async (req, res) => {
    try {

        // Get inventory counts by office
        const officeComparison = await database.all(`
            SELECT 
                office,
                'computers' as category,
                COUNT(*) as total_items,
                SUM(quantity) as total_quantity
            FROM computers 
            GROUP BY office
            UNION ALL
            SELECT 
                office,
                'peripherals' as category,
                COUNT(*) as total_items,
                SUM(quantity) as total_quantity
            FROM peripherals 
            GROUP BY office
            UNION ALL
            SELECT 
                office,
                'printer_items' as category,
                COUNT(*) as total_items,
                SUM(quantity) as total_quantity
            FROM printer_items 
            GROUP BY office
            ORDER BY office, category
        `);

        // Get restock requests by office
        const restockByOffice = await database.all(`
            SELECT 
                office,
                status,
                COUNT(*) as count
            FROM restock_requests
            GROUP BY office, status
            ORDER BY office, status
        `);

        res.json({
            success: true,
            data: {
                inventory_comparison: officeComparison,
                restock_comparison: restockByOffice
            }
        });
    } catch (error) {
        console.error('Error generating office comparison report:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate office comparison report',
            message: error.message
        });
    }
});

module.exports = router;