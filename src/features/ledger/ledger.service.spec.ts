import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { AccountType, PostingType } from '@prisma/client';
import { LedgerService } from './ledger.service';
import { PrismaService } from '../../database/prisma.service';

describe('LedgerService', () => {
  let service: LedgerService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const mockPrisma = {
      account: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
      },
      journalEntry: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LedgerService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<LedgerService>(LedgerService);
    prisma = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAccount', () => {
    it('should throw ConflictException if account code exists', async () => {
      (prisma.account.findFirst as jest.Mock).mockResolvedValue({
        id: '1',
        code: '1010',
      });

      await expect(
        service.createAccount({
          code: '1010',
          name: 'Bank',
          type: AccountType.ASSET,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create account successfully if code is unique', async () => {
      (prisma.account.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.account.create as jest.Mock).mockResolvedValue({
        id: 'acc-1',
        code: '1010',
        name: 'Bank',
        type: AccountType.ASSET,
      });

      const result = await service.createAccount({
        code: '1010',
        name: 'Bank',
        type: AccountType.ASSET,
      });
      expect(result.code).toBe('1010');
    });
  });

  describe('postJournalEntry', () => {
    it('should throw BadRequestException if debits and credits do not balance', async () => {
      const unbalancedDto = {
        entryNumber: 'TXN-001',
        description: 'Supermarket Spend',
        postings: [
          { accountId: 'acc-1', type: PostingType.DEBIT, amount: 1000 },
          { accountId: 'acc-2', type: PostingType.CREDIT, amount: 800 },
        ],
      };

      await expect(service.postJournalEntry(unbalancedDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ForbiddenException if posting accounts do not belong to user', async () => {
      const dto = {
        entryNumber: 'TXN-003',
        description: 'Cross User Spend',
        postings: [
          { accountId: 'acc-1', type: PostingType.DEBIT, amount: 1000 },
          { accountId: 'acc-other-user', type: PostingType.CREDIT, amount: 1000 },
        ],
      };

      (prisma.account.findMany as jest.Mock).mockResolvedValue([
        { id: 'acc-1' },
      ]);

      await expect(
        service.postJournalEntry(dto, 'user-123'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should create journal entry if debits strictly equal credits and accounts are accessible', async () => {
      const balancedDto = {
        entryNumber: 'TXN-002',
        description: 'Balanced Spend',
        postings: [
          { accountId: 'acc-1', type: PostingType.DEBIT, amount: 1000 },
          { accountId: 'acc-2', type: PostingType.CREDIT, amount: 1000 },
        ],
      };

      (prisma.account.findMany as jest.Mock).mockResolvedValue([
        { id: 'acc-1' },
        { id: 'acc-2' },
      ]);
      (prisma.journalEntry.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.journalEntry.create as jest.Mock).mockResolvedValue({
        id: 'entry-1',
        entryNumber: 'TXN-002',
        description: 'Balanced Spend',
        postings: balancedDto.postings,
      });

      const result = await service.postJournalEntry(balancedDto, 'user-123');
      expect(result.entryNumber).toBe('TXN-002');
    });
  });

  describe('getNetWorth', () => {
    it('should calculate Net Worth as Assets minus Liabilities correctly', async () => {
      (prisma.account.findMany as jest.Mock).mockResolvedValue([
        {
          id: '1',
          code: '1010',
          name: 'Bank',
          type: AccountType.ASSET,
          postings: [{ type: PostingType.DEBIT, amount: 50000 }],
        },
        {
          id: '2',
          code: '2010',
          name: 'Card',
          type: AccountType.LIABILITY,
          postings: [{ type: PostingType.CREDIT, amount: 15000 }],
        },
      ]);

      const result = await service.getNetWorth();
      expect(result.totalAssets).toBe(50000);
      expect(result.totalLiabilities).toBe(15000);
      expect(result.netWorth).toBe(35000);
    });
  });

  describe('findAllJournalEntries', () => {
    it('should return entries with populated posting account details', async () => {
      const mockTxDate = new Date('2026-07-26T10:00:00.000Z');
      const mockCreatedAt = new Date('2026-07-26T10:05:00.000Z');

      (prisma.journalEntry.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'entry-101',
          entryNumber: 'TXN-2026-001',
          description: 'Grocery Shopping',
          transactionDate: mockTxDate,
          createdAt: mockCreatedAt,
          postings: [
            {
              accountId: 'acc-groceries',
              type: PostingType.DEBIT,
              amount: 2500,
              account: {
                id: 'acc-groceries',
                name: 'Groceries Expense',
                code: '5010',
                type: AccountType.EXPENSE,
              },
            },
            {
              accountId: 'acc-bank',
              type: PostingType.CREDIT,
              amount: 2500,
              account: {
                id: 'acc-bank',
                name: 'HDFC Savings',
                code: '1010',
                type: AccountType.ASSET,
              },
            },
          ],
        },
      ]);

      const result = await service.findAllJournalEntries(10, 'user-123');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('entry-101');
      expect(result[0].entryNumber).toBe('TXN-2026-001');
      expect(result[0].postings).toHaveLength(2);

      const debitPosting = result[0].postings[0];
      expect(debitPosting.accountId).toBe('acc-groceries');
      expect(debitPosting.accountName).toBe('Groceries Expense');
      expect(debitPosting.accountCode).toBe('5010');
      expect(debitPosting.accountType).toBe(AccountType.EXPENSE);
      expect(debitPosting.type).toBe(PostingType.DEBIT);
      expect(debitPosting.amount).toBe(2500);

      const creditPosting = result[0].postings[1];
      expect(creditPosting.accountId).toBe('acc-bank');
      expect(creditPosting.accountName).toBe('HDFC Savings');
      expect(creditPosting.accountCode).toBe('1010');
      expect(creditPosting.accountType).toBe(AccountType.ASSET);
      expect(creditPosting.type).toBe(PostingType.CREDIT);
      expect(creditPosting.amount).toBe(2500);
    });
  });
});
