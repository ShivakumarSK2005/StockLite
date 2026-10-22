const http = require("http");
const app = require("../src/app");
const pool = require("../src/config/db");

let server;
let baseUrl;

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (token) {
      options.headers["Authorization"] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on("error", reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log("=== Running StockLite Backend API Test Suite ===\n");

  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://localhost:${port}`;
  console.log(`Test server running on port ${port}\n`);

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    const health = await request("GET", "/api/health");
    assert(health.status === 200 && health.body.database === "connected", "GET /api/health returns 200 with database: connected");

    // 2. Auth: Login Admin
    const adminLogin = await request("POST", "/api/auth/login", {
      email: "admin@example.com",
      password: "admin123",
    });
    assert(adminLogin.status === 200 && adminLogin.body.data.token, "POST /api/auth/login successfully logs in admin");
    const adminToken = adminLogin.body.data.token;

    // 3. Auth: Login Employee
    const empLogin = await request("POST", "/api/auth/login", {
      email: "employee@example.com",
      password: "employee123",
    });
    assert(empLogin.status === 200 && empLogin.body.data.token, "POST /api/auth/login successfully logs in employee");
    const employeeToken = empLogin.body.data.token;

    // 4. Auth: Invalid login
    const badLogin = await request("POST", "/api/auth/login", {
      email: "admin@example.com",
      password: "wrongpassword",
    });
    assert(badLogin.status === 401, "POST /api/auth/login rejects wrong password with 401");

    // 5. Auth: Get Current User profile
    const me = await request("GET", "/api/auth/me", null, adminToken);
    assert(me.status === 200 && me.body.data.user.role === "admin", "GET /api/auth/me returns authenticated admin user");

    // 6. RBAC: Employee attempting admin-only user creation -> should get 403
    const forbiddenCreate = await request("POST", "/api/users", {
      name: "Sneaky User",
      email: "sneaky@example.com",
      password: "password123",
      role: "employee",
    }, employeeToken);
    assert(forbiddenCreate.status === 403, "RBAC: Employee forbidden from POST /api/users with 403");

    // 7. Categories: List
    const cats = await request("GET", "/api/categories", null, employeeToken);
    assert(cats.status === 200 && Array.isArray(cats.body.data.categories), "GET /api/categories returns category list");

    // 8. Products: List & Filters
    const products = await request("GET", "/api/products?page=1&limit=5", null, employeeToken);
    assert(products.status === 200 && products.body.data.products.length <= 5, "GET /api/products returns paginated products");

    // 9. Low Stock Filter
    const lowStock = await request("GET", "/api/products?stock_status=low_stock", null, employeeToken);
    assert(lowStock.status === 200 && lowStock.body.data.products.every(p => p.stock_status === "low_stock"), "GET /api/products?stock_status=low_stock filters correctly");

    // Pick a test product for stock operations
    const testProduct = products.body.data.products[0];
    const initialQty = testProduct.quantity;

    // 10. Stock In
    const stockInRes = await request("POST", `/api/products/${testProduct.id}/stock-in`, {
      quantity: 5,
      note: "API Test Stock In",
    }, employeeToken);
    assert(stockInRes.status === 200 && stockInRes.body.data.quantity_after === initialQty + 5, `POST /api/products/:id/stock-in adds 5 units (${initialQty} -> ${initialQty + 5})`);

    // 11. Stock Out
    const stockOutRes = await request("POST", `/api/products/${testProduct.id}/stock-out`, {
      quantity: 2,
      note: "API Test Stock Out",
    }, employeeToken);
    assert(stockOutRes.status === 200 && stockOutRes.body.data.quantity_after === initialQty + 3, `POST /api/products/:id/stock-out removes 2 units (${initialQty + 5} -> ${initialQty + 3})`);

    // 12. Stock Out Overdraw rejection (Atomic procedure rollback check)
    const overdrawRes = await request("POST", `/api/products/${testProduct.id}/stock-out`, {
      quantity: 999999,
      note: "Attempting excessive stock out",
    }, employeeToken);
    assert(overdrawRes.status === 400 && overdrawRes.body.message.includes("Insufficient stock"), "Overdraw rejected: procedure returns 400 Insufficient stock");

    // Verify quantity was unaffected by failed overdraw
    const verifyProd = await request("GET", `/api/products/${testProduct.id}`, null, employeeToken);
    assert(verifyProd.body.data.product.quantity === initialQty + 3, "Product quantity remained unchanged after rejected overdraw");

    // 13. Movement History
    const movements = await request("GET", `/api/products/${testProduct.id}/movements`, null, employeeToken);
    assert(movements.status === 200 && movements.body.data.movements.length >= 2, "GET /api/products/:id/movements returns recorded stock audit log");

    // 14. Stock Adjustment (Admin only)
    const adjustRes = await request("POST", `/api/products/${testProduct.id}/adjust`, {
      new_quantity: 20,
      reason: "Audit reconciliation test",
    }, adminToken);
    assert(adjustRes.status === 200 && adjustRes.body.data.quantity_after === 20, "POST /api/products/:id/adjust successfully adjusts quantity to 20");

    // 15. Reports: Dashboard Summary
    const summary = await request("GET", "/api/reports/summary", null, employeeToken);
    assert(summary.status === 200 && summary.body.data.summary.total_products > 0, "GET /api/reports/summary returns accurate aggregate view metrics");

    // 16. Reports: Low Stock
    const reportLowStock = await request("GET", "/api/reports/low-stock", null, employeeToken);
    assert(reportLowStock.status === 200 && Array.isArray(reportLowStock.body.data.products), "GET /api/reports/low-stock returns view-based low stock items");

    console.log(`\n=== Test Results: ${passed} Passed, ${failed} Failed ===\n`);
  } finally {
    server.close();
    await pool.end();
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
