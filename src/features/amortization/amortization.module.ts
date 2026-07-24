import { Module } from '@nestjs/common';
import { AmortizationService } from './amortization.service';
import { AmortizationController } from './amortization.controller';

/**
 * Feature module encapsulating EMI loan amortization calculations and prepayment engines.
 */
@Module({
  controllers: [AmortizationController],
  providers: [AmortizationService],
  exports: [AmortizationService],
})
export class AmortizationModule {}
