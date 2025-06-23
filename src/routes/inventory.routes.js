const express = require('express');
const router = express.Router();

const inventoryController = require('../controllers/inventory.controller');

// GET /inventory
router.get('/', inventoryController.getInventoryList);
router.post('/', inventoryController.createInventory);
router.post('/grouped-update', inventoryController.updateGroupedInventory);

router.get('/plants', inventoryController.getPlantWiseReport);
router.get('/search', inventoryController.searchInventoryByItem);

router.get('/export', inventoryController.exportInventoryExcel);
router.get('/plants/export', inventoryController.exportPlantReportExcel);

module.exports = router;
