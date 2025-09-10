const { v4: uuidv4 } = require('uuid');
const database = require('../database/connection');

class PrinterItem {
    constructor(data = {}) {
        this.id = data.id || uuidv4();
        this.item_type = data.item_type;
        this.make = data.make;
        this.model = data.model;
        this.quantity = data.quantity || 1;
        this.office = data.office;
        this.status = data.status || 'active';
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    static async findAll(office = null) {
        const sql = office 
            ? 'SELECT * FROM printer_items WHERE office = ? ORDER BY created_at DESC'
            : 'SELECT * FROM printer_items ORDER BY created_at DESC';
        
        const params = office ? [office] : [];
        const rows = await database.all(sql, params);
        
        return rows.map(row => new PrinterItem(row));
    }

    static async findById(id) {
        const sql = 'SELECT * FROM printer_items WHERE id = ?';
        const row = await database.get(sql, [id]);
        
        return row ? new PrinterItem(row) : null;
    }

    async save() {
        const existingItem = await PrinterItem.findById(this.id);
        
        if (existingItem) {
            return this.update();
        } else {
            return this.create();
        }
    }

    async create() {
        const sql = `
            INSERT INTO printer_items (id, item_type, make, model, quantity, office, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        
        const params = [
            this.id,
            this.item_type,
            this.make,
            this.model,
            this.quantity,
            this.office,
            this.status
        ];

        await database.run(sql, params);
        
        const created = await PrinterItem.findById(this.id);
        Object.assign(this, created);
        
        return this;
    }

    async update() {
        const sql = `
            UPDATE printer_items 
            SET item_type = ?, make = ?, model = ?, quantity = ?, office = ?, status = ?
            WHERE id = ?
        `;
        
        const params = [
            this.item_type,
            this.make,
            this.model,
            this.quantity,
            this.office,
            this.status,
            this.id
        ];

        await database.run(sql, params);
        
        const updated = await PrinterItem.findById(this.id);
        Object.assign(this, updated);
        
        return this;
    }

    async delete() {
        const sql = 'DELETE FROM printer_items WHERE id = ?';
        const result = await database.run(sql, [this.id]);
        
        return result.changes > 0;
    }

    static async getCountsByOffice() {
        const sql = `
            SELECT office, COUNT(*) as total, SUM(quantity) as total_quantity
            FROM printer_items
            WHERE status = 'active'
            GROUP BY office
        `;
        
        return await database.all(sql);
    }

    static async findByType(itemType, office = null) {
        const sql = office
            ? `SELECT * FROM printer_items 
               WHERE item_type = ? AND office = ?
               ORDER BY created_at DESC`
            : `SELECT * FROM printer_items 
               WHERE item_type = ?
               ORDER BY created_at DESC`;
        
        const params = office ? [itemType, office] : [itemType];
        const rows = await database.all(sql, params);
        
        return rows.map(row => new PrinterItem(row));
    }

    toJSON() {
        return {
            id: this.id,
            item_type: this.item_type,
            make: this.make,
            model: this.model,
            quantity: this.quantity,
            office: this.office,
            status: this.status,
            created_at: this.created_at,
            updated_at: this.updated_at
        };
    }
}

module.exports = PrinterItem;