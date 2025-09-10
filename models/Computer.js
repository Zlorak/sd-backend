const { v4: uuidv4 } = require('uuid');
const database = require('../database/connection');
const SerialNumber = require('./SerialNumber');

class Computer {
    constructor(data = {}) {
        this.id = data.id || uuidv4();
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
            ? 'SELECT * FROM computers WHERE office = ? ORDER BY created_at DESC'
            : 'SELECT * FROM computers ORDER BY created_at DESC';
        
        const params = office ? [office] : [];
        const rows = await database.all(sql, params);
        
        const computers = [];
        for (const row of rows) {
            const computer = new Computer(row);
            computer.serial_numbers = await SerialNumber.findByItemId(computer.id);
            computers.push(computer);
        }
        
        return computers;
    }

    static async findById(id) {
        const sql = 'SELECT * FROM computers WHERE id = ?';
        const row = await database.get(sql, [id]);
        
        if (!row) return null;
        
        const computer = new Computer(row);
        computer.serial_numbers = await SerialNumber.findByItemId(computer.id);
        
        return computer;
    }

    static async findBySerialNumber(serialNumber) {
        const serial = await SerialNumber.findBySerialNumber(serialNumber);
        if (!serial) return null;
        
        return await Computer.findById(serial.item_id);
    }

    async save() {
        const existingComputer = await Computer.findById(this.id);
        
        if (existingComputer) {
            return this.update();
        } else {
            return this.create();
        }
    }

    async create() {
        const sql = `
            INSERT INTO computers (id, make, model, quantity, office, status)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        const params = [
            this.id,
            this.make,
            this.model,
            this.quantity,
            this.office,
            this.status
        ];

        await database.run(sql, params);
        
        // Create serial numbers if provided
        if (this.serial_numbers && this.serial_numbers.length > 0) {
            await SerialNumber.createMultiple('computer', this.id, this.serial_numbers);
        }
        
        const created = await Computer.findById(this.id);
        Object.assign(this, created);
        
        return this;
    }

    async update() {
        const sql = `
            UPDATE computers 
            SET make = ?, model = ?, quantity = ?, office = ?, status = ?
            WHERE id = ?
        `;
        
        const params = [
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
                await SerialNumber.createMultiple('computer', this.id, this.serial_numbers);
            }
        }
        
        const updated = await Computer.findById(this.id);
        Object.assign(this, updated);
        
        return this;
    }

    async delete() {
        // First delete associated serial numbers
        await SerialNumber.deleteByItemId(this.id);
        
        // Then delete the computer record
        const sql = 'DELETE FROM computers WHERE id = ?';
        const result = await database.run(sql, [this.id]);
        
        return result.changes > 0;
    }

    static async getCountsByOffice() {
        const sql = `
            SELECT office, COUNT(*) as total, SUM(quantity) as total_quantity
            FROM computers
            WHERE status = 'active'
            GROUP BY office
        `;
        
        return await database.all(sql);
    }

    static async searchByMakeOrModel(query, office = null) {
        const searchTerm = `%${query}%`;
        const sql = office
            ? `SELECT * FROM computers 
               WHERE (make LIKE ? OR model LIKE ?) AND office = ?
               ORDER BY created_at DESC`
            : `SELECT * FROM computers 
               WHERE make LIKE ? OR model LIKE ?
               ORDER BY created_at DESC`;
        
        const params = office ? [searchTerm, searchTerm, office] : [searchTerm, searchTerm];
        const rows = await database.all(sql, params);
        
        const computers = [];
        for (const row of rows) {
            const computer = new Computer(row);
            computer.serial_numbers = await SerialNumber.findByItemId(computer.id);
            computers.push(computer);
        }
        
        return computers;
    }

    toJSON() {
        return {
            id: this.id,
            make: this.make,
            model: this.model,
            quantity: this.quantity,
            office: this.office,
            status: this.status,
            created_at: this.created_at,
            updated_at: this.updated_at,
            serial_numbers: this.serial_numbers.map(sn => sn.toJSON ? sn.toJSON() : sn)
        };
    }
}

module.exports = Computer;