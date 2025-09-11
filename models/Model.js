const { v4: uuidv4 } = require('uuid');
const database = require('../database/connection');

class Model {
    constructor(data = {}) {
        this.id = data.id || uuidv4();
        this.name = data.name;
        this.make_id = data.make_id;
        this.category = data.category;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
        this.make_name = data.make_name;
    }

    static async findAll(category = null, makeId = null) {
        let sql = `
            SELECT m.*, mk.name as make_name 
            FROM models m 
            JOIN makes mk ON m.make_id = mk.id
        `;
        const params = [];

        if (category && makeId) {
            sql += ' WHERE m.category = ? AND m.make_id = ?';
            params.push(category, makeId);
        } else if (category) {
            sql += ' WHERE m.category = ?';
            params.push(category);
        } else if (makeId) {
            sql += ' WHERE m.make_id = ?';
            params.push(makeId);
        }

        sql += ' ORDER BY mk.name ASC, m.name ASC';
        
        const rows = await database.all(sql, params);
        
        return rows.map(row => new Model(row));
    }

    static async findById(id) {
        const sql = `
            SELECT m.*, mk.name as make_name 
            FROM models m 
            JOIN makes mk ON m.make_id = mk.id
            WHERE m.id = ?
        `;
        const row = await database.get(sql, [id]);
        
        return row ? new Model(row) : null;
    }

    static async findByName(name, makeId) {
        const sql = 'SELECT * FROM models WHERE name = ? AND make_id = ?';
        const row = await database.get(sql, [name, makeId]);
        
        return row ? new Model(row) : null;
    }

    async save() {
        const existingModel = await Model.findById(this.id);
        
        if (existingModel) {
            return this.update();
        } else {
            return this.create();
        }
    }

    async create() {
        const sql = `
            INSERT INTO models (id, name, make_id, category)
            VALUES (?, ?, ?, ?)
        `;
        
        const params = [
            this.id,
            this.name,
            this.make_id,
            this.category
        ];

        await database.run(sql, params);
        
        const created = await Model.findById(this.id);
        Object.assign(this, created);
        
        return this;
    }

    async update() {
        const oldModel = await Model.findById(this.id);
        const oldName = oldModel ? oldModel.name : null;
        
        const sql = `
            UPDATE models 
            SET name = ?, make_id = ?, category = ?
            WHERE id = ?
        `;
        
        const params = [
            this.name,
            this.make_id,
            this.category,
            this.id
        ];

        await database.run(sql, params);
        
        if (oldName && oldName !== this.name) {
            await this.updateItemReferences(oldName, this.name, this.category);
        }
        
        const updated = await Model.findById(this.id);
        Object.assign(this, updated);
        
        return this;
    }

    async updateItemReferences(oldName, newName, category) {
        const tables = [];
        
        if (category === 'computer') {
            tables.push('computers');
        } else if (category === 'peripheral') {
            tables.push('peripherals');
        } else if (category === 'printer') {
            tables.push('printer_items');
        }
        
        for (const table of tables) {
            const updateSql = `
                UPDATE ${table}
                SET model = ?
                WHERE model = ?
            `;
            await database.run(updateSql, [newName, oldName]);
        }
    }

    async delete() {
        const sql = 'DELETE FROM models WHERE id = ?';
        const result = await database.run(sql, [this.id]);
        
        return result.changes > 0;
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            make_id: this.make_id,
            make_name: this.make_name,
            category: this.category,
            created_at: this.created_at,
            updated_at: this.updated_at
        };
    }
}

module.exports = Model;