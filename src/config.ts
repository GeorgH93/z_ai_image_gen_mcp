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
 * Configuration management for the Z.AI Image MCP Server.
 * Loads configuration from environment variables with sensible defaults.
 */

// Load .env file if present (for development only)
// dotenv is optional - only needed when using .env files
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('dotenv').config();
} catch {
  // dotenv not available, skip .env loading (production)
}

export interface Config {
  /** Z.AI API key (required) */
  apiKey: string;
  /** API base URL */
  baseUrl: string;
  /** Default model to use */
  defaultModel: SupportedModel;
  /** Default image size */
  defaultSize: string;
  /** Request timeout in milliseconds */
  timeout: number;
  /** Maximum retry attempts */
  maxRetries: number;
  /** Initial retry delay in milliseconds */
  retryDelay: number;
}

/**
 * Validates that a model name is supported.
 */
export const SUPPORTED_MODELS = ['glm-image', 'cogview-4-250304'] as const;
export type SupportedModel = typeof SUPPORTED_MODELS[number];

export function isSupportedModel(model: string): model is SupportedModel {
  return SUPPORTED_MODELS.includes(model as SupportedModel);
}

/**
 * Validate that a size string has the correct WIDTHxHEIGHT format
 * without importing from validation.ts (which would create a circular dep).
 */
function isValidSizeFormat(size: string): boolean {
  const parts = size.toLowerCase().split('x');
  if (parts.length !== 2) return false;
  const width = parseInt(parts[0] ?? '', 10);
  const height = parseInt(parts[1] ?? '', 10);
  return !isNaN(width) && !isNaN(height) && width > 0 && height > 0;
}

/**
 * Load configuration from environment variables.
 * @throws Error if required configuration is missing or invalid
 */
export function loadConfig(): Config {
  const apiKey = process.env['ZAI_API_KEY'];
  if (!apiKey) {
    throw new Error(
      'ZAI_API_KEY environment variable is required. ' +
      'Get your API key from: https://z.ai/manage-apikey/apikey-list'
    );
  }

  const defaultModel = process.env['ZAI_DEFAULT_MODEL'] ?? 'glm-image';
  if (!isSupportedModel(defaultModel)) {
    throw new Error(
      `Invalid ZAI_DEFAULT_MODEL: "${defaultModel}". Supported models: ${SUPPORTED_MODELS.join(', ')}`
    );
  }

  const defaultSize = process.env['ZAI_DEFAULT_SIZE'] ?? '1280x1280';
  if (!isValidSizeFormat(defaultSize)) {
    throw new Error(
      `Invalid ZAI_DEFAULT_SIZE: "${defaultSize}". Expected format: "WIDTHxHEIGHT" (e.g., "1280x1280")`
    );
  }

  return {
    apiKey,
    baseUrl: process.env['ZAI_API_BASE_URL'] ?? 'https://api.z.ai/api',
    defaultModel,
    defaultSize,
    timeout: parseInt(process.env['ZAI_REQUEST_TIMEOUT'] ?? '60000', 10),
    maxRetries: parseInt(process.env['ZAI_MAX_RETRIES'] ?? '3', 10),
    retryDelay: parseInt(process.env['ZAI_RETRY_DELAY'] ?? '1000', 10),
  };
}

/**
 * Model capabilities and constraints.
 */
export const MODEL_CONFIGS: Record<SupportedModel, {
  displayName: string;
  description: string;
  supportsAsync: boolean;
  minSize: number;
  maxSize: number;
  sizeDivisor: number;
  maxPixels: number;
  recommendedSizes: string[];
  defaultQuality: 'hd' | 'standard';
  supportedQualities: ('hd' | 'standard')[];
}> = {
  'glm-image': {
    displayName: 'GLM-Image',
    description: 'Z.AI flagship image generation model with hybrid autoregressive + diffusion architecture. Best for complex compositions, text rendering, and detailed illustrations.',
    supportsAsync: true,
    minSize: 1024,
    maxSize: 2048,
    sizeDivisor: 32,
    maxPixels: Math.pow(2, 22), // 4,194,304
    recommendedSizes: [
      '1280x1280',
      '1568x1056',
      '1056x1568',
      '1472x1088',
      '1088x1472',
      '1728x960',
      '960x1728',
    ],
    defaultQuality: 'hd',
    supportedQualities: ['hd', 'standard'],
  },
  'cogview-4-250304': {
    displayName: 'CogView-4-250304',
    description: 'General purpose image generation model with fast and accurate understanding of text descriptions.',
    supportsAsync: false,
    minSize: 512,
    maxSize: 2048,
    sizeDivisor: 16,
    maxPixels: Math.pow(2, 21), // 2,097,152
    recommendedSizes: [
      '1024x1024',
      '768x1344',
      '864x1152',
      '1344x768',
      '1152x864',
      '1440x720',
      '720x1440',
    ],
    defaultQuality: 'standard',
    supportedQualities: ['hd', 'standard'],
  },
};

// ============================================
// Video Model Configuration
// ============================================

/**
 * Video generation model codes.
 */
