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
 * Response formatters for MCP tool outputs.
 */

import type {
  AsyncImageGenerationResponse,
  AsyncResponse,
  AsyncVideoGenerationResponse,
  ImageGenerationResponse,
  VideoResponse,
} from '../client/types.js';
import { MODEL_CONFIGS, VIDEO_MODEL_CONFIGS, type SupportedModel } from '../config.js';

/**
 * Format a synchronous image generation response for MCP output.
 */
export function formatImageResponse(
  response: ImageGenerationResponse,
  model: SupportedModel
): string {
  const lines: string[] = [];

  lines.push(`# Image Generated Successfully`);
  lines.push(``);
  lines.push(`**Model:** ${MODEL_CONFIGS[model].displayName}`);
  lines.push(`**Created:** ${new Date(response.created * 1000).toISOString()}`);

  if (response.data && response.data.length > 0) {
    const imageData = response.data[0];
    if (imageData) {
      lines.push(`**Image URL:** ${imageData.url}`);
      lines.push(``);
      lines.push(`> **Note:** The image URL expires after 30 days. Download and store the image promptly.`);
    }
  }

  if (response.content_filter && response.content_filter.length > 0) {
    lines.push(``);
    lines.push(`**Content Filter Info:**`);
    for (const filter of response.content_filter) {
      lines.push(`- ${filter.role}: severity level ${filter.level}`);
    }
  }

  return lines.join('\n');
}

/**
 * Format an async image generation response for MCP output.
 */
export function formatAsyncStartResponse(response: AsyncResponse): string {
  const lines: string[] = [];

  lines.push(`# Async Image Generation Started`);
  lines.push(``);
  lines.push(`**Task ID:** ${response.id}`);
  lines.push(`**Model:** ${response.model}`);
  lines.push(`**Status:** ${response.task_status}`);
  lines.push(`**Request ID:** ${response.request_id}`);
  lines.push(``);
  lines.push(`Use the \`get_async_result\` tool with task ID \`${response.id}\` to check the result.`);
  lines.push(``);
  lines.push(`> **Note:** Image generation typically takes 5-20 seconds depending on quality settings.`);

  return lines.join('\n');
}

/**
 * Format an async result response for MCP output.
 */
export function formatAsyncResultResponse(
  response: AsyncImageGenerationResponse
): string {
  const lines: string[] = [];

  const status = response.task_status;

  if (status === 'PROCESSING') {
    lines.push(`# Task Still Processing`);
    lines.push(``);
    lines.push(`The image generation task is still in progress.`);
    lines.push(`Please try again in a few seconds.`);
    lines.push(``);
    lines.push(`**Status:** ${status}`);
    if (response.request_id) {
      lines.push(`**Request ID:** ${response.request_id}`);
    }
  } else if (status === 'SUCCESS') {
    lines.push(`# Image Generation Complete`);
    lines.push(``);
    lines.push(`**Status:** ${status}`);
    if (response.model) {
      lines.push(`**Model:** ${response.model}`);
    }

    if (response.image_result && response.image_result.length > 0) {
      const imageData = response.image_result[0];
      if (imageData) {
        lines.push(`**Image URL:** ${imageData.url}`);
        lines.push(``);
        lines.push(`> **Note:** The image URL expires after 30 days. Download and store the image promptly.`);
      }
    }
  } else if (status === 'FAIL') {
    lines.push(`# Image Generation Failed`);
    lines.push(``);
    lines.push(`**Status:** ${status}`);
    if (response.error) {
      lines.push(`**Error Code:** ${response.error.code}`);
      lines.push(`**Error Message:** ${response.error.message}`);
    }
    lines.push(``);
    lines.push(`The image generation task failed. Please check your prompt and try again.`);
  }

  return lines.join('\n');
}

/**
 * Format model list for MCP output.
 */
export function formatModelList(): string {
  const lines: string[] = [];

  lines.push(`# Available Image Generation Models`);
  lines.push(``);

  for (const [modelId, config] of Object.entries(MODEL_CONFIGS)) {
    lines.push(`## ${config.displayName}`);
    lines.push(``);
    lines.push(`**Model ID:** \`${modelId}\``);
    lines.push(`**Description:** ${config.description}`);
    lines.push(`**Supports Async:** ${config.supportsAsync ? 'Yes' : 'No'}`);
    lines.push(`**Default Quality:** ${config.defaultQuality}`);
    lines.push(`**Supported Qualities:** ${config.supportedQualities.join(', ')}`);
    lines.push(`**Size Range:** ${config.minSize}-${config.maxSize}px (divisible by ${config.sizeDivisor})`);
    lines.push(`**Recommended Sizes:** ${config.recommendedSizes.join(', ')}`);
    lines.push(``);
  }

  return lines.join('\n');
}

/**
 * Format an error for MCP output.
 */
export function formatError(error: unknown): string {
  const lines: string[] = [];

  lines.push(`# Error`);
  lines.push(``);

  if (error instanceof Error) {
    lines.push(`**Type:** ${error.name}`);
    lines.push(`**Message:** ${error.message}`);
  } else {
    lines.push(`**Message:** ${String(error)}`);
  }

  return lines.join('\n');
}

/**
 * Format a download response for MCP output.
 */
