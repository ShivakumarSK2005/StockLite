const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const bcrypt = require("bcryptjs");
const pool = require("../src/config/db");

async function seed() {
  console.log("--- Starting StockLite Seed Script ---");

  const salt = await bcrypt.genSalt(10);
  const adminHash = await bcrypt.hash("admin123", salt);
  const employeeHash = await bcrypt.hash("employee123", salt);

  // 1. Seed Users
  console.log("Seeding users...");
  await pool.query(
    `INSERT INTO users (name, email, password_hash, role, is_active)
     VALUES (?, ?, ?, 'admin', TRUE)
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), name = VALUES(name), role = 'admin'`,
    ["StockLite Admin", "admin@example.com", adminHash]
  );

  await pool.query(
    `INSERT INTO users (name, email, password_hash, role, is_active)
     VALUES (?, ?, ?, 'employee', TRUE)
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), name = VALUES(name), role = 'employee'`,
    ["Alex Employee", "employee@example.com", employeeHash]
  );

  const [adminRows] = await pool.query("SELECT id FROM users WHERE email = 'admin@example.com'");
  const adminId = adminRows[0].id;

  const [empRows] = await pool.query("SELECT id FROM users WHERE email = 'employee@example.com'");
  const employeeId = empRows[0].id;

  // 2. Seed Categories
  console.log("Seeding categories...");
  const categories = [
    { name: "Peripherals", description: "Keyboards, mice, and pointing devices" },
    { name: "Storage & Memory", description: "SSDs, HDDs, RAM, and flash drives" },
    { name: "Cables & Adapters", description: "HDMI, DisplayPort, USB-C, and power cables" },
    { name: "Networking", description: "Routers, switches, patch panels, and Wi-Fi adapters" },
    { name: "Audio", description: "Headsets, microphones, and desktop speakers" },
  ];

  for (const cat of categories) {
    await pool.query(
      `INSERT INTO categories (name, description)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE description = VALUES(description)`,
      [cat.name, cat.description]
    );
  }

  const [catRows] = await pool.query("SELECT id, name FROM categories");
  const categoryMap = {};
  for (const row of catRows) {
    categoryMap[row.name] = row.id;
  }

  // 3. Seed Products
  console.log("Seeding products...");
  const products = [
    { sku: "KB-001", name: "Mechanical RGB Keyboard", cat: "Peripherals", price: 3499.00, reorder: 5, initialStock: 25 },
    { sku: "MS-001", name: "Wireless Ergonomic Mouse", cat: "Peripherals", price: 1299.00, reorder: 8, initialStock: 4 }, // Low stock!
    { sku: "SSD-500", name: "500GB NVMe M.2 SSD", cat: "Storage & Memory", price: 4200.00, reorder: 6, initialStock: 18 },
    { sku: "SSD-1TB", name: "1TB NVMe M.2 SSD", cat: "Storage & Memory", price: 7499.00, reorder: 5, initialStock: 0 }, // Out of stock!
    { sku: "RAM-16G", name: "16GB DDR5 5600MHz RAM", cat: "Storage & Memory", price: 3899.00, reorder: 4, initialStock: 12 },
    { sku: "CBL-HDMI2", name: "HDMI 2.1 Ultra High Speed Cable (2m)", cat: "Cables & Adapters", price: 499.00, reorder: 10, initialStock: 45 },
    { sku: "CBL-USBC", name: "100W USB-C Braided Cable (1.5m)", cat: "Cables & Adapters", price: 350.00, reorder: 15, initialStock: 3 }, // Low stock!
    { sku: "NET-RT01", name: "AX3000 Wi-Fi 6 Gigabit Router", cat: "Networking", price: 5999.00, reorder: 3, initialStock: 10 },
    { sku: "NET-SW08", name: "8-Port Gigabit Desktop Switch", cat: "Networking", price: 2199.00, reorder: 4, initialStock: 7 },
    { sku: "AUD-HS01", name: "Noise Cancelling USB Headset", cat: "Audio", price: 2899.00, reorder: 5, initialStock: 15 },
  ];

  for (const item of products) {
    const categoryId = categoryMap[item.cat];
    await pool.query(
      `INSERT INTO products (sku, name, category_id, price, quantity, reorder_level, is_active)
       VALUES (?, ?, ?, ?, 0, ?, TRUE)
       ON DUPLICATE KEY UPDATE name = VALUES(name), price = VALUES(price), reorder_level = VALUES(reorder_level)`,
      [item.sku, item.name, categoryId, item.price, item.reorder]
    );

    const [prodRows] = await pool.query("SELECT id, quantity FROM products WHERE sku = ?", [item.sku]);
    const prod = prodRows[0];

    // If product has 0 quantity and we want initial stock, call sp_stock_in
    if (prod.quantity === 0 && item.initialStock > 0) {
      const conn = await pool.getConnection();
      try {
        await conn.query("CALL sp_stock_in(?, ?, ?, ?)", [
          prod.id,
          adminId,
          item.initialStock,
          "Initial inventory batch seed",
        ]);
      } finally {
        conn.release();
      }
    }
  }

  // 4. Seed a couple of stock movements using employee to simulate activity
  const [sampleProd] = await pool.query("SELECT id, quantity FROM products WHERE sku = 'KB-001'");
  if (sampleProd.length > 0 && sampleProd[0].quantity > 5) {
    const conn = await pool.getConnection();
    try {
      await conn.query("CALL sp_stock_out(?, ?, ?, ?)", [
        sampleProd[0].id,
        employeeId,
        2,
        "Issued 2 units for customer invoice #INV-1001",
      ]);
    } finally {
      conn.release();
    }
  }

  console.log("--- Seeding complete successfully! ---");
  console.log("Admin credentials:    email: admin@example.com    password: admin123");
  console.log("Employee credentials: email: employee@example.com password: employee123");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
