const inventoryService = require("../services/inventoryService");

async function stockIn(req, res, next) {
  try {
    const { id: productId } = req.params;
    const { quantity, note } = req.body;
    const userId = req.user.id;

    const result = await inventoryService.stockIn(productId, userId, quantity, note);

    res.status(200).json({
      success: true,
      message: `Successfully added ${quantity} units to stock`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

async function stockOut(req, res, next) {
  try {
    const { id: productId } = req.params;
    const { quantity, note } = req.body;
    const userId = req.user.id;

    const result = await inventoryService.stockOut(productId, userId, quantity, note);

    res.status(200).json({
      success: true,
      message: `Successfully issued ${quantity} units from stock`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

async function adjustStock(req, res, next) {
  try {
    const { id: productId } = req.params;
    const { new_quantity, delta, reason } = req.body;
    const userId = req.user.id;

    const result = await inventoryService.adjustStock(productId, userId, {
      new_quantity,
      delta,
      reason,
    });

    res.status(200).json({
      success: true,
      message: `Stock successfully adjusted`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

async function getProductMovements(req, res, next) {
  try {
    const { id: productId } = req.params;
    const { page, limit } = req.query;

    const result = await inventoryService.getProductMovements(productId, { page, limit });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

async function getAllMovements(req, res, next) {
  try {
    const {
      page,
      limit,
      product_id,
      user_id,
      movement_type,
      search,
      date_from,
      date_to,
    } = req.query;

    const result = await inventoryService.getAllMovements({
      page,
      limit,
      product_id,
      user_id,
      movement_type,
      search,
      date_from,
      date_to,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  stockIn,
  stockOut,
  adjustStock,
  getProductMovements,
  getAllMovements,
};
