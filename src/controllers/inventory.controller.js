const inventoryService = require('../services/inventory.service');
const plantService = require('../services/plant.service');
const itemService = require('../services/item.service');
const itemGroupService = require('../services/itemGroup.service'); 

exports.getInventoryList = async (req, res) => {
  try {
    const rawInventory = await inventoryService.getGroupedInventory();
    const plants = await plantService.getAllPlants();
    const items = await itemService.getAllItems();

    res.render('inventory/index', {
      inventory: rawInventory,
      plants,
      items,
      page:'inventory'
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading inventory summary');
  }
};

exports.createInventory = async (req, res) => {
  try {
    const { plantId, itemId, quantity, category } = req.body;

    await inventoryService.createInventory({
      plantId: parseInt(plantId),
      itemId: parseInt(itemId),
      quantity: parseInt(quantity),
      category
    });

    req.flash('success', 'Inventory added/updated successfully.');
    res.redirect('/inventory');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Failed to add inventory.');
    res.redirect('/inventory');
  }
};

exports.updateGroupedInventory = async (req, res) => {
  try {
    const { plantId, itemId, NEW, OLD, SCRAPED } = req.body;

    const parsedPlantId = parseInt(plantId);
    const parsedItemId = parseInt(itemId);

    await inventoryService.updateGroupedInventory({
      plantId: parsedPlantId,
      itemId: parsedItemId,
      NEW: parseInt(NEW),
      OLD: parseInt(OLD),
      SCRAPED: parseInt(SCRAPED),
    });

    req.flash('success', 'Inventory updated successfully.');
    res.redirect('/inventory');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Failed to update inventory.');
    res.redirect('/inventory');
  }
};

exports.getPlantWiseReport = async (req, res) => {
  try {
    const structuredInventory = await inventoryService.getStructuredInventoryData();
    res.render('inventory/plantReport', { structuredInventory, page: "plantsInventory" });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading plant-wise report');
  }
};

exports.searchInventoryByItem = async (req, res) => {
  const query = req.query.q?.trim();
  const itemGroups = await itemGroupService.getAllItemGroups(); // fetch all item groups

  if (!query) {
    return res.render('inventory/search', {
      groupedByPlant: null,
      totalSummary: null,
      query: '',
      itemGroups,
      page:'search'
    });
  }

  try {
    const data = await inventoryService.searchGroupedByItem(query);
    const total = Object.keys(data).length > 0
      ? await inventoryService.calculateTotals(data)
      : { NEW: 0, OLD: 0, SCRAPED: 0, total: 0 };

    res.render('inventory/search', {
      groupedByPlant: data,
      totalSummary: total,
      query,
      itemGroups,
      page: "search"
    });
  } catch (err) {
    console.error("Search error:", err);
    req.flash('error', 'Something went wrong during search.');  // Better UX
    res.redirect('/inventory/search');
  }
};

exports.searchItemsByName = async (req, res) => {
  const { q, groupId } = req.query;

  // Only allow if Accept header indicates it's an AJAX/fetch request
  const acceptsJSON = req.headers.accept?.includes('application/json');

  if (!acceptsJSON) {
    return res.status(403).send('Forbidden');
  }

  try {
    const items = await itemService.searchItems(q, groupId);
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching items" });
  }
};

exports.exportInventoryExcel = async (req, res) => {
  try {
    const workbook = await inventoryService.exportGroupedInventoryToExcel();

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="inventory-report.xlsx"'
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Excel Export Error:', err);
    req.flash('error', 'Failed to export inventory data.');
    res.redirect('/inventory');
  }
};

exports.exportPlantReportExcel = async (req, res) => {
  try {
    const workbook = await inventoryService.exportPlantWiseReportToExcel();

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="plant-wise-report.xlsx"'
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Export Plant Report Error:', err);
    req.flash('error', 'Failed to export plant-wise report.');
    res.redirect('/inventory/plants');
  }
};

