const express = require("express");
const userController = require("../controllers/userController");
const { authenticate, authorize } = require("../middleware/auth");
const validate = require("../middleware/validate");
const {
  validateCreateUser,
  validateUpdateUser,
} = require("../validators/userValidator");

const router = express.Router();

// All user management routes require admin role
router.use(authenticate, authorize("admin"));

router.get("/", userController.listUsers);
router.get("/:id", userController.getUserById);
router.post("/", validate(validateCreateUser), userController.createUser);
router.patch("/:id", validate(validateUpdateUser), userController.updateUser);
router.delete("/:id", userController.deleteUser);

module.exports = router;
