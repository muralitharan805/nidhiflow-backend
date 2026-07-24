import { Injectable, NotFoundException } from '@nestjs/common';
import { LoanAmortization } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { PrepaymentDto } from './dto/prepayment.dto';

export interface AmortizationScheduleItem {
  month: number;
  paymentDate: string;
  emi: number;
  principalComponent: number;
  interestComponent: number;
  remainingPrincipal: number;
}

export interface LoanAmortizationDetails {
  loan: LoanAmortization;
  monthlyEmi: number;
  totalInterestPayable: number;
  totalAmountPayable: number;
  payoffDate: string;
  schedule: AmortizationScheduleItem[];
}

export interface PrepaymentSimulationResult {
  originalPayoffDate: string;
  newPayoffDate: string;
  monthsSaved: number;
  interestSaved: number;
  updatedSchedule: AmortizationScheduleItem[];
}

/**
 * Service managing EMI amortization calculations, schedule generation, and prepayment simulations.
 */
@Injectable()
export class AmortizationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a loan amortization schedule and persists to database.
   *
   * @param dto - Loan parameters
   * @returns Detailed loan calculations and full amortization schedule
   */
  async createLoan(dto: CreateLoanDto): Promise<LoanAmortizationDetails> {
    const account = await this.prisma.account.findUnique({
      where: { id: dto.accountId },
    });
    if (!account) {
      throw new NotFoundException(`Liability account with ID '${dto.accountId}' not found.`);
    }

    const startDate = dto.startDate ? new Date(dto.startDate) : new Date();
    const monthlyEmi = this.calculateEmi(dto.principalAmount, dto.annualInterestRate, dto.tenureMonths);
    const payoffDate = new Date(startDate);
    payoffDate.setMonth(payoffDate.getMonth() + dto.tenureMonths);

    const loan = await this.prisma.loanAmortization.create({
      data: {
        accountId: dto.accountId,
        principalAmount: dto.principalAmount,
        annualInterestRate: dto.annualInterestRate,
        tenureMonths: dto.tenureMonths,
        monthlyEmi,
        startDate,
        payoffDate,
      },
    });

    const schedule = this.generateSchedule(dto.principalAmount, dto.annualInterestRate, dto.tenureMonths, startDate, monthlyEmi);
    const totalInterest = schedule.reduce((sum, item) => sum + item.interestComponent, 0);

    return {
      loan,
      monthlyEmi,
      totalInterestPayable: Math.round(totalInterest * 100) / 100,
      totalAmountPayable: Math.round((dto.principalAmount + totalInterest) * 100) / 100,
      payoffDate: payoffDate.toISOString(),
      schedule,
    };
  }

  /**
   * Simulates early principal prepayment and computes interest & timeline savings.
   *
   * @param loanId - Database ID of existing loan
   * @param dto - Prepayment details
   * @returns Simulation result with revised payoff date and savings
   */
  async simulatePrepayment(loanId: string, dto: PrepaymentDto): Promise<PrepaymentSimulationResult> {
    const loan = await this.prisma.loanAmortization.findUnique({
      where: { id: loanId },
    });
    if (!loan) {
      throw new NotFoundException(`Loan amortization record '${loanId}' not found.`);
    }

    const originalDetails = this.generateSchedule(
      loan.principalAmount,
      loan.annualInterestRate,
      loan.tenureMonths,
      loan.startDate,
      loan.monthlyEmi,
    );
    const originalTotalInterest = originalDetails.reduce((sum, i) => sum + i.interestComponent, 0);

    const monthlyRate = loan.annualInterestRate / (12 * 100);
    const updatedSchedule: AmortizationScheduleItem[] = [];

    let currentBalance = loan.principalAmount;
    let currentDate = new Date(loan.startDate);

    for (let month = 1; month <= loan.tenureMonths; month++) {
      if (currentBalance <= 0) break;

      currentDate.setMonth(currentDate.getMonth() + 1);
      const interestComponent = currentBalance * monthlyRate;

      if (month === dto.prepaymentMonth) {
        currentBalance = Math.max(0, currentBalance - dto.prepaymentAmount);
      }

      let principalComponent = loan.monthlyEmi - interestComponent;
      if (principalComponent > currentBalance) {
        principalComponent = currentBalance;
      }

      currentBalance = Math.max(0, currentBalance - principalComponent);

      updatedSchedule.push({
        month,
        paymentDate: currentDate.toISOString().split('T')[0] || '',
        emi: Math.round((principalComponent + interestComponent) * 100) / 100,
        principalComponent: Math.round(principalComponent * 100) / 100,
        interestComponent: Math.round(interestComponent * 100) / 100,
        remainingPrincipal: Math.round(currentBalance * 100) / 100,
      });
    }

    const newTotalInterest = updatedSchedule.reduce((sum, i) => sum + i.interestComponent, 0);
    const originalPayoff = loan.payoffDate.toISOString().split('T')[0] || '';
    const newPayoff = updatedSchedule[updatedSchedule.length - 1]?.paymentDate || originalPayoff;

    return {
      originalPayoffDate: originalPayoff,
      newPayoffDate: newPayoff,
      monthsSaved: loan.tenureMonths - updatedSchedule.length,
      interestSaved: Math.round((originalTotalInterest - newTotalInterest) * 100) / 100,
      updatedSchedule,
    };
  }

  /**
   * Standard EMI mathematical formula: M = P * r * (1 + r)^n / ((1 + r)^n - 1)
   */
  calculateEmi(principal: number, annualRate: number, tenureMonths: number): number {
    const monthlyRate = annualRate / (12 * 100);
    const compoundFactor = Math.pow(1 + monthlyRate, tenureMonths);
    const emi = (principal * monthlyRate * compoundFactor) / (compoundFactor - 1);
    return Math.round(emi * 100) / 100;
  }

  /**
   * Generates month-by-month repayment schedule breakdown.
   */
  private generateSchedule(
    principal: number,
    annualRate: number,
    tenureMonths: number,
    startDate: Date,
    monthlyEmi: number,
  ): AmortizationScheduleItem[] {
    const schedule: AmortizationScheduleItem[] = [];
    const monthlyRate = annualRate / (12 * 100);

    let remainingPrincipal = principal;
    let currentDate = new Date(startDate);

    for (let month = 1; month <= tenureMonths; month++) {
      currentDate.setMonth(currentDate.getMonth() + 1);
      const interestComponent = remainingPrincipal * monthlyRate;
      let principalComponent = monthlyEmi - interestComponent;

      if (month === tenureMonths || principalComponent > remainingPrincipal) {
        principalComponent = remainingPrincipal;
      }

      remainingPrincipal = Math.max(0, remainingPrincipal - principalComponent);

      schedule.push({
        month,
        paymentDate: currentDate.toISOString().split('T')[0] || '',
        emi: Math.round((principalComponent + interestComponent) * 100) / 100,
        principalComponent: Math.round(principalComponent * 100) / 100,
        interestComponent: Math.round(interestComponent * 100) / 100,
        remainingPrincipal: Math.round(remainingPrincipal * 100) / 100,
      });
    }

    return schedule;
  }
}
