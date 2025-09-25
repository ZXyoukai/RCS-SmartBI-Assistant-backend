const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAllUsers = async () => {
    try {
        
        return prisma.users.findMany();
    } catch (error) {
        console.log("has problem:", error);
    }
};

exports.createUser = async (data) => {
  return prisma.user.create({ data });
};

