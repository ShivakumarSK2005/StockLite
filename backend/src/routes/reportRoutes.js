const express = require("express");
const reportController = require("../controllers/reportController");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

router.use(authenticate);

router.get("/summary", reportController.getDashboardSummary);
router.get("/low-stock", reportController.getLowStockProducts);
router.get("/inventory-export", reportController.getInventoryExport);

module.exports = router;
