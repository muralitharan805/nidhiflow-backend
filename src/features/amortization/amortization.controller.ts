import {
  Controller,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  AmortizationService,
  LoanAmortizationDetails,
  PrepaymentSimulationResult,
} from './amortization.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { PrepaymentDto } from './dto/prepayment.dto';
import { UserEntity } from '../users/entities/user.entity';

interface RequestWithUser {
  user?: UserEntity;
}

/**
 * Controller managing EMI loan amortization schedules and prepayment simulations.
 */
@ApiTags('EMI Loan Amortization')
@Controller('amortization')
export class AmortizationController {
  constructor(private readonly amortizationService: AmortizationService) {}

  /**
   * Creates a new loan amortization record and generates repayment schedule scoped to user.
   */
  @Post('loans')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create loan and generate complete EMI amortization schedule',
  })
  @ApiResponse({
    status: 201,
    description: 'Loan schedule created successfully.',
  })
  async createLoan(
    @Req() req: RequestWithUser,
    @Body() dto: CreateLoanDto,
  ): Promise<LoanAmortizationDetails> {
    return this.amortizationService.createLoan(dto, req.user?.id);
  }

  /**
   * Simulates early principal prepayment for an existing loan scoped to user.
   */
  @Post('loans/:id/prepayment')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Simulate lump-sum prepayment and calculate timeline/interest savings',
  })
  @ApiResponse({
    status: 200,
    description: 'Prepayment simulation calculated successfully.',
  })
  async simulatePrepayment(
    @Req() req: RequestWithUser,
    @Param('id') loanId: string,
    @Body() dto: PrepaymentDto,
  ): Promise<PrepaymentSimulationResult> {
    return this.amortizationService.simulatePrepayment(
      loanId,
      dto,
      req.user?.id,
    );
  }
}

