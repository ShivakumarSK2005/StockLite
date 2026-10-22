const express = require("express");
const categoryController = require("../controllers/categoryController");
const { authenticate, authorize } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { validateCategory } = require("../validators/categoryValidator");

const router = express.Router();

router.use(authenticate);

router.get("/", categoryController.listCategories);
router.get("/:id", categoryController.getCategoryById);
router.post(
  "/",
  authorize("admin"),
  validate(validateCategory),
  categoryController.createCategory
);
router.patch(
  "/:id",
  authorize("admin"),
  validate(validateCategory),
  categoryController.updateCategory
);
router.delete("/:id", authorize("admin"), categoryController.deleteCategory);

module.exports = router;
