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
 * Unit tests for Z.AI API Client.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createZaiClient } from '../../src/client/index.js';
import {
  ZaiAuthenticationError,
  ZaiRateLimitError,
  ZaiValidationError,
  ZaiServerError,
  ZaiNetworkError,
  ZaiTimeoutError,
  ZaiConfigError,
} from '../../src/client/errors.js';

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('createZaiClient', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should throw error if API key is missing', () => {
      expect(() => createZaiClient({ apiKey: '' })).toThrow(ZaiConfigError);
    });

    it('should create client with valid config', () => {
      const client = createZaiClient({
        apiKey: 'test-key',
        baseUrl: 'https://test.api',
        timeout: 5000,
        maxRetries: 2,
        retryDelay: 100,
      });
      expect(client).toBeDefined();
      expect(client.generateImage).toBeTypeOf('function');
      expect(client.generateImageAsync).toBeTypeOf('function');
      expect(client.getAsyncResult).toBeTypeOf('function');
    });
  });

  describe('generateImage', () => {
    it('should successfully generate an image', async () => {
      const mockResponse = {
        created: 1760335349,
        data: [{ url: 'https://example.com/image.png' }],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const client = createZaiClient({ apiKey: 'test-key' });
      const result = await client.generateImage({
        model: 'glm-image',
        prompt: 'A cute kitten',
        size: '1280x1280',
      });

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.z.ai/api/paas/v4/images/generations',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-key',
          }),
        })
      );
    });

    it('should throw ZaiAuthenticationError on 401', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ message: 'Invalid API key' }),
      });

      const client = createZaiClient({ apiKey: 'test-key', maxRetries: 0 });

      await expect(
        client.generateImage({ model: 'glm-image', prompt: 'test' })
      ).rejects.toThrow(ZaiAuthenticationError);
    });

    it('should throw ZaiRateLimitError on 429', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: async () => ({ message: 'Rate limit exceeded' }),
      });

      const client = createZaiClient({ apiKey: 'test-key', maxRetries: 0 });

      await expect(
        client.generateImage({ model: 'glm-image', prompt: 'test' })
      ).rejects.toThrow(ZaiRateLimitError);
    });

    it('should throw ZaiValidationError on 400', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ message: 'Invalid parameter' }),
      });

      const client = createZaiClient({ apiKey: 'test-key', maxRetries: 0 });

      await expect(
        client.generateImage({ model: 'glm-image', prompt: 'test' })
      ).rejects.toThrow(ZaiValidationError);
    });

    it('should throw ZaiServerError on 500', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ message: 'Server error' }),
      });

      const client = createZaiClient({ apiKey: 'test-key', maxRetries: 0 });

      await expect(
        client.generateImage({ model: 'glm-image', prompt: 'test' })
      ).rejects.toThrow(ZaiServerError);
    });

    it('should retry on server error', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: async () => ({ message: 'Server error' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ created: 123, data: [{ url: 'test' }] }),
        });

      const client = createZaiClient({
        apiKey: 'test-key',
        maxRetries: 1,
        retryDelay: 10,
      });

      const result = await client.generateImage({
        model: 'glm-image',
        prompt: 'test',
      });

      expect(result).toEqual({ created: 123, data: [{ url: 'test' }] });
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('generateImageAsync', () => {
    it('should start async image generation', async () => {
      const mockResponse = {
        model: 'glm-image',
        id: 'task-123',
        request_id: 'req-456',
        task_status: 'PROCESSING',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const client = createZaiClient({ apiKey: 'test-key' });
      const result = await client.generateImageAsync({
        model: 'glm-image',
        prompt: 'A sunset',
      });

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.z.ai/api/paas/v4/async/images/generations',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });

  describe('getAsyncResult', () => {
    it('should retrieve async result', async () => {
      const mockResponse = {
        model: 'glm-image',
        task_status: 'SUCCESS',
        image_result: [{ url: 'https://example.com/image.png' }],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const client = createZaiClient({ apiKey: 'test-key' });
      const result = await client.getAsyncResult('task-123');

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.z.ai/api/paas/v4/async-result/task-123',
        expect.objectContaining({
          method: 'GET',
        })
      );
    });
  });

  describe('timeout handling', () => {
    it('should throw ZaiTimeoutError on abort', async () => {
      const controller = new AbortController();

      mockFetch.mockImplementation(async (url: string, options: { signal?: AbortSignal }) => {
        // Simulate abort
        setTimeout(() => options?.signal?.dispatchEvent?.(new Event('abort')), 10);
        await new Promise((_, reject) => {
          options?.signal?.addEventListener('abort', () => {
            const error = new Error('Aborted');
            error.name = 'AbortError';
            reject(error);
          });
        });
      });

      const client = createZaiClient({ apiKey: 'test-key', maxRetries: 0, timeout: 5 });

      await expect(
        client.generateImage({ model: 'glm-image', prompt: 'test' })
      ).rejects.toThrow();
    });
  });
});
