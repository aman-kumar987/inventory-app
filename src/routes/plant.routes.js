const express = require('express');
const router = express.Router();
const plantController = require('../controllers/plant.controller');

// GET /plants
router.get('/', plantController.getAllPlants);
router.post('/', plantController.createPlant);


module.exports = router;
