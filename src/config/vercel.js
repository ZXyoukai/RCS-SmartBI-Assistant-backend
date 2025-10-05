module.exports = {
  // Configurações específicas para Vercel
  vercel: {
    // Região preferida
    regions: ['iad1'],
    
    // Configurações de função
    functions: {
      'src/app.js': {
        maxDuration: 60,
        memory: 1024,
      },
    },
    
    // Variáveis de ambiente obrigatórias
    requiredEnvVars: [
      'DATABASE_URL',
      'JWT_SECRET',
      'NODE_ENV',
    ],
    
    // Configurações do Prisma
    prisma: {
      generateDataProxy: true,
      binaryTargets: ['native', 'rhel-openssl-1.0.x'],
    },
  },
  
  // Configurações de CORS para produção
  cors: {
    production: {
      origin: process.env.FRONTEND_URL || false,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    },
    development: {
      origin: '*',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    },
  },
  
  // Configurações de rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // máximo 100 requests por IP por janela de tempo
    standardHeaders: true,
    legacyHeaders: false,
  },
};
