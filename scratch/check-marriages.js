const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const marriages = await prisma.marriage.findMany({ take: 10 });
  console.log('=== MARRIAGES IN DB ===');
  console.log(JSON.stringify(marriages, null, 2));
  console.log(`Total: ${marriages.length}`);
  
  // Also check total count
  const count = await prisma.marriage.count();
  console.log(`Total marriages in DB: ${count}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
