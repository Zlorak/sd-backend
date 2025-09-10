const express = require('express');
const Make = require('../models/Make');
const { makeSchema } = require('../validators/schemas');
const { validate } = require('../middleware/validation');

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const { category } = req.query;
        const makes = await Make.findAll(category);
        res.json({ success: true, data: makes });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: 'Internal server error', 
            message: error.message 
        });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const make = await Make.findById(req.params.id);
        if (!make) {
            return res.status(404).json({ success: false, error: 'Make not found' });
        }
        res.json({ success: true, data: make });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: 'Internal server error', 
            message: error.message 
        });
    }
});

router.post('/', validate(makeSchema), async (req, res) => {
    try {
        const existingMake = await Make.findByName(req.body.name, req.body.category);
        if (existingMake) {
            return res.status(400).json({ 
                success: false,
                error: 'Make already exists', 
                message: `A make named "${req.body.name}" already exists in the ${req.body.category} category` 
            });
        }

        const make = new Make(req.body);
        const savedMake = await make.save();
        
        res.status(201).json({ success: true, data: savedMake });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: 'Internal server error', 
            message: error.message 
        });
    }
});

router.put('/:id', validate(makeSchema), async (req, res) => {
    try {
        const make = await Make.findById(req.params.id);
        if (!make) {
            return res.status(404).json({ success: false, error: 'Make not found' });
        }

        const existingMake = await Make.findByName(req.body.name, req.body.category);
        if (existingMake && existingMake.id !== req.params.id) {
            return res.status(400).json({ 
                success: false,
                error: 'Make already exists', 
                message: `A make named "${req.body.name}" already exists in the ${req.body.category} category` 
            });
        }

        Object.assign(make, req.body);
        const updatedMake = await make.save();
        
        res.json({ success: true, data: updatedMake });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: 'Internal server error', 
            message: error.message 
        });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const make = await Make.findById(req.params.id);
        if (!make) {
            return res.status(404).json({ success: false, error: 'Make not found' });
        }

        const deleted = await make.delete();
        if (deleted) {
            res.json({ success: true, message: 'Make deleted successfully' });
        } else {
            res.status(400).json({ success: false, error: 'Failed to delete make' });
        }
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: 'Internal server error', 
            message: error.message 
        });
    }
});

module.exports = router;