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
  validateVideoPrompt,
  validateVideoResolution,
  validateVideoDuration,
  validateVideoAspectRatio,
  validateMovementAmplitude,
  validateVideoStyle,
  validateVideoImageUrl,
  validateVideoFps,
  validateVideoQuality,
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

// ============================================
// Video Validation Tests
// ============================================

describe('validateVideoPrompt', () => {
  it('should accept valid video prompts', () => {
    expect(() => validateVideoPrompt('A cat playing with a ball', 'cogvideox-3')).not.toThrow();
    expect(() => validateVideoPrompt('a'.repeat(512), 'viduq1-text')).not.toThrow();
  });

  it('should reject empty video prompts', () => {
    expect(() => validateVideoPrompt('', 'cogvideox-3')).toThrow(ZaiValidationError);
    expect(() => validateVideoPrompt('   ', 'viduq1-text')).toThrow(ZaiValidationError);
  });

  it('should reject prompts exceeding max length', () => {
    expect(() => validateVideoPrompt('a'.repeat(513), 'cogvideox-3')).toThrow(ZaiValidationError);
    expect(() => validateVideoPrompt('a'.repeat(513), 'vidu2-image')).toThrow(ZaiValidationError);
  });
});

describe('validateVideoResolution', () => {
  it('should accept valid resolutions for CogVideoX-3', () => {
    expect(() => validateVideoResolution('1920x1080', 'cogvideox-3')).not.toThrow();
    expect(() => validateVideoResolution('1280x720', 'cogvideox-3')).not.toThrow();
    expect(() => validateVideoResolution('3840x2160', 'cogvideox-3')).not.toThrow();
  });

  it('should accept valid resolutions for Vidu Q1', () => {
    expect(() => validateVideoResolution('1920x1080', 'viduq1-text')).not.toThrow();
    expect(() => validateVideoResolution('1920x1080', 'viduq1-image')).not.toThrow();
  });

  it('should accept valid resolutions for Vidu 2', () => {
    expect(() => validateVideoResolution('1280x720', 'vidu2-image')).not.toThrow();
    expect(() => validateVideoResolution('1280x720', 'vidu2-reference')).not.toThrow();
  });

  it('should reject invalid resolutions', () => {
    expect(() => validateVideoResolution('999x999', 'cogvideox-3')).toThrow(ZaiValidationError);
    expect(() => validateVideoResolution('720p', 'vidu2-image')).toThrow(ZaiValidationError);
  });
});

describe('validateVideoDuration', () => {
  it('should accept valid durations for CogVideoX-3', () => {
    expect(() => validateVideoDuration(5, 'cogvideox-3')).not.toThrow();
    expect(() => validateVideoDuration(10, 'cogvideox-3')).not.toThrow();
  });

  it('should accept valid durations for Vidu Q1', () => {
    expect(() => validateVideoDuration(5, 'viduq1-text')).not.toThrow();
    expect(() => validateVideoDuration(5, 'viduq1-image')).not.toThrow();
  });

  it('should accept valid durations for Vidu 2', () => {
    expect(() => validateVideoDuration(4, 'vidu2-image')).not.toThrow();
    expect(() => validateVideoDuration(4, 'vidu2-start-end')).not.toThrow();
  });

  it('should reject invalid durations', () => {
    expect(() => validateVideoDuration(15, 'cogvideox-3')).toThrow(ZaiValidationError);
    expect(() => validateVideoDuration(4, 'viduq1-text')).toThrow(ZaiValidationError);
    expect(() => validateVideoDuration(5, 'vidu2-image')).toThrow(ZaiValidationError);
  });
});

describe('validateVideoAspectRatio', () => {
  it('should accept valid aspect ratios for Vidu Q1 text', () => {
    expect(() => validateVideoAspectRatio('16:9', 'viduq1-text')).not.toThrow();
    expect(() => validateVideoAspectRatio('9:16', 'viduq1-text')).not.toThrow();
    expect(() => validateVideoAspectRatio('1:1', 'viduq1-text')).not.toThrow();
  });

  it('should reject invalid aspect ratios', () => {
    expect(() => validateVideoAspectRatio('4:3', 'viduq1-text')).toThrow(ZaiValidationError);
    expect(() => validateVideoAspectRatio('21:9', 'viduq1-text')).toThrow(ZaiValidationError);
  });

  it('should reject aspect ratio for models that do not support it', () => {
    expect(() => validateVideoAspectRatio('16:9', 'cogvideox-3')).toThrow(ZaiValidationError);
    expect(() => validateVideoAspectRatio('16:9', 'viduq1-image')).toThrow(ZaiValidationError);
  });
});

describe('validateMovementAmplitude', () => {
  it('should accept valid movement amplitudes', () => {
    expect(() => validateMovementAmplitude('auto')).not.toThrow();
    expect(() => validateMovementAmplitude('small')).not.toThrow();
    expect(() => validateMovementAmplitude('medium')).not.toThrow();
    expect(() => validateMovementAmplitude('large')).not.toThrow();
  });

  it('should reject invalid movement amplitudes', () => {
    expect(() => validateMovementAmplitude('tiny')).toThrow(ZaiValidationError);
    expect(() => validateMovementAmplitude('huge')).toThrow(ZaiValidationError);
    expect(() => validateMovementAmplitude('fast')).toThrow(ZaiValidationError);
  });
});

