import { Controller, Get, Post, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LedgerService, NetWorthSummary } from './ledger.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { CreateJournalEntryDto } from './dto/create-journal-entry.dto';
import { AccountQueryDto } from './dto/account-query.dto';
import { Account, JournalEntry } from '@prisma/client';

/**
 * Controller managing double-entry ledger accounts, journal entry transactions, and net worth queries.
 */
@ApiTags('Ledger & Net Worth')
@Controller('ledger')
export class LedgerController {
  constructor(private readonly ledgerService: LedgerService) {}

  /**
   * Creates a new Account head in the Chart of Accounts.
   */
  @Post('accounts')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new account head in Chart of Accounts' })
  @ApiResponse({ status: 201, description: 'Account head successfully created.' })
  async createAccount(@Body() dto: CreateAccountDto): Promise<Account> {
    return this.ledgerService.createAccount(dto);
  }

  /**
   * Fetches paginated accounts from the Chart of Accounts.
   */
  @Get('accounts')
  @ApiOperation({ summary: 'List accounts with optional pagination and type filtering' })
  async findAllAccounts(@Query() query: AccountQueryDto): Promise<{ items: Account[]; total: number }> {
    return this.ledgerService.findAllAccounts(query);
  }

  /**
   * Posts a multi-line double-entry journal entry.
   */
  @Post('entries')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Post balanced double-entry transaction' })
  @ApiResponse({ status: 201, description: 'Journal entry posted successfully.' })
  @ApiResponse({ status: 400, description: 'Unbalanced debits and credits rejected.' })
  async postJournalEntry(@Body() dto: CreateJournalEntryDto): Promise<JournalEntry> {
    return this.ledgerService.postJournalEntry(dto);
  }

  /**
   * Fetches real-time Net Worth breakdown.
   */
  @Get('net-worth')
  @ApiOperation({ summary: 'Calculate current Net Worth (Total Assets - Total Liabilities)' })
  async getNetWorth(): Promise<NetWorthSummary> {
    return this.ledgerService.getNetWorth();
  }
}
