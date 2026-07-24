import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { validateEnv } from './core/config/env.config';
import { CoreModule } from './core/core.module';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './features/auth/auth.module';
import { UsersModule } from './features/users/users.module';
import { LedgerModule } from './features/ledger/ledger.module';
import { AmortizationModule } from './features/amortization/amortization.module';
import { ForecastingModule } from './features/forecasting/forecasting.module';
import { JwtAuthGuard } from './features/auth/guards/jwt-auth.guard';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    CoreModule,
    DatabaseModule,
    HealthModule,
    AuthModule,
    UsersModule,
    LedgerModule,
    AmortizationModule,
    ForecastingModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
