import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

/**
 * Middleware creating or propagating unique request correlation IDs (X-Correlation-ID)
 * across HTTP headers and request lifecycles.
 */
@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  /**
   * Assigns or reads X-Correlation-ID header and binds to request and response objects.
   *
   * @param req - Express Request
   * @param res - Express Response
   * @param next - Express NextFunction
   */
  use(req: Request, res: Response, next: NextFunction): void {
    const headerVal = req.headers['x-correlation-id'];
    const correlationId =
      (Array.isArray(headerVal) ? headerVal[0] : headerVal) || randomUUID();

    (req as Request & { correlationId?: string })['correlationId'] = correlationId;
    res.setHeader('X-Correlation-ID', correlationId);

    next();
  }
}
