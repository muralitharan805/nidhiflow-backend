import { IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Data Transfer Object for simulating early principal prepayment on a loan.
 */
export class PrepaymentDto {
  @ApiProperty({
    example: 100000,
    description: 'Lump-sum principal prepayment amount',
  })
  @IsNumber()
  @Min(100)
  readonly prepaymentAmount!: number;

  @ApiProperty({
    example: 12,
    description: 'Month index (1-based) at which prepayment is made',
  })
  @IsNumber()
  @Min(1)
  readonly prepaymentMonth!: number;
}
