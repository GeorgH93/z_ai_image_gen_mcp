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
 * Unit tests for validation utilities.
 */

import { describe, it, expect } from 'vitest';
import {
  parseSize,
  validateSize,
  validateQuality,
  validateUserId,
  validatePrompt,
  getRecommendedSizes,
  isRecommendedSize,
  formatSizeError,
} from '../../src/utils/validation.js';
import { ZaiValidationError } from '../../src/client/errors.js';

describe('parseSize', () => {
  it('should parse valid size strings', () => {
    expect(parseSize('1280x1280')).toEqual({ width: 1280, height: 1280 });
    expect(parseSize('1024x768')).toEqual({ width: 1024, height: 768 });
    expect(parseSize('1920X1080')).toEqual({ width: 1920, height: 1080 }); // Case insensitive
  });

  it('should return null for invalid size strings', () => {
    expect(parseSize('invalid')).toBeNull();
    expect(parseSize('1280')).toBeNull();
    expect(parseSize('1280x')).toBeNull();
    expect(parseSize('x1280')).toBeNull();
    expect(parseSize('1280x1280x1024')).toBeNull();
    expect(parseSize('0x1280')).toBeNull();
    expect(parseSize('-100x100')).toBeNull();
    expect(parseSize('abcxdef')).toBeNull();
  });
});

describe('validateSize', () => {
  describe('glm-image', () => {
    it('should accept valid recommended sizes', () => {
      expect(() => validateSize('1280x1280', 'glm-image')).not.toThrow();
      expect(() => validateSize('1568x1056', 'glm-image')).not.toThrow();
      expect(() => validateSize('1056x1568', 'glm-image')).not.toThrow();
    });

    it('should accept valid custom sizes', () => {
      expect(() => validateSize('1024x1024', 'glm-image')).not.toThrow();
      expect(() => validateSize('2048x2048', 'glm-image')).not.toThrow();
      expect(() => validateSize('1088x1472', 'glm-image')).not.toThrow();
    });

    it('should reject sizes below minimum', () => {
      expect(() => validateSize('512x512', 'glm-image')).toThrow(ZaiValidationError);
      expect(() => validateSize('1024x512', 'glm-image')).toThrow(ZaiValidationError);
    });

    it('should reject sizes above maximum', () => {
      expect(() => validateSize('2049x2049', 'glm-image')).toThrow(ZaiValidationError);
      expect(() => validateSize('4096x2048', 'glm-image')).toThrow(ZaiValidationError);
    });

    it('should reject sizes not divisible by 32', () => {
      expect(() => validateSize('1025x1025', 'glm-image')).toThrow(ZaiValidationError);
      expect(() => validateSize('1030x1030', 'glm-image')).toThrow(ZaiValidationError);
    });
  });

  describe('cogview-4-250304', () => {
    it('should accept valid recommended sizes', () => {
      expect(() => validateSize('1024x1024', 'cogview-4-250304')).not.toThrow();
      expect(() => validateSize('768x1344', 'cogview-4-250304')).not.toThrow();
    });

    it('should accept valid custom sizes', () => {
      expect(() => validateSize('512x512', 'cogview-4-250304')).not.toThrow();
      expect(() => validateSize('1024x1024', 'cogview-4-250304')).not.toThrow();
      expect(() => validateSize('1008x1008', 'cogview-4-250304')).not.toThrow();
    });

    it('should reject sizes not divisible by 16', () => {
      expect(() => validateSize('513x513', 'cogview-4-250304')).toThrow(ZaiValidationError);
      expect(() => validateSize('1000x1000', 'cogview-4-250304')).toThrow(ZaiValidationError);
    });

    it('should accept sizes divisible by 16', () => {
      expect(() => validateSize('512x512', 'cogview-4-250304')).not.toThrow();
      expect(() => validateSize('1008x1008', 'cogview-4-250304')).not.toThrow();
    });
  });
});

describe('validateQuality', () => {
  it('should accept valid quality values', () => {
    expect(() => validateQuality('hd', 'glm-image')).not.toThrow();
    expect(() => validateQuality('standard', 'glm-image')).not.toThrow();
    expect(() => validateQuality('hd', 'cogview-4-250304')).not.toThrow();
    expect(() => validateQuality('standard', 'cogview-4-250304')).not.toThrow();
  });

  it('should reject invalid quality values', () => {
    expect(() => validateQuality('ultra', 'glm-image')).toThrow(ZaiValidationError);
    expect(() => validateQuality('fast', 'glm-image')).toThrow(ZaiValidationError);
  });
});

describe('validateUserId', () => {
  it('should accept valid user IDs', () => {
    expect(() => validateUserId('123456')).not.toThrow();
    expect(() => validateUserId('user-12345')).not.toThrow();
    expect(() => validateUserId('a'.repeat(128))).not.toThrow();
  });

  it('should reject user IDs that are too short', () => {
    expect(() => validateUserId('12345')).toThrow(ZaiValidationError);
    expect(() => validateUserId('abcde')).toThrow(ZaiValidationError);
  });

  it('should reject user IDs that are too long', () => {
    expect(() => validateUserId('a'.repeat(129))).toThrow(ZaiValidationError);
  });
});

describe('validatePrompt', () => {
  it('should accept valid prompts', () => {
    expect(() => validatePrompt('A cute kitten')).not.toThrow();
    expect(() => validatePrompt('A sunset over the ocean with waves')).not.toThrow();
    expect(() => validatePrompt('a'.repeat(4000))).not.toThrow();
  });

  it('should reject empty prompts', () => {
    expect(() => validatePrompt('')).toThrow(ZaiValidationError);
    expect(() => validatePrompt('   ')).toThrow(ZaiValidationError);
  });

  it('should reject prompts that are too long', () => {
    expect(() => validatePrompt('a'.repeat(4001))).toThrow(ZaiValidationError);
  });
});

describe('getRecommendedSizes', () => {
  it('should return recommended sizes for glm-image', () => {
    const sizes = getRecommendedSizes('glm-image');
    expect(sizes).toContain('1280x1280');
    expect(sizes).toContain('1568x1056');
    expect(sizes.length).toBeGreaterThan(0);
  });

  it('should return recommended sizes for cogview-4-250304', () => {
    const sizes = getRecommendedSizes('cogview-4-250304');
    expect(sizes).toContain('1024x1024');
    expect(sizes.length).toBeGreaterThan(0);
  });
});

describe('isRecommendedSize', () => {
  it('should return true for recommended sizes', () => {
    expect(isRecommendedSize('1280x1280', 'glm-image')).toBe(true);
    expect(isRecommendedSize('1024x1024', 'cogview-4-250304')).toBe(true);
  });

  it('should return false for non-recommended sizes', () => {
    expect(isRecommendedSize('999x999', 'glm-image')).toBe(false);
    expect(isRecommendedSize('512x512', 'cogview-4-250304')).toBe(false);
  });
});

describe('formatSizeError', () => {
  it('should include model name and recommendations', () => {
    const error = formatSizeError('999x999', 'glm-image');
    expect(error).toContain('glm-image');
    expect(error).toContain('1280x1280');
    expect(error).toContain('Recommended');
  });
});
