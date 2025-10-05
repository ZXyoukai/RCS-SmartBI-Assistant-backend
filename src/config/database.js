const { PrismaClient } = require('@prisma/client');

// Singleton pattern para Prisma Client
let prisma;

const getPrismaClient = () => {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });

    // Graceful shutdown
    const gracefulShutdown = async () => {
      await prisma.$disconnect();
      process.exit(0);
    };

    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);
  }

  return prisma;
};

module.exports = { getPrismaClient };
