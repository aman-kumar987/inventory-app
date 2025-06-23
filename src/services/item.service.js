const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

exports.getAllItems = async () => {
  return await prisma.item.findMany({
    include: {
      ItemGroup: true,
    },
    orderBy: {
      id: 'asc', // or 'asc' for old to new
    },
  });
};

exports.createItem = async (data) => {
  return await prisma.item.create({
    data,
  });
};

exports.updateItemById = async (id, data) => {
  return await prisma.item.update({
    where: { id },
    data,
  });
};

exports.searchItems = async (q, groupId) => {
  return await prisma.item.findMany({
    where: {
      itemName: {
        contains: q,
        mode: 'insensitive'
      },
      ...(groupId && { itemGroupId: parseInt(groupId) })
    },
    take: 10,
    orderBy: {
      itemName: 'asc'
    }
  });
};
