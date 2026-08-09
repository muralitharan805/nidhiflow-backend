import { PrismaClient, Role, AccountType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * Interface defining the structure of default seed account heads.
 */
interface AccountSeedInput {
  readonly code: string;
  readonly name: string;
  readonly type: AccountType;
  readonly description: string;
}

/**
 * Comprehensive Chart of Accounts tailored for Indian Personal Finance & Net Worth tracking.
 * Structured under the 5 canonical accounting equation types (ASSET, LIABILITY, EQUITY, INCOME, EXPENSE).
 */
const DEFAULT_INDIAN_CHART_OF_ACCOUNTS: readonly AccountSeedInput[] = [
  // --- 1. ASSET ACCOUNTS (1000 Series) ---
  { code: '1010', name: 'Primary Savings Bank Account', type: AccountType.ASSET, description: 'Main liquid bank savings account (SBI / HDFC / ICICI)' },
  { code: '1020', name: 'Secondary / Salary Bank Account', type: AccountType.ASSET, description: 'Direct salary deposit and bill payment account' },
  { code: '1030', name: 'Cash Wallet & Physical Currency', type: AccountType.ASSET, description: 'Physical cash held in wallet or emergency stash' },
  { code: '1040', name: 'Fixed Deposits (FD) & Recurring Deposits (RD)', type: AccountType.ASSET, description: 'Bank and Post Office fixed and recurring term deposits' },
  { code: '1050', name: 'Equity Mutual Funds (SIP & Lumpsum)', type: AccountType.ASSET, description: 'Investments in ELSS, Flexi Cap, Large/Mid Cap MFs' },
  { code: '1060', name: 'Direct Indian Stocks Portfolio', type: AccountType.ASSET, description: 'Direct stock holdings on NSE/BSE via Zerodha, Groww, etc.' },
  { code: '1070', name: 'Employees Provident Fund (EPF)', type: AccountType.ASSET, description: 'Accumulated EPF balance from employer and employee contributions' },
  { code: '1080', name: 'Public Provident Fund (PPF)', type: AccountType.ASSET, description: 'Government-backed 15-year tax-exempt savings scheme balance' },
  { code: '1090', name: 'National Pension System (NPS)', type: AccountType.ASSET, description: 'Tier-1 and Tier-2 retirement pension annuity fund balance' },
  { code: '1100', name: 'Sovereign Gold Bonds (SGB) & Physical Gold', type: AccountType.ASSET, description: 'Gold investments including RBI SGBs, Digital Gold, and physical bullion' },
  { code: '1110', name: 'UPI & Digital Wallets', type: AccountType.ASSET, description: 'Prepaid wallet balances (Paytm Wallet, Mobikwik, PhonePe)' },

  // --- 2. LIABILITY ACCOUNTS (2000 Series) ---
  { code: '2010', name: 'Home Loan Liability', type: AccountType.LIABILITY, description: 'Primary housing mortgage principal outstanding' },
  { code: '2020', name: 'Car & Two-Wheeler Vehicle Loan', type: AccountType.LIABILITY, description: 'Auto/Bike loan principal balance remaining' },
  { code: '2030', name: 'Personal Loan Liability', type: AccountType.LIABILITY, description: 'Unsecured personal loan outstanding balance' },
  { code: '2040', name: 'Education & Student Loan', type: AccountType.LIABILITY, description: 'Higher education loan principal liability' },
  { code: '2050', name: 'Credit Card Outstanding Dues', type: AccountType.LIABILITY, description: 'Unpaid statement and current balance across credit cards' },
  { code: '2060', name: 'BNPL & Pay Later Services', type: AccountType.LIABILITY, description: 'Buy Now Pay Later dues (Amazon Pay Later, LazyPay, Simpl)' },
  { code: '2070', name: 'Gold Loan & Loan Against Mutual Funds', type: AccountType.LIABILITY, description: 'Secured loans backed by gold ornaments or mutual fund units' },
  { code: '2080', name: 'Hand Loans & Borrowings', type: AccountType.LIABILITY, description: 'Informal loans borrowed from family members or friends' },

  // --- 3. EQUITY ACCOUNTS (3000 Series) ---
  { code: '3010', name: 'Opening Balance Equity', type: AccountType.EQUITY, description: 'Initial net worth capital at system setup' },
  { code: '3020', name: 'Retained Net Worth Reserves', type: AccountType.EQUITY, description: 'Accumulated net profit/savings carried forward' },

  // --- 4. INCOME ACCOUNTS (4000 Series) ---
  { code: '4010', name: 'Primary Salary Income', type: AccountType.INCOME, description: 'Monthly employment take-home salary income' },
  { code: '4020', name: 'Annual Performance Bonus & Incentives', type: AccountType.INCOME, description: 'Yearly/quarterly corporate performance bonus payouts' },
  { code: '4030', name: 'Freelance & Consulting Earnings', type: AccountType.INCOME, description: 'Income from side gigs, independent projects, and consulting' },
  { code: '4040', name: 'Savings & FD Interest Income', type: AccountType.INCOME, description: 'Interest earned on savings accounts, FDs, and RDs' },
  { code: '4050', name: 'Stock & Mutual Fund Dividend Income', type: AccountType.INCOME, description: 'Dividend payouts received from listed shares and mutual funds' },
  { code: '4060', name: 'Real Estate Rental Income', type: AccountType.INCOME, description: 'Monthly rental payments collected from tenant properties' },
  { code: '4070', name: 'Realized Capital Gains', type: AccountType.INCOME, description: 'Net profit realized from selling stocks, mutual funds, or property' },
  { code: '4080', name: 'Cashbacks, Rewards & Refunds', type: AccountType.INCOME, description: 'Credit card cashback rewards, e-commerce refunds, and discounts' },

  // --- 5. EXPENSE ACCOUNTS (5000 Series) ---
  { code: '5010', name: 'House Rent & Society Maintenance', type: AccountType.EXPENSE, description: 'Monthly house rent and apartment association maintenance charges' },
  { code: '5020', name: 'Groceries & Daily Essentials', type: AccountType.EXPENSE, description: 'Supermarket, local vendor, DMart, Blinkit, and Zepto grocery spend' },
  { code: '5030', name: 'Dining Out & Online Food Delivery', type: AccountType.EXPENSE, description: 'Restaurants, cafes, Swiggy, and Zomato food purchases' },
  { code: '5040', name: 'Electricity, Water & LPG Cooking Gas', type: AccountType.EXPENSE, description: 'Monthly utility bill payments and LPG cylinder refills' },
  { code: '5050', name: 'Mobile Recharge & Home Broadband Wi-Fi', type: AccountType.EXPENSE, description: 'Cellular plan recharges (Jio/Airtel) and fiber broadband bills' },
  { code: '5060', name: 'Fuel & Daily Commute', type: AccountType.EXPENSE, description: 'Petrol/Diesel, FASTag tolls, Metro SmartCard, and cab fares (Uber/Ola)' },
  { code: '5070', name: 'Domestic Staff & Maid Wages', type: AccountType.EXPENSE, description: 'Monthly salaries for house maid, cook, driver, and security staff' },
  { code: '5080', name: 'Medical, Medicines & Health Care', type: AccountType.EXPENSE, description: 'Doctor consultation fees, pharmacy bills, and diagnostic lab tests' },
  { code: '5090', name: 'Health & Term Life Insurance Premiums', type: AccountType.EXPENSE, description: 'Periodic insurance premium payments for self and family' },
  { code: '5100', name: 'Vehicle Insurance, Servicing & Repair', type: AccountType.EXPENSE, description: 'Car/Bike motor insurance renewal and routine maintenance servicing' },
  { code: '5110', name: 'Children Education & School Fees', type: AccountType.EXPENSE, description: 'School tuition fees, coaching classes, uniforms, and textbooks' },
  { code: '5120', name: 'Shopping, Apparel & Footwear', type: AccountType.EXPENSE, description: 'Clothing, fashion accessories, and e-commerce shopping (Amazon/Myntra)' },
  { code: '5130', name: 'OTT & Digital Subscriptions', type: AccountType.EXPENSE, description: 'Netflix, Amazon Prime, Disney+ Hotstar, Spotify, and YouTube Premium' },
  { code: '5140', name: 'Personal Care, Grooming & Salon', type: AccountType.EXPENSE, description: 'Salon haircuts, spa treatments, cosmetics, and personal hygiene products' },
  { code: '5150', name: 'Loan Interest Expense', type: AccountType.EXPENSE, description: 'Interest portion paid towards Home, Personal, and Vehicle Loan EMIs' },
  { code: '5160', name: 'Income Tax Payments & TDS', type: AccountType.EXPENSE, description: 'TDS deducted at source, advance tax, and self-assessment income tax payments' },
  { code: '5170', name: 'Travel, Vacations & Holiday Trips', type: AccountType.EXPENSE, description: 'Flight/Train tickets, hotel bookings, and vacation expenses' },
  { code: '5180', name: 'Gifts, Festivals & Celebrations', type: AccountType.EXPENSE, description: 'Diwali/Pongal gifts, wedding presents, and family celebration expenses' },
];

const DEFAULT_ACCOUNT_CATEGORY_META = [
  {
    type: AccountType.ASSET,
    label: 'Assets',
    icon: '🏦',
    description: 'What you own — Cash, Bank balances, Mutual Funds & Investments',
    colorClass: 'type-asset',
  },
  {
    type: AccountType.LIABILITY,
    label: 'Liabilities',
    icon: '💳',
    description: 'What you owe — Home Loans, Credit Card balances & Debts',
    colorClass: 'type-liability',
  },
  {
    type: AccountType.EQUITY,
    label: 'Equity',
    icon: '⚖️',
    description: 'Your Net Worth & Capital — Initial savings & Net Worth reserves',
    colorClass: 'type-equity',
  },
  {
    type: AccountType.INCOME,
    label: 'Income',
    icon: '💰',
    description: 'Money coming in — Monthly salary, Freelance earnings & Dividends',
    colorClass: 'type-income',
  },
  {
    type: AccountType.EXPENSE,
    label: 'Expenses',
    icon: '📤',
    description: 'Money going out — House rent, Groceries, Fuel & Utility bills',
    colorClass: 'type-expense',
  },
];

/**
 * Seed script initializing default administrator, user, and standard Indian Chart of Accounts.
 */
async function main(): Promise<void> {
  console.log('🌱 Starting database seeding...');

  // 1. Seed Admin User
  const adminPassword = process.env.ADMIN_SEED_PASSWORD || 'Murali@123';
  const hashedPassword = await bcrypt.hash(adminPassword, 10);
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
  const userPassword = process.env.USER_SEED_PASSWORD || 'Murali@123';
  const sampleUserPassword = await bcrypt.hash(userPassword, 10);
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

  // 3. Seed Category Guidance Metadata
  for (const cat of DEFAULT_ACCOUNT_CATEGORY_META) {
    const seededCat = await prisma.accountCategoryMeta.upsert({
      where: { type: cat.type },
      update: {
        label: cat.label,
        icon: cat.icon,
        description: cat.description,
        colorClass: cat.colorClass,
      },
      create: cat,
    });
    console.log(`✅ Seeded Category Metadata [${seededCat.type}] ${seededCat.label}`);
  }

  // 4. Seed Initial Chart of Accounts (Double-Entry Canon)
  for (const acc of DEFAULT_INDIAN_CHART_OF_ACCOUNTS) {
    const createdAcc = await prisma.account.upsert({
      where: { code: acc.code },
      update: {
        name: acc.name,
        type: acc.type,
        description: acc.description,
      },
      create: {
        code: acc.code,
        name: acc.name,
        type: acc.type,
        description: acc.description,
      },
    });
    console.log(`✅ Seeded Account [${createdAcc.code}] ${createdAcc.name} (${createdAcc.type})`);
  }

  console.log(`🎉 Database seeding completed successfully (${DEFAULT_INDIAN_CHART_OF_ACCOUNTS.length} ledger accounts seeded).`);
}

main()
  .catch((e: unknown) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

