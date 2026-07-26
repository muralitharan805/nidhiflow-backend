import { Injectable } from '@nestjs/common';
import { AccountType, PostingType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { IncomeStatementQueryDto } from './dto/income-statement-query.dto';
import { StatementQueryDto } from './dto/statement-query.dto';
import {
  BalanceSheetResponseDto,
  IncomeStatementResponseDto,
  StatementLineItemDto,
  TrialBalanceResponseDto,
  TrialBalanceRowDto,
} from './dto/financial-reports-response.dto';

/**
 * Service computing dynamic double-entry financial statements (Income Statement, Balance Sheet, Trial Balance).
 */
@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calculates the Income Statement (Profit & Loss) for a given date range and user.
   *
   * @param query - Optional startDate and endDate filters
   * @param userId - Optional authenticated user ID
   * @returns IncomeStatementResponseDto payload with revenues, expenses, and netIncome
   */
  async getIncomeStatement(
    query: IncomeStatementQueryDto,
    userId?: string,
  ): Promise<IncomeStatementResponseDto> {
    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (query.startDate) {
      dateFilter.gte = new Date(query.startDate);
    }
    if (query.endDate) {
      dateFilter.lte = this.parseCutoffEndDate(query.endDate);
    }

    const postingWhere = {
      journalEntry: {
        ...(userId ? { userId } : {}),
        ...(Object.keys(dateFilter).length > 0
          ? { transactionDate: dateFilter }
          : {}),
      },
    };

    const accounts = await this.prisma.account.findMany({
      where: {
        type: { in: [AccountType.INCOME, AccountType.EXPENSE] },
        ...(userId ? { OR: [{ userId }, { userId: null }] } : {}),
      },
      include: {
        postings: { where: postingWhere },
      },
      orderBy: { code: 'asc' },
    });

    const revenues: StatementLineItemDto[] = [];
    const expenses: StatementLineItemDto[] = [];

    let totalRevenue = 0;
    let totalExpenses = 0;

    for (const acc of accounts) {
      if (acc.type === AccountType.INCOME) {
        const balance = this.calculateIncomeBalance(acc.postings);
        if (balance !== 0) {
          const amount = Math.round(balance * 100) / 100;
          revenues.push({
            accountId: acc.id,
            accountCode: acc.code,
            accountName: acc.name,
            amount,
          });
          totalRevenue += amount;
        }
      } else if (acc.type === AccountType.EXPENSE) {
        const balance = this.calculateExpenseBalance(acc.postings);
        if (balance !== 0) {
          const amount = Math.round(balance * 100) / 100;
          expenses.push({
            accountId: acc.id,
            accountCode: acc.code,
            accountName: acc.name,
            amount,
          });
          totalExpenses += amount;
        }
      }
    }

    totalRevenue = Math.round(totalRevenue * 100) / 100;
    totalExpenses = Math.round(totalExpenses * 100) / 100;
    const netIncome = Math.round((totalRevenue - totalExpenses) * 100) / 100;

    return {
      revenues,
      expenses,
      totalRevenue,
      totalExpenses,
      netIncome,
    };
  }

  /**
   * Aggregates account balances for Assets, Liabilities, and Equity including Retained Earnings up to an optional asOfDate.
   * Enforces totalAssets === totalLiabilities + totalEquity.
   *
   * @param query - Optional asOfDate cutoff filter
   * @param userId - Optional authenticated user ID
   * @returns BalanceSheetResponseDto payload
   */
  async getBalanceSheet(
    query?: StatementQueryDto,
    userId?: string,
  ): Promise<BalanceSheetResponseDto> {
    const cutoffDate = query?.asOfDate
      ? this.parseCutoffEndDate(query.asOfDate)
      : undefined;
    const postingWhere = {
      journalEntry: {
        ...(userId ? { userId } : {}),
        ...(cutoffDate ? { transactionDate: { lte: cutoffDate } } : {}),
      },
    };

    const accounts = await this.prisma.account.findMany({
      where: userId ? { OR: [{ userId }, { userId: null }] } : {},
      include: {
        postings: { where: postingWhere },
      },
      orderBy: { code: 'asc' },
    });

    const assets: StatementLineItemDto[] = [];
    const liabilities: StatementLineItemDto[] = [];
    const equity: StatementLineItemDto[] = [];

    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquityAccounts = 0;
    let totalRevenueAllTime = 0;
    let totalExpensesAllTime = 0;

    for (const acc of accounts) {
      if (acc.type === AccountType.ASSET) {
        const balance = this.calculateAssetBalance(acc.postings);
        if (balance !== 0) {
          const amount = Math.round(balance * 100) / 100;
          assets.push({
            accountId: acc.id,
            accountCode: acc.code,
            accountName: acc.name,
            amount,
          });
          totalAssets += amount;
        }
      } else if (acc.type === AccountType.LIABILITY) {
        const balance = this.calculateLiabilityBalance(acc.postings);
        if (balance !== 0) {
          const amount = Math.round(balance * 100) / 100;
          liabilities.push({
            accountId: acc.id,
            accountCode: acc.code,
            accountName: acc.name,
            amount,
          });
          totalLiabilities += amount;
        }
      } else if (acc.type === AccountType.EQUITY) {
        const balance = this.calculateEquityBalance(acc.postings);
        if (balance !== 0) {
          const amount = Math.round(balance * 100) / 100;
          equity.push({
            accountId: acc.id,
            accountCode: acc.code,
            accountName: acc.name,
            amount,
          });
          totalEquityAccounts += amount;
        }
      } else if (acc.type === AccountType.INCOME) {
        totalRevenueAllTime += this.calculateIncomeBalance(acc.postings);
      } else if (acc.type === AccountType.EXPENSE) {
        totalExpensesAllTime += this.calculateExpenseBalance(acc.postings);
      }
    }

    const retainedEarnings =
      Math.round((totalRevenueAllTime - totalExpensesAllTime) * 100) / 100;

    if (retainedEarnings !== 0) {
      equity.push({
        accountId: 'retained-earnings-id',
        accountCode: '3020-RE',
        accountName: 'Retained Earnings (Net Profit/Loss)',
        amount: retainedEarnings,
      });
    }

    totalAssets = Math.round(totalAssets * 100) / 100;
    totalLiabilities = Math.round(totalLiabilities * 100) / 100;
    const totalEquity =
      Math.round((totalEquityAccounts + retainedEarnings) * 100) / 100;
    const totalLiabilitiesAndEquity =
      Math.round((totalLiabilities + totalEquity) * 100) / 100;
    const isBalanced =
      Math.abs(totalAssets - totalLiabilitiesAndEquity) < 0.001;

    return {
      assets,
      liabilities,
      equity,
      totalAssets,
      totalLiabilities,
      totalEquity,
      totalLiabilitiesAndEquity,
      isBalanced,
    };
  }

  /**
   * Generates a Trial Balance listing all accounts with Net Debit vs Net Credit allocations up to an optional asOfDate.
   * Asserts totalDebit === totalCredit.
   *
   * @param query - Optional asOfDate cutoff filter
   * @param userId - Optional authenticated user ID
   * @returns TrialBalanceResponseDto payload
   */
  async getTrialBalance(
    query?: StatementQueryDto,
    userId?: string,
  ): Promise<TrialBalanceResponseDto> {
    const cutoffDate = query?.asOfDate
      ? this.parseCutoffEndDate(query.asOfDate)
      : undefined;
    const postingWhere = {
      journalEntry: {
        ...(userId ? { userId } : {}),
        ...(cutoffDate ? { transactionDate: { lte: cutoffDate } } : {}),
      },
    };

    const accounts = await this.prisma.account.findMany({
      where: userId ? { OR: [{ userId }, { userId: null }] } : {},
      include: {
        postings: { where: postingWhere },
      },
      orderBy: { code: 'asc' },
    });

    const rows: TrialBalanceRowDto[] = [];
    let totalDebit = 0;
    let totalCredit = 0;

    for (const acc of accounts) {
      let rawDebitSum = 0;
      let rawCreditSum = 0;

      for (const p of acc.postings) {
        if (p.type === PostingType.DEBIT) {
          rawDebitSum += p.amount;
        } else {
          rawCreditSum += p.amount;
        }
      }

      if (rawDebitSum === 0 && rawCreditSum === 0) {
        continue;
      }

      let netDebit = 0;
      let netCredit = 0;

      if (rawDebitSum > rawCreditSum) {
        netDebit = Math.round((rawDebitSum - rawCreditSum) * 100) / 100;
      } else {
        netCredit = Math.round((rawCreditSum - rawDebitSum) * 100) / 100;
      }

      rows.push({
        accountId: acc.id,
        accountCode: acc.code,
        accountName: acc.name,
        accountType: acc.type,
        debit: netDebit,
        credit: netCredit,
      });

      totalDebit += netDebit;
      totalCredit += netCredit;
    }

    totalDebit = Math.round(totalDebit * 100) / 100;
    totalCredit = Math.round(totalCredit * 100) / 100;
    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.001;

    return {
      rows,
      totalDebit,
      totalCredit,
      isBalanced,
    };
  }

  private calculateAssetBalance(
    postings: { type: PostingType; amount: number }[],
  ): number {
    return postings.reduce(
      (sum, p) => sum + (p.type === PostingType.DEBIT ? p.amount : -p.amount),
      0,
    );
  }

  private calculateLiabilityBalance(
    postings: { type: PostingType; amount: number }[],
  ): number {
    return postings.reduce(
      (sum, p) => sum + (p.type === PostingType.CREDIT ? p.amount : -p.amount),
      0,
    );
  }

  private calculateEquityBalance(
    postings: { type: PostingType; amount: number }[],
  ): number {
    return postings.reduce(
      (sum, p) => sum + (p.type === PostingType.CREDIT ? p.amount : -p.amount),
      0,
    );
  }

  private calculateIncomeBalance(
    postings: { type: PostingType; amount: number }[],
  ): number {
    return postings.reduce(
      (sum, p) => sum + (p.type === PostingType.CREDIT ? p.amount : -p.amount),
      0,
    );
  }

  private calculateExpenseBalance(
    postings: { type: PostingType; amount: number }[],
  ): number {
    return postings.reduce(
      (sum, p) => sum + (p.type === PostingType.DEBIT ? p.amount : -p.amount),
      0,
    );
  }

  /**
   * Helper parsing YYYY-MM-DD or ISO cutoff dates to end-of-day (23:59:59.999Z).
   */
  private parseCutoffEndDate(dateStr: string): Date {
    const date = new Date(dateStr);
    if (dateStr.length <= 10 || !dateStr.includes('T')) {
      date.setUTCHours(23, 59, 59, 999);
    }
    return date;
  }
}
