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

async function runConcurrencyTest() {
  console.log("=== StockLite Concurrency & Race Condition Test ===\n");

  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://localhost:${port}`;

  try {
    // 1. Login Admin
    const login = await request("POST", "/api/auth/login", {
      email: "admin@example.com",
      password: "admin123",
    });
    const token = login.body.data.token;

    // 2. Create a dedicated temporary product with initial quantity = 5
    const [cats] = await pool.query("SELECT id FROM categories LIMIT 1");
    const categoryId = cats[0].id;
    const testSku = `RACE-${Date.now()}`;

    const createRes = await request("POST", "/api/products", {
      sku: testSku,
      name: "Concurrency Test Widget",
      category_id: categoryId,
      price: 199.00,
      reorder_level: 2,
      initial_quantity: 5,
    }, token);

    const productId = createRes.body.data.product.id;
    console.log(`Created test product [ID: ${productId}, SKU: ${testSku}] with initial stock = 5.`);

    // 3. Fire 10 concurrent stock-out requests (each requesting 1 unit)
    console.log("Firing 10 simultaneous stock-out requests (1 unit each)...");
    const promises = [];
    for (let i = 1; i <= 10; i++) {
      promises.push(
        request("POST", `/api/products/${productId}/stock-out`, {
          quantity: 1,
          note: `Concurrent request #${i}`,
        }, token)
      );
    }

    const results = await Promise.all(promises);

    const successful = results.filter((r) => r.status === 200);
    const failed = results.filter((r) => r.status === 400);

    console.log(`\nResults:`);
    console.log(`  - 200 OK (Succeeded): ${successful.length}`);
    console.log(`  - 400 Insufficient Stock (Rejected): ${failed.length}`);

    // 4. Verify final database state
    const [productCheck] = await pool.query(
      "SELECT quantity FROM products WHERE id = ?",
      [productId]
    );
    const finalQuantity = productCheck[0].quantity;

    const [movementCheck] = await pool.query(
      "SELECT COUNT(*) as count FROM stock_movements WHERE product_id = ? AND movement_type = 'stock_out'",
      [productId]
    );
    const recordedMovements = movementCheck[0].count;

    console.log(`  - Final product stock in DB: ${finalQuantity}`);
    console.log(`  - Recorded stock_out movements in DB: ${recordedMovements}`);

    // Assertions
    if (successful.length === 5 && failed.length === 5 && finalQuantity === 0 && recordedMovements === 5) {
      console.log("\n>>> [CONCURRENCY TEST PASSED]: Zero race conditions detected. Row locks and transactions maintained strict ACID consistency! <<<\n");
    } else {
      console.error("\n>>> [CONCURRENCY TEST FAILED]: Unexpected quantity or movement counts! <<<\n");
      process.exitCode = 1;
    }

    // Deactivate test product to maintain audit immutability
    await pool.query("UPDATE products SET is_active = FALSE WHERE id = ?", [productId]);
  } finally {
    server.close();
    await pool.end();
  }
}

runConcurrencyTest().catch((err) => {
  console.error("Concurrency test failed:", err);
  process.exit(1);
});
