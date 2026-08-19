import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding HomeMind AI Database...');

  // Clean existing tables
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
  await prisma.user.deleteMany();
  await prisma.household.deleteMany();

  // Create Household
  const household = await prisma.household.create({
    data: {
      name: 'Alpha Residence',
      inviteCode: 'HM-ALPHA88'
    }
  });

  // Settings
  await prisma.setting.create({
    data: {
      householdId: household.id,
      country: 'IN',
      currency: 'INR',
      theme: 'dark'
    }
  });

  // Dashboard Config
  await prisma.dashboardConfig.create({
    data: {
      householdId: household.id,
      layout: JSON.stringify({ widgets: ['expenses', 'bills', 'groceries', 'appliances'] })
    }
  });

  // Users
  const alex = await prisma.user.create({
    data: {
      email: 'user.gmail@gmail.com',
      name: 'Alex Rivera',
      provider: 'GOOGLE',
      googleId: 'google-user-primary',
      role: 'OWNER',
      householdId: household.id,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      isVerified: true,
      isActive: true
    }
  });

  const sarah = await prisma.user.create({
    data: {
      email: 'sarah@homemind.ai',
      name: 'Sarah Rivera',
      provider: 'GOOGLE',
      googleId: 'google-sarah-demo',
      role: 'ADMIN',
      householdId: household.id,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      isVerified: true,
      isActive: true
    }
  });

  const leo = await prisma.user.create({
    data: {
      email: 'leo@homemind.ai',
      name: 'Leo Rivera',
      provider: 'GOOGLE',
      googleId: 'google-leo-demo',
      role: 'MEMBER',
      householdId: household.id,
      isVerified: true,
      isActive: true
    }
  });

  // Expenses & Income
  await prisma.income.createMany({
    data: [
      { householdId: household.id, title: 'Salary Alex', amount: 4800, source: 'Tech Corp', date: new Date('2026-07-01') },
      { householdId: household.id, title: 'Consulting Sarah', amount: 2200, source: 'Design Studio', date: new Date('2026-07-05') }
    ]
  });

  await prisma.expense.createMany({
    data: [
      { householdId: household.id, userId: alex.id, title: 'Organic Supermarket Grocery', amount: 245.80, category: 'Groceries', date: new Date('2026-07-25') },
      { householdId: household.id, userId: sarah.id, title: 'Weekly Farmers Market', amount: 84.50, category: 'Groceries', date: new Date('2026-07-28') },
      { householdId: household.id, userId: alex.id, title: 'High-Speed Fiber Internet', amount: 89.99, category: 'Utilities', date: new Date('2026-07-10'), isRecurring: true },
      { householdId: household.id, userId: alex.id, title: 'Household Cleaning Supplies', amount: 42.15, category: 'Household', date: new Date('2026-07-18') },
      { householdId: household.id, userId: sarah.id, title: 'Pharmacy Prescriptions', amount: 65.00, category: 'Health', date: new Date('2026-07-20') }
    ]
  });

  // Budgets
  await prisma.budget.createMany({
    data: [
      { householdId: household.id, category: 'Groceries', monthlyLimit: 800, month: '2026-07' },
      { householdId: household.id, category: 'Utilities', monthlyLimit: 400, month: '2026-07' },
      { householdId: household.id, category: 'Health', monthlyLimit: 200, month: '2026-07' }
    ]
  });

  // Bills
  await prisma.bill.createMany({
    data: [
      { householdId: household.id, title: 'City Electricity Grid', category: 'Electricity', amount: 142.50, dueDate: new Date('2026-08-05'), status: 'UNPAID', provider: 'EcoPower Inc' },
      { householdId: household.id, title: 'Municipal Water Supply', category: 'Water', amount: 54.20, dueDate: new Date('2026-08-12'), status: 'UNPAID', provider: 'City Water Dept' },
      { householdId: household.id, title: 'Piped Natural Gas', category: 'Gas', amount: 38.90, dueDate: new Date('2026-08-18'), status: 'UNPAID', provider: 'National Gas' },
      { householdId: household.id, title: 'High Speed Fiber Internet', category: 'Internet', amount: 89.99, dueDate: new Date('2026-07-15'), status: 'PAID', provider: 'GigaFiber' }
    ]
  });

  // Grocery Items
  await prisma.groceryItem.createMany({
    data: [
      { householdId: household.id, name: 'Organic Whole Milk 2L', category: 'Milk', quantity: 2, unit: 'L', minThreshold: 1, expiryDate: new Date('2026-08-02') },
      { householdId: household.id, name: 'Artisan Whole Wheat Bread', category: 'Bread', quantity: 1, unit: 'pack', minThreshold: 1, expiryDate: new Date('2026-07-31') },
      { householdId: household.id, name: 'Fresh Spinach 500g', category: 'Vegetables', quantity: 1, unit: 'pack', minThreshold: 1, expiryDate: new Date('2026-07-30') },
      { householdId: household.id, name: 'Basmati Rice 5kg', category: 'Rice', quantity: 3.5, unit: 'kg', minThreshold: 1 },
      { householdId: household.id, name: 'Extra Virgin Olive Oil 1L', category: 'Oil', quantity: 0.2, unit: 'L', minThreshold: 0.5 },
      { householdId: household.id, name: 'Eco Dishwasher Pods', category: 'Cleaning Products', quantity: 15, unit: 'pcs', minThreshold: 5 }
    ]
  });

  // Recipes
  const pastaRecipe = await prisma.recipe.create({
    data: {
      title: 'Creamy Spinach & Garlic Pasta',
      description: 'Quick 20-minute vegetarian pasta utilizing fresh spinach before expiry.',
      prepTimeMins: 20,
      category: 'Quick Meal',
      calories: 420,
      isVegetarian: true,
      instructions: '1. Boil pasta in salted water.\n2. Sauté minced garlic and spinach in olive oil.\n3. Stir in cream, parmesan, and combine with pasta.',
      ingredients: {
        create: [
          { name: 'Fresh Spinach', quantity: 200, unit: 'g' },
          { name: 'Garlic', quantity: 3, unit: 'cloves' },
          { name: 'Pasta', quantity: 250, unit: 'g' },
          { name: 'Heavy Cream', quantity: 100, unit: 'ml' }
        ]
      }
    }
  });

  // Appliances
  const ac = await prisma.appliance.create({
    data: {
      householdId: household.id,
      name: 'Living Room Dual Inverter AC',
      brand: 'Daikin',
      modelNumber: 'FTKF50TV',
      purchaseDate: new Date('2024-05-10'),
      warrantyYears: 3,
      lastServicedDate: new Date('2026-02-15'),
      nextServiceDueDate: new Date('2026-08-15')
    }
  });

  await prisma.applianceMaintenance.create({
    data: {
      applianceId: ac.id,
      cost: 45.00,
      description: 'Deep coil cleaning and refrigerant filter replacement',
      serviceDate: new Date('2026-02-15'),
      status: 'COMPLETED',
      technician: 'CoolAir Technicians'
    }
  });

  // Medicines
  const med = await prisma.medicine.create({
    data: {
      householdId: household.id,
      name: 'Multivitamin Complex',
      dosage: '1 Tablet',
      stockCount: 28,
      expiryDate: new Date('2027-01-01'),
      doctorName: 'Dr. Emily Vance',
      schedules: {
        create: [
          { timeOfDay: '08:30', memberAssignee: 'Alex Rivera', taken: false }
        ]
      }
    }
  });

  // Tasks
  await prisma.task.createMany({
    data: [
      { householdId: household.id, creatorId: alex.id, assigneeId: sarah.id, title: 'Clean HVAC Filters', description: 'Clean primary dust mesh in living room AC unit', priority: 'HIGH', status: 'PENDING', dueDate: new Date('2026-08-02') },
      { householdId: household.id, creatorId: sarah.id, assigneeId: alex.id, title: 'Pay Electricity Utility Bill', description: 'Pay via banking app before early discount deadline', priority: 'URGENT', status: 'PENDING', dueDate: new Date('2026-08-05') },
      { householdId: household.id, creatorId: alex.id, assigneeId: leo.id, title: 'Organize Recycling Bins', description: 'Separate glass, paper, and plastic packaging', priority: 'LOW', status: 'COMPLETED', dueDate: new Date('2026-07-28') }
    ]
  });

  // Notifications
  await prisma.notification.createMany({
    data: [
      { householdId: household.id, title: 'Expiring Item Warning', message: 'Fresh Spinach 500g expires tomorrow! Try cooking Creamy Spinach Pasta tonight.', type: 'GROCERY_EXPIRING' },
      { householdId: household.id, title: 'Bill Payment Reminder', message: 'City Electricity Grid bill of $142.50 is due in 7 days.', type: 'BILL_DUE' },
      { householdId: household.id, title: 'Low Stock Alert', message: 'Extra Virgin Olive Oil is below minimum threshold (0.2L remaining).', type: 'LOW_STOCK' },
      { householdId: household.id, title: 'AI Energy Tip', message: 'Setting AC thermostat to 24°C saves up to 14% on monthly electricity bill.', type: 'AI_ALERT' }
    ]
  });

  // Sustainability Metrics
  await prisma.sustainabilityMetric.create({
    data: {
      householdId: household.id,
      month: '2026-07',
      waterUsageLitre: 4200,
      electricityKwh: 340,
      foodWasteKg: 1.8,
      plasticRecycledKg: 8.5,
      ecoScore: 86.5
    }
  });

  // AI Recommendations
  await prisma.aIRecommendation.createMany({
    data: [
      { householdId: household.id, module: 'Appliance', title: 'Service Living Room AC', description: 'AC filter cleaning is due in 17 days to maintain optimal cooling efficiency.', impactLevel: 'MEDIUM', savingsEstimate: 18.00 },
      { householdId: household.id, module: 'Grocery', title: 'Zero Food Waste Suggestion', description: 'Use Spinach and Bread within 48h to prevent $12.50 in food waste.', impactLevel: 'HIGH', savingsEstimate: 12.50 },
      { householdId: household.id, module: 'Expense', title: 'Re-negotiate Fiber Internet Rate', description: 'Your current $89.99/mo plan can be downgraded or price-matched to $69.99/mo.', impactLevel: 'HIGH', savingsEstimate: 240.00 }
    ]
  });

  console.log('✅ HomeMind AI Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
