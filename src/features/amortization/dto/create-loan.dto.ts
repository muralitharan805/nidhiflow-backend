import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Data Transfer Object for recording a loan for EMI amortization calculation.
 */
export class CreateLoanDto {
  @ApiProperty({
    example: 'uuid-liability-account-id',
    description: 'Target liability account ID',
  })
  @IsString()
  @IsNotEmpty()
  readonly accountId!: string;

  @ApiProperty({
    example: 2500000,
    description: 'Loan principal amount in currency units',
  })
  @IsNumber()
  @Min(1000)
  readonly principalAmount!: number;

  @ApiProperty({
    example: 8.5,
    description: 'Annual interest rate percentage (e.g. 8.5 for 8.5%)',
  })
  @IsNumber()
  @Min(0.1)
  readonly annualInterestRate!: number;

  @ApiProperty({
    example: 240,
    description: 'Loan tenure in months (e.g. 240 for 20 years)',
  })
  @IsNumber()
  @Min(1)
  readonly tenureMonths!: number;

  @ApiPropertyOptional({
    example: '2026-08-01T00:00:00.000Z',
    description: 'Loan start date',
  })
  @IsOptional()
  @IsString()
  readonly startDate?: string;
}
