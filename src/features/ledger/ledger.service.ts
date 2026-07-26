import {
  Injectable,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import {
  Account,
  AccountCategoryMeta,
  AccountType,
  JournalEntry,
  PostingType,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { CreateJournalEntryDto } from './dto/create-journal-entry.dto';
import { AccountQueryDto } from './dto/account-query.dto';
import { JournalEntryResponseDto } from './dto/journal-entry-response.dto';

export interface NetWorthSummary {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  accountsCount: number;
}

/**
 * Service managing Chart of Accounts, double-entry journal postings, and Net Worth generation with user-level isolation.
 */
@Injectable()
export class LedgerService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Fetches all account category metadata stored in DB.
   */
  async getCategoryMetadata(): Promise<AccountCategoryMeta[]> {
    return this.prisma.accountCategoryMeta.findMany({
      orderBy: { type: 'asc' },
    });
  }

  /**
   * Creates a new Account head in the Chart of Accounts scoped to a specific user.
   *
   * @param dto - Account creation details
   * @param userId - Optional authenticated user ID
   * @returns Newly created Account entity
   * @throws ConflictException if account code already exists
   */
  async createAccount(
    dto: CreateAccountDto,
    userId?: string,
  ): Promise<Account> {
    const existing = await this.prisma.account.findFirst({
      where: {
        code: dto.code,
        ...(userId ? { OR: [{ userId }, { userId: null }] } : {}),
      },
    });
    if (existing) {
      throw new ConflictException(
        `Account with code '${dto.code}' already exists.`,
      );
    }

    return this.prisma.account.create({
      data: {
        code: dto.code,
        name: dto.name,
        type: dto.type,
        description: dto.description,
        parentId: dto.parentId,
        userId: userId || undefined,
      },
    });
  }

  /**
   * Retrieves paginated accounts scoped to a specific user.
   *
   * @param query - Pagination and filtering parameters
   * @param userId - Optional authenticated user ID
   * @returns Array of accounts and total count
   */
  async findAllAccounts(
    query: AccountQueryDto,
    userId?: string,
  ): Promise<{ items: Account[]; total: number }> {
    const where = {
      ...(query.type ? { type: query.type } : {}),
      ...(userId ? { OR: [{ userId }, { userId: null }] } : {}),
    };

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
   * Retrieves recent journal entries with populated posting account details scoped to a specific user.
   *
   * @param limit - Max number of entries to retrieve (default: 50)
   * @param userId - Optional authenticated user ID
   * @returns Array of recent JournalEntryResponseDto items with postings and account metadata
   */
  async findAllJournalEntries(
    limit = 50,
    userId?: string,
  ): Promise<JournalEntryResponseDto[]> {
    const entries = await this.prisma.journalEntry.findMany({
      where: userId ? { userId } : {},
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        postings: {
          include: {
            account: {
              select: {
                id: true,
                name: true,
                code: true,
                type: true,
              },
            },
          },
        },
      },
    });

    return entries.map((entry) => ({
      id: entry.id,
      entryNumber: entry.entryNumber,
      description: entry.description,
      transactionDate: entry.transactionDate.toISOString(),
      createdAt: entry.createdAt.toISOString(),
      postings: entry.postings.map((p) => ({
        accountId: p.accountId,
        accountName: p.account?.name ?? '',
        accountCode: p.account?.code ?? '',
        accountType: p.account?.type,
        type: p.type,
        amount: p.amount,
      })),
    }));
  }

  /**
   * Posts a multi-line double-entry journal entry scoped to a specific user.
   * Enforces strict balance rule: Sum of Debits must equal Sum of Credits.
   *
   * @param dto - Multi-line journal entry payload
   * @param userId - Optional authenticated user ID
   * @returns Created JournalEntry entity with postings
   * @throws BadRequestException if unbalanced or missing accounts
   */
  async postJournalEntry(
    dto: CreateJournalEntryDto,
    userId?: string,
  ): Promise<JournalEntry> {
    this.validatePostingBalance(dto.postings);

    if (userId) {
      const accountIds = Array.from(
        new Set(dto.postings.map((p) => p.accountId)),
      );
      const accessibleAccounts = await this.prisma.account.findMany({
        where: {
          id: { in: accountIds },
          OR: [{ userId }, { userId: null }],
        },
        select: { id: true },
      });
      if (accessibleAccounts.length !== accountIds.length) {
        throw new ForbiddenException(
          'One or more posting account heads do not belong to your user account.',
        );
      }
    }

    const existingTxn = await this.prisma.journalEntry.findFirst({
      where: {
        entryNumber: dto.entryNumber,
        ...(userId ? { userId } : {}),
      },
    });
    if (existingTxn) {
      throw new ConflictException(
        `Journal entry with number '${dto.entryNumber}' already exists.`,
      );
    }

    return this.prisma.journalEntry.create({
      data: {
        entryNumber: dto.entryNumber,
        description: dto.description,
        transactionDate: dto.transactionDate
          ? new Date(dto.transactionDate)
          : new Date(),
        userId: userId || undefined,
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
   * Calculates overall Net Worth based on Assets minus Liabilities scoped to the authenticated user.
   *
   * @param userId - Optional authenticated user ID
   * @returns Net Worth breakdown summary
   */
  async getNetWorth(userId?: string): Promise<NetWorthSummary> {
    const accounts = await this.prisma.account.findMany({
      where: userId ? { OR: [{ userId }, { userId: null }] } : {},
      include: {
        postings: userId ? { where: { journalEntry: { userId } } } : true,
      },
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
  private validatePostingBalance(
    postings: { type: PostingType; amount: number }[],
  ): void {
    if (!postings || postings.length < 2) {
      throw new BadRequestException(
        'A double-entry transaction must contain at least 2 posting lines.',
      );
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
  private calculateAccountBalance(
    type: AccountType,
    postings: { type: PostingType; amount: number }[],
  ): number {
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
