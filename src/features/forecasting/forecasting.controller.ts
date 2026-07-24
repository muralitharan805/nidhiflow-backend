import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ForecastingService, SimulationResult } from './forecasting.service';
import { SimulateScenarioDto } from './dto/simulate-scenario.dto';

/**
 * Controller managing multi-year inflation forecasting simulations.
 */
@ApiTags('Financial Forecasting & What-If Simulation')
@Controller('forecasting')
export class ForecastingController {
  constructor(private readonly forecastingService: ForecastingService) {}

  /**
   * Runs a transient multi-year scenario simulation.
   */
  @Post('simulate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Simulate multi-year inflation, cashflow, and Net Worth crossover year' })
  @ApiResponse({ status: 200, description: 'Simulation executed successfully.' })
  async simulateScenario(@Body() dto: SimulateScenarioDto): Promise<SimulationResult> {
    return this.forecastingService.simulateScenario(dto);
  }
}
