import { Controller, Post, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AmortizationService, LoanAmortizationDetails, PrepaymentSimulationResult } from './amortization.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { PrepaymentDto } from './dto/prepayment.dto';

/**
 * Controller managing EMI loan amortization schedules and prepayment simulations.
 */
@ApiTags('EMI Loan Amortization')
@Controller('amortization')
export class AmortizationController {
  constructor(private readonly amortizationService: AmortizationService) {}

  /**
   * Creates a new loan amortization record and generates repayment schedule.
   */
  @Post('loans')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create loan and generate complete EMI amortization schedule' })
  @ApiResponse({ status: 201, description: 'Loan schedule created successfully.' })
  async createLoan(@Body() dto: CreateLoanDto): Promise<LoanAmortizationDetails> {
    return this.amortizationService.createLoan(dto);
  }

  /**
   * Simulates early principal prepayment for an existing loan.
   */
  @Post('loans/:id/prepayment')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Simulate lump-sum prepayment and calculate timeline/interest savings' })
  @ApiResponse({ status: 200, description: 'Prepayment simulation calculated successfully.' })
  async simulatePrepayment(@Param('id') loanId: string, @Body() dto: PrepaymentDto): Promise<PrepaymentSimulationResult> {
    return this.amortizationService.simulatePrepayment(loanId, dto);
  }
}
