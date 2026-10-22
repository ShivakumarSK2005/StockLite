# StockLite — Full-Stack Inventory & Stock Management System

A robust, enterprise-grade Inventory and Stock Management System designed for small-to-medium businesses. StockLite guarantees **zero race conditions, consistent quantities, and an immutable audit trail** using MySQL InnoDB row-level locking, atomic stored procedures, triggers, Express.js REST APIs, and a modern React dashboard.

---

## 🚀 Key Architectural Highlights & Engineering Decisions

1. **ACID Transaction Management & Row Locking (`FOR UPDATE`)**
   - Stock deduction (`sp_stock_out`) and replenishment (`sp_stock_in`) run inside isolated MySQL transactions.
   - Products are queried with `SELECT ... FOR UPDATE` row locks, preventing race conditions (e.g., overselling) when multiple employees issue stock simultaneously.
2. **Immutable Audit Trail via Stored Procedures & Triggers**
   - Every single stock change logs an immutable entry to `stock_movements` (`quantity_before`, `quantity_after`, `note`, `user_id`).
   - Custom database triggers (`trg_stock_movements_before_update`, `trg_stock_movements_before_delete`) reject updates and deletions to historical movement records.
3. **Role-Based Access Control (RBAC)**
   - **Administrators**: Full CRUD over products, categories, stock adjustments, and staff accounts.
   - **Employees**: View inventory catalog and execute authorized stock-in / stock-out transactions.
4. **Analytical Database Views**
   - `vw_inventory`: Real-time stock status (`in_stock`, `low_stock`, `out_of_stock`) and monetary inventory valuation.
   - `vw_dashboard_summary`: Aggregate inventory KPIs (total valuation, low-stock count, product totals).
   - `vw_low_stock_products` & `vw_recent_stock_movements`.
5. **No Direct Quantity Overwrite**
   - The product update endpoint (`PATCH /api/products/:id`) explicitly forbids direct quantity editing. Stock can only be changed via atomic transaction workflows.

---

## 🌟 Extra Features Implemented

- **Automated Concurrency Stress Test Suite**: A script (`npm run test:concurrency`) launching 10 simultaneous stock-out requests on a product with only 5 units remaining, demonstrating that exactly 5 succeed, 5 fail with `400 Insufficient stock`, and final stock is 0.
- **SKU Barcode Label Generator**: Built-in SVG barcode label generator in React with print-ready sticker formatting for warehouse shelves.
- **CSV Inventory Export**: 1-click export of the active inventory ledger to `.csv` format for accounting and audits.
- **Structured Stock Adjustment Workflow**: Modal requiring staff to select formal audit reasons (`Physical Count Discrepancy`, `Damaged Goods`, `Expired / Obsolete`, etc.).
- **Live Low-Stock Alert Hub**: Visual warning banners and color-coded stock health badges.

---

## 🛠️ Tech Stack

- **Frontend**: React (Vite), React Router v6, Axios, Lucide Icons, Modern CSS.
- **Backend**: Node.js, Express.js, JWT (`jsonwebtoken`), Password Hashing (`bcryptjs`), Connection Pooling (`mysql2/promise`).
- **Database**: MySQL 8.0+ (InnoDB, Triggers, Views, Stored Procedures, Foreign Keys).

---

## 📁 Project Structure

```text
Stock lite/
├── backend/
│   ├── src/
│   │   ├── config/db.js           # MySQL connection pool
│   │   ├── controllers/           # Request handlers
│   │   ├── middleware/            # Auth (JWT & RBAC), Error Handler, Validator
│   │   ├── routes/                # Express API routes
│   │   ├── services/              # Business logic & Stored Procedure runners
│   │   ├── validators/            # Input payload validators
│   │   ├── app.js                 # Express application configuration
│   │   └── server.js              # Server entry point
│   ├── scripts/
│   │   └── seed.js                # Database seeder (admin/employee accounts, catalog)
│   ├── tests/
│   │   ├── api.test.js            # 17-point API integration test suite
│   │   └── concurrency.test.js    # Race-condition stress test
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/client.js          # Axios client with JWT interceptors
│   │   ├── components/            # Layout, Sidebar, Badges, StockModal, BarcodeModal
│   │   ├── context/AuthContext.jsx# Authentication & session provider
│   │   ├── pages/                 # Dashboard, Products, Categories, Movements, Users
│   │   ├── App.jsx
│   │   └── index.css              # Modern UI stylesheet
│   └── package.json
│
└── database/
    ├── schema.sql                 # Tables, constraints, checks
    ├── procedures.sql             # sp_stock_in, sp_stock_out, sp_adjust_stock
    ├── triggers.sql               # Audit trail immutability triggers
    └── views.sql                  # Analytical inventory views
```

---

## ⚡ Quick Start & Setup

### 1. Database Setup
Ensure MySQL is running and execute the database scripts:
```sql
source database/schema.sql;
source database/triggers.sql;
source database/procedures.sql;
source database/views.sql;
```

### 2. Backend Setup
```bash
cd backend
npm install
npm run seed     # Seeds categories, products, and default accounts
npm test         # Runs the 17 integration tests
npm run dev      # Starts server at http://localhost:5000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev      # Starts Vite dev server at http://localhost:5173
```

---

## 🔑 Default Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| **Administrator** | `admin@example.com` | `admin123` |
| **Employee** | `employee@example.com` | `employee123` |

*(Quick one-click demo login buttons are also available on the Login page).*

---

## 🧪 Automated Testing

### 1. API Integration Test Suite
```bash
cd backend
npm test
```
Tests health check, JWT login, RBAC restrictions, category CRUD, product filtering, stock-in, stock-out, overdraw protection, adjustment, and view reporting.

### 2. Concurrency Race-Condition Stress Test
```bash
cd backend
npm run test:concurrency
```
Simulates 10 concurrent HTTP requests attempting to issue 1 unit each from a product with only 5 units in stock. Verifies that MySQL row locks prevent race conditions, exactly 5 succeed, and final balance is 0.
