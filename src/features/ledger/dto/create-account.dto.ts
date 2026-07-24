import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccountType } from '@prisma/client';

/**
 * Data Transfer Object for creating a new Account Head in the Chart of Accounts.
 */
export class CreateAccountDto {
  @ApiProperty({ example: '1030', description: 'Unique alphanumeric account code' })
  @IsString()
  @IsNotEmpty()
  readonly code!: string;

  @ApiProperty({ example: 'Investment Portfolio', description: 'Account head display name' })
  @IsString()
  @IsNotEmpty()
  readonly name!: string;

  @ApiProperty({ enum: AccountType, example: AccountType.ASSET, description: 'Canonical accounting equation classification' })
  @IsEnum(AccountType)
  @IsNotEmpty()
  readonly type!: AccountType;

  @ApiPropertyOptional({ example: 'Equity and mutual fund holdings', description: 'Optional account description' })
  @IsOptional()
  @IsString()
  readonly description?: string;

  @ApiPropertyOptional({ example: 'uuid-parent-account-id', description: 'Optional parent account ID for hierarchical grouping' })
  @IsOptional()
  @IsString()
  readonly parentId?: string;
}
