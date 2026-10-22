const express = require("express");
const inventoryController = require("../controllers/inventoryController");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

router.use(authenticate);

router.get("/", inventoryController.getAllMovements);

module.exports = router;
