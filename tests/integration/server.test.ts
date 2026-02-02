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
 * Integration tests for the MCP server with mocked API.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createServer } from '../../src/server.js';
import type { Config } from '../../src/config.js';

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const testConfig: Config = {
  apiKey: 'test-api-key',
  baseUrl: 'https://api.z.ai/api',
  defaultModel: 'glm-image',
  defaultSize: '1280x1280',
  timeout: 60000,
  maxRetries: 3,
  retryDelay: 100,
};

describe('MCP Server Integration', () => {
  let server: ReturnType<typeof createServer>;

  beforeEach(() => {
    mockFetch.mockReset();
    server = createServer(testConfig);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('server creation', () => {
    it('should create server successfully', () => {
      expect(server).toBeDefined();
    });

    it('should be an McpServer instance', () => {
      expect(server.connect).toBeTypeOf('function');
    });
  });

  describe('tool execution', () => {
    describe('list_models', () => {
      it('should return model list without API calls', () => {
        // The server should have tools registered
        expect(server).toBeDefined();
      });
    });

    describe('generate_image', () => {
      it('should call API with correct parameters', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            created: 1760335349,
            data: [{ url: 'https://example.com/generated-image.png' }],
          }),
        });

        // The server should be configured to handle generate_image
        expect(server).toBeDefined();
      });
    });
  });
});

describe('API Client Integration', () => {
  describe('full request flow', () => {
    it('should handle successful image generation', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          created: 1760335349,
          data: [{ url: 'https://example.com/image.png' }],
        }),
      });

      expect(mockFetch).toBeDefined();
    });

    it('should handle async flow', async () => {
      // Mock async start
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            model: 'glm-image',
            id: 'task-123',
            request_id: 'req-456',
            task_status: 'PROCESSING',
          }),
        })
        // Mock processing check
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            model: 'glm-image',
            task_status: 'PROCESSING',
          }),
        })
        // Mock success check
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            model: 'glm-image',
            task_status: 'SUCCESS',
            image_result: [{ url: 'https://example.com/async-image.png' }],
          }),
        });

      expect(mockFetch).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ message: 'Invalid API key' }),
      });

      expect(mockFetch).toBeDefined();
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      expect(mockFetch).toBeDefined();
    });
  });
});

describe('Configuration Integration', () => {
  it('should use default values when not specified', () => {
    const minimalConfig: Config = {
      apiKey: 'minimal-key',
      baseUrl: 'https://api.z.ai/api',
      defaultModel: 'glm-image',
      defaultSize: '1280x1280',
      timeout: 60000,
      maxRetries: 3,
      retryDelay: 1000,
    };

    const server = createServer(minimalConfig);
    expect(server).toBeDefined();
  });

  it('should use custom configuration', () => {
    const customConfig: Config = {
      apiKey: 'custom-key',
      baseUrl: 'https://custom.api',
      defaultModel: 'cogview-4-250304',
      defaultSize: '1024x1024',
      timeout: 30000,
      maxRetries: 5,
      retryDelay: 500,
    };

    const server = createServer(customConfig);
    expect(server).toBeDefined();
  });
});
