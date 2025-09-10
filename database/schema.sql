-- SD Inventory System Database Schema
-- SQLite database schema with office-based organization

-- Computers table (now tracks make/model combinations)
CREATE TABLE IF NOT EXISTS computers (
    id TEXT PRIMARY KEY,
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    office TEXT NOT NULL CHECK (office IN ('Office 1', 'Office 2', 'Office 3')),
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Serial numbers table for individual item tracking
CREATE TABLE IF NOT EXISTS serial_numbers (
    id TEXT PRIMARY KEY,
    item_type TEXT NOT NULL CHECK (item_type IN ('computer', 'peripheral', 'printer_item')),
    item_id TEXT NOT NULL,
    serial_number TEXT NOT NULL UNIQUE,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Peripherals table (now tracks item_name/make/model combinations)
CREATE TABLE IF NOT EXISTS peripherals (
    id TEXT PRIMARY KEY,
    item_name TEXT NOT NULL,
    make TEXT,
    model TEXT,
    quantity INTEGER DEFAULT 1,
    office TEXT NOT NULL CHECK (office IN ('Office 1', 'Office 2', 'Office 3')),
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Makes table for dropdown options
CREATE TABLE IF NOT EXISTS makes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL CHECK (category IN ('computer', 'peripheral', 'printer')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Models table for dropdown options
CREATE TABLE IF NOT EXISTS models (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    make_id TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('computer', 'peripheral', 'printer')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (make_id) REFERENCES makes(id) ON DELETE CASCADE,
    UNIQUE(name, make_id)
);

-- Printer items table
CREATE TABLE IF NOT EXISTS printer_items (
    id TEXT PRIMARY KEY,
    item_type TEXT NOT NULL,
    make TEXT,
    model TEXT,
    quantity INTEGER DEFAULT 1,
    office TEXT NOT NULL CHECK (office IN ('Office 1', 'Office 2', 'Office 3')),
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Restock requests table
CREATE TABLE IF NOT EXISTS restock_requests (
    id TEXT PRIMARY KEY,
    item_category TEXT NOT NULL CHECK (item_category IN ('computers', 'peripherals', 'printer_items')),
    item_description TEXT NOT NULL,
    make_id TEXT,
    model_id TEXT,
    quantity_requested INTEGER NOT NULL,
    office TEXT NOT NULL CHECK (office IN ('Office 1', 'Office 2', 'Office 3')),
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'ordered', 'received', 'cancelled')),
    requested_by TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (make_id) REFERENCES makes(id),
    FOREIGN KEY (model_id) REFERENCES models(id)
);

-- Audit log table
CREATE TABLE IF NOT EXISTS audit_log (
    id TEXT PRIMARY KEY,
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    action TEXT NOT NULL,
    old_values TEXT,
    new_values TEXT,
    office TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_computers_office ON computers(office);
CREATE INDEX IF NOT EXISTS idx_peripherals_office ON peripherals(office);
CREATE INDEX IF NOT EXISTS idx_printer_items_office ON printer_items(office);
CREATE INDEX IF NOT EXISTS idx_restock_requests_office ON restock_requests(office);
CREATE INDEX IF NOT EXISTS idx_restock_requests_status ON restock_requests(status);
CREATE INDEX IF NOT EXISTS idx_restock_requests_make_id ON restock_requests(make_id);
CREATE INDEX IF NOT EXISTS idx_restock_requests_model_id ON restock_requests(model_id);
CREATE INDEX IF NOT EXISTS idx_serial_numbers_item_id ON serial_numbers(item_id);
CREATE INDEX IF NOT EXISTS idx_serial_numbers_item_type ON serial_numbers(item_type);
CREATE INDEX IF NOT EXISTS idx_serial_numbers_serial_number ON serial_numbers(serial_number);
CREATE INDEX IF NOT EXISTS idx_audit_log_table_record ON audit_log(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_makes_category ON makes(category);
CREATE INDEX IF NOT EXISTS idx_models_make_id ON models(make_id);
CREATE INDEX IF NOT EXISTS idx_models_category ON models(category);

-- Triggers for updating the updated_at field
CREATE TRIGGER IF NOT EXISTS computers_updated_at
    AFTER UPDATE ON computers
BEGIN
    UPDATE computers SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS peripherals_updated_at
    AFTER UPDATE ON peripherals
BEGIN
    UPDATE peripherals SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS printer_items_updated_at
    AFTER UPDATE ON printer_items
BEGIN
    UPDATE printer_items SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS restock_requests_updated_at
    AFTER UPDATE ON restock_requests
BEGIN
    UPDATE restock_requests SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS makes_updated_at
    AFTER UPDATE ON makes
BEGIN
    UPDATE makes SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS models_updated_at
    AFTER UPDATE ON models
BEGIN
    UPDATE models SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS serial_numbers_updated_at
    AFTER UPDATE ON serial_numbers
BEGIN
    UPDATE serial_numbers SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Triggers for audit logging
CREATE TRIGGER IF NOT EXISTS computers_audit_insert
    AFTER INSERT ON computers
BEGIN
    INSERT INTO audit_log (id, table_name, record_id, action, old_values, new_values, office)
    VALUES (
        (SELECT LOWER(HEX(RANDOMBLOB(16)))),
        'computers',
        NEW.id,
        'INSERT',
        NULL,
        JSON_OBJECT('id', NEW.id, 'make', NEW.make, 'model', NEW.model, 'quantity', NEW.quantity, 'office', NEW.office, 'status', NEW.status),
        NEW.office
    );
END;

CREATE TRIGGER IF NOT EXISTS computers_audit_update
    AFTER UPDATE ON computers
BEGIN
    INSERT INTO audit_log (id, table_name, record_id, action, old_values, new_values, office)
    VALUES (
        (SELECT LOWER(HEX(RANDOMBLOB(16)))),
        'computers',
        NEW.id,
        'UPDATE',
        JSON_OBJECT('id', OLD.id, 'make', OLD.make, 'model', OLD.model, 'quantity', OLD.quantity, 'office', OLD.office, 'status', OLD.status),
        JSON_OBJECT('id', NEW.id, 'make', NEW.make, 'model', NEW.model, 'quantity', NEW.quantity, 'office', NEW.office, 'status', NEW.status),
        NEW.office
    );
END;

CREATE TRIGGER IF NOT EXISTS computers_audit_delete
    AFTER DELETE ON computers
BEGIN
    INSERT INTO audit_log (id, table_name, record_id, action, old_values, new_values, office)
    VALUES (
        (SELECT LOWER(HEX(RANDOMBLOB(16)))),
        'computers',
        OLD.id,
        'DELETE',
        JSON_OBJECT('id', OLD.id, 'make', OLD.make, 'model', OLD.model, 'quantity', OLD.quantity, 'office', OLD.office, 'status', OLD.status),
        NULL,
        OLD.office
    );
END;

-- Serial numbers audit triggers
CREATE TRIGGER IF NOT EXISTS serial_numbers_audit_insert
    AFTER INSERT ON serial_numbers
BEGIN
    INSERT INTO audit_log (id, table_name, record_id, action, old_values, new_values, office)
    VALUES (
        (SELECT LOWER(HEX(RANDOMBLOB(16)))),
        'serial_numbers',
        NEW.id,
        'INSERT',
        NULL,
        JSON_OBJECT('id', NEW.id, 'item_type', NEW.item_type, 'item_id', NEW.item_id, 'serial_number', NEW.serial_number, 'status', NEW.status),
        CASE 
            WHEN NEW.item_type = 'computer' THEN (SELECT office FROM computers WHERE id = NEW.item_id)
            WHEN NEW.item_type = 'peripheral' THEN (SELECT office FROM peripherals WHERE id = NEW.item_id)
            WHEN NEW.item_type = 'printer_item' THEN (SELECT office FROM printer_items WHERE id = NEW.item_id)
            ELSE NULL
        END
    );
END;

CREATE TRIGGER IF NOT EXISTS serial_numbers_audit_update
    AFTER UPDATE ON serial_numbers
BEGIN
    INSERT INTO audit_log (id, table_name, record_id, action, old_values, new_values, office)
    VALUES (
        (SELECT LOWER(HEX(RANDOMBLOB(16)))),
        'serial_numbers',
        NEW.id,
        'UPDATE',
        JSON_OBJECT('id', OLD.id, 'item_type', OLD.item_type, 'item_id', OLD.item_id, 'serial_number', OLD.serial_number, 'status', OLD.status),
        JSON_OBJECT('id', NEW.id, 'item_type', NEW.item_type, 'item_id', NEW.item_id, 'serial_number', NEW.serial_number, 'status', NEW.status),
        CASE 
            WHEN NEW.item_type = 'computer' THEN (SELECT office FROM computers WHERE id = NEW.item_id)
            WHEN NEW.item_type = 'peripheral' THEN (SELECT office FROM peripherals WHERE id = NEW.item_id)
            WHEN NEW.item_type = 'printer_item' THEN (SELECT office FROM printer_items WHERE id = NEW.item_id)
            ELSE NULL
        END
    );
END;

CREATE TRIGGER IF NOT EXISTS serial_numbers_audit_delete
    AFTER DELETE ON serial_numbers
BEGIN
    INSERT INTO audit_log (id, table_name, record_id, action, old_values, new_values, office)
    VALUES (
        (SELECT LOWER(HEX(RANDOMBLOB(16)))),
        'serial_numbers',
        OLD.id,
        'DELETE',
        JSON_OBJECT('id', OLD.id, 'item_type', OLD.item_type, 'item_id', OLD.item_id, 'serial_number', OLD.serial_number, 'status', OLD.status),
        NULL,
        CASE 
            WHEN OLD.item_type = 'computer' THEN (SELECT office FROM computers WHERE id = OLD.item_id)
            WHEN OLD.item_type = 'peripheral' THEN (SELECT office FROM peripherals WHERE id = OLD.item_id)
            WHEN OLD.item_type = 'printer_item' THEN (SELECT office FROM printer_items WHERE id = OLD.item_id)
            ELSE NULL
        END
    );
END;