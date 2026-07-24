import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AmortizationService } from './amortization.service';
import { PrismaService } from '../../database/prisma.service';

describe('AmortizationService', () => {
  let service: AmortizationService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const mockPrisma = {
      account: {
        findUnique: jest.fn(),
      },
      loanAmortization: {
        create: jest.fn(),
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AmortizationService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AmortizationService>(AmortizationService);
    prisma = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateEmi', () => {
    it('should correctly calculate EMI for ₹2,500,000 at 8.5% for 240 months', () => {
      const emi = service.calculateEmi(2500000, 8.5, 240);
      expect(emi).toBeGreaterThan(21690);
      expect(emi).toBeLessThan(21700);
    });
  });

  describe('createLoan', () => {
    it('should throw NotFoundException if account does not exist', async () => {
      (prisma.account.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.createLoan({
          accountId: 'non-existent-id',
          principalAmount: 2500000,
          annualInterestRate: 8.5,
          tenureMonths: 240,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should calculate loan details and schedule correctly when account exists', async () => {
      (prisma.account.findUnique as jest.Mock).mockResolvedValue({ id: 'acc-1' });
      (prisma.loanAmortization.create as jest.Mock).mockResolvedValue({
        id: 'loan-1',
        accountId: 'acc-1',
        principalAmount: 2500000,
        annualInterestRate: 8.5,
        tenureMonths: 240,
        monthlyEmi: 21695.59,
        startDate: new Date('2026-08-01'),
        payoffDate: new Date('2046-08-01'),
      });

      const result = await service.createLoan({
        accountId: 'acc-1',
        principalAmount: 2500000,
        annualInterestRate: 8.5,
        tenureMonths: 240,
        startDate: '2026-08-01',
      });

      expect(result.monthlyEmi).toBeGreaterThan(21690);
      expect(result.schedule.length).toBe(240);
      expect(result.totalInterestPayable).toBeGreaterThan(0);
    });
  });

  describe('simulatePrepayment', () => {
    it('should reduce payoff timeline and interest payable on early prepayment', async () => {
      const startDate = new Date('2026-08-01');
      const payoffDate = new Date('2046-08-01');

      (prisma.loanAmortization.findUnique as jest.Mock).mockResolvedValue({
        id: 'loan-1',
        accountId: 'acc-1',
        principalAmount: 2500000,
        annualInterestRate: 8.5,
        tenureMonths: 240,
        monthlyEmi: 21695.59,
        startDate,
        payoffDate,
      });

      const simulation = await service.simulatePrepayment('loan-1', {
        prepaymentAmount: 500000,
        prepaymentMonth: 12,
      });

      expect(simulation.monthsSaved).toBeGreaterThan(0);
      expect(simulation.interestSaved).toBeGreaterThan(0);
    });
  });
});
