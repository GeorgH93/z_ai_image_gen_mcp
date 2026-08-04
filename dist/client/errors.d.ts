/**
 * Custom error classes for the Z.AI API client.
 * Provides structured error handling with specific error types.
 */
/**
 * Base error class for all Z.AI API errors.
 */
export declare class ZaiError extends Error {
    readonly code: string;
    readonly statusCode?: number | undefined;
    readonly details?: unknown | undefined;
    constructor(message: string, code: string, statusCode?: number | undefined, details?: unknown | undefined);
}
/**
 * Authentication error - invalid or missing API key.
 */
export declare class ZaiAuthenticationError extends ZaiError {
    constructor(message?: string);
}
/**
 * Rate limit error - too many requests.
 */
export declare class ZaiRateLimitError extends ZaiError {
    readonly retryAfter?: number | undefined;
    constructor(message?: string, retryAfter?: number | undefined);
}
/**
 * Validation error - invalid request parameters.
 */
export declare class ZaiValidationError extends ZaiError {
    constructor(message: string, details?: unknown);
}
/**
 * Server error - Z.AI API returned a 5xx error.
 */
export declare class ZaiServerError extends ZaiError {
    constructor(message?: string, statusCode?: number);
}
/**
 * Network error - request failed to reach the server.
 */
export declare class ZaiNetworkError extends ZaiError {
    constructor(message?: string);
}
/**
 * Timeout error - request took too long.
 */
export declare class ZaiTimeoutError extends ZaiError {
    constructor(message?: string);
}
/**
 * Content filter error - request blocked by content policy.
 */
export declare class ZaiContentFilterError extends ZaiError {
    readonly filterLevel?: number | undefined;
    constructor(message?: string, filterLevel?: number | undefined);
}
/**
 * Configuration error - missing required configuration.
 */
export declare class ZaiConfigError extends ZaiError {
    constructor(message: string);
}
/**
 * Task failed error - async task failed to complete.
 */
export declare class ZaiTaskFailedError extends ZaiError {
    readonly taskId?: string | undefined;
    constructor(message?: string, taskId?: string | undefined);
}
/**
 * Map HTTP status codes to appropriate error types.
 */
export declare function createErrorFromStatus(statusCode: number, message: string, details?: unknown, headers?: Headers): ZaiError;
/**
 * Check if an error is retryable.
 */
export declare function isRetryableError(error: unknown): boolean;
//# sourceMappingURL=errors.d.ts.map