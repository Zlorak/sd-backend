const { v4: uuidv4 } = require('uuid');
const database = require('../database/connection');

class AuditLog {
    constructor(data = {}) {
        this.id = data.id || uuidv4();
        this.table_name = data.table_name;
        this.record_id = data.record_id;
        this.action = data.action;
        this.old_values = data.old_values;
        this.new_values = data.new_values;
        this.office = data.office;
        this.timestamp = data.timestamp;
    }

    static async findAll(office = null, tableName = null, limit = 100) {
        let sql = 'SELECT * FROM audit_log';
        const params = [];
        const conditions = [];

        if (office) {
            conditions.push('office = ?');
            params.push(office);
        }

        if (tableName) {
            conditions.push('table_name = ?');
            params.push(tableName);
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        sql += ' ORDER BY timestamp DESC';
        
        if (limit) {
            sql += ' LIMIT ?';
            params.push(limit);
        }
        
        const rows = await database.all(sql, params);
        
        return rows.map(row => new AuditLog(row));
    }

    static async findByRecord(tableName, recordId) {
        const sql = `
            SELECT * FROM audit_log 
            WHERE table_name = ? AND record_id = ? 
            ORDER BY timestamp DESC
        `;
        
        const rows = await database.all(sql, [tableName, recordId]);
        
        return rows.map(row => new AuditLog(row));
    }

    static async getRecentActivity(office = null, days = 7, limit = 50) {
        const sql = office
            ? `SELECT * FROM audit_log 
               WHERE office = ? AND timestamp >= datetime('now', '-${days} days')
               ORDER BY timestamp DESC 
               LIMIT ?`
            : `SELECT * FROM audit_log 
               WHERE timestamp >= datetime('now', '-${days} days')
               ORDER BY timestamp DESC 
               LIMIT ?`;
        
        const params = office ? [office, limit] : [limit];
        const rows = await database.all(sql, params);
        
        return rows.map(row => new AuditLog(row));
    }

    static async getActionCounts(office = null, days = 30) {
        const sql = office
            ? `SELECT action, COUNT(*) as count 
               FROM audit_log 
               WHERE office = ? AND timestamp >= datetime('now', '-${days} days')
               GROUP BY action`
            : `SELECT action, COUNT(*) as count 
               FROM audit_log 
               WHERE timestamp >= datetime('now', '-${days} days')
               GROUP BY action`;
        
        const params = office ? [office] : [];
        return await database.all(sql, params);
    }

    static async getTableActivity(office = null, days = 30) {
        const sql = office
            ? `SELECT table_name, COUNT(*) as activity_count 
               FROM audit_log 
               WHERE office = ? AND timestamp >= datetime('now', '-${days} days')
               GROUP BY table_name 
               ORDER BY activity_count DESC`
            : `SELECT table_name, COUNT(*) as activity_count 
               FROM audit_log 
               WHERE timestamp >= datetime('now', '-${days} days')
               GROUP BY table_name 
               ORDER BY activity_count DESC`;
        
        const params = office ? [office] : [];
        return await database.all(sql, params);
    }

    async create() {
        const sql = `
            INSERT INTO audit_log (id, table_name, record_id, action, old_values, new_values, office)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        
        const params = [
            this.id,
            this.table_name,
            this.record_id,
            this.action,
            this.old_values,
            this.new_values,
            this.office
        ];

        await database.run(sql, params);
        return this;
    }

    getOldValuesJSON() {
        try {
            return this.old_values ? JSON.parse(this.old_values) : null;
        } catch (e) {
            return null;
        }
    }

    getNewValuesJSON() {
        try {
            return this.new_values ? JSON.parse(this.new_values) : null;
        } catch (e) {
            return null;
        }
    }

    toJSON() {
        return {
            id: this.id,
            table_name: this.table_name,
            record_id: this.record_id,
            action: this.action,
            old_values: this.getOldValuesJSON(),
            new_values: this.getNewValuesJSON(),
            office: this.office,
            timestamp: this.timestamp
        };
    }
}

module.exports = AuditLog;