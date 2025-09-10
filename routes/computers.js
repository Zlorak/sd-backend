const express = require('express');
const Computer = require('../models/Computer');
const SerialNumber = require('../models/SerialNumber');
const { computerSchema, computerUpdateSchema, querySchema, uuidSchema } = require('../validators/schemas');
const { validate, validateParams } = require('../middleware/validation');

const router = express.Router();

router.get('/', validate(querySchema, 'query'), async (req, res) => {
    try {
        const { office, search } = req.query;
        let computers;

        if (search) {
            computers = await Computer.searchByMakeOrModel(search, office);
        } else {
            computers = await Computer.findAll(office);
        }

        res.json({
            success: true,
            data: computers,
            count: computers.length
        });
    } catch (error) {
        console.error('Error fetching computers:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch computers',
            message: error.message
        });
    }
});

router.get('/counts', validate(querySchema, 'query'), async (req, res) => {
    try {
        const counts = await Computer.getCountsByOffice();
        
        res.json({
            success: true,
            data: counts
        });
    } catch (error) {
        console.error('Error fetching computer counts:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch computer counts',
            message: error.message
        });
    }
});

router.get('/:id', validateParams(uuidSchema), async (req, res) => {
    try {
        const { id } = req.params;
        const computer = await Computer.findById(id);

        if (!computer) {
            return res.status(404).json({
                success: false,
                error: 'Computer not found'
            });
        }

        res.json({
            success: true,
            data: computer
        });
    } catch (error) {
        console.error('Error fetching computer:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch computer',
            message: error.message
        });
    }
});

router.post('/', validate(computerSchema), async (req, res) => {
    try {
        const computerData = req.body;

        // Check for duplicate serial numbers
        if (computerData.serial_numbers && computerData.serial_numbers.length > 0) {
            for (const serialNumber of computerData.serial_numbers) {
                if (serialNumber && serialNumber.trim()) {
                    const existing = await SerialNumber.findBySerialNumber(serialNumber.trim());
                    if (existing) {
                        return res.status(400).json({
                            success: false,
                            error: `Serial number '${serialNumber}' already exists`
                        });
                    }
                }
            }
        }

        const computer = new Computer(computerData);
        await computer.save();

        res.status(201).json({
            success: true,
            data: computer,
            message: 'Computer created successfully'
        });
    } catch (error) {
        console.error('Error creating computer:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create computer',
            message: error.message
        });
    }
});

router.put('/:id', validateParams(uuidSchema), validate(computerUpdateSchema), async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const computer = await Computer.findById(id);
        if (!computer) {
            return res.status(404).json({
                success: false,
                error: 'Computer not found'
            });
        }

        // Check for duplicate serial numbers (excluding current computer's serial numbers)
        if (updateData.serial_numbers && updateData.serial_numbers.length > 0) {
            const currentSerialNumbers = computer.serial_numbers.map(sn => sn.serial_number);
            for (const serialNumber of updateData.serial_numbers) {
                if (serialNumber && serialNumber.trim() && !currentSerialNumbers.includes(serialNumber.trim())) {
                    const existing = await SerialNumber.findBySerialNumber(serialNumber.trim());
                    if (existing) {
                        return res.status(400).json({
                            success: false,
                            error: `Serial number '${serialNumber}' already exists`
                        });
                    }
                }
            }
        }

        Object.assign(computer, updateData);
        await computer.update();

        res.json({
            success: true,
            data: computer,
            message: 'Computer updated successfully'
        });
    } catch (error) {
        console.error('Error updating computer:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update computer',
            message: error.message
        });
    }
});

router.delete('/:id', validateParams(uuidSchema), async (req, res) => {
    try {
        const { id } = req.params;
        
        const computer = await Computer.findById(id);
        if (!computer) {
            return res.status(404).json({
                success: false,
                error: 'Computer not found'
            });
        }

        const deleted = await computer.delete();
        
        if (deleted) {
            res.json({
                success: true,
                message: 'Computer deleted successfully'
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Failed to delete computer'
            });
        }
    } catch (error) {
        console.error('Error deleting computer:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete computer',
            message: error.message
        });
    }
});

module.exports = router;