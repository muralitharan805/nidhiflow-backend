import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { LedgerService } from '../ledger/ledger.service';
import { SimulateScenarioDto } from './dto/simulate-scenario.dto';

export interface YearlyProjectionItem {
  year: number;
  projectedIncome: number;
  projectedExpenses: number;
  annualEmiObligation: number;
  totalOutflow: number;
  netCashflow: number;
  projectedNetWorth: number;
  isDeficitYear: boolean;
}

export interface SimulationResult {
  scenarioName: string;
  projectionYears: number;
  deficitCrossoverYear: number | null;
  hasDeficitCrossover: boolean;
  initialNetWorth: number;
  projectedFinalNetWorth: number;
  yearlyProjections: YearlyProjectionItem[];
}

/**
 * Service executing transient 7-dimensional multi-year scenario forecasting simulations.
 */
@Injectable()
export class ForecastingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledgerService: LedgerService,
  ) {}

  /**
   * Runs a transient multi-year inflation and cashflow simulation.
   * Does NOT mutate actual ledger postings.
   *
   * @param dto - Simulation parameters
   * @param userId - Optional authenticated user ID
   * @returns Detailed multi-year projections and Deficit Crossover Year detection
   */
  async simulateScenario(
    dto: SimulateScenarioDto,
    userId?: string,
  ): Promise<SimulationResult> {
    const netWorthSummary = await this.ledgerService.getNetWorth(userId);
    const initialNetWorth = netWorthSummary.netWorth;

    let annualEmi = dto.annualEmiObligation ?? 0;
    if (dto.annualEmiObligation === undefined) {
      const loans = await this.prisma.loanAmortization.findMany({
        where: userId ? { account: { OR: [{ userId }, { userId: null }] } } : {},
      });
      annualEmi = loans.reduce((sum, loan) => sum + loan.monthlyEmi * 12, 0);
    }

    const projectionYears = dto.projectionYears || 5;
    const yearlyProjections: YearlyProjectionItem[] = [];

    let deficitCrossoverYear: number | null = null;
    let runningNetWorth = initialNetWorth;

    for (let t = 1; t <= projectionYears; t++) {
      const projectedIncome =
        dto.initialAnnualIncome * Math.pow(1 + dto.incomeGrowthRate, t);

      let projectedExpenses = 0;
      for (const item of dto.categoryInflations) {
        projectedExpenses +=
          item.baseAnnualExpense * Math.pow(1 + item.inflationRate, t);
      }

      const totalOutflow = projectedExpenses + annualEmi;
      const netCashflow = projectedIncome - totalOutflow;
      const isDeficitYear = netCashflow < 0;

      if (isDeficitYear && deficitCrossoverYear === null) {
        deficitCrossoverYear = t;
      }

      runningNetWorth += netCashflow;

      yearlyProjections.push({
        year: t,
        projectedIncome: Math.round(projectedIncome * 100) / 100,
        projectedExpenses: Math.round(projectedExpenses * 100) / 100,
        annualEmiObligation: Math.round(annualEmi * 100) / 100,
        totalOutflow: Math.round(totalOutflow * 100) / 100,
        netCashflow: Math.round(netCashflow * 100) / 100,
        projectedNetWorth: Math.round(runningNetWorth * 100) / 100,
        isDeficitYear,
      });
    }

    return {
      scenarioName: dto.scenarioName,
      projectionYears,
      deficitCrossoverYear,
      hasDeficitCrossover: deficitCrossoverYear !== null,
      initialNetWorth,
      projectedFinalNetWorth: Math.round(runningNetWorth * 100) / 100,
      yearlyProjections,
    };
  }
}
