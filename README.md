# 🏢 SD Inventory Management System

A comprehensive full-stack inventory management system designed for multi-office companies to track computers, peripherals, printer items, and manage restock requests efficiently.

## ✨ Features

### 📊 **Dashboard & Analytics**
- **Real-time inventory overview** across all offices
- **Interactive dashboard** with metrics and recent activity
- **Comprehensive reporting** with multiple report types:
  - Inventory Summary Reports
  - Restock Request Analytics
  - Activity Logs and Audit Trails
  - Office-to-Office Comparisons

### 🖥️ **Inventory Management**
- **Computers**: Track make, model, serial numbers, and status across offices
- **Peripherals**: Manage mice, keyboards, monitors, and other accessories
- **Printer Items**: Track printer cartridges, paper, and supplies
- **Serial Number Tracking**: Individual serial number management for assets

### 📋 **Restock Request System**
- **Priority-based requests**: Low, Normal, High, Urgent
- **Status tracking**: Pending → Approved → Ordered → Received
- **Multi-category support**: Computers, Peripherals, Printer Items
- **Make/Model integration**: Link requests to existing inventory structure

### 🏢 **Multi-Office Support**
- **Office-based filtering**: Office 1, Office 2, Office 3
- **Centralized management** with office-specific views
- **Cross-office comparisons** and analytics

### 🎨 **User Experience**
- **Dark/Light theme** toggle
- **Responsive design** optimized for desktop and mobile
- **Real-time validation** and error handling
- **Modular component architecture** for maintainability

## 🛠️ Technology Stack

### **Frontend**
- **React 18** with TypeScript for type safety
- **Tailwind CSS v4** for modern styling
- **React Router** for navigation
- **Vite** for fast development and building
- **Lucide React** for consistent iconography

### **Backend**
- **Node.js** with Express.js framework
- **SQLite** database with audit logging
- **Joi** for comprehensive data validation
- **Rate limiting** and security middleware
- **CORS** and **Helmet** for security

### **Development Tools**
- **ESLint** for code quality
- **Concurrently** for parallel development servers
- **Nodemon** for automatic backend restarts

## 🚀 Quick Start

### **Prerequisites**
- Node.js ≥ 18.0.0
- npm ≥ 8.0.0

### **One-Command Setup**
```bash
# Clone and setup everything
npm run setup
```

### **Development**
```bash
# Start both frontend and backend servers
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001

### **Manual Setup**

#### Backend Setup
```bash
cd sd-backend
npm install
npm run dev  # Runs on http://localhost:3001
```

#### Frontend Setup
```bash
cd sd-frontend
npm install
npm run dev  # Runs on http://localhost:5173
```

## 📁 Project Structure

```
sd-inventory/
├── sd-frontend/          # React TypeScript frontend
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   │   ├── admin/    # Admin management components
│   │   │   ├── common/   # Shared components
│   │   │   ├── computers/# Computer management
│   │   │   ├── peripherals/# Peripheral management
│   │   │   ├── printer-items/# Printer item management
│   │   │   └── restock-requests/# Request management
│   │   ├── contexts/     # React contexts (Theme, Office)
│   │   ├── hooks/        # Custom React hooks
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   └── types/        # TypeScript definitions
├── sd-backend/           # Node.js Express backend
│   ├── database/         # SQLite database and schema
│   ├── models/           # Data models and business logic
│   ├── routes/           # API route handlers
│   ├── middleware/       # Custom middleware
│   └── validators/       # Input validation schemas
└── package.json          # Root package with scripts
```

## 🔌 API Endpoints

### **Computers**
- `GET /api/computers` - List computers (with office filtering)
- `GET /api/computers/:id` - Get specific computer
- `POST /api/computers` - Create new computer
- `PUT /api/computers/:id` - Update computer
- `DELETE /api/computers/:id` - Delete computer

### **Peripherals**
- `GET /api/peripherals` - List peripherals
- `POST /api/peripherals` - Create peripheral
- `PUT /api/peripherals/:id` - Update peripheral
- `DELETE /api/peripherals/:id` - Delete peripheral

### **Printer Items**
- `GET /api/printer-items` - List printer items
- `POST /api/printer-items` - Create printer item
- `PUT /api/printer-items/:id` - Update printer item
- `DELETE /api/printer-items/:id` - Delete printer item

### **Restock Requests**
- `GET /api/restock-requests` - List requests (with filtering)
- `POST /api/restock-requests` - Create new request
- `PUT /api/restock-requests/:id` - Update request status
- `DELETE /api/restock-requests/:id` - Delete request

### **Reports & Analytics**
- `GET /api/reports/inventory-summary` - Inventory overview
- `GET /api/reports/restock-requests` - Restock analytics
- `GET /api/reports/activity` - System activity logs
- `GET /api/reports/office-comparison` - Cross-office comparison

### **Administration**
- `GET /api/makes` - Manufacturer management
- `POST /api/makes` - Create manufacturer
- `GET /api/models` - Model management
- `POST /api/models` - Create model

## 📊 Data Models

### **Computer**
```typescript
{
  id: string;
  make: string;
  model: string;
  quantity: number;
  office: 'Office 1' | 'Office 2' | 'Office 3';
  status: 'active' | 'inactive' | 'maintenance' | 'retired';
  serial_numbers: SerialNumber[];
  created_at: string;
  updated_at: string;
}
```

### **Peripheral**
```typescript
{
  id: string;
  item_name: string;
  make?: string;
  model?: string;
  quantity: number;
  office: Office;
  status: ItemStatus;
  serial_numbers: SerialNumber[];
}
```

### **RestockRequest**
```typescript
{
  id: string;
  item_category: 'computers' | 'peripherals' | 'printer_items';
  item_description: string;
  quantity_requested: number;
  office: Office;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'pending' | 'approved' | 'ordered' | 'received' | 'cancelled';
  requested_by?: string;
  notes?: string;
}
```

## 🛡️ Security Features

- **Input validation** with Joi schemas
- **Rate limiting** to prevent API abuse
- **CORS** configuration for secure cross-origin requests
- **Helmet** for security headers
- **SQL injection protection** through parameterized queries

## 🔄 Available Scripts

### **Root Level**
- `npm run dev` - Start both frontend and backend
- `npm run build` - Build for production
- `npm run setup` - Complete project setup
- `npm run clean` - Clean all dependencies and database

### **Frontend**
- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run lint` - Code linting
- `npm run type-check` - TypeScript checking

### **Backend**
- `npm run dev` - Development with auto-restart
- `npm run start` - Production server
- `npm run test` - Run tests
- `npm run lint` - Code linting

## 📄 License

MIT License - see LICENSE file for details

## 👥 Contributing

This project follows modular architecture principles:
- **Frontend**: Modular React components, no hardcoded styles
- **Backend**: Modular routes and middleware
- **Database**: SQLite with proper indexing and relationships

---

<div align="center">
  <strong>Built for efficient multi-office inventory management</strong><br>
  <em>Simple, robust, and scalable</em>
</div>