import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding HomeMind AI Database with full household dataset...');

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. Create or Find Household
  let household = await prisma.household.findFirst({
    where: { name: 'The Rivera Residence' }
  });

  if (!household) {
    household = await prisma.household.create({
      data: {
        name: 'The Rivera Residence',
        inviteCode: 'RIVERA-2026',
      }
    });
  }

  // 2. Household Settings
  await prisma.setting.deleteMany({ where: { householdId: household.id } });
  await prisma.setting.create({
    data: {
      householdId: household.id,
      currency: 'USD',
      country: 'US',
      timeZone: 'America/New_York',
      theme: 'dark',
      aiMemoryEnabled: true,
      proactiveAI: true
    }
  });

  // 3. Create Users
  let alex = await prisma.user.findFirst({ where: { email: 'alex.rivera@homemind.internal' } });
  if (!alex) {
    alex = await prisma.user.create({
      data: {
        email: 'alex.rivera@homemind.internal',
        name: 'Alex Rivera',
        passwordHash,
        role: 'OWNER',
        householdId: household.id,
        isVerified: true
      }
    });
  }

  let sarah = await prisma.user.findFirst({ where: { email: 'sarah.rivera@homemind.internal' } });
  if (!sarah) {
    sarah = await prisma.user.create({
      data: {
        email: 'sarah.rivera@homemind.internal',
        name: 'Sarah Rivera',
        passwordHash,
        role: 'ADMIN',
        householdId: household.id,
        isVerified: true
      }
    });
  }

  // 4. Incomes
  await prisma.income.deleteMany({ where: { householdId: household.id } });
  await prisma.income.createMany({
    data: [
      {
        householdId: household.id,
        title: 'Salary Alex',
        amount: 4800,
        source: 'Tech Corp',
        date: new Date()
      },
      {
        householdId: household.id,
        title: 'Consulting Sarah',
        amount: 2200,
        source: 'Design Studio',
        date: new Date()
      }
    ]
  });

  // 5. Expenses
  await prisma.expense.deleteMany({ where: { householdId: household.id } });
  await prisma.expense.createMany({
    data: [
      {
        householdId: household.id,
        userId: alex.id,
        title: 'Organic Supermarket Grocery',
        amount: 245.80,
        category: 'Groceries',
        date: new Date()
      },
      {
        householdId: household.id,
        userId: sarah.id,
        title: 'Weekly Farmers Market',
        amount: 84.50,
        category: 'Groceries',
        date: new Date()
      },
      {
        householdId: household.id,
        userId: alex.id,
        title: 'High-Speed Fiber Internet',
        amount: 89.99,
        category: 'Utilities',
        date: new Date(),
        isRecurring: true
      },
      {
        householdId: household.id,
        userId: alex.id,
        title: 'Household Cleaning Supplies',
        amount: 42.15,
        category: 'Household',
        date: new Date()
      },
      {
        householdId: household.id,
        userId: sarah.id,
        title: 'Pharmacy Prescriptions',
        amount: 65.00,
        category: 'Health',
        date: new Date()
      }
    ]
  });

  // 6. Bills
  await prisma.bill.deleteMany({ where: { householdId: household.id } });
  await prisma.bill.createMany({
    data: [
      {
        householdId: household.id,
        title: 'City Electricity Grid',
        category: 'Electricity',
        amount: 142.50,
        dueDate: new Date(Date.now() + 7 * 86400000),
        status: 'UNPAID',
        provider: 'EcoPower Inc'
      },
      {
        householdId: household.id,
        title: 'Municipal Water Supply',
        category: 'Water',
        amount: 54.20,
        dueDate: new Date(Date.now() + 12 * 86400000),
        status: 'UNPAID',
        provider: 'City Water Dept'
      },
      {
        householdId: household.id,
        title: 'Piped Natural Gas',
        category: 'Gas',
        amount: 38.90,
        dueDate: new Date(Date.now() + 18 * 86400000),
        status: 'UNPAID',
        provider: 'National Gas'
      },
      {
        householdId: household.id,
        title: 'High Speed Fiber Internet',
        category: 'Internet',
        amount: 89.99,
        dueDate: new Date(Date.now() - 5 * 86400000),
        status: 'PAID',
        provider: 'GigaFiber'
      }
    ]
  });

  // 7. Grocery Items
  await prisma.groceryItem.deleteMany({ where: { householdId: household.id } });
  await prisma.groceryItem.createMany({
    data: [
      {
        householdId: household.id,
        name: 'Organic Whole Milk 2L',
        category: 'Milk',
        quantity: 2,
        unit: 'L',
        minThreshold: 1,
        expiryDate: new Date(Date.now() + 3 * 86400000)
      },
      {
        householdId: household.id,
        name: 'Artisan Whole Wheat Bread',
        category: 'Bread',
        quantity: 1,
        unit: 'pack',
        minThreshold: 1,
        expiryDate: new Date(Date.now() + 2 * 86400000)
      },
      {
        householdId: household.id,
        name: 'Fresh Spinach 500g',
        category: 'Vegetables',
        quantity: 1,
        unit: 'pack',
        minThreshold: 1,
        expiryDate: new Date(Date.now() + 1 * 86400000)
      },
      {
        householdId: household.id,
        name: 'Basmati Rice 5kg',
        category: 'Rice',
        quantity: 3.5,
        unit: 'kg',
        minThreshold: 1
      },
      {
        householdId: household.id,
        name: 'Extra Virgin Olive Oil 1L',
        category: 'Oil',
        quantity: 0.2,
        unit: 'L',
        minThreshold: 0.5
      },
      {
        householdId: household.id,
        name: 'Eco Dishwasher Pods',
        category: 'Cleaning Products',
        quantity: 15,
        unit: 'pcs',
        minThreshold: 5
      }
    ]
  });

  // 8. Tasks
  await prisma.task.deleteMany({ where: { householdId: household.id } });
  await prisma.task.createMany({
    data: [
      {
        householdId: household.id,
        creatorId: alex.id,
        assigneeId: sarah.id,
        title: 'Clean HVAC Filters',
        description: 'Clean primary dust mesh in living room AC unit',
        priority: 'HIGH',
        status: 'PENDING',
        dueDate: new Date(Date.now() + 2 * 86400000)
      },
      {
        householdId: household.id,
        creatorId: sarah.id,
        assigneeId: alex.id,
        title: 'Pay Electricity Utility Bill',
        description: 'Pay via banking app before early discount deadline',
        priority: 'URGENT',
        status: 'PENDING',
        dueDate: new Date(Date.now() + 5 * 86400000)
      },
      {
        householdId: household.id,
        creatorId: alex.id,
        title: 'Organize Recycling Bins',
        description: 'Separate glass, paper, and plastic packaging',
        priority: 'LOW',
        status: 'COMPLETED',
        dueDate: new Date(Date.now() - 1 * 86400000)
      }
    ]
  });

  // 9. Appliances
  await prisma.appliance.deleteMany({ where: { householdId: household.id } });
  await prisma.appliance.create({
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

  // 10. Medicines
  await prisma.medicine.deleteMany({ where: { householdId: household.id } });
  await prisma.medicine.create({
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

  // 11. Ensure all user households also have Income, Expenses, Bills, Groceries, and Tasks
  const allHouseholds = await prisma.household.findMany({
    include: { members: true }
  });
  for (const h of allHouseholds) {
    if (h.id !== household.id) {
      const uId = h.members[0]?.id || alex.id;
      const existingIncomes = await prisma.income.count({ where: { householdId: h.id } });
      if (existingIncomes === 0) {
        await prisma.income.createMany({
          data: [
            { householdId: h.id, title: 'Monthly Salary', amount: 4800, source: 'Tech Corp', date: new Date() },
            { householdId: h.id, title: 'Consulting & Freelance', amount: 2200, source: 'Design Studio', date: new Date() }
          ]
        });
      }
      const existingExpenses = await prisma.expense.count({ where: { householdId: h.id } });
      if (existingExpenses === 0) {
        await prisma.expense.createMany({
          data: [
            { householdId: h.id, userId: uId, title: 'Organic Supermarket Grocery', amount: 245.80, category: 'Groceries', date: new Date() },
            { householdId: h.id, userId: uId, title: 'High-Speed Fiber Internet', amount: 89.99, category: 'Utilities', date: new Date(), isRecurring: true },
            { householdId: h.id, userId: uId, title: 'Weekly Farmers Market', amount: 84.50, category: 'Groceries', date: new Date() }
          ]
        });
      }
      const existingBills = await prisma.bill.count({ where: { householdId: h.id } });
      if (existingBills === 0) {
        await prisma.bill.createMany({
          data: [
            { householdId: h.id, title: 'City Electricity Grid', category: 'Electricity', amount: 142.50, dueDate: new Date(Date.now() + 7 * 86400000), status: 'UNPAID', provider: 'EcoPower Inc' },
            { householdId: h.id, title: 'Municipal Water Supply', category: 'Water', amount: 54.20, dueDate: new Date(Date.now() + 12 * 86400000), status: 'UNPAID', provider: 'City Water Dept' },
            { householdId: h.id, title: 'High Speed Fiber Internet', category: 'Internet', amount: 89.99, dueDate: new Date(Date.now() - 5 * 86400000), status: 'PAID', provider: 'GigaFiber' }
          ]
        });
      }
      const existingGroceries = await prisma.groceryItem.count({ where: { householdId: h.id } });
      if (existingGroceries === 0) {
        await prisma.groceryItem.createMany({
          data: [
            { householdId: h.id, name: 'Organic Whole Milk 2L', category: 'Milk', quantity: 2, unit: 'L', minThreshold: 1, expiryDate: new Date(Date.now() + 3 * 86400000) },
            { householdId: h.id, name: 'Fresh Spinach 500g', category: 'Vegetables', quantity: 1, unit: 'pack', minThreshold: 1, expiryDate: new Date(Date.now() + 1 * 86400000) },
            { householdId: h.id, name: 'Basmati Rice 5kg', category: 'Rice', quantity: 3.5, unit: 'kg', minThreshold: 1 },
            { householdId: h.id, name: 'Extra Virgin Olive Oil 1L', category: 'Oil', quantity: 0.2, unit: 'L', minThreshold: 0.5 }
          ]
        });
      }
      const existingTasks = await prisma.task.count({ where: { householdId: h.id } });
      if (existingTasks === 0) {
        await prisma.task.createMany({
          data: [
            { householdId: h.id, creatorId: uId, title: 'Clean HVAC Filters', description: 'Clean primary dust mesh in AC unit', priority: 'HIGH', status: 'PENDING', dueDate: new Date(Date.now() + 2 * 86400000) },
            { householdId: h.id, creatorId: uId, title: 'Pay Electricity Utility Bill', description: 'Pay via banking app before deadline', priority: 'URGENT', status: 'PENDING', dueDate: new Date(Date.now() + 5 * 86400000) }
          ]
        });
      }
    }
  }

  console.log('✅ HomeMind AI Database seeded successfully with all income and household records!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
