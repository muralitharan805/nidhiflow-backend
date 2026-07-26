import { Test, TestingModule } from '@nestjs/testing';
import { ForecastingService } from './forecasting.service';
import { PrismaService } from '../../database/prisma.service';
import { LedgerService } from '../ledger/ledger.service';

describe('ForecastingService', () => {
  let service: ForecastingService;
  let ledgerService: jest.Mocked<LedgerService>;

  beforeEach(async () => {
    const mockPrisma = {
      loanAmortization: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    const mockLedger = {
      getNetWorth: jest.fn().mockResolvedValue({
        totalAssets: 100000,
        totalLiabilities: 0,
        netWorth: 100000,
        accountsCount: 1,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ForecastingService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: LedgerService, useValue: mockLedger },
      ],
    }).compile();

    service = module.get<ForecastingService>(ForecastingService);
    ledgerService = module.get(LedgerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(ledgerService).toBeDefined();
  });

  describe('simulateScenario', () => {
    it('should detect deficit crossover year when expense inflation outpaces income growth', async () => {
      const dto = {
        scenarioName: 'High Inflation Test',
        initialAnnualIncome: 500000,
        incomeGrowthRate: 0.01, // 1% growth
        annualEmiObligation: 0,
        projectionYears: 5,
        categoryInflations: [
          { category: 'Rent', baseAnnualExpense: 480000, inflationRate: 0.1 }, // 10% inflation
        ],
      };

      const result = await service.simulateScenario(dto);
      expect(result.hasDeficitCrossover).toBe(true);
      expect(result.deficitCrossoverYear).toBeGreaterThan(0);
      expect(result.yearlyProjections.length).toBe(5);
    });

    it('should compute positive net worth trajectory when income growth exceeds inflation', async () => {
      const dto = {
        scenarioName: 'Strong Income Test',
        initialAnnualIncome: 1500000,
        incomeGrowthRate: 0.1, // 10% growth
        annualEmiObligation: 100000,
        projectionYears: 5,
        categoryInflations: [
          {
            category: 'Groceries',
            baseAnnualExpense: 300000,
            inflationRate: 0.05,
          }, // 5% inflation
        ],
      };

      const result = await service.simulateScenario(dto);
      expect(result.hasDeficitCrossover).toBe(false);
      expect(result.projectedFinalNetWorth).toBeGreaterThan(
        result.initialNetWorth,
      );
    });
  });
});
