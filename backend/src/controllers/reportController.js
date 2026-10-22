const reportService = require("../services/reportService");

async function getDashboardSummary(req, res, next) {
  try {
    const data = await reportService.getDashboardSummary();
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}

async function getLowStockProducts(req, res, next) {
  try {
    const { page, limit } = req.query;
    const data = await reportService.getLowStockProducts({ page, limit });
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}

async function getInventoryExport(req, res, next) {
  try {
    const items = await reportService.getInventoryExport();
    res.status(200).json({
      success: true,
      data: {
        items,
        total: items.length,
        exported_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDashboardSummary,
  getLowStockProducts,
  getInventoryExport,
};
