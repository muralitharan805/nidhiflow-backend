import { IsISO8601, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Query parameters for filtering Income Statement (P&L) report by date range.
 */
export class IncomeStatementQueryDto {
  @ApiPropertyOptional({
    example: '2026-01-01T00:00:00.000Z',
    description: 'Start date of the reporting period (ISO string)',
  })
  @IsOptional()
  @IsISO8601()
  readonly startDate?: string;

  @ApiPropertyOptional({
    example: '2026-12-31T23:59:59.999Z',
    description: 'End date of the reporting period (ISO string)',
  })
  @IsOptional()
  @IsISO8601()
  readonly endDate?: string;
}
