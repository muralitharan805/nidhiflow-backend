import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Security & Header Protection
  app.use(helmet());
  app.enableCors({ origin: true, credentials: true });

  // API Versioning Prefix
  app.setGlobalPrefix('api/v1');

  // DTO Validation & Transformation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Graceful Process Signal Shutdown Hooks
  app.enableShutdownHooks();

  // OpenAPI / Swagger Interactive Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('NidhiFlow Enterprise Backend API')
    .setDescription(
      'Production-grade NestJS REST API with Double-Entry Accounting & Financial Scaffolding',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env['PORT'] || 3000;
  await app.listen(port);

  logger.log(`🚀 Application running on http://localhost:${port}/api/v1`);
  logger.log(
    `📚 Swagger Documentation active at http://localhost:${port}/api/docs`,
  );
}

void bootstrap();
