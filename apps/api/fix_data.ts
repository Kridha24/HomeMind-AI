import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  for (const user of users) {
    if (!user.householdId) continue;
    
    // Migrate Expenses
    const e = await prisma.expense.updateMany({
      where: { userId: user.id, householdId: { not: user.householdId } },
      data: { householdId: user.householdId }
    });
    
    // Migrate Incomes
    const i = await prisma.income.updateMany({
      where: { createdBy: user.id, householdId: { not: user.householdId } },
      data: { householdId: user.householdId }
    });
    
    // Migrate Bills
    const b = await prisma.bill.updateMany({
      where: { createdBy: user.id, householdId: { not: user.householdId } },
      data: { householdId: user.householdId }
    });

    if (e.count > 0 || i.count > 0 || b.count > 0) {
      console.log(`Migrated for user ${user.name}: ${e.count} expenses, ${i.count} incomes, ${b.count} bills.`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
