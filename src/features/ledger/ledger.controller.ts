import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LedgerService, NetWorthSummary } from './ledger.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { CreateJournalEntryDto } from './dto/create-journal-entry.dto';
import { AccountQueryDto } from './dto/account-query.dto';
import { JournalEntryResponseDto } from './dto/journal-entry-response.dto';
import { Account, AccountCategoryMeta, JournalEntry } from '@prisma/client';
import { UserEntity } from '../users/entities/user.entity';

interface RequestWithUser {
  user?: UserEntity;
}

/**
 * Controller managing double-entry ledger accounts, journal entry transactions, and net worth queries with user-level isolation.
 */
@ApiTags('Ledger & Net Worth')
@Controller('ledger')
export class LedgerController {
  constructor(private readonly ledgerService: LedgerService) {}

  /**
   * Fetches category metadata guidance (labels, icons, descriptions, colors) from DB.
   */
  @Get('categories')
  @ApiOperation({
    summary: 'List account category metadata guidance from database',
  })
  async getCategoryMetadata(): Promise<AccountCategoryMeta[]> {
    return this.ledgerService.getCategoryMetadata();
  }

  /**
   * Creates a new Account head in the Chart of Accounts scoped to the authenticated user.
   */
  @Post('accounts')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new account head in Chart of Accounts' })
  @ApiResponse({
    status: 201,
    description: 'Account head successfully created.',
  })
  async createAccount(
    @Req() req: RequestWithUser,
    @Body() dto: CreateAccountDto,
  ): Promise<Account> {
    return this.ledgerService.createAccount(dto, req.user?.id);
  }

  /**
   * Fetches paginated accounts scoped to the authenticated user.
   */
  @Get('accounts')
  @ApiOperation({
    summary: 'List accounts with optional pagination and type filtering',
  })
  async findAllAccounts(
    @Req() req: RequestWithUser,
    @Query() query: AccountQueryDto,
  ): Promise<{ items: Account[]; total: number }> {
    return this.ledgerService.findAllAccounts(query, req.user?.id);
  }

  /**
   * Fetches recent journal entries with populated posting account details scoped to the authenticated user.
   */
  @Get('entries')
  @ApiOperation({ summary: 'List recent journal entries with postings' })
  @ApiResponse({
    status: 200,
    description:
      'List of recent journal entries with account details in posting lines.',
    type: [JournalEntryResponseDto],
  })
  async findAllEntries(
    @Req() req: RequestWithUser,
    @Query('limit') limit?: number,
  ): Promise<JournalEntryResponseDto[]> {
    return this.ledgerService.findAllJournalEntries(
      limit ? Number(limit) : 50,
      req.user?.id,
    );
  }

  /**
   * Posts a multi-line double-entry journal entry scoped to the authenticated user.
   */
  @Post('entries')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Post balanced double-entry transaction' })
  @ApiResponse({
    status: 201,
    description: 'Journal entry posted successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Unbalanced debits and credits rejected.',
  })
  async postJournalEntry(
    @Req() req: RequestWithUser,
    @Body() dto: CreateJournalEntryDto,
  ): Promise<JournalEntry> {
    return this.ledgerService.postJournalEntry(dto, req.user?.id);
  }

  /**
   * Fetches real-time Net Worth breakdown scoped to the authenticated user.
   */
  @Get('net-worth')
  @ApiOperation({
    summary: 'Calculate current Net Worth (Total Assets - Total Liabilities)',
  })
  async getNetWorth(@Req() req: RequestWithUser): Promise<NetWorthSummary> {
    return this.ledgerService.getNetWorth(req.user?.id);
  }
}
