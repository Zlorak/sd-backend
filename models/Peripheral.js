const { v4: uuidv4 } = require('uuid');
const database = require('../database/connection');
const SerialNumber = require('./SerialNumber');

class Peripheral {
    constructor(data = {}) {
        this.id = data.id || uuidv4();
        this.item_name = data.item_name;
        this.make = data.make;
        this.model = data.model;
        this.quantity = data.quantity || 1;
        this.office = data.office;
        this.status = data.status || 'active';
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
        this.serial_numbers = data.serial_numbers || [];
    }

    static async findAll(office = null) {
        const sql = office 
            ? 'SELECT * FROM peripherals WHERE office = ? ORDER BY created_at DESC'
            : 'SELECT * FROM peripherals ORDER BY created_at DESC';
        
        const params = office ? [office] : [];
        const rows = await database.all(sql, params);
        
        const peripherals = rows.map(row => new Peripheral(row));
        
        // Load serial numbers for each peripheral
        for (const peripheral of peripherals) {
            peripheral.serial_numbers = await SerialNumber.findByItemId(peripheral.id);
        }
        
        return peripherals;
    }

    static async findById(id) {
        const sql = 'SELECT * FROM peripherals WHERE id = ?';
        const row = await database.get(sql, [id]);
        
        if (!row) return null;
        
        const peripheral = new Peripheral(row);
        peripheral.serial_numbers = await SerialNumber.findByItemId(peripheral.id);
        
        return peripheral;
    }

    static async findBySerialNumber(serialNumber) {
        const serial = await SerialNumber.findBySerialNumber(serialNumber);
        if (!serial || serial.item_type !== 'peripheral') return null;
        
        return await Peripheral.findById(serial.item_id);
    }

    async save() {
        const existingPeripheral = await Peripheral.findById(this.id);
        
        if (existingPeripheral) {
            return this.update();
        } else {
            return this.create();
        }
    }

    async create() {
        const sql = `
            INSERT INTO peripherals (id, item_name, make, model, quantity, office, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        
        const params = [
            this.id,
            this.item_name,
            this.make,
            this.model,
            this.quantity,
            this.office,
            this.status
        ];

        await database.run(sql, params);
        
        // Create serial numbers if provided
        if (this.serial_numbers && this.serial_numbers.length > 0) {
            await SerialNumber.createMultiple('peripheral', this.id, this.serial_numbers);
        }
        
        const created = await Peripheral.findById(this.id);
        Object.assign(this, created);
        
        return this;
    }

    async update() {
        const sql = `
            UPDATE peripherals 
            SET item_name = ?, make = ?, model = ?, quantity = ?, office = ?, status = ?
            WHERE id = ?
        `;
        
        const params = [
            this.item_name,
            this.make,
            this.model,
            this.quantity,
            this.office,
            this.status,
            this.id
        ];

        await database.run(sql, params);
        
        // Update serial numbers - delete existing ones and create new ones
        if (this.serial_numbers !== undefined) {
            await SerialNumber.deleteByItemId(this.id);
            if (this.serial_numbers && this.serial_numbers.length > 0) {
                await SerialNumber.createMultiple('peripheral', this.id, this.serial_numbers);
            }
        }
        
        const updated = await Peripheral.findById(this.id);
        Object.assign(this, updated);
        
        return this;
    }

    async delete() {
        // First delete associated serial numbers
        await SerialNumber.deleteByItemId(this.id);
        
        // Then delete the peripheral record
        const sql = 'DELETE FROM peripherals WHERE id = ?';
        const result = await database.run(sql, [this.id]);
        
        return result.changes > 0;
    }

    static async getCountsByOffice() {
        const sql = `
            SELECT office, COUNT(*) as total, SUM(quantity) as total_quantity
            FROM peripherals
            WHERE status = 'active'
            GROUP BY office
        `;
        
        return await database.all(sql);
    }

    static async searchByName(query, office = null) {
        const searchTerm = `%${query}%`;
        const sql = office
            ? `SELECT * FROM peripherals 
               WHERE item_name LIKE ? AND office = ?
               ORDER BY created_at DESC`
            : `SELECT * FROM peripherals 
               WHERE item_name LIKE ?
               ORDER BY created_at DESC`;
        
        const params = office ? [searchTerm, office] : [searchTerm];
        const rows = await database.all(sql, params);
        
        const peripherals = rows.map(row => new Peripheral(row));
        
        // Load serial numbers for each peripheral
        for (const peripheral of peripherals) {
            peripheral.serial_numbers = await SerialNumber.findByItemId(peripheral.id);
        }
        
        return peripherals;
    }

    toJSON() {
        return {
            id: this.id,
            item_name: this.item_name,
            make: this.make,
            model: this.model,
            quantity: this.quantity,
            office: this.office,
            status: this.status,
            created_at: this.created_at,
            updated_at: this.updated_at,
            serial_numbers: this.serial_numbers || []
        };
    }
}

module.exports = Peripheral;