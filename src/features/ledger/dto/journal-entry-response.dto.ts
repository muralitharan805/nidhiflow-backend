import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccountType, PostingType } from '@prisma/client';

/**
 * Single posting line with populated account details for ledger transactions.
 */
export class JournalPostingResponseDto {
  @ApiProperty({
    example: 'uuid-account-id',
    description: 'Unique identifier of the account head',
  })
  readonly accountId!: string;

  @ApiProperty({
    example: 'HDFC Savings Account',
    description: 'User-friendly name of the account head',
  })
  readonly accountName!: string;

  @ApiProperty({
    example: '1010',
    description: 'Unique accounting code of the account head',
  })
  readonly accountCode!: string;

  @ApiProperty({
    enum: AccountType,
    example: AccountType.ASSET,
    description: 'Canonical accounting classification (ASSET, LIABILITY, EQUITY, INCOME, EXPENSE)',
  })
  readonly accountType!: AccountType;

  @ApiProperty({
    enum: PostingType,
    example: PostingType.DEBIT,
    description: 'Transaction allocation type (DEBIT or CREDIT)',
  })
  readonly type!: PostingType;

  @ApiProperty({
    example: 1500.5,
    description: 'Monetary amount allocated to this posting line',
  })
  readonly amount!: number;
}

/**
 * Data Transfer Object representing a posted double-entry journal transaction response with account metadata.
 */
export class JournalEntryResponseDto {
  @ApiProperty({
    example: 'uuid-entry-id',
    description: 'Unique journal entry identifier',
  })
  readonly id!: string;

  @ApiProperty({
    example: 'TXN-2026-001',
    description: 'Unique entry transaction number',
  })
  readonly entryNumber!: string;

  @ApiProperty({
    example: 'Monthly grocery shopping',
    description: 'Business transaction narrative description',
  })
  readonly description!: string;

  @ApiPropertyOptional({
    example: 'REF-INV-9921',
    description: 'Optional external reference number or receipt identifier',
  })
  readonly reference?: string;

  @ApiProperty({
    example: '2026-07-26T12:00:00.000Z',
    description: 'ISO timestamp when the transaction took place',
  })
  readonly transactionDate!: string;

  @ApiProperty({
    example: '2026-07-26T12:05:00.000Z',
    description: 'ISO timestamp when the record was posted to the ledger',
  })
  readonly createdAt!: string;

  @ApiProperty({
    type: [JournalPostingResponseDto],
    description: 'List of posting lines with account details',
  })
  readonly postings!: JournalPostingResponseDto[];
}
