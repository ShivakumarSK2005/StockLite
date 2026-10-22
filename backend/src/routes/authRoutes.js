const express = require("express");
const authController = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { validateLogin } = require("../validators/authValidator");

const router = express.Router();

router.post("/login", validate(validateLogin), authController.login);
router.get("/me", authenticate, authController.getMe);

module.exports = router;
