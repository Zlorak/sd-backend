const express = require('express');
const RestockRequest = require('../models/RestockRequest');
const { restockRequestSchema, restockRequestUpdateSchema, restockQuerySchema, uuidSchema } = require('../validators/schemas');
const { validate, validateParams } = require('../middleware/validation');

const router = express.Router();

router.get('/', validate(restockQuerySchema, 'query'), async (req, res) => {
    try {
        const { office, status, priority, item_category } = req.query;
        const requests = await RestockRequest.findAll(office, status, priority, item_category);

        res.json({
            success: true,
            data: requests,
            count: requests.length
        });
    } catch (error) {
        console.error('Error fetching restock requests:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch restock requests',
            message: error.message
        });
    }
});

router.get('/status-counts', validate(restockQuerySchema, 'query'), async (req, res) => {
    try {
        const { office } = req.query;
        const counts = await RestockRequest.getStatusCounts(office);
        
        res.json({
            success: true,
            data: counts
        });
    } catch (error) {
        console.error('Error fetching restock request status counts:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch restock request status counts',
            message: error.message
        });
    }
});

router.get('/pending-priority', validate(restockQuerySchema, 'query'), async (req, res) => {
    try {
        const { office } = req.query;
        const counts = await RestockRequest.getPendingByPriority(office);
        
        res.json({
            success: true,
            data: counts
        });
    } catch (error) {
        console.error('Error fetching pending restock requests by priority:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch pending restock requests by priority',
            message: error.message
        });
    }
});

router.get('/:id', validateParams(uuidSchema), async (req, res) => {
    try {
        const { id } = req.params;
        const request = await RestockRequest.findById(id);

        if (!request) {
            return res.status(404).json({
                success: false,
                error: 'Restock request not found'
            });
        }

        res.json({
            success: true,
            data: request
        });
    } catch (error) {
        console.error('Error fetching restock request:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch restock request',
            message: error.message
        });
    }
});

router.post('/', validate(restockRequestSchema), async (req, res) => {
    try {
        const requestData = req.body;
        const request = new RestockRequest(requestData);
        await request.save();

        res.status(201).json({
            success: true,
            data: request,
            message: 'Restock request created successfully'
        });
    } catch (error) {
        console.error('Error creating restock request:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create restock request',
            message: error.message
        });
    }
});

router.put('/:id', validateParams(uuidSchema), validate(restockRequestUpdateSchema), async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const request = await RestockRequest.findById(id);
        if (!request) {
            return res.status(404).json({
                success: false,
                error: 'Restock request not found'
            });
        }

        Object.assign(request, updateData);
        await request.update();

        res.json({
            success: true,
            data: request,
            message: 'Restock request updated successfully'
        });
    } catch (error) {
        console.error('Error updating restock request:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update restock request',
            message: error.message
        });
    }
});

router.delete('/:id', validateParams(uuidSchema), async (req, res) => {
    try {
        const { id } = req.params;
        
        const request = await RestockRequest.findById(id);
        if (!request) {
            return res.status(404).json({
                success: false,
                error: 'Restock request not found'
            });
        }

        const deleted = await request.delete();
        
        if (deleted) {
            res.json({
                success: true,
                message: 'Restock request deleted successfully'
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Failed to delete restock request'
            });
        }
    } catch (error) {
        console.error('Error deleting restock request:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete restock request',
            message: error.message
        });
    }
});

module.exports = router;