import { Injectable, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { Account, AccountType, JournalEntry, PostingType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { CreateJournalEntryDto } from './dto/create-journal-entry.dto';
import { AccountQueryDto } from './dto/account-query.dto';

export interface NetWorthSummary {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  accountsCount: number;
}

/**
 * Service managing Chart of Accounts, double-entry journal postings, and Net Worth generation.
 */
@Injectable()
export class LedgerService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a new Account head in the Chart of Accounts.
   *
   * @param dto - Account creation details
   * @returns Newly created Account entity
   * @throws ConflictException if account code already exists
   */
  async createAccount(dto: CreateAccountDto): Promise<Account> {
    const existing = await this.prisma.account.findUnique({
      where: { code: dto.code },
    });
    if (existing) {
      throw new ConflictException(`Account with code '${dto.code}' already exists.`);
    }

    return this.prisma.account.create({
      data: {
        code: dto.code,
        name: dto.name,
        type: dto.type,
        description: dto.description,
        parentId: dto.parentId,
      },
    });
  }

  /**
   * Retrieves paginated accounts with optional type filter.
   *
   * @param query - Pagination and filtering parameters
   * @returns Array of accounts and total count
   */
  async findAllAccounts(query: AccountQueryDto): Promise<{ items: Account[]; total: number }> {
    const where = query.type ? { type: query.type } : {};

    const [items, total] = await Promise.all([
      this.prisma.account.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { code: 'asc' },
      }),
      this.prisma.account.count({ where }),
    ]);

    return { items, total };
  }

  /**
   * Posts a multi-line double-entry journal entry.
   * Enforces strict balance rule: Sum of Debits must equal Sum of Credits.
   *
   * @param dto - Multi-line journal entry payload
   * @returns Created JournalEntry entity with postings
   * @throws BadRequestException if unbalanced or missing accounts
   */
  async postJournalEntry(dto: CreateJournalEntryDto): Promise<JournalEntry> {
    this.validatePostingBalance(dto.postings);

    const existingTxn = await this.prisma.journalEntry.findUnique({
      where: { entryNumber: dto.entryNumber },
    });
    if (existingTxn) {
      throw new ConflictException(`Journal entry with number '${dto.entryNumber}' already exists.`);
    }

    return this.prisma.journalEntry.create({
      data: {
        entryNumber: dto.entryNumber,
        description: dto.description,
        transactionDate: dto.transactionDate ? new Date(dto.transactionDate) : new Date(),
        postings: {
          create: dto.postings.map((p) => ({
            accountId: p.accountId,
            type: p.type,
            amount: p.amount,
          })),
        },
      },
      include: {
        postings: {
          include: { account: true },
        },
      },
    });
  }

  /**
   * Calculates overall Net Worth based on Assets minus Liabilities.
   *
   * @returns Net Worth breakdown summary
   */
  async getNetWorth(): Promise<NetWorthSummary> {
    const accounts = await this.prisma.account.findMany({
      include: { postings: true },
    });

    let totalAssets = 0;
    let totalLiabilities = 0;

    for (const acc of accounts) {
      const balance = this.calculateAccountBalance(acc.type, acc.postings);
      if (acc.type === AccountType.ASSET) {
        totalAssets += balance;
      } else if (acc.type === AccountType.LIABILITY) {
        totalLiabilities += balance;
      }
    }

    return {
      totalAssets,
      totalLiabilities,
      netWorth: totalAssets - totalLiabilities,
      accountsCount: accounts.length,
    };
  }

  /**
   * Validates that total DEBIT allocations strictly equal total CREDIT allocations.
   */
  private validatePostingBalance(postings: { type: PostingType; amount: number }[]): void {
    if (!postings || postings.length < 2) {
      throw new BadRequestException('A double-entry transaction must contain at least 2 posting lines.');
    }

    let totalDebit = 0;
    let totalCredit = 0;

    for (const posting of postings) {
      if (posting.type === PostingType.DEBIT) {
        totalDebit += posting.amount;
      } else {
        totalCredit += posting.amount;
      }
    }

    const difference = Math.abs(totalDebit - totalCredit);
    if (difference > 0.0001) {
      throw new BadRequestException(
        `Unbalanced journal entry! Total Debits (${totalDebit}) must strictly equal Total Credits (${totalCredit}).`,
      );
    }
  }

  /**
   * Computes individual account head net balance based on canonical accounting equation rules.
   */
  private calculateAccountBalance(type: AccountType, postings: { type: PostingType; amount: number }[]): number {
    let balance = 0;
    for (const p of postings) {
      if (type === AccountType.ASSET || type === AccountType.EXPENSE) {
        balance += p.type === PostingType.DEBIT ? p.amount : -p.amount;
      } else {
        balance += p.type === PostingType.CREDIT ? p.amount : -p.amount;
      }
    }
    return balance;
  }
}
