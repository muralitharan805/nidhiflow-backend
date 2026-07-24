import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException } from '@nestjs/common';
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
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
      },
      journalEntry: {
        findUnique: jest.fn(),
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
      (prisma.account.findUnique as jest.Mock).mockResolvedValue({ id: '1', code: '1010' });

      await expect(
        service.createAccount({ code: '1010', name: 'Bank', type: AccountType.ASSET }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create account successfully if code is unique', async () => {
      (prisma.account.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.account.create as jest.Mock).mockResolvedValue({
        id: 'acc-1',
        code: '1010',
        name: 'Bank',
        type: AccountType.ASSET,
      });

      const result = await service.createAccount({ code: '1010', name: 'Bank', type: AccountType.ASSET });
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

      await expect(service.postJournalEntry(unbalancedDto)).rejects.toThrow(BadRequestException);
    });

    it('should create journal entry if debits strictly equal credits', async () => {
      const balancedDto = {
        entryNumber: 'TXN-002',
        description: 'Balanced Spend',
        postings: [
          { accountId: 'acc-1', type: PostingType.DEBIT, amount: 1000 },
          { accountId: 'acc-2', type: PostingType.CREDIT, amount: 1000 },
        ],
      };

      (prisma.journalEntry.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.journalEntry.create as jest.Mock).mockResolvedValue({
        id: 'entry-1',
        entryNumber: 'TXN-002',
        description: 'Balanced Spend',
        postings: balancedDto.postings,
      });

      const result = await service.postJournalEntry(balancedDto);
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
});
