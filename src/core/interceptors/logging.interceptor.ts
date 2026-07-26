import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { sanitizeLogPayload } from '../logger/log-sanitizer.util';

export interface StructuredLogPayload {
  readonly timestamp: string;
  readonly correlationId: string;
  readonly method: string;
  readonly path: string;
  readonly statusCode: number;
  readonly durationMs: number;
  readonly payload?: unknown;
}

const LOG_DIR = path.join(process.cwd(), 'logs');
const LOG_FILE = path.join(LOG_DIR, 'requests.log');

/**
 * Appends a log line to logs/requests.log file asynchronously/safely.
 */
function appendLogToFile(logLine: string): void {
  try {
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }
    fs.appendFileSync(LOG_FILE, logLine + '\n', 'utf8');
  } catch {
    // Fallback if file writing fails
  }
}

/**
 * Interceptor handling enterprise structured JSON logging, execution latency,
 * correlation ID tracing, file storage, and sanitized payload logging.
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  /**
   * Intercepts HTTP request lifecycle and emits single-line structured JSON logs to console and file.
   *
   * @param context - ExecutionContext of the request
   * @param next - CallHandler for invoking next handler in pipeline
   * @returns Observable emitting response payload
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request & { correlationId?: string }>();
    const response = ctx.getResponse<Response>();

    const { method, originalUrl, url, body } = request;
    const correlationId = request.correlationId || 'N/A';
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const durationMs = Date.now() - startTime;
        const statusCode = response.statusCode;

        const hasBody =
          body &&
          typeof body === 'object' &&
          Object.keys(body as Record<string, unknown>).length > 0;

        const structuredLog: StructuredLogPayload = {
          timestamp: new Date().toISOString(),
          correlationId,
          method,
          path: originalUrl || url,
          statusCode,
          durationMs,
          ...(hasBody ? { payload: sanitizeLogPayload(body) } : {}),
        };

        const jsonString = JSON.stringify(structuredLog);
        this.logger.log(jsonString);
        appendLogToFile(jsonString);
      }),
    );
  }
}
