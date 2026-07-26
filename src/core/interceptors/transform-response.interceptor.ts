import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request, Response } from 'express';

export interface ApiResponseEnvelope<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
  timestamp: string;
  path: string;
}

@Injectable()
export class TransformResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiResponseEnvelope<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponseEnvelope<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    return next.handle().pipe(
      map((resData: unknown) => {
        // Handle paginated responses where resData contains { data, meta }
        const isPaginated =
          resData !== null &&
          typeof resData === 'object' &&
          'data' in resData &&
          'meta' in resData;

        const paginatedObj = isPaginated
          ? (resData as Record<string, unknown>)
          : null;
        const data = (paginatedObj ? paginatedObj.data : resData) as T;
        const meta = paginatedObj
          ? (paginatedObj.meta as Record<string, unknown>)
          : undefined;

        return {
          success: true,
          statusCode: response.statusCode,
          message: 'Operation completed successfully',
          data,
          ...(meta ? { meta } : {}),
          timestamp: new Date().toISOString(),
          path: request.url,
        };
      }),
    );
  }
}
