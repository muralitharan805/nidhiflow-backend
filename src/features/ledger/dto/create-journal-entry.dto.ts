import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PostingType } from '@prisma/client';

/**
 * Single posting line inside a double-entry journal transaction.
 */
export class CreatePostingDto {
  @ApiProperty({ example: 'uuid-account-id', description: 'Target account head ID' })
  @IsString()
  @IsNotEmpty()
  readonly accountId!: string;

  @ApiProperty({ enum: PostingType, example: PostingType.DEBIT, description: 'DEBIT or CREDIT allocation' })
  @IsEnum(PostingType)
  @IsNotEmpty()
  readonly type!: PostingType;

  @ApiProperty({ example: 1500.5, description: 'Monetary transaction amount (must be positive)' })
  @IsNumber()
  @Min(0.01)
  readonly amount!: number;
}

/**
 * Data Transfer Object for posting a multi-line double-entry journal transaction.
 */
export class CreateJournalEntryDto {
  @ApiProperty({ example: 'TXN-2026-001', description: 'Unique transaction identifier' })
  @IsString()
  @IsNotEmpty()
  readonly entryNumber!: string;

  @ApiProperty({ example: 'Monthly grocery purchase at supermarket', description: 'Business transaction narrative description' })
  @IsString()
  @IsNotEmpty()
  readonly description!: string;

  @ApiPropertyOptional({ example: '2026-07-24T00:00:00.000Z', description: 'Transaction date (ISO string)' })
  @IsOptional()
  @IsString()
  readonly transactionDate?: string;

  @ApiProperty({ type: [CreatePostingDto], description: 'List of posting line allocations (Sum of Debits must equal Sum of Credits)' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePostingDto)
  readonly postings!: CreatePostingDto[];
}
