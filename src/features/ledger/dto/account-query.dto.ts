import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AccountType } from '@prisma/client';
import { PaginationQueryDto } from '../../../core/dto/pagination-query.dto';

/**
 * Extended query parameters for filtering accounts by type with pagination.
 */
export class AccountQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: AccountType,
    description: 'Optional account type filter',
  })
  @IsOptional()
  @IsEnum(AccountType)
  readonly type?: AccountType;
}
