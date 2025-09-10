const { v4: uuidv4 } = require('uuid');
const database = require('../database/connection');

class SerialNumber {
    constructor(data = {}) {
        this.id = data.id || uuidv4();
        this.item_type = data.item_type;
        this.item_id = data.item_id;
        this.serial_number = data.serial_number;
        this.status = data.status || 'active';
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    static async findAll(itemType = null, itemId = null) {
        let sql = 'SELECT * FROM serial_numbers';
        const params = [];
        const conditions = [];

        if (itemType) {
            conditions.push('item_type = ?');
            params.push(itemType);
        }

        if (itemId) {
            conditions.push('item_id = ?');
            params.push(itemId);
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        sql += ' ORDER BY created_at DESC';

        const rows = await database.all(sql, params);
        return rows.map(row => new SerialNumber(row));
    }

    static async findById(id) {
        const sql = 'SELECT * FROM serial_numbers WHERE id = ?';
        const row = await database.get(sql, [id]);
        return row ? new SerialNumber(row) : null;
    }

    static async findBySerialNumber(serialNumber) {
        const sql = 'SELECT * FROM serial_numbers WHERE serial_number = ?';
        const row = await database.get(sql, [serialNumber]);
        return row ? new SerialNumber(row) : null;
    }

    static async findByItemId(itemId) {
        const sql = 'SELECT * FROM serial_numbers WHERE item_id = ? ORDER BY created_at ASC';
        const rows = await database.all(sql, [itemId]);
        return rows.map(row => new SerialNumber(row));
    }

    async save() {
        const existingSerialNumber = await SerialNumber.findById(this.id);
        
        if (existingSerialNumber) {
            return this.update();
        } else {
            return this.create();
        }
    }

    async create() {
        const sql = `
            INSERT INTO serial_numbers (id, item_type, item_id, serial_number, status)
            VALUES (?, ?, ?, ?, ?)
        `;
        
        const params = [
            this.id,
            this.item_type,
            this.item_id,
            this.serial_number,
            this.status
        ];

        await database.run(sql, params);
        
        const created = await SerialNumber.findById(this.id);
        Object.assign(this, created);
        
        return this;
    }

    async update() {
        const sql = `
            UPDATE serial_numbers 
            SET item_type = ?, item_id = ?, serial_number = ?, status = ?
            WHERE id = ?
        `;
        
        const params = [
            this.item_type,
            this.item_id,
            this.serial_number,
            this.status,
            this.id
        ];

        await database.run(sql, params);
        
        const updated = await SerialNumber.findById(this.id);
        Object.assign(this, updated);
        
        return this;
    }

    async delete() {
        const sql = 'DELETE FROM serial_numbers WHERE id = ?';
        const result = await database.run(sql, [this.id]);
        return result.changes > 0;
    }

    static async deleteByItemId(itemId) {
        const sql = 'DELETE FROM serial_numbers WHERE item_id = ?';
        const result = await database.run(sql, [itemId]);
        return result.changes;
    }

    static async createMultiple(itemType, itemId, serialNumbers) {
        if (!serialNumbers || serialNumbers.length === 0) {
            return [];
        }

        const serialNumberObjects = [];
        
        for (const serialNumber of serialNumbers) {
            if (serialNumber && serialNumber.trim()) {
                const obj = new SerialNumber({
                    item_type: itemType,
                    item_id: itemId,
                    serial_number: serialNumber.trim()
                });
                await obj.create();
                serialNumberObjects.push(obj);
            }
        }

        return serialNumberObjects;
    }

    toJSON() {
        return {
            id: this.id,
            item_type: this.item_type,
            item_id: this.item_id,
            serial_number: this.serial_number,
            status: this.status,
            created_at: this.created_at,
            updated_at: this.updated_at
        };
    }
}

module.exports = SerialNumber;