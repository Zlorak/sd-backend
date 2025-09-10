const express = require('express');
const PrinterItem = require('../models/PrinterItem');
const { printerItemSchema, printerItemUpdateSchema, querySchema, uuidSchema } = require('../validators/schemas');
const { validate, validateParams } = require('../middleware/validation');

const router = express.Router();

router.get('/', validate(querySchema, 'query'), async (req, res) => {
    try {
        const { office } = req.query;
        const printerItems = await PrinterItem.findAll(office);

        res.json({
            success: true,
            data: printerItems,
            count: printerItems.length
        });
    } catch (error) {
        console.error('Error fetching printer items:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch printer items',
            message: error.message
        });
    }
});

router.get('/counts', validate(querySchema, 'query'), async (req, res) => {
    try {
        const counts = await PrinterItem.getCountsByOffice();
        
        res.json({
            success: true,
            data: counts
        });
    } catch (error) {
        console.error('Error fetching printer item counts:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch printer item counts',
            message: error.message
        });
    }
});

router.get('/by-type/:type', async (req, res) => {
    try {
        const { type } = req.params;
        const { office } = req.query;
        const items = await PrinterItem.findByType(type, office);

        res.json({
            success: true,
            data: items,
            count: items.length
        });
    } catch (error) {
        console.error('Error fetching printer items by type:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch printer items by type',
            message: error.message
        });
    }
});

router.get('/:id', validateParams(uuidSchema), async (req, res) => {
    try {
        const { id } = req.params;
        const printerItem = await PrinterItem.findById(id);

        if (!printerItem) {
            return res.status(404).json({
                success: false,
                error: 'Printer item not found'
            });
        }

        res.json({
            success: true,
            data: printerItem
        });
    } catch (error) {
        console.error('Error fetching printer item:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch printer item',
            message: error.message
        });
    }
});

router.post('/', validate(printerItemSchema), async (req, res) => {
    try {
        const printerItemData = req.body;
        const printerItem = new PrinterItem(printerItemData);
        await printerItem.save();

        res.status(201).json({
            success: true,
            data: printerItem,
            message: 'Printer item created successfully'
        });
    } catch (error) {
        console.error('Error creating printer item:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create printer item',
            message: error.message
        });
    }
});

router.put('/:id', validateParams(uuidSchema), validate(printerItemUpdateSchema), async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const printerItem = await PrinterItem.findById(id);
        if (!printerItem) {
            return res.status(404).json({
                success: false,
                error: 'Printer item not found'
            });
        }

        Object.assign(printerItem, updateData);
        await printerItem.update();

        res.json({
            success: true,
            data: printerItem,
            message: 'Printer item updated successfully'
        });
    } catch (error) {
        console.error('Error updating printer item:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update printer item',
            message: error.message
        });
    }
});

router.delete('/:id', validateParams(uuidSchema), async (req, res) => {
    try {
        const { id } = req.params;
        
        const printerItem = await PrinterItem.findById(id);
        if (!printerItem) {
            return res.status(404).json({
                success: false,
                error: 'Printer item not found'
            });
        }

        const deleted = await printerItem.delete();
        
        if (deleted) {
            res.json({
                success: true,
                message: 'Printer item deleted successfully'
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Failed to delete printer item'
            });
        }
    } catch (error) {
        console.error('Error deleting printer item:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete printer item',
            message: error.message
        });
    }
});

module.exports = router;