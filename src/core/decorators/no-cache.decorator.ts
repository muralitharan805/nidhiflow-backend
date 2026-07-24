import { SetMetadata, CustomDecorator } from '@nestjs/common';

/**
 * Metadata key for disabling cache on specific route handlers or controllers.
 */
export const NO_CACHE_KEY = 'no_cache';

/**
 * Decorator to explicitly disable Redis HTTP caching for a controller or route handler.
 *
 * @example
 * ```typescript
 * @Get('live-stream')
 * @NoCache()
 * getLiveStream() { ... }
 * ```
 *
 * @returns CustomDecorator setting the NO_CACHE_KEY metadata flag to true
 */
export const NoCache = (): CustomDecorator<string> => SetMetadata(NO_CACHE_KEY, true);
