const express = require('express');
const Peripheral = require('../models/Peripheral');
const SerialNumber = require('../models/SerialNumber');
const { peripheralSchema, peripheralUpdateSchema, querySchema, uuidSchema } = require('../validators/schemas');
const { validate, validateParams } = require('../middleware/validation');

const router = express.Router();

router.get('/', validate(querySchema, 'query'), async (req, res) => {
    try {
        const { office, search } = req.query;
        let peripherals;

        if (search) {
            peripherals = await Peripheral.searchByName(search, office);
        } else {
            peripherals = await Peripheral.findAll(office);
        }

        res.json({
            success: true,
            data: peripherals,
            count: peripherals.length
        });
    } catch (error) {
        console.error('Error fetching peripherals:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch peripherals',
            message: error.message
        });
    }
});

router.get('/counts', validate(querySchema, 'query'), async (req, res) => {
    try {
        const counts = await Peripheral.getCountsByOffice();
        
        res.json({
            success: true,
            data: counts
        });
    } catch (error) {
        console.error('Error fetching peripheral counts:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch peripheral counts',
            message: error.message
        });
    }
});

router.get('/:id', validateParams(uuidSchema), async (req, res) => {
    try {
        const { id } = req.params;
        const peripheral = await Peripheral.findById(id);

        if (!peripheral) {
            return res.status(404).json({
                success: false,
                error: 'Peripheral not found'
            });
        }

        res.json({
            success: true,
            data: peripheral
        });
    } catch (error) {
        console.error('Error fetching peripheral:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch peripheral',
            message: error.message
        });
    }
});

router.post('/', validate(peripheralSchema), async (req, res) => {
    try {
        const peripheralData = req.body;

        // Check for duplicate serial numbers
        if (peripheralData.serial_numbers && peripheralData.serial_numbers.length > 0) {
            for (const serialNumber of peripheralData.serial_numbers) {
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

        const peripheral = new Peripheral(peripheralData);
        await peripheral.save();

        res.status(201).json({
            success: true,
            data: peripheral,
            message: 'Peripheral created successfully'
        });
    } catch (error) {
        console.error('Error creating peripheral:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create peripheral',
            message: error.message
        });
    }
});

router.put('/:id', validateParams(uuidSchema), validate(peripheralUpdateSchema), async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const peripheral = await Peripheral.findById(id);
        if (!peripheral) {
            return res.status(404).json({
                success: false,
                error: 'Peripheral not found'
            });
        }

        // Check for duplicate serial numbers (excluding current peripheral's serial numbers)
        if (updateData.serial_numbers && updateData.serial_numbers.length > 0) {
            const currentSerialNumbers = peripheral.serial_numbers.map(sn => sn.serial_number);
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

        Object.assign(peripheral, updateData);
        await peripheral.update();

        res.json({
            success: true,
            data: peripheral,
            message: 'Peripheral updated successfully'
        });
    } catch (error) {
        console.error('Error updating peripheral:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update peripheral',
            message: error.message
        });
    }
});

router.delete('/:id', validateParams(uuidSchema), async (req, res) => {
    try {
        const { id } = req.params;
        
        const peripheral = await Peripheral.findById(id);
        if (!peripheral) {
            return res.status(404).json({
                success: false,
                error: 'Peripheral not found'
            });
        }

        const deleted = await peripheral.delete();
        
        if (deleted) {
            res.json({
                success: true,
                message: 'Peripheral deleted successfully'
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Failed to delete peripheral'
            });
        }
    } catch (error) {
        console.error('Error deleting peripheral:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete peripheral',
            message: error.message
        });
    }
});

module.exports = router;