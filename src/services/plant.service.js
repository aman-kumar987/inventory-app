const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

exports.getAllPlants = async () => {
  return await prisma.plant.findMany();
};

exports.createPlant = async (name) => {
  return await prisma.plant.create({
    data: { name }
  });
};