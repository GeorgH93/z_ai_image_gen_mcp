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
 * Z.AI API Client with retry logic and error handling.
 */

import type {
  AsyncCreateImageRequest,
  AsyncImageGenerationResponse,
  AsyncResponse,
  ClientOptions,
  CreateImageRequest,
  ImageGenerationResponse,
  ZaiClient,
} from './types.js';
import {
  createErrorFromStatus,
  isRetryableError,
  ZaiConfigError,
  ZaiNetworkError,
  ZaiTimeoutError,
} from './errors.js';

const DEFAULT_TIMEOUT = 60000;
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_DELAY = 1000;

/**
 * Sleep for a given number of milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay with jitter.
 */
function calculateBackoff(attempt: number, baseDelay: number): number {
  const exponentialDelay = baseDelay * Math.pow(2, attempt);
  const jitter = Math.random() * 0.1 * exponentialDelay;
  return Math.min(exponentialDelay + jitter, 30000); // Cap at 30 seconds
}

/**
 * Create a Z.AI API client.
 */
export function createZaiClient(options: ClientOptions): ZaiClient {
  const {
    apiKey,
    baseUrl = 'https://api.z.ai/api',
    timeout = DEFAULT_TIMEOUT,
    maxRetries = DEFAULT_MAX_RETRIES,
    retryDelay = DEFAULT_RETRY_DELAY,
  } = options;

  if (!apiKey) {
    throw new ZaiConfigError('API key is required');
  }

  /**
   * Make an HTTP request with retry logic.
   */
  async function request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (attempt > 0) {
        const backoff = calculateBackoff(attempt - 1, retryDelay);
        await sleep(backoff);
      }

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const fetchOptions: RequestInit = {
          method,
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          signal: controller.signal,
        };
        if (body) {
          fetchOptions.body = JSON.stringify(body);
        }

        const response = await fetch(`${baseUrl}${path}`, fetchOptions);

        clearTimeout(timeoutId);

        // Handle successful response
        if (response.ok) {
          return (await response.json()) as T;
        }

        // Handle error response
        let errorBody: { message?: string; error?: { message?: string } } | undefined;
        try {
          errorBody = (await response.json()) as { message?: string; error?: { message?: string } } | undefined;
        } catch {
          // Ignore JSON parse errors
        }

        const errorMessage =
          errorBody?.message ??
          errorBody?.error?.message ??
          `HTTP ${response.status}: ${response.statusText}`;

        const error = createErrorFromStatus(
          response.status,
          errorMessage,
          errorBody,
          response.headers
        );

        // Don't retry non-retryable errors
        if (!isRetryableError(error)) {
          throw error;
        }

        lastError = error;
      } catch (error) {
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            const timeoutError = new ZaiTimeoutError();
            if (!isRetryableError(timeoutError)) {
              throw timeoutError;
            }
            lastError = timeoutError;
          } else if (
            error.message.includes('fetch') ||
            error.message.includes('network') ||
            error.message.includes('ECONNREFUSED') ||
            error.message.includes('ENOTFOUND')
          ) {
            const networkError = new ZaiNetworkError(error.message);
            if (!isRetryableError(networkError)) {
              throw networkError;
            }
            lastError = networkError;
          } else if (error instanceof ZaiTimeoutError || isRetryableError(error)) {
            lastError = error;
          } else {
            throw error;
          }
        } else {
          throw error;
        }
      }
    }

    throw lastError ?? new ZaiNetworkError('Max retries exceeded');
  }

  return {
    /**
     * Generate an image synchronously.
     */
    async generateImage(
      req: CreateImageRequest
    ): Promise<ImageGenerationResponse> {
      return request<ImageGenerationResponse>(
        'POST',
        '/paas/v4/images/generations',
        req
      );
    },

    /**
     * Start an async image generation task.
     */
    async generateImageAsync(
      req: AsyncCreateImageRequest
    ): Promise<AsyncResponse> {
      return request<AsyncResponse>(
        'POST',
        '/paas/v4/async/images/generations',
        req
      );
    },

    /**
     * Get the result of an async task.
     */
    async getAsyncResult(taskId: string): Promise<AsyncImageGenerationResponse> {
      return request<AsyncImageGenerationResponse>(
        'GET',
        `/paas/v4/async-result/${taskId}`
      );
    },
  };
}

export type { ZaiClient, ClientOptions };
