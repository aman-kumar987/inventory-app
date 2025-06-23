const express = require('express');
const router = express.Router();
const itemController = require('../controllers/item.controller.js');

router.get('/', itemController.getItems);
router.post('/', itemController.createItem);
router.post('/:id/update', itemController.updateItem);


module.exports = router;
