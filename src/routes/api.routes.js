const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventory.controller');

// Only API-specific route here
router.get('/inventory/items', inventoryController.searchItemsByName);

module.exports = router;
