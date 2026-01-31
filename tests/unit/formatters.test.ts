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
 * Unit tests for response formatters.
 */

import { describe, it, expect } from 'vitest';
import {
  formatImageResponse,
  formatAsyncStartResponse,
  formatAsyncResultResponse,
  formatModelList,
  formatError,
  createStructuredResult,
} from '../../src/utils/formatters.js';
import type {
  ImageGenerationResponse,
  AsyncResponse,
  AsyncImageGenerationResponse,
} from '../../src/client/types.js';
import { ZaiValidationError, ZaiRateLimitError } from '../../src/client/errors.js';

describe('formatImageResponse', () => {
  it('should format successful image response', () => {
    const response: ImageGenerationResponse = {
      created: 1760335349,
      data: [{ url: 'https://example.com/image.png' }],
    };

    const result = formatImageResponse(response, 'glm-image');

    expect(result).toContain('# Image Generated Successfully');
    expect(result).toContain('GLM-Image');
    expect(result).toContain('https://example.com/image.png');
    expect(result).toContain('2025');
  });

  it('should include content filter info when present', () => {
    const response: ImageGenerationResponse = {
      created: 1760335349,
      data: [{ url: 'https://example.com/image.png' }],
      content_filter: [
        { role: 'assistant', level: 1 },
        { role: 'user', level: 3 },
      ],
    };

    const result = formatImageResponse(response, 'glm-image');

    expect(result).toContain('Content Filter Info');
    expect(result).toContain('severity level 1');
    expect(result).toContain('severity level 3');
  });

  it('should warn about URL expiration', () => {
    const response: ImageGenerationResponse = {
      created: 1760335349,
      data: [{ url: 'https://example.com/image.png' }],
    };

    const result = formatImageResponse(response, 'glm-image');

    expect(result).toContain('expires after 30 days');
  });
});

describe('formatAsyncStartResponse', () => {
  it('should format async start response', () => {
    const response: AsyncResponse = {
      model: 'glm-image',
      id: 'task-123',
      request_id: 'req-456',
      task_status: 'PROCESSING',
    };

    const result = formatAsyncStartResponse(response);

    expect(result).toContain('# Async Image Generation Started');
    expect(result).toContain('task-123');
    expect(result).toContain('glm-image');
    expect(result).toContain('PROCESSING');
    expect(result).toContain('get_async_result');
  });
});

describe('formatAsyncResultResponse', () => {
  it('should format processing status', () => {
    const response: AsyncImageGenerationResponse = {
      task_status: 'PROCESSING',
      request_id: 'req-456',
    };

    const result = formatAsyncResultResponse(response);

    expect(result).toContain('# Task Still Processing');
    expect(result).toContain('PROCESSING');
  });

  it('should format success status with image', () => {
    const response: AsyncImageGenerationResponse = {
      task_status: 'SUCCESS',
      model: 'glm-image',
      image_result: [{ url: 'https://example.com/image.png' }],
    };

    const result = formatAsyncResultResponse(response);

    expect(result).toContain('# Image Generation Complete');
    expect(result).toContain('SUCCESS');
    expect(result).toContain('https://example.com/image.png');
  });

  it('should format failed status with error', () => {
    const response: AsyncImageGenerationResponse = {
      task_status: 'FAIL',
      error: {
        code: 400,
        message: 'Invalid prompt',
      },
    };

    const result = formatAsyncResultResponse(response);

    expect(result).toContain('# Image Generation Failed');
    expect(result).toContain('FAIL');
    expect(result).toContain('Invalid prompt');
  });
});

describe('formatModelList', () => {
  it('should list all available models', () => {
    const result = formatModelList();

    expect(result).toContain('# Available Image Generation Models');
    expect(result).toContain('GLM-Image');
    expect(result).toContain('CogView-4-250304');
    expect(result).toContain('glm-image');
    expect(result).toContain('cogview-4-250304');
  });

  it('should include model capabilities', () => {
    const result = formatModelList();

    expect(result).toContain('Supports Async');
    expect(result).toContain('Default Quality');
    expect(result).toContain('Size Range');
    expect(result).toContain('Recommended Sizes');
  });
});

describe('formatError', () => {
  it('should format standard Error objects', () => {
    const error = new Error('Something went wrong');
    const result = formatError(error);

    expect(result).toContain('# Error');
    expect(result).toContain('Error');
    expect(result).toContain('Something went wrong');
  });

  it('should format ZaiValidationError with details', () => {
    const error = new ZaiValidationError('Invalid size');
    const result = formatError(error);

    expect(result).toContain('# Error');
    expect(result).toContain('ZaiValidationError');
    expect(result).toContain('Invalid size');
  });

  it('should format ZaiRateLimitError', () => {
    const error = new ZaiRateLimitError('Too many requests', 60);
    const result = formatError(error);

    expect(result).toContain('# Error');
    expect(result).toContain('Too many requests');
  });

  it('should format non-Error objects', () => {
    const result = formatError('Simple error string');

    expect(result).toContain('# Error');
    expect(result).toContain('Simple error string');
  });
});

describe('createStructuredResult', () => {
  it('should create success result', () => {
    const result = createStructuredResult(true, { url: 'test.png' });

    expect(result).toEqual({
      success: true,
      data: { url: 'test.png' },
    });
  });

  it('should create error result', () => {
    const result = createStructuredResult(false, undefined, 'Something failed');

    expect(result).toEqual({
      success: false,
      error: 'Something failed',
    });
  });

  it('should create minimal success result', () => {
    const result = createStructuredResult(true);

    expect(result).toEqual({ success: true });
  });
});
