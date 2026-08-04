/*
 * Copyright (c) 2026  GeorgH93
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
/**
 * Custom error classes for the Z.AI API client.
 * Provides structured error handling with specific error types.
 */
/**
 * Base error class for all Z.AI API errors.
 */
export class ZaiError extends Error {
    code;
    statusCode;
    details;
    constructor(message, code, statusCode, details) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
        this.name = 'ZaiError';
    }
}
/**
 * Authentication error - invalid or missing API key.
 */
export class ZaiAuthenticationError extends ZaiError {
    constructor(message = 'Authentication failed. Check your API key.') {
        super(message, 'AUTH_ERROR', 401);
        this.name = 'ZaiAuthenticationError';
    }
}
/**
 * Rate limit error - too many requests.
 */
export class ZaiRateLimitError extends ZaiError {
    retryAfter;
    constructor(message = 'Rate limit exceeded. Please retry after some time.', retryAfter) {
        super(message, 'RATE_LIMIT', 429);
        this.retryAfter = retryAfter;
        this.name = 'ZaiRateLimitError';
    }
}
/**
 * Validation error - invalid request parameters.
 */
export class ZaiValidationError extends ZaiError {
    constructor(message, details) {
        super(message, 'VALIDATION_ERROR', 400, details);
        this.name = 'ZaiValidationError';
    }
}
/**
 * Server error - Z.AI API returned a 5xx error.
 */
export class ZaiServerError extends ZaiError {
    constructor(message = 'Z.AI server error. Please retry.', statusCode = 500) {
        super(message, 'SERVER_ERROR', statusCode);
        this.name = 'ZaiServerError';
    }
}
/**
 * Network error - request failed to reach the server.
 */
export class ZaiNetworkError extends ZaiError {
    constructor(message = 'Network error. Please check your connection.') {
        super(message, 'NETWORK_ERROR');
        this.name = 'ZaiNetworkError';
    }
}
/**
 * Timeout error - request took too long.
 */
export class ZaiTimeoutError extends ZaiError {
    constructor(message = 'Request timed out.') {
        super(message, 'TIMEOUT_ERROR');
        this.name = 'ZaiTimeoutError';
    }
}
/**
 * Content filter error - request blocked by content policy.
 */
export class ZaiContentFilterError extends ZaiError {
    filterLevel;
    constructor(message = 'Content filtered. Your prompt may contain restricted content.', filterLevel) {
        super(message, 'CONTENT_FILTER', 200);
        this.filterLevel = filterLevel;
        this.name = 'ZaiContentFilterError';
    }
}
/**
 * Configuration error - missing required configuration.
 */
export class ZaiConfigError extends ZaiError {
    constructor(message) {
        super(message, 'CONFIG_ERROR');
        this.name = 'ZaiConfigError';
    }
}
/**
 * Task failed error - async task failed to complete.
 */
export class ZaiTaskFailedError extends ZaiError {
    taskId;
    constructor(message = 'Image generation task failed.', taskId) {
        super(message, 'TASK_FAILED');
        this.taskId = taskId;
        this.name = 'ZaiTaskFailedError';
    }
}
/**
 * Map HTTP status codes to appropriate error types.
 */
export function createErrorFromStatus(statusCode, message, details, headers) {
    switch (statusCode) {
        case 401:
            return new ZaiAuthenticationError(message);
        case 429: {
            const retryAfterHeader = headers?.get('Retry-After');
            const retryAfter = retryAfterHeader != null ? parseInt(retryAfterHeader, 10) : undefined;
            return new ZaiRateLimitError(message, retryAfter != null && !isNaN(retryAfter) ? retryAfter : undefined);
        }
        case 400:
            return new ZaiValidationError(message, details);
        default:
            if (statusCode >= 500) {
                return new ZaiServerError(message, statusCode);
            }
            return new ZaiError(message, 'API_ERROR', statusCode, details);
    }
}
/**
 * Check if an error is retryable.
 */
export function isRetryableError(error) {
    if (error instanceof ZaiRateLimitError)
        return true;
    if (error instanceof ZaiServerError)
        return true;
    if (error instanceof ZaiNetworkError)
        return true;
    if (error instanceof ZaiTimeoutError)
        return true;
    return false;
}
//# sourceMappingURL=errors.js.map