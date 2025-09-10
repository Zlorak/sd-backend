const Joi = require('joi');

const offices = ['Office 1', 'Office 2', 'Office 3'];
const itemCategories = ['computers', 'peripherals', 'printer_items'];
const makeModelCategories = ['computer', 'peripheral', 'printer'];
const priorities = ['low', 'normal', 'high', 'urgent'];
const restockStatuses = ['pending', 'approved', 'ordered', 'received', 'cancelled'];
const itemStatuses = ['active', 'inactive', 'maintenance', 'retired'];

const computerSchema = Joi.object({
    make: Joi.string().trim().max(100).required(),
    model: Joi.string().trim().max(100).required(),
    serial_numbers: Joi.array().items(Joi.string().trim().max(100)).default([]),
    quantity: Joi.number().integer().min(1).default(1),
    office: Joi.string().valid(...offices).required(),
    status: Joi.string().valid(...itemStatuses).default('active')
});

const computerUpdateSchema = Joi.object({
    make: Joi.string().trim().max(100),
    model: Joi.string().trim().max(100),
    serial_numbers: Joi.array().items(Joi.string().trim().max(100)),
    quantity: Joi.number().integer().min(1),
    office: Joi.string().valid(...offices),
    status: Joi.string().valid(...itemStatuses)
}).min(1);

const peripheralSchema = Joi.object({
    item_name: Joi.string().trim().max(100).required(),
    make: Joi.string().trim().max(100).allow(null, ''),
    model: Joi.string().trim().max(100).allow(null, ''),
    serial_numbers: Joi.array().items(Joi.string().trim().max(100)).default([]),
    quantity: Joi.number().integer().min(1).default(1),
    office: Joi.string().valid(...offices).required(),
    status: Joi.string().valid(...itemStatuses).default('active')
});

const peripheralUpdateSchema = Joi.object({
    item_name: Joi.string().trim().max(100),
    make: Joi.string().trim().max(100).allow(null, ''),
    model: Joi.string().trim().max(100).allow(null, ''),
    serial_numbers: Joi.array().items(Joi.string().trim().max(100)),
    quantity: Joi.number().integer().min(1),
    office: Joi.string().valid(...offices),
    status: Joi.string().valid(...itemStatuses)
}).min(1);

const printerItemSchema = Joi.object({
    item_type: Joi.string().trim().max(100).required(),
    make: Joi.string().trim().max(100).allow(null, ''),
    model: Joi.string().trim().max(200).allow(null, ''),
    quantity: Joi.number().integer().min(1).default(1),
    office: Joi.string().valid(...offices).required(),
    status: Joi.string().valid(...itemStatuses).default('active')
});

const printerItemUpdateSchema = Joi.object({
    item_type: Joi.string().trim().max(100),
    make: Joi.string().trim().max(100).allow(null, ''),
    model: Joi.string().trim().max(200).allow(null, ''),
    quantity: Joi.number().integer().min(1),
    office: Joi.string().valid(...offices),
    status: Joi.string().valid(...itemStatuses)
}).min(1);

const restockRequestSchema = Joi.object({
    item_category: Joi.string().valid(...itemCategories).required(),
    item_description: Joi.string().trim().max(500).required(),
    make_id: Joi.string().uuid().allow(null, ''),
    model_id: Joi.string().uuid().allow(null, ''),
    quantity_requested: Joi.number().integer().min(1).required(),
    office: Joi.string().valid(...offices).required(),
    priority: Joi.string().valid(...priorities).default('normal'),
    status: Joi.string().valid(...restockStatuses).default('pending'),
    requested_by: Joi.string().trim().max(100).allow(null, ''),
    notes: Joi.string().trim().max(1000).allow(null, '')
});

const restockRequestUpdateSchema = Joi.object({
    item_category: Joi.string().valid(...itemCategories),
    item_description: Joi.string().trim().max(500),
    make_id: Joi.string().uuid().allow(null, ''),
    model_id: Joi.string().uuid().allow(null, ''),
    quantity_requested: Joi.number().integer().min(1),
    office: Joi.string().valid(...offices),
    priority: Joi.string().valid(...priorities),
    status: Joi.string().valid(...restockStatuses),
    requested_by: Joi.string().trim().max(100).allow(null, ''),
    notes: Joi.string().trim().max(1000).allow(null, '')
}).min(1);

const querySchema = Joi.object({
    office: Joi.string().valid(...offices),
    status: Joi.string().valid(...itemStatuses),
    search: Joi.string().trim().max(100),
    limit: Joi.number().integer().min(1).max(1000).default(100),
    offset: Joi.number().integer().min(0).default(0)
});

const restockQuerySchema = Joi.object({
    office: Joi.string().valid(...offices),
    status: Joi.string().valid(...restockStatuses),
    priority: Joi.string().valid(...priorities),
    item_category: Joi.string().valid(...itemCategories),
    limit: Joi.number().integer().min(1).max(1000).default(100),
    offset: Joi.number().integer().min(0).default(0)
});

const auditLogQuerySchema = Joi.object({
    office: Joi.string().valid(...offices),
    table_name: Joi.string().valid('computers', 'peripherals', 'printer_items', 'restock_requests'),
    record_id: Joi.string().uuid(),
    days: Joi.number().integer().min(1).max(365).default(30),
    limit: Joi.number().integer().min(1).max(1000).default(100)
});

const makeSchema = Joi.object({
    name: Joi.string().trim().max(100).required(),
    category: Joi.string().valid(...makeModelCategories).required()
});

const modelSchema = Joi.object({
    name: Joi.string().trim().max(100).required(),
    make_id: Joi.string().uuid().required(),
    category: Joi.string().valid(...makeModelCategories).required()
});

const uuidSchema = Joi.object({
    id: Joi.string().uuid().required()
});

const validateComputer = (data) => computerSchema.validate(data);
const validateComputerUpdate = (data) => computerUpdateSchema.validate(data);
const validatePeripheral = (data) => peripheralSchema.validate(data);
const validatePeripheralUpdate = (data) => peripheralUpdateSchema.validate(data);
const validatePrinterItem = (data) => printerItemSchema.validate(data);
const validatePrinterItemUpdate = (data) => printerItemUpdateSchema.validate(data);
const validateRestockRequest = (data) => restockRequestSchema.validate(data);
const validateRestockRequestUpdate = (data) => restockRequestUpdateSchema.validate(data);
const validateMake = (data) => makeSchema.validate(data);
const validateModel = (data) => modelSchema.validate(data);
const validateQuery = (data) => querySchema.validate(data);
const validateRestockQuery = (data) => restockQuerySchema.validate(data);
const validateAuditLogQuery = (data) => auditLogQuerySchema.validate(data);
const validateUuid = (data) => uuidSchema.validate(data);

module.exports = {
    computerSchema,
    computerUpdateSchema,
    peripheralSchema,
    peripheralUpdateSchema,
    printerItemSchema,
    printerItemUpdateSchema,
    restockRequestSchema,
    restockRequestUpdateSchema,
    makeSchema,
    modelSchema,
    querySchema,
    restockQuerySchema,
    auditLogQuerySchema,
    uuidSchema,
    validateComputer,
    validateComputerUpdate,
    validatePeripheral,
    validatePeripheralUpdate,
    validatePrinterItem,
    validatePrinterItemUpdate,
    validateRestockRequest,
    validateRestockRequestUpdate,
    validateMake,
    validateModel,
    validateQuery,
    validateRestockQuery,
    validateAuditLogQuery,
    validateUuid,
    offices,
    itemCategories,
    makeModelCategories,
    priorities,
    restockStatuses,
    itemStatuses
};