export function formatDownloadResponse(
  filePath: string,
  outputType: 'file' | 'base64'
): string {
  const lines: string[] = [];

  if (outputType === 'file') {
    lines.push(`# Image Downloaded Successfully`);
    lines.push(``);
    lines.push(`**Saved to:** file://${filePath}`);
    lines.push(``);
    lines.push(`> The image has been saved to disk and can be accessed at the path above.`);
  } else {
    lines.push(`# Image Downloaded Successfully`);
    lines.push(``);
    lines.push(`The image has been returned as base64 data.`);
  }

  return lines.join('\n');
}

/**
 * Create a JSON-serializable result object for structured output.
 */
export function createStructuredResult(
  success: boolean,
  data?: unknown,
  error?: string
): { success: boolean; data?: unknown; error?: string } {
  const result: { success: boolean; data?: unknown; error?: string } = { success };
  if (data !== undefined) {
    result.data = data;
  }
  if (error !== undefined) {
    result.error = error;
  }
  return result;
}

// ============================================
// Video Formatters
// ============================================

/**
 * Format a video generation start response for MCP output.
 */
export function formatVideoStartResponse(response: VideoResponse): string {
  const lines: string[] = [];

  lines.push(`# Video Generation Started`);
  lines.push(``);
  lines.push(`**Task ID:** ${response.id}`);
  lines.push(`**Model:** ${response.model}`);
  lines.push(`**Status:** ${response.task_status}`);
  lines.push(`**Request ID:** ${response.request_id}`);
  lines.push(``);
  lines.push(`Use the \`get_video_result\` tool with task ID \`${response.id}\` to check the result.`);
  lines.push(``);
  lines.push(`> **Note:** Video generation typically takes 30 seconds to several minutes depending on duration and quality settings.`);

  return lines.join('\n');
}

/**
 * Format an async video result response for MCP output.
 */
export function formatVideoResultResponse(
  response: AsyncVideoGenerationResponse
): string {
  const lines: string[] = [];

  const status = response.task_status;

  if (status === 'PROCESSING') {
    lines.push(`# Video Task Still Processing`);
    lines.push(``);
    lines.push(`The video generation task is still in progress.`);
    lines.push(`Please try again in a few seconds.`);
    lines.push(``);
    lines.push(`**Status:** ${status}`);
    if (response.request_id) {
      lines.push(`**Request ID:** ${response.request_id}`);
    }
  } else if (status === 'SUCCESS') {
    lines.push(`# Video Generation Complete`);
    lines.push(``);
    lines.push(`**Status:** ${status}`);
    if (response.model) {
      lines.push(`**Model:** ${response.model}`);
    }

    if (response.video_result && response.video_result.length > 0) {
      const videoData = response.video_result[0];
      if (videoData) {
        lines.push(`**Video URL:** ${videoData.url}`);
        lines.push(``);
        lines.push(`> **Note:** The video URL expires after 1 day. Download and store the video promptly.`);
      }
    }
  } else if (status === 'FAIL') {
    lines.push(`# Video Generation Failed`);
    lines.push(``);
    lines.push(`**Status:** ${status}`);
    if (response.error) {
      lines.push(`**Error Code:** ${response.error.code}`);
      lines.push(`**Error Message:** ${response.error.message}`);
    }
    lines.push(``);
    lines.push(`The video generation task failed. Please check your prompt and try again.`);
  }

  return lines.join('\n');
}

/**
 * Format video model list for MCP output.
 */
export function formatVideoModelList(): string {
  const lines: string[] = [];

  lines.push(`# Available Video Generation Models`);
  lines.push(``);

  for (const [modelId, config] of Object.entries(VIDEO_MODEL_CONFIGS)) {
    lines.push(`## ${config.displayName}`);
    lines.push(``);
    lines.push(`**Model ID:** \`${modelId}\``);
    lines.push(`**Category:** ${config.category}`);
    lines.push(`**Description:** ${config.description}`);
    lines.push(`**Duration:** ${config.duration.join(', ')} seconds`);
    lines.push(`**Resolutions:** ${config.resolutions.join(', ')}`);
    if (config.aspectRatios) {
      lines.push(`**Aspect Ratios:** ${config.aspectRatios.join(', ')}`);
    }
    lines.push(`**Audio Support:** ${config.supportsAudio ? 'Yes' : 'No'}`);
    lines.push(`**FPS Options:** ${config.supportsFps ? '30, 60' : 'N/A'}`);
    lines.push(`**Style Options:** ${config.supportsStyle ? 'general, anime' : 'N/A'}`);
    lines.push(`**Movement Amplitude:** ${config.supportsMovementAmplitude ? 'auto, small, medium, large' : 'N/A'}`);
    lines.push(`**Max Prompt Length:** ${config.maxPromptLength} characters`);
    lines.push(`**Price:** $${config.priceUsd}/video`);
    lines.push(``);
  }

  return lines.join('\n');
}

/**
 * Format a video download response for MCP output.
 */
export function formatVideoDownloadResponse(
  filePath: string,
  outputType: 'file' | 'base64'
): string {
  const lines: string[] = [];

  if (outputType === 'file') {
    lines.push(`# Video Downloaded Successfully`);
    lines.push(``);
    lines.push(`**Saved to:** file://${filePath}`);
    lines.push(``);
    lines.push(`> The video has been saved to disk and can be accessed at the path above.`);
  } else {
    lines.push(`# Video Downloaded Successfully`);
    lines.push(``);
    lines.push(`The video has been returned as base64 data.`);
  }

  return lines.join('\n');
}
