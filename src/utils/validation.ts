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
 * Validation utilities for Z.AI image generation parameters.
 */

import { MODEL_CONFIGS, type SupportedModel } from '../config.js';
import { ZaiValidationError } from '../client/errors.js';

/**
 * Parse a size string into width and height.
 */
export function parseSize(size: string): { width: number; height: number } | null {
  const parts = size.toLowerCase().split('x');
  if (parts.length !== 2) return null;

  const width = parseInt(parts[0] ?? '', 10);
  const height = parseInt(parts[1] ?? '', 10);

  if (isNaN(width) || isNaN(height)) return null;
  if (width <= 0 || height <= 0) return null;

  return { width, height };
}

/**
 * Validate image size for a specific model.
 * @throws ZaiValidationError if size is invalid
 */
export function validateSize(size: string, model: SupportedModel): void {
  const dimensions = parseSize(size);
  if (!dimensions) {
    throw new ZaiValidationError(
      `Invalid size format: "${size}". Expected format: "WIDTHxHEIGHT" (e.g., "1280x1280")`
    );
  }

  const config = MODEL_CONFIGS[model];
  const { width, height } = dimensions;

  // Check minimum size
  if (width < config.minSize || height < config.minSize) {
    throw new ZaiValidationError(
      `Size ${size} is too small for ${model}. ` +
      `Both dimensions must be at least ${config.minSize}px.`
    );
  }

  // Check maximum size
  if (width > config.maxSize || height > config.maxSize) {
    throw new ZaiValidationError(
      `Size ${size} is too large for ${model}. ` +
      `Both dimensions must be at most ${config.maxSize}px.`
    );
  }

  // Check divisibility
  if (width % config.sizeDivisor !== 0 || height % config.sizeDivisor !== 0) {
    throw new ZaiValidationError(
      `Size ${size} is invalid for ${model}. ` +
      `Both dimensions must be divisible by ${config.sizeDivisor}.`
    );
  }

  // Check total pixels
  const totalPixels = width * height;
  if (totalPixels > config.maxPixels) {
    throw new ZaiValidationError(
      `Size ${size} exceeds maximum pixel count for ${model}. ` +
      `Maximum is ${config.maxPixels.toLocaleString()} pixels.`
    );
  }
}

/**
 * Validate quality parameter for a specific model.
 * @throws ZaiValidationError if quality is invalid
 */
export function validateQuality(
  quality: string,
  model: SupportedModel
): void {
  const config = MODEL_CONFIGS[model];
  if (!config.supportedQualities.includes(quality as 'hd' | 'standard')) {
    throw new ZaiValidationError(
      `Invalid quality "${quality}" for ${model}. ` +
      `Supported values: ${config.supportedQualities.join(', ')}`
    );
  }
}

/**
 * Validate user_id parameter.
 * @throws ZaiValidationError if user_id is invalid
 */
export function validateUserId(userId: string): void {
  if (userId.length < 6 || userId.length > 128) {
    throw new ZaiValidationError(
      `user_id must be between 6 and 128 characters. Got ${userId.length} characters.`
    );
  }
}

/**
 * Validate prompt parameter.
 * @throws ZaiValidationError if prompt is invalid
 */
export function validatePrompt(prompt: string): void {
  if (!prompt || prompt.trim().length === 0) {
    throw new ZaiValidationError('Prompt cannot be empty.');
  }
  if (prompt.length > 4000) {
    throw new ZaiValidationError(
      `Prompt is too long. Maximum 4000 characters, got ${prompt.length}.`
    );
  }
}

/**
 * Get recommended sizes for a model.
 */
export function getRecommendedSizes(model: SupportedModel): string[] {
  return MODEL_CONFIGS[model].recommendedSizes;
}

/**
 * Check if a size is a recommended size for a model.
 */
export function isRecommendedSize(size: string, model: SupportedModel): boolean {
  return MODEL_CONFIGS[model].recommendedSizes.includes(size);
}

/**
 * Format size validation error with suggestions.
 */
export function formatSizeError(size: string, model: SupportedModel): string {
  const recommended = getRecommendedSizes(model);
  return (
    `Invalid size "${size}" for model "${model}". ` +
    `Recommended sizes: ${recommended.join(', ')}. ` +
    `Custom sizes must have both dimensions between ` +
    `${MODEL_CONFIGS[model].minSize}-${MODEL_CONFIGS[model].maxSize}px, ` +
    `divisible by ${MODEL_CONFIGS[model].sizeDivisor}.`
  );
}
