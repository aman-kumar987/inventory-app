const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

exports.getAllItemGroups = async () => {
  return await prisma.itemGroup.findMany({
    orderBy: { groupName: 'asc' },
  });
};
