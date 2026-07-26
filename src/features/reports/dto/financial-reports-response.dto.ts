import { ApiProperty } from '@nestjs/swagger';
import { AccountType } from '@prisma/client';

/**
 * Line item entry inside an Income Statement or Balance Sheet section.
 */
export class StatementLineItemDto {
  @ApiProperty({ example: 'uuid-account-id' })
  readonly accountId!: string;

  @ApiProperty({ example: '4010' })
  readonly accountCode!: string;

  @ApiProperty({ example: 'Primary Salary Income' })
  readonly accountName!: string;

  @ApiProperty({ example: 75000 })
  readonly amount!: number;
}

/**
 * Data Transfer Object for Income Statement (Profit & Loss) report.
 */
export class IncomeStatementResponseDto {
  @ApiProperty({ type: [StatementLineItemDto] })
  readonly revenues!: StatementLineItemDto[];

  @ApiProperty({ type: [StatementLineItemDto] })
  readonly expenses!: StatementLineItemDto[];

  @ApiProperty({ example: 100000 })
  readonly totalRevenue!: number;

  @ApiProperty({ example: 45000 })
  readonly totalExpenses!: number;

  @ApiProperty({ example: 55000 })
  readonly netIncome!: number;
}

/**
 * Data Transfer Object for Balance Sheet report adhering to Assets = Liabilities + Equity.
 */
export class BalanceSheetResponseDto {
  @ApiProperty({ type: [StatementLineItemDto] })
  readonly assets!: StatementLineItemDto[];

  @ApiProperty({ type: [StatementLineItemDto] })
  readonly liabilities!: StatementLineItemDto[];

  @ApiProperty({ type: [StatementLineItemDto] })
  readonly equity!: StatementLineItemDto[];

  @ApiProperty({ example: 250000 })
  readonly totalAssets!: number;

  @ApiProperty({ example: 50000 })
  readonly totalLiabilities!: number;

  @ApiProperty({ example: 200000 })
  readonly totalEquity!: number;

  @ApiProperty({ example: 250000 })
  readonly totalLiabilitiesAndEquity!: number;

  @ApiProperty({ example: true })
  readonly isBalanced!: boolean;
}

/**
 * Single row inside a Trial Balance report.
 */
export class TrialBalanceRowDto {
  @ApiProperty({ example: 'uuid-account-id' })
  readonly accountId!: string;

  @ApiProperty({ example: '1010' })
  readonly accountCode!: string;

  @ApiProperty({ example: 'Primary Savings Bank Account' })
  readonly accountName!: string;

  @ApiProperty({ enum: AccountType, example: AccountType.ASSET })
  readonly accountType!: AccountType;

  @ApiProperty({ example: 150000 })
  readonly debit!: number;

  @ApiProperty({ example: 0 })
  readonly credit!: number;
}

/**
 * Data Transfer Object for Trial Balance report asserting Total Debits strictly equal Total Credits.
 */
export class TrialBalanceResponseDto {
  @ApiProperty({ type: [TrialBalanceRowDto] })
  readonly rows!: TrialBalanceRowDto[];

  @ApiProperty({ example: 300000 })
  readonly totalDebit!: number;

  @ApiProperty({ example: 300000 })
  readonly totalCredit!: number;

  @ApiProperty({ example: true })
  readonly isBalanced!: boolean;
}