export const VIDEO_SUPPORTED_MODELS = [
  'cogvideox-3',
  'viduq1-text',
  'viduq1-image',
  'viduq1-start-end',
  'vidu2-image',
  'vidu2-start-end',
  'vidu2-reference',
] as const;
export type VideoSupportedModel = typeof VIDEO_SUPPORTED_MODELS[number];

/**
 * Video model categories for easier selection.
 */
export const VIDEO_MODEL_CATEGORIES = {
  textToVideo: ['viduq1-text'] as const,
  imageToVideo: ['cogvideox-3', 'viduq1-image', 'vidu2-image'] as const,
  startEndFrame: ['cogvideox-3', 'viduq1-start-end', 'vidu2-start-end'] as const,
  reference: ['vidu2-reference'] as const,
};

export function isVideoSupportedModel(model: string): model is VideoSupportedModel {
  return VIDEO_SUPPORTED_MODELS.includes(model as VideoSupportedModel);
}

/**
 * Video model capabilities and constraints.
 */
export const VIDEO_MODEL_CONFIGS: Record<VideoSupportedModel, {
  displayName: string;
  description: string;
  category: 'text-to-video' | 'image-to-video' | 'start-end-frame' | 'reference';
  duration: number[];
  resolutions: string[];
  aspectRatios?: string[];
  supportsAudio: boolean;
  supportsFps: boolean;
  supportsStyle: boolean;
  supportsMovementAmplitude: boolean;
  maxPromptLength: number;
  priceUsd: number;
}> = {
  'cogvideox-3': {
    displayName: 'CogVideoX-3',
    description: 'Z.AI flagship video generation model with improved frame stability and clarity. Supports text-to-video, image-to-video, and start-end frame generation. Up to 4K resolution.',
    category: 'image-to-video', // Also supports text-to-video and start-end-frame
    duration: [5, 10],
    resolutions: ['1280x720', '720x1280', '1024x1024', '1920x1080', '1080x1920', '2048x1080', '3840x2160'],
    supportsAudio: true,
    supportsFps: true,
    supportsStyle: false,
    supportsMovementAmplitude: false,
    maxPromptLength: 512,
    priceUsd: 0.2,
  },
  'viduq1-text': {
    displayName: 'Vidu Q1 Text-to-Video',
    description: 'High-quality text-to-video model with 1080P output. Supports general and anime styles with smooth transitions.',
    category: 'text-to-video',
    duration: [5],
    resolutions: ['1920x1080'],
    aspectRatios: ['16:9', '9:16', '1:1'],
    supportsAudio: false,
    supportsFps: false,
    supportsStyle: true,
    supportsMovementAmplitude: true,
    maxPromptLength: 512,
    priceUsd: 0.4,
  },
  'viduq1-image': {
    displayName: 'Vidu Q1 Image-to-Video',
    description: 'High-quality image-to-video model with 1080P output. Exceptional clarity and smooth frame transitions.',
    category: 'image-to-video',
    duration: [5],
    resolutions: ['1920x1080'],
    supportsAudio: false,
    supportsFps: false,
    supportsStyle: false,
    supportsMovementAmplitude: true,
    maxPromptLength: 512,
    priceUsd: 0.4,
  },
  'viduq1-start-end': {
    displayName: 'Vidu Q1 Start-End Frame',
    description: 'Generate videos from start and end frame images with 1080P output. Industry-leading transition smoothness.',
    category: 'start-end-frame',
    duration: [5],
    resolutions: ['1920x1080'],
    supportsAudio: false,
    supportsFps: false,
    supportsStyle: false,
    supportsMovementAmplitude: true,
    maxPromptLength: 512,
    priceUsd: 0.4,
  },
  'vidu2-image': {
    displayName: 'Vidu 2 Image-to-Video',
    description: 'Fast and cost-effective image-to-video model with 720P output. Stable and controllable visuals ideal for e-commerce.',
    category: 'image-to-video',
    duration: [4],
    resolutions: ['1280x720'],
    supportsAudio: true,
    supportsFps: false,
    supportsStyle: false,
    supportsMovementAmplitude: true,
    maxPromptLength: 512,
    priceUsd: 0.2,
  },
  'vidu2-start-end': {
    displayName: 'Vidu 2 Start-End Frame',
    description: 'Cost-effective start-end frame generation with 720P output. Enhanced semantic understanding between keyframes.',
    category: 'start-end-frame',
    duration: [4],
    resolutions: ['1280x720'],
    supportsAudio: true,
    supportsFps: false,
    supportsStyle: false,
    supportsMovementAmplitude: true,
    maxPromptLength: 512,
    priceUsd: 0.2,
  },
  'vidu2-reference': {
    displayName: 'Vidu 2 Reference',
    description: 'Generate videos using 1-3 reference images with 720P output. Enhanced consistency with multiple reference images.',
    category: 'reference',
    duration: [4],
    resolutions: ['1280x720'],
    aspectRatios: ['16:9', '9:16', '1:1'],
    supportsAudio: true,
    supportsFps: false,
    supportsStyle: false,
    supportsMovementAmplitude: true,
    maxPromptLength: 512,
    priceUsd: 0.4,
  },
};
