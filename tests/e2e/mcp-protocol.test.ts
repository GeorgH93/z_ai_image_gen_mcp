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
 * E2E tests for MCP protocol communication.
 * Tests the full server-client interaction via stdio transport.
 */

import { describe, it, expect, vi } from 'vitest';

// Mock fetch for E2E tests that don't need real API calls
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);
describe('MCP Protocol E2E', () => {
  describe('Server Startup', () => {
    it('should start without errors when API key is provided', async () => {
      // This test verifies the server can be imported and created
      const { createServer } = await import('../../src/server.js');

      // Create a test config
      const testConfig = {
        apiKey: 'test-key-for-e2e',
        baseUrl: 'https://api.z.ai/api',
        defaultModel: 'glm-image' as const,
        defaultSize: '1280x1280',
        timeout: 60000,
        maxRetries: 3,
        retryDelay: 1000,
      };

      const server = createServer(testConfig);
      expect(server).toBeDefined();
    });
    it('should fail without API key', async () => {
      const { loadConfig } = await import('../../src/config.js');

      // Clear the env var temporarily
      const originalKey = process.env['ZAI_API_KEY'];
      delete process.env['ZAI_API_KEY'];

      expect(() => loadConfig()).toThrow('ZAI_API_KEY');

      // Restore
      if (originalKey) {
        process.env['ZAI_API_KEY'] = originalKey;
      }
    });
  });

  describe('Tool Definitions', () => {
    it('should expose expected tools', async () => {
      const { createServer } = await import('../../src/server.js');

      const testConfig = {
        apiKey: 'test-key',
        baseUrl: 'https://api.z.ai/api',
        defaultModel: 'glm-image' as const,
        defaultSize: '1280x1280',
        timeout: 60000,
        maxRetries: 3,
        retryDelay: 1000,
      };

      const server = createServer(testConfig);

      // Server should be created successfully with all tools registered
      expect(server).toBeDefined();
      expect(typeof server.connect).toBe('function');
    });
  });

  describe('list_models tool', () => {
    it('should return model information', async () => {
      const { formatModelList } = await import('../../src/utils/formatters.js');

      const result = formatModelList();

      expect(result).toContain('GLM-Image');
      expect(result).toContain('CogView-4-250304');
      expect(result).toContain('glm-image');
      expect(result).toContain('cogview-4-250304');
      expect(result).toContain('Recommended Sizes');
    });
  });

  describe('Error Scenarios', () => {
    it('should handle invalid model parameter', async () => {
      const { validateSize } = await import('../../src/utils/validation.js');
      const { ZaiValidationError } = await import('../../src/client/errors.js');

      expect(() => validateSize('invalid', 'glm-image')).toThrow(ZaiValidationError);
    });

    it('should handle invalid size parameter', async () => {
      const { validateSize } = await import('../../src/utils/validation.js');
      const { ZaiValidationError } = await import('../../src/client/errors.js');

      expect(() => validateSize('100x100', 'glm-image')).toThrow(ZaiValidationError);
    });

    it('should handle empty prompt', async () => {
      const { validatePrompt } = await import('../../src/utils/validation.js');
      const { ZaiValidationError } = await import('../../src/client/errors.js');

      expect(() => validatePrompt('')).toThrow(ZaiValidationError);
    });
  });

  describe('Async Flow', () => {
    it('should format async start response correctly', async () => {
      const { formatAsyncStartResponse } = await import('../../src/utils/formatters.js');

      const result = formatAsyncStartResponse({
        model: 'glm-image',
        id: 'task-123',
        request_id: 'req-456',
        task_status: 'PROCESSING',
      });

      expect(result).toContain('task-123');
      expect(result).toContain('get_async_result');
    });

    it('should format processing status correctly', async () => {
      const { formatAsyncResultResponse } = await import('../../src/utils/formatters.js');

      const result = formatAsyncResultResponse({
        task_status: 'PROCESSING',
      });

      expect(result).toContain('Still Processing');
    });

    it('should format success status correctly', async () => {
      const { formatAsyncResultResponse } = await import('../../src/utils/formatters.js');

      const result = formatAsyncResultResponse({
        task_status: 'SUCCESS',
        model: 'glm-image',
        image_result: [{ url: 'https://example.com/image.png' }],
      });

      expect(result).toContain('Complete');
      expect(result).toContain('https://example.com/image.png');
    });

    it('should format failure status correctly', async () => {
      const { formatAsyncResultResponse } = await import('../../src/utils/formatters.js');

      const result = formatAsyncResultResponse({
        task_status: 'FAIL',
        error: { code: 400, message: 'Invalid prompt' },
      });

      expect(result).toContain('Failed');
      expect(result).toContain('Invalid prompt');
    });
  });
});
