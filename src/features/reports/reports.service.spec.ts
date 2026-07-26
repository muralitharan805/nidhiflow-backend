import { Test, TestingModule } from '@nestjs/testing';
import { AccountType, PostingType } from '@prisma/client';
import { ReportsService } from './reports.service';
import { PrismaService } from '../../database/prisma.service';

describe('ReportsService', () => {
  let service: ReportsService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const mockPrisma = {
      account: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    prisma = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getIncomeStatement', () => {
    it('should calculate Total Revenue, Total Expenses, and Net Income correctly', async () => {
      (prisma.account.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'acc-inc-1',
          code: '4010',
          name: 'Primary Salary Income',
          type: AccountType.INCOME,
          postings: [{ type: PostingType.CREDIT, amount: 100000 }],
        },
        {
          id: 'acc-exp-1',
          code: '5010',
          name: 'House Rent',
          type: AccountType.EXPENSE,
          postings: [{ type: PostingType.DEBIT, amount: 30000 }],
        },
        {
          id: 'acc-exp-2',
          code: '5020',
          name: 'Groceries',
          type: AccountType.EXPENSE,
          postings: [{ type: PostingType.DEBIT, amount: 15000 }],
        },
      ]);

      const report = await service.getIncomeStatement({}, 'user-123');

      expect(report.totalRevenue).toBe(100000);
      expect(report.totalExpenses).toBe(45000);
      expect(report.netIncome).toBe(55000);
      expect(report.revenues).toHaveLength(1);
      expect(report.expenses).toHaveLength(2);
    });
  });

  describe('getBalanceSheet', () => {
    it('should aggregate Assets, Liabilities, Equity, include Retained Earnings, and assert balance', async () => {
      (prisma.account.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'acc-asset-1',
          code: '1010',
          name: 'Primary Savings Bank',
          type: AccountType.ASSET,
          postings: [{ type: PostingType.DEBIT, amount: 150000 }],
        },
        {
          id: 'acc-liab-1',
          code: '2050',
          name: 'Credit Card Outstanding',
          type: AccountType.LIABILITY,
          postings: [{ type: PostingType.CREDIT, amount: 30000 }],
        },
        {
          id: 'acc-eq-1',
          code: '3010',
          name: 'Opening Balance Equity',
          type: AccountType.EQUITY,
          postings: [{ type: PostingType.CREDIT, amount: 70000 }],
        },
        {
          id: 'acc-inc-1',
          code: '4010',
          name: 'Salary Income',
          type: AccountType.INCOME,
          postings: [{ type: PostingType.CREDIT, amount: 80000 }],
        },
        {
          id: 'acc-exp-1',
          code: '5010',
          name: 'Groceries',
          type: AccountType.EXPENSE,
          postings: [{ type: PostingType.DEBIT, amount: 30000 }],
        },
      ]);

      const report = await service.getBalanceSheet(
        { asOfDate: '2026-12-31T23:59:59.000Z' },
        'user-123',
      );

      expect(report.totalAssets).toBe(150000);
      expect(report.totalLiabilities).toBe(30000);
      expect(report.totalEquity).toBe(120000); // 70000 (Opening Equity) + 50000 (Retained Earnings)
      expect(report.totalLiabilitiesAndEquity).toBe(150000);
      expect(report.isBalanced).toBe(true);
    });
  });

  describe('getTrialBalance', () => {
    it('should list active account debits vs credits and assert total debit equals total credit', async () => {
      (prisma.account.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'acc-asset-1',
          code: '1010',
          name: 'Primary Savings Bank',
          type: AccountType.ASSET,
          postings: [{ type: PostingType.DEBIT, amount: 100000 }],
        },
        {
          id: 'acc-inc-1',
          code: '4010',
          name: 'Salary Income',
          type: AccountType.INCOME,
          postings: [{ type: PostingType.CREDIT, amount: 100000 }],
        },
      ]);

      const report = await service.getTrialBalance(
        { asOfDate: '2026-12-31T23:59:59.000Z' },
        'user-123',
      );

      expect(report.rows).toHaveLength(2);
      expect(report.totalDebit).toBe(100000);
      expect(report.totalCredit).toBe(100000);
      expect(report.isBalanced).toBe(true);
    });
  });
});
