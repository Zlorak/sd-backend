const { v4: uuidv4 } = require('uuid');
const database = require('../database/connection');

class RestockRequest {
    constructor(data = {}) {
        this.id = data.id || uuidv4();
        this.item_category = data.item_category;
        this.item_description = data.item_description;
        this.make_id = data.make_id;
        this.model_id = data.model_id;
        this.quantity_requested = data.quantity_requested;
        this.office = data.office;
        this.priority = data.priority || 'normal';
        this.status = data.status || 'pending';
        this.requested_by = data.requested_by;
        this.notes = data.notes;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    static async findAll(office = null, status = null, priority = null, item_category = null) {
        let sql = `
            SELECT rr.*, 
                   m.name as make_name, 
                   mod.name as model_name 
            FROM restock_requests rr
            LEFT JOIN makes m ON rr.make_id = m.id
            LEFT JOIN models mod ON rr.model_id = mod.id
        `;
        const params = [];
        const conditions = [];

        if (office) {
            conditions.push('rr.office = ?');
            params.push(office);
        }

        if (status) {
            conditions.push('rr.status = ?');
            params.push(status);
        }

        if (priority) {
            conditions.push('rr.priority = ?');
            params.push(priority);
        }

        if (item_category) {
            conditions.push('rr.item_category = ?');
            params.push(item_category);
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        sql += ' ORDER BY rr.created_at DESC';
        
        const rows = await database.all(sql, params);
        
        return rows.map(row => {
            const request = new RestockRequest(row);
            request.make_name = row.make_name;
            request.model_name = row.model_name;
            return request;
        });
    }

    static async findById(id) {
        const sql = `
            SELECT rr.*, 
                   m.name as make_name, 
                   mod.name as model_name 
            FROM restock_requests rr
            LEFT JOIN makes m ON rr.make_id = m.id
            LEFT JOIN models mod ON rr.model_id = mod.id
            WHERE rr.id = ?
        `;
        const row = await database.get(sql, [id]);
        
        if (row) {
            const request = new RestockRequest(row);
            request.make_name = row.make_name;
            request.model_name = row.model_name;
            return request;
        }
        return null;
    }

    async save() {
        const existingRequest = await RestockRequest.findById(this.id);
        
        if (existingRequest) {
            return this.update();
        } else {
            return this.create();
        }
    }

    async create() {
        const sql = `
            INSERT INTO restock_requests (id, item_category, item_description, make_id, model_id, quantity_requested, office, priority, status, requested_by, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const params = [
            this.id,
            this.item_category,
            this.item_description,
            this.make_id,
            this.model_id,
            this.quantity_requested,
            this.office,
            this.priority,
            this.status,
            this.requested_by,
            this.notes
        ];

        await database.run(sql, params);
        
        const created = await RestockRequest.findById(this.id);
        Object.assign(this, created);
        
        return this;
    }

    async update() {
        const sql = `
            UPDATE restock_requests 
            SET item_category = ?, item_description = ?, make_id = ?, model_id = ?, quantity_requested = ?, office = ?, priority = ?, status = ?, requested_by = ?, notes = ?
            WHERE id = ?
        `;
        
        const params = [
            this.item_category,
            this.item_description,
            this.make_id,
            this.model_id,
            this.quantity_requested,
            this.office,
            this.priority,
            this.status,
            this.requested_by,
            this.notes,
            this.id
        ];

        await database.run(sql, params);
        
        const updated = await RestockRequest.findById(this.id);
        Object.assign(this, updated);
        
        return this;
    }

    async delete() {
        const sql = 'DELETE FROM restock_requests WHERE id = ?';
        const result = await database.run(sql, [this.id]);
        
        return result.changes > 0;
    }

    static async getStatusCounts(office = null) {
        const sql = office
            ? `SELECT status, COUNT(*) as count 
               FROM restock_requests 
               WHERE office = ?
               GROUP BY status`
            : `SELECT status, COUNT(*) as count 
               FROM restock_requests 
               GROUP BY status`;
        
        const params = office ? [office] : [];
        return await database.all(sql, params);
    }

    static async getPendingByPriority(office = null) {
        const sql = office
            ? `SELECT priority, COUNT(*) as count 
               FROM restock_requests 
               WHERE status = 'pending' AND office = ?
               GROUP BY priority 
               ORDER BY CASE priority 
                   WHEN 'urgent' THEN 1 
                   WHEN 'high' THEN 2 
                   WHEN 'normal' THEN 3 
                   WHEN 'low' THEN 4 
               END`
            : `SELECT priority, COUNT(*) as count 
               FROM restock_requests 
               WHERE status = 'pending'
               GROUP BY priority 
               ORDER BY CASE priority 
                   WHEN 'urgent' THEN 1 
                   WHEN 'high' THEN 2 
                   WHEN 'normal' THEN 3 
                   WHEN 'low' THEN 4 
               END`;
        
        const params = office ? [office] : [];
        return await database.all(sql, params);
    }

    toJSON() {
        return {
            id: this.id,
            item_category: this.item_category,
            item_description: this.item_description,
            make_id: this.make_id,
            model_id: this.model_id,
            make_name: this.make_name,
            model_name: this.model_name,
            quantity_requested: this.quantity_requested,
            office: this.office,
            priority: this.priority,
            status: this.status,
            requested_by: this.requested_by,
            notes: this.notes,
            created_at: this.created_at,
            updated_at: this.updated_at
        };
    }
}

module.exports = RestockRequest;