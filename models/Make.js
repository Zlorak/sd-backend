const { v4: uuidv4 } = require('uuid');
const database = require('../database/connection');

class Make {
    constructor(data = {}) {
        this.id = data.id || uuidv4();
        this.name = data.name;
        this.category = data.category;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    static async findAll(category = null) {
        const sql = category 
            ? 'SELECT * FROM makes WHERE category = ? ORDER BY name ASC'
            : 'SELECT * FROM makes ORDER BY name ASC';
        
        const params = category ? [category] : [];
        const rows = await database.all(sql, params);
        
        return rows.map(row => new Make(row));
    }

    static async findById(id) {
        const sql = 'SELECT * FROM makes WHERE id = ?';
        const row = await database.get(sql, [id]);
        
        return row ? new Make(row) : null;
    }

    static async findByName(name, category) {
        const sql = 'SELECT * FROM makes WHERE name = ? AND category = ?';
        const row = await database.get(sql, [name, category]);
        
        return row ? new Make(row) : null;
    }

    async save() {
        const existingMake = await Make.findById(this.id);
        
        if (existingMake) {
            return this.update();
        } else {
            return this.create();
        }
    }

    async create() {
        const sql = `
            INSERT INTO makes (id, name, category)
            VALUES (?, ?, ?)
        `;
        
        const params = [
            this.id,
            this.name,
            this.category
        ];

        await database.run(sql, params);
        
        const created = await Make.findById(this.id);
        Object.assign(this, created);
        
        return this;
    }

    async update() {
        const sql = `
            UPDATE makes 
            SET name = ?, category = ?
            WHERE id = ?
        `;
        
        const params = [
            this.name,
            this.category,
            this.id
        ];

        await database.run(sql, params);
        
        const updated = await Make.findById(this.id);
        Object.assign(this, updated);
        
        return this;
    }

    async delete() {
        const sql = 'DELETE FROM makes WHERE id = ?';
        const result = await database.run(sql, [this.id]);
        
        return result.changes > 0;
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            category: this.category,
            created_at: this.created_at,
            updated_at: this.updated_at
        };
    }
}

module.exports = Make;