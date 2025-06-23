const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();
const ExcelJS = require('exceljs');

exports.getStructuredInventoryData = async () => {
    const inventoryRecords = await prisma.inventory.findMany({
        include: {
            Plant: true,
            Item: {
                include: {
                    ItemGroup: true
                }
            }
        }
    });

    // Final structured data
    const structuredData = {};

    for (const record of inventoryRecords) {
        const plantName = record.Plant.name;
        const groupName = record.Item.ItemGroup.groupName;
        const itemName = record.Item.itemName;
        const category = record.category;
        const quantity = record.quantity || 0;

        // Initialize plant
        if (!structuredData[plantName]) {
            structuredData[plantName] = {};
        }

        // Initialize group
        if (!structuredData[plantName][groupName]) {
            structuredData[plantName][groupName] = {};
        }

        // Initialize item
        if (!structuredData[plantName][groupName][itemName]) {
            structuredData[plantName][groupName][itemName] = {
                NEW: 0,
                OLD: 0,
                SCRAPED: 0,
                total: 0
            };
        }

        // Update category & total
        structuredData[plantName][groupName][itemName][category] += quantity;
        structuredData[plantName][groupName][itemName].total += quantity;
    }

    return structuredData;
};

exports.getFlatInventory = async () => {
    return await prisma.inventory.findMany({
        include: {
            Plant: true,
            Item: {
                include: {
                    ItemGroup: true
                }
            }
        },
        orderBy: {
            id: 'asc'
        }
    });
};

exports.getGroupedInventory = async () => {
    const inventoryData = await prisma.inventory.findMany({
        include: {
            Plant: true,
            Item: {
                include: {
                    ItemGroup: true
                }
            }
        },
            orderBy: [
                { plantId: 'asc' },
                { itemId: 'asc' }
            ]
    });

    const grouped = {};

    inventoryData.forEach(entry => {
        const key = `${entry.plantId}-${entry.itemId}`;

        // Fix this
        if (!grouped[key]) {
            grouped[key] = {
                id: entry.id, // this is okay
                plantId: entry.plantId, // 🔁 ADD THIS
                itemId: entry.itemId,   // 🔁 ADD THIS
                plantName: entry.Plant.name,
                itemGroupName: entry.Item.ItemGroup.groupName,
                itemName: entry.Item.itemName,
                NEW: 0,
                OLD: 0,
                SCRAPED: 0
            };
        }


        // Safety check: ensure category is valid
        if (entry.category in grouped[key]) {
            grouped[key][entry.category] += entry.quantity;
        }
    });

    // Add total
    const result = Object.values(grouped).map(entry => {
        entry.total = entry.NEW + entry.OLD + entry.SCRAPED;
        return entry;
    });

    return result;
};


exports.createInventory = async ({ plantId, itemId, quantity, category }) => {
    // Check if entry already exists for same plant, item, category
    const existing = await prisma.inventory.findFirst({
        where: { plantId, itemId, category }
    });

    if (existing) {
        // If exists, just update the quantity
        return await prisma.inventory.update({
            where: { id: existing.id },
            data: { quantity: existing.quantity + quantity }
        });
    }

    // Else, create new entry
    return await prisma.inventory.create({
        data: { plantId, itemId, quantity, category }
    });
};

exports.updateGroupedInventory = async ({ plantId, itemId, NEW, OLD, SCRAPED }) => {
    const categories = ['NEW', 'OLD', 'SCRAPED'];
    const quantities = { NEW, OLD, SCRAPED };

    for (const category of categories) {
        const existing = await prisma.inventory.findFirst({
            where: { plantId, itemId, category }
        });

        if (existing) {
            await prisma.inventory.update({
                where: { id: existing.id },
                data: { quantity: quantities[category] }
            });
        } else {
            if (quantities[category] > 0) {
                await prisma.inventory.create({
                    data: { plantId, itemId, category, quantity: quantities[category] }
                });
            }
        }
    }
};

exports.searchGroupedByItem = async (query) => {
  const inventoryRecords = await prisma.inventory.findMany({
    where: {
      Item: {
        itemName: {
          contains: query,
          mode: 'insensitive'
        }
      }
    },
    include: {
      Plant: true,
      Item: {
        include: {
          ItemGroup: true
        }
      }
    }
  });

  const grouped = {};

  for (const entry of inventoryRecords) {
    const plantName = entry.Plant.name;
    const category = entry.category;
    const quantity = entry.quantity;

    if (!grouped[plantName]) {
      grouped[plantName] = { NEW: 0, OLD: 0, SCRAPED: 0, total: 0 };
    }

    if (category in grouped[plantName]) {
      grouped[plantName][category] += quantity;
      grouped[plantName].total += quantity;
    }
  }

  return grouped;
};

exports.calculateTotals = async (groupedData) => {
  const total = { NEW: 0, OLD: 0, SCRAPED: 0, total: 0 };

  for (const plant in groupedData) {
    const plantData = groupedData[plant];
    total.NEW += plantData.NEW;
    total.OLD += plantData.OLD;
    total.SCRAPED += plantData.SCRAPED;
    total.total += plantData.total;
  }

  return total;
};

exports.exportGroupedInventoryToExcel = async () => {
  const data = await exports.getGroupedInventory(); // reuse grouped data

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Inventory Report');

  // Define header
  worksheet.columns = [
    { header: 'Plant', key: 'plantName', width: 20 },
    { header: 'Item Group', key: 'itemGroupName', width: 20 },
    { header: 'Item Name', key: 'itemName', width: 25 },
    { header: 'NEW', key: 'NEW', width: 10 },
    { header: 'OLD', key: 'OLD', width: 10 },
    { header: 'SCRAPED', key: 'SCRAPED', width: 10 },
    { header: 'TOTAL', key: 'total', width: 12 }
  ];

  // Add rows
  data.forEach(row => worksheet.addRow(row));

  // Formatting header bold
  worksheet.getRow(1).font = { bold: true };

  return workbook;
};

exports.exportPlantWiseReportToExcel = async () => {
  const structuredData = await exports.getStructuredInventoryData();
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Plant-Wise Report');

  // Define styles
  const boldStyle = { bold: true };

  worksheet.columns = [
    { header: 'Plant', key: 'plant', width: 25 },
    { header: 'Item Group', key: 'group', width: 25 },
    { header: 'Item Name', key: 'item', width: 30 },
    { header: 'NEW', key: 'new', width: 10 },
    { header: 'OLD', key: 'old', width: 10 },
    { header: 'SCRAPED', key: 'scraped', width: 10 },
    { header: 'TOTAL', key: 'total', width: 10 },
  ];

  for (const plant in structuredData) {
    worksheet.addRow([plant]).font = boldStyle;

    const groups = structuredData[plant];
    for (const group in groups) {
      worksheet.addRow(['', group]).font = boldStyle;

      const items = groups[group];
      for (const item in items) {
        const data = items[item];
        worksheet.addRow([
          '', '', item, data.NEW, data.OLD, data.SCRAPED, data.total
        ]);
      }

      worksheet.addRow([]); // Empty row after each group
    }

    worksheet.addRow([]); // Empty row after each plant
  }

  return workbook;
};

