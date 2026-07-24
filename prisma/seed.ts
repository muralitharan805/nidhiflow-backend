import { PrismaClient, Role, AccountType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * Seed script initializing default administrator, user, and standard Chart of Accounts.
 */
async function main(): Promise<void> {
  console.log('🌱 Starting database seeding...');

  // 1. Seed Admin User
  const hashedPassword = await bcrypt.hash('AdminP@ss123!', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@nidhiflow.io' },
    update: {},
    create: {
      email: 'admin@nidhiflow.io',
      name: 'System Administrator',
      password: hashedPassword,
      role: Role.ADMIN,
    },
  });
  console.log(`✅ Seeded Admin User: ${admin.email}`);

  // 2. Seed Standard User
  const sampleUserPassword = await bcrypt.hash('UserP@ss123!', 10);
  const user = await prisma.user.upsert({
    where: { email: 'murali@nidhiflow.io' },
    update: {},
    create: {
      email: 'murali@nidhiflow.io',
      name: 'Murali',
      password: sampleUserPassword,
      role: Role.USER,
    },
  });
  console.log(`✅ Seeded Standard User: ${user.email}`);

  // 3. Seed Initial Chart of Accounts (Double-Entry Canon)
  const defaultAccounts = [
    { code: '1010', name: 'Primary Bank Account', type: AccountType.ASSET, description: 'Main savings/checking account' },
    { code: '1020', name: 'Cash Wallet', type: AccountType.ASSET, description: 'Physical cash on hand' },
    { code: '2010', name: 'Home Loan Liability', type: AccountType.LIABILITY, description: 'Primary mortgage liability' },
    { code: '2020', name: 'Credit Card Outstanding', type: AccountType.LIABILITY, description: 'Monthly credit card balance' },
    { code: '3010', name: 'Primary Salary Income', type: AccountType.INCOME, description: 'Monthly employment salary' },
    { code: '4010', name: 'Groceries Expense', type: AccountType.EXPENSE, description: 'Food and daily grocery spend' },
    { code: '4020', name: 'House Rent Expense', type: AccountType.EXPENSE, description: 'Monthly house rent payment' },
    { code: '4030', name: 'Loan Interest Expense', type: AccountType.EXPENSE, description: 'Interest portion of EMI payments' },
  ];

  for (const acc of defaultAccounts) {
    const createdAcc = await prisma.account.upsert({
      where: { code: acc.code },
      update: {},
      create: {
        code: acc.code,
        name: acc.name,
        type: acc.type,
        description: acc.description,
      },
    });
    console.log(`✅ Seeded Account [${createdAcc.code}] ${createdAcc.name} (${createdAcc.type})`);
  }

  console.log('🎉 Database seeding completed successfully.');
}

main()
  .catch((e: unknown) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
