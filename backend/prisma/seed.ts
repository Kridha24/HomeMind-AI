import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Cleaning all tables in HomeMind AI Database for 100% clean slate...');

  // Clean all existing tables completely
  await prisma.notification.deleteMany();
  await prisma.aIRecommendation.deleteMany();
  await prisma.aIForecast.deleteMany();
  await prisma.sustainabilityMetric.deleteMany();
  await prisma.task.deleteMany();
  await prisma.medicineSchedule.deleteMany();
  await prisma.medicine.deleteMany();
  await prisma.applianceMaintenance.deleteMany();
  await prisma.appliance.deleteMany();
  await prisma.recipeIngredient.deleteMany();
  await prisma.recipe.deleteMany();
  await prisma.groceryItem.deleteMany();
  await prisma.bill.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.income.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.dashboardConfig.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.oTPVerification.deleteMany();
  await prisma.user.deleteMany();
  await prisma.household.deleteMany();

  console.log('✅ All users, households, and mock data wiped. Ready for real user registrations!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
