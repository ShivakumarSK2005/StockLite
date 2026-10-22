const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const app = require("./app");
const pool = require("./config/db");

const PORT = Number(process.env.PORT || 5000);

async function startServer() {
  try {
    const connection = await pool.getConnection();
    connection.release();

    const server = app.listen(PORT, () => {
      console.log(`StockLite API running at http://localhost:${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
    });

    const shutdown = (signal) => {
      console.log(`${signal} received. Shutting down StockLite...`);

      server.close(async () => {
        try {
          await pool.end();
          console.log("HTTP server and MySQL pool closed.");
          process.exit(0);
        } catch (error) {
          console.error("Error during shutdown:", error.message);
          process.exit(1);
        }
      });
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error) {
    console.error("Failed to start StockLite:", error.message);
    await pool.end();
    process.exit(1);
  }
}

startServer();
