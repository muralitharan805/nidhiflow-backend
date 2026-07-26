import { Controller, Get, Query, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { IncomeStatementQueryDto } from './dto/income-statement-query.dto';
import { StatementQueryDto } from './dto/statement-query.dto';
import {
  BalanceSheetResponseDto,
  IncomeStatementResponseDto,
  TrialBalanceResponseDto,
} from './dto/financial-reports-response.dto';
import { UserEntity } from '../users/entities/user.entity';

interface RequestWithUser {
  user?: UserEntity;
}

/**
 * Controller providing financial statement reports (Income Statement, Balance Sheet, Trial Balance).
 */
@ApiTags('Financial Reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  /**
   * Generates Income Statement (Profit & Loss) for a specified date range.
   */
  @Get('income-statement')
  @ApiOperation({
    summary: 'Generate Income Statement (P&L: Total Revenues - Total Expenses)',
  })
  @ApiResponse({
    status: 200,
    description: 'Income statement generated successfully.',
    type: IncomeStatementResponseDto,
  })
  async getIncomeStatement(
    @Req() req: RequestWithUser,
    @Query() query: IncomeStatementQueryDto,
  ): Promise<IncomeStatementResponseDto> {
    return this.reportsService.getIncomeStatement(query, req.user?.id);
  }

  /**
   * Generates Balance Sheet asserting Assets = Liabilities + Equity up to an optional asOfDate.
   */
  @Get('balance-sheet')
  @ApiOperation({
    summary:
      'Generate Balance Sheet (Assets = Liabilities + Equity including Retained Earnings)',
  })
  @ApiResponse({
    status: 200,
    description: 'Balance sheet generated successfully.',
    type: BalanceSheetResponseDto,
  })
  async getBalanceSheet(
    @Req() req: RequestWithUser,
    @Query() query: StatementQueryDto,
  ): Promise<BalanceSheetResponseDto> {
    return this.reportsService.getBalanceSheet(query, req.user?.id);
  }

  /**
   * Generates Trial Balance asserting Total Debits === Total Credits up to an optional asOfDate.
   */
  @Get('trial-balance')
  @ApiOperation({
    summary: 'Generate Trial Balance asserting Total Debits === Total Credits',
  })
  @ApiResponse({
    status: 200,
    description: 'Trial balance generated successfully.',
    type: TrialBalanceResponseDto,
  })
  async getTrialBalance(
    @Req() req: RequestWithUser,
    @Query() query: StatementQueryDto,
  ): Promise<TrialBalanceResponseDto> {
    return this.reportsService.getTrialBalance(query, req.user?.id);
  }
}

