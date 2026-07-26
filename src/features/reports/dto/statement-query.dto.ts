import { IsISO8601, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Query parameters for point-in-time financial statements (Balance Sheet and Trial Balance).
 */
export class StatementQueryDto {
  @ApiPropertyOptional({
    example: '2026-12-31T23:59:59.999Z',
    description: 'Cutoff date for point-in-time financial reporting (ISO string)',
  })
  @IsOptional()
  @IsISO8601()
  readonly asOfDate?: string;
}