describe('validateVideoStyle', () => {
  it('should accept valid styles', () => {
    expect(() => validateVideoStyle('general')).not.toThrow();
    expect(() => validateVideoStyle('anime')).not.toThrow();
  });

  it('should reject invalid styles', () => {
    expect(() => validateVideoStyle('realistic')).toThrow(ZaiValidationError);
    expect(() => validateVideoStyle('cartoon')).toThrow(ZaiValidationError);
  });
});

describe('validateVideoImageUrl', () => {
  describe('CogVideoX-3', () => {
    it('should accept single image URL', () => {
      expect(() => validateVideoImageUrl('https://example.com/image.jpg', 'cogvideox-3')).not.toThrow();
    });

    it('should accept array of 1-2 image URLs', () => {
      expect(() => validateVideoImageUrl(['https://example.com/img1.jpg'], 'cogvideox-3')).not.toThrow();
      expect(() => validateVideoImageUrl(['https://example.com/img1.jpg', 'https://example.com/img2.jpg'], 'cogvideox-3')).not.toThrow();
    });

    it('should reject more than 2 images', () => {
      expect(() => validateVideoImageUrl(['img1.jpg', 'img2.jpg', 'img3.jpg'], 'cogvideox-3')).toThrow(ZaiValidationError);
    });
  });

  describe('Vidu Q1 image', () => {
    it('should accept single image URL', () => {
      expect(() => validateVideoImageUrl('https://example.com/image.jpg', 'viduq1-image')).not.toThrow();
    });

    it('should reject array of URLs', () => {
      expect(() => validateVideoImageUrl(['https://example.com/img1.jpg'], 'viduq1-image')).toThrow(ZaiValidationError);
    });
  });

  describe('Vidu start-end frame', () => {
    it('should accept exactly 2 images', () => {
      expect(() => validateVideoImageUrl(['https://example.com/img1.jpg', 'https://example.com/img2.jpg'], 'viduq1-start-end')).not.toThrow();
      expect(() => validateVideoImageUrl(['https://example.com/img1.jpg', 'https://example.com/img2.jpg'], 'vidu2-start-end')).not.toThrow();
    });

    it('should reject single image', () => {
      expect(() => validateVideoImageUrl('https://example.com/image.jpg', 'viduq1-start-end')).toThrow(ZaiValidationError);
    });

    it('should reject wrong number of images', () => {
      expect(() => validateVideoImageUrl(['img1.jpg'], 'viduq1-start-end')).toThrow(ZaiValidationError);
      expect(() => validateVideoImageUrl(['img1.jpg', 'img2.jpg', 'img3.jpg'], 'vidu2-start-end')).toThrow(ZaiValidationError);
    });
  });

  describe('Vidu 2 reference', () => {
    it('should accept 1-3 reference images', () => {
      expect(() => validateVideoImageUrl(['https://example.com/img1.jpg'], 'vidu2-reference')).not.toThrow();
      expect(() => validateVideoImageUrl(['img1.jpg', 'img2.jpg'], 'vidu2-reference')).not.toThrow();
      expect(() => validateVideoImageUrl(['img1.jpg', 'img2.jpg', 'img3.jpg'], 'vidu2-reference')).not.toThrow();
    });

    it('should reject more than 3 images', () => {
      expect(() => validateVideoImageUrl(['img1.jpg', 'img2.jpg', 'img3.jpg', 'img4.jpg'], 'vidu2-reference')).toThrow(ZaiValidationError);
    });

    it('should reject single URL string', () => {
      expect(() => validateVideoImageUrl('https://example.com/image.jpg', 'vidu2-reference')).toThrow(ZaiValidationError);
    });
  });

  describe('Text-to-video models', () => {
    it('should reject image URLs for text-only models', () => {
      expect(() => validateVideoImageUrl('https://example.com/image.jpg', 'viduq1-text')).toThrow(ZaiValidationError);
    });
  });
});

describe('validateVideoFps', () => {
  it('should accept valid FPS values', () => {
    expect(() => validateVideoFps(30)).not.toThrow();
    expect(() => validateVideoFps(60)).not.toThrow();
  });

  it('should reject invalid FPS values', () => {
    expect(() => validateVideoFps(24)).toThrow(ZaiValidationError);
    expect(() => validateVideoFps(25)).toThrow(ZaiValidationError);
    expect(() => validateVideoFps(120)).toThrow(ZaiValidationError);
  });
});

describe('validateVideoQuality', () => {
  it('should accept valid quality values', () => {
    expect(() => validateVideoQuality('quality')).not.toThrow();
    expect(() => validateVideoQuality('speed')).not.toThrow();
  });

  it('should reject invalid quality values', () => {
    expect(() => validateVideoQuality('hd')).toThrow(ZaiValidationError);
    expect(() => validateVideoQuality('standard')).toThrow(ZaiValidationError);
    expect(() => validateVideoQuality('fast')).toThrow(ZaiValidationError);
  });
});
