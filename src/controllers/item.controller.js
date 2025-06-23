const itemService = require('../services/item.service');
const itemGroupService = require('../services/itemGroup.service');

exports.getItems = async (req, res) => {
  try {
    const items = await itemService.getAllItems();
    const itemGroups = await itemGroupService.getAllItemGroups(); 
    // console.log(itemGroups); // just used for debugging
    res.render('items/index', { 
      items, 
      itemGroups, 
      page:"items"
      // error: req.flash('error'),
      // success: req.flash('success'),
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching items');
  }
};

exports.createItem = async (req, res) => {
  try {
    const { itemName, itemNumber, uom, itemGroupId } = req.body;

    await itemService.createItem({
      itemName,
      itemNumber,
      uom,
      itemGroupId: parseInt(itemGroupId),
    });

    res.redirect('/items');
  } catch (err) {
    let errorMessage = 'Something went wrong. Please try again.';

    // Prisma duplicate error code: P2002
    if (err.code === 'P2002') {
      if (err.meta.target.includes('itemName')) {
        errorMessage = 'Item Name already exists.';
      } else if (err.meta.target.includes('itemNumber')) {
        errorMessage = 'Item Number already exists.';
      }
    }

    const items = await itemService.getAllItems();
    const itemGroups = await require('../services/itemGroup.service').getAllItemGroups();

    req.flash('error', errorMessage);
    res.redirect('/items'); 
  }
};

exports.updateItem = async (req, res) => {
  const itemId = parseInt(req.params.id);
  const { itemName, itemNumber, uom, itemGroupId } = req.body;

  try {
    await itemService.updateItemById(itemId, {
      itemName,
      itemNumber,
      uom,
      itemGroupId: parseInt(itemGroupId),
    });

    req.flash('success', 'Item updated successfully');
    res.redirect('/items');
  } catch (err) {
    console.error('Error updating item:', err);
    let errorMessage = 'Something went wrong';

    if (err.code === 'P2002') {
      errorMessage = 'Item name or number must be unique';
    }

    req.flash('error', errorMessage);
    res.redirect('/items');
  }
};