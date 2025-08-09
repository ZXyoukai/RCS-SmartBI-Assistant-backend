const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Usuário de teste
  const user = await prisma.users.create({
    data: {
      name: 'Domingos Franco',
      email: 'domingos@example.com',
      password_hash: 'hash_aqui',
      role: 'admin',
    },
  });

  // Consulta de teste
  const query = await prisma.queries.create({
    data: {
      user_id: user.id,
      question_text: 'Qual foi o faturamento do último trimestre?',
    },
  });

  // Resultado de teste
  await prisma.results.create({
    data: {
      query_id: query.id,
      result_type: 'table',
      content: { colunas: ['Mês', 'Faturamento'], valores: [['Jan', 1000], ['Fev', 2000]] },
    },
  });

  console.log('Banco populado com dados de teste!');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
