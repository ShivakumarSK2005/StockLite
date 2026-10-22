const express = require("express");
const productController = require("../controllers/productController");
const inventoryController = require("../controllers/inventoryController");
const { authenticate, authorize } = require("../middleware/auth");
const validate = require("../middleware/validate");
const {
  validateCreateProduct,
  validateUpdateProduct,
} = require("../validators/productValidator");
const {
  validateStockOperation,
  validateStockAdjustment,
} = require("../validators/inventoryValidator");

const router = express.Router();

router.use(authenticate);

// Product CRUD
router.get("/", productController.listProducts);
router.get("/:id", productController.getProductById);
router.post(
  "/",
  authorize("admin"),
  validate(validateCreateProduct),
  productController.createProduct
);
router.patch(
  "/:id",
  authorize("admin"),
  validate(validateUpdateProduct),
  productController.updateProduct
);
router.delete("/:id", authorize("admin"), productController.deleteProduct);

// Inventory Operations on specific product
router.post(
  "/:id/stock-in",
  validate(validateStockOperation),
  inventoryController.stockIn
);
router.post(
  "/:id/stock-out",
  validate(validateStockOperation),
  inventoryController.stockOut
);
router.post(
  "/:id/adjust",
  authorize("admin"),
  validate(validateStockAdjustment),
  inventoryController.adjustStock
);
router.get("/:id/movements", inventoryController.getProductMovements);

module.exports = router;
