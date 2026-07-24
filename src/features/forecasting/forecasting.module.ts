import { Module } from '@nestjs/common';
import { ForecastingService } from './forecasting.service';
import { ForecastingController } from './forecasting.controller';
import { LedgerModule } from '../ledger/ledger.module';

/**
 * Feature module encapsulating multi-year financial forecasting and inflation simulation services.
 */
@Module({
  imports: [LedgerModule],
  controllers: [ForecastingController],
  providers: [ForecastingService],
  exports: [ForecastingService],
})
export class ForecastingModule {}
