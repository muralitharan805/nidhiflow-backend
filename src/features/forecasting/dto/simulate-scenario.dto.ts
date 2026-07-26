import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CategoryInflationDto {
  @ApiProperty({
    example: 'Groceries',
    description: 'Expense category head name',
  })
  @IsString()
  @IsNotEmpty()
  readonly category!: string;

  @ApiProperty({
    example: 120000,
    description: 'Base annual expense amount in year 0',
  })
  @IsNumber()
  @Min(0)
  readonly baseAnnualExpense!: number;

  @ApiProperty({
    example: 0.08,
    description: 'Annual inflation rate decimal (e.g. 0.08 for 8% per annum)',
  })
  @IsNumber()
  @Min(0)
  readonly inflationRate!: number;
}

/**
 * Data Transfer Object for running a multi-year inflation and cashflow simulation.
 */
export class SimulateScenarioDto {
  @ApiProperty({
    example: '5-Year Moderate Inflation Scenario',
    description: 'Simulation scenario label',
  })
  @IsString()
  @IsNotEmpty()
  readonly scenarioName!: string;

  @ApiProperty({
    example: 1200000,
    description: 'Initial annual income in year 0',
  })
  @IsNumber()
  @Min(0)
  readonly initialAnnualIncome!: number;

  @ApiProperty({
    example: 0.05,
    description:
      'Annual income growth rate decimal (e.g. 0.05 for 5% per annum)',
  })
  @IsNumber()
  @Min(0)
  readonly incomeGrowthRate!: number;

  @ApiPropertyOptional({
    example: 260347,
    description: 'Total annual loan EMI obligations (optional override)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  readonly annualEmiObligation?: number;

  @ApiPropertyOptional({
    example: 10,
    description: 'Projection duration in years (default: 5, max: 30)',
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(30)
  readonly projectionYears?: number;

  @ApiProperty({
    type: [CategoryInflationDto],
    description: 'List of category-wise base expenses and inflation rates',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CategoryInflationDto)
  readonly categoryInflations!: CategoryInflationDto[];
}
