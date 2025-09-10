const express = require('express');
const Model = require('../models/Model');
const Make = require('../models/Make');
const { modelSchema } = require('../validators/schemas');
const { validate } = require('../middleware/validation');

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const { category, make_id } = req.query;
        const models = await Model.findAll(category, make_id);
        res.json({ success: true, data: models });
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
        const model = await Model.findById(req.params.id);
        if (!model) {
            return res.status(404).json({ success: false, error: 'Model not found' });
        }
        res.json({ success: true, data: model });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: 'Internal server error', 
            message: error.message 
        });
    }
});

router.post('/', validate(modelSchema), async (req, res) => {
    try {
        const make = await Make.findById(req.body.make_id);
        if (!make) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid make', 
                message: 'The specified make does not exist' 
            });
        }

        if (make.category !== req.body.category) {
            return res.status(400).json({ 
                success: false,
                error: 'Category mismatch', 
                message: 'Model category must match the make category' 
            });
        }

        const existingModel = await Model.findByName(req.body.name, req.body.make_id);
        if (existingModel) {
            return res.status(400).json({ 
                success: false,
                error: 'Model already exists', 
                message: `A model named "${req.body.name}" already exists for this make` 
            });
        }

        const model = new Model(req.body);
        const savedModel = await model.save();
        
        res.status(201).json({ success: true, data: savedModel });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: 'Internal server error', 
            message: error.message 
        });
    }
});

router.put('/:id', validate(modelSchema), async (req, res) => {
    try {
        const model = await Model.findById(req.params.id);
        if (!model) {
            return res.status(404).json({ success: false, error: 'Model not found' });
        }

        const make = await Make.findById(req.body.make_id);
        if (!make) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid make', 
                message: 'The specified make does not exist' 
            });
        }

        if (make.category !== req.body.category) {
            return res.status(400).json({ 
                success: false,
                error: 'Category mismatch', 
                message: 'Model category must match the make category' 
            });
        }

        const existingModel = await Model.findByName(req.body.name, req.body.make_id);
        if (existingModel && existingModel.id !== req.params.id) {
            return res.status(400).json({ 
                success: false,
                error: 'Model already exists', 
                message: `A model named "${req.body.name}" already exists for this make` 
            });
        }

        Object.assign(model, req.body);
        const updatedModel = await model.save();
        
        res.json({ success: true, data: updatedModel });
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
        const model = await Model.findById(req.params.id);
        if (!model) {
            return res.status(404).json({ success: false, error: 'Model not found' });
        }

        const deleted = await model.delete();
        if (deleted) {
            res.json({ success: true, message: 'Model deleted successfully' });
        } else {
            res.status(400).json({ success: false, error: 'Failed to delete model' });
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