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
 * MCP Server for Z.AI Image Generation.
 * Exposes GLM-Image and CogView-4 models via the Model Context Protocol.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import * as fs from 'fs/promises';
import * as path from 'path';
import { createZaiClient, type ZaiClient } from './client/index.js';
import {
  loadConfig,
  MODEL_CONFIGS,
  type Config,
  type SupportedModel,
} from './config.js';
import {
  formatAsyncResultResponse,
  formatAsyncStartResponse,
  formatDownloadResponse,
  formatError,
  formatImageResponse,
  formatModelList,
} from './utils/formatters.js';
import {
  validatePrompt,
  validateQuality,
  validateSize,
  validateUserId,
} from './utils/validation.js';
/**
 * Create and configure the MCP server.
 */
export function createServer(config: Config): McpServer {
  const client = createZaiClient({
    apiKey: config.apiKey,
    baseUrl: config.baseUrl,
    timeout: config.timeout,
    maxRetries: config.maxRetries,
    retryDelay: config.retryDelay,
  });

  const server = new McpServer({
    name: 'z-ai-image-mcp',
    version: '1.0.0',
  });

  // Register tools
  registerListModelsTool(server);
  registerGenerateImageTool(server, client, config);
  registerGenerateImageAsyncTool(server, client, config);
  registerGetAsyncResultTool(server, client);
  registerDownloadImageTool(server);
  registerGenerateAndDownloadTool(server, client, config);

  return server;
  registerListModelsTool(server);
  registerGenerateImageTool(server, client, config);
  registerGenerateImageAsyncTool(server, client, config);
  registerGetAsyncResultTool(server, client);
  registerDownloadImageTool(server);
  return server;
}

/**
 * Register the list_models tool.
 */
function registerListModelsTool(server: McpServer): void {
  server.tool(
    'list_models',
    'List available Z.AI image generation models and their capabilities',
    {},
    async () => {
      const result = formatModelList();
      return {
        content: [{ type: 'text' as const, text: result }],
      };
    }
  );
}

/**
 * Register the generate_image (synchronous) tool.
 */
function registerGenerateImageTool(
  server: McpServer,
  client: ZaiClient,
  config: Config
): void {
  server.tool(
    'generate_image',
    'Generate an image synchronously from a text prompt. Returns the image URL directly. Use this for most image generation tasks.',
    {
      model: z
        .enum(['glm-image', 'cogview-4-250304'])
        .optional()
        .default(config.defaultModel)
        .describe('Model to use for generation'),
      prompt: z
        .string()
        .min(1)
        .max(4000)
        .describe('Text description of the image to generate'),
      size: z
        .string()
        .optional()
        .default(config.defaultSize)
        .describe('Image size (e.g., "1280x1280", "1568x1056")'),
      quality: z
        .enum(['hd', 'standard'])
        .optional()
        .describe('Quality level: "hd" (more detailed, ~20s) or "standard" (faster, ~5-10s)'),
      user_id: z
        .string()
        .min(6)
        .max(128)
        .optional()
        .describe('Unique end user ID for abuse prevention (6-128 characters)'),
    },
    async (params) => {
      try {
        const model = params.model ?? config.defaultModel;
        const size = params.size ?? config.defaultSize;
        const modelConfig = MODEL_CONFIGS[model];

        // Validate inputs
        validatePrompt(params.prompt);
        validateSize(size, model);
        if (params.quality) {
          validateQuality(params.quality, model);
        }
        if (params.user_id) {
          validateUserId(params.user_id);
        }

        // Make API request
        const response = await client.generateImage({
          model,
          prompt: params.prompt,
          size,
          quality: params.quality ?? modelConfig.defaultQuality,
          ...(params.user_id ? { user_id: params.user_id } : {}),
        });

        const result = formatImageResponse(response, model);
        return {
          content: [{ type: 'text' as const, text: result }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: formatError(error) }],
          isError: true,
        };
      }
    }
  );
}

/**
 * Register the generate_image_async tool.
 */
function registerGenerateImageAsyncTool(
  server: McpServer,
  client: ZaiClient,
  config: Config
): void {
  server.tool(
    'generate_image_async',
    'Start an asynchronous image generation task. Returns a task ID to poll for results. Use this for long-running generations or when you need to process multiple images.',
    {
      model: z
        .literal('glm-image')
        .optional()
        .default('glm-image')
        .describe('Model to use (only glm-image supports async)'),
      prompt: z
        .string()
        .min(1)
        .max(4000)
        .describe('Text description of the image to generate'),
      size: z
        .string()
        .optional()
        .default(config.defaultSize)
        .describe('Image size (e.g., "1280x1280", "1568x1056")'),
      quality: z
        .literal('hd')
        .optional()
        .default('hd')
        .describe('Quality level (only "hd" supported for async)'),
      user_id: z
        .string()
        .min(6)
        .max(128)
        .optional()
        .describe('Unique end user ID for abuse prevention (6-128 characters)'),
    },
    async (params) => {
      try {
        const model: SupportedModel = 'glm-image';
        const size = params.size ?? config.defaultSize;

        // Validate inputs
        validatePrompt(params.prompt);
        validateSize(size, model);
        if (params.user_id) {
          validateUserId(params.user_id);
        }

        // Make API request
        const response = await client.generateImageAsync({
          model: 'glm-image',
          prompt: params.prompt,
          size,
          quality: 'hd',
          ...(params.user_id ? { user_id: params.user_id } : {}),
        });

        const result = formatAsyncStartResponse(response);
        return {
          content: [{ type: 'text' as const, text: result }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: formatError(error) }],
          isError: true,
        };
      }
    }
  );
}

/**
 * Register the get_async_result tool.
 */
function registerGetAsyncResultTool(server: McpServer, client: ZaiClient): void {
  server.tool(
    'get_async_result',
    'Retrieve the result of an asynchronous image generation task. Use the task ID from generate_image_async.',
    {
      task_id: z
        .string()
        .min(1, 'task_id is required')
        .describe('The task ID returned by generate_image_async'),
    },
    async (params) => {
      try {

        const response = await client.getAsyncResult(params.task_id);
        const result = formatAsyncResultResponse(response);
        return {
          content: [{ type: 'text' as const, text: result }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: formatError(error) }],
          isError: true,
        };
      }
    }
  );
}

/**
 * Register the download_image tool.
 */
function registerDownloadImageTool(server: McpServer): void {
  server.tool(
    'download_image',
    'Download an image from a URL and return it as base64 or save to a file. Use this after generating an image to get the actual image data. Note: Z.AI image URLs expire after 30 days.',
    {
      url: z
        .string()
        .url()
        .describe('The URL of the image to download (e.g., from generate_image or get_async_result)'),
      output: z
        .enum(['base64', 'file_output'])
        .optional()
        .default('base64')
        .describe('Output format: "base64" returns the image data directly, "file_output" saves to disk'),
      file_output: z
        .string()
        .optional()
        .describe('Absolute path to save the image file (required if output is "file_output"). Example: /path/to/image.png'),
    },
    async (params) => {
      try {
        const { url, output = 'base64', file_output } = params;

        // Fetch the image
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to download image: HTTP ${response.status}`);
        }

        // Get content type for mime type detection
        const contentType = response.headers.get('content-type') ?? 'image/png';
        const buffer = Buffer.from(await response.arrayBuffer());
        const base64 = buffer.toString('base64');

        // Determine extension from content type
        const extMap: Record<string, string> = {
          'image/png': 'png',
          'image/jpeg': 'jpg',
          'image/jpg': 'jpg',
          'image/webp': 'webp',
          'image/gif': 'gif',
        };
        const ext = extMap[contentType] ?? 'png';

        // Auto-switch to file_output if base64 exceeds 1MB (MCP limit)
        const MAX_RESPONSE_SIZE = 1048576; // 1MB
        const effectiveOutput = output === 'base64' && buffer.length > MAX_RESPONSE_SIZE
          ? 'file_output'
          : output;

        if (effectiveOutput === 'file_output') {
          // Determine file path
          let filePath: string;
          if (file_output) {
            // Use provided path, ensure correct extension
            const parsed = path.parse(file_output);
            filePath = path.join(parsed.dir, `${parsed.name}.${ext}`);
          } else {
            // Auto-generate path in temp directory
            const tmpDir = process.env.MCP_HF_WORK_DIR ?? '/tmp';
            const unique = Date.now();
            filePath = path.join(tmpDir, `zai_image_${unique}.${ext}`);
          }

          // Ensure directory exists
          await fs.mkdir(path.dirname(filePath), { recursive: true });

          // Write file
          await fs.writeFile(filePath, buffer);

          return {
            content: [{ type: 'text' as const, text: formatDownloadResponse(filePath, 'file') }],
          };
        } else {
          // Return base64
          return {
            content: [{
              type: 'image' as const,
              data: base64,
              mimeType: contentType,
            }],
          };
        }
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: formatError(error) }],
          isError: true,
        };
      }
    }
  );
}


/**
 * Sleep for a given number of milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Register the generate_and_download_image tool.
 * Combines image generation and download into a single operation.
 */
function registerGenerateAndDownloadTool(
  server: McpServer,
  client: ZaiClient,
  config: Config
): void {
  server.tool(
    'generate_and_download_image',
    'Generate an image and automatically download it. This combines generate_image and download_image into a single operation. Returns the image as base64 or saves to a file. Best for when you want the image data immediately.',
    {
      prompt: z
        .string()
        .min(1)
        .max(4000)
        .describe('Text description of the image to generate'),
      model: z
        .enum(['glm-image', 'cogview-4-250304'])
        .optional()
        .default(config.defaultModel)
        .describe('Model to use for generation'),
      size: z
        .string()
        .optional()
        .default(config.defaultSize)
        .describe('Image size (e.g., "1280x1280", "1568x1056")'),
      quality: z
        .enum(['hd', 'standard'])
        .optional()
        .describe('Quality level: "hd" (more detailed, ~20s) or "standard" (faster, ~5-10s)'),
      user_id: z
        .string()
        .min(6)
        .max(128)
        .optional()
        .describe('Unique end user ID for abuse prevention (6-128 characters)'),
      output: z
        .enum(['base64', 'file_output'])
        .optional()
        .default('base64')
        .describe('Output format: "base64" returns the image data directly, "file_output" saves to disk'),
      file_output: z
        .string()
        .optional()
        .describe('Absolute path to save the image file (required if output is "file_output"). Example: /path/to/image.png'),
      poll_interval: z
        .number()
        .int()
        .min(1)
        .max(30)
        .optional()
        .default(3)
        .describe('Seconds to wait between polling for async results (default: 3)'),
      max_wait: z
        .number()
        .int()
        .min(10)
        .max(300)
        .optional()
        .default(120)
        .describe('Maximum seconds to wait for image generation (default: 120)'),
    },
    async (params) => {
      try {
        const {
          prompt,
          model = config.defaultModel,
          size = config.defaultSize,
          quality,
          user_id,
          output = 'base64',
          file_output,
          poll_interval = 3,
          max_wait = 120,
        } = params;

        const modelConfig = MODEL_CONFIGS[model];

        // Validate inputs
        validatePrompt(prompt);
        validateSize(size, model);
        if (quality) {
          validateQuality(quality, model);
        }
        if (user_id) {
          validateUserId(user_id);
        }

        let imageUrl: string | undefined;

        // Generate the image
        if (modelConfig.supportsAsync) {
          // Use async API with polling
          const asyncResponse = await client.generateImageAsync({
            model: 'glm-image',
            prompt,
            size,
            quality: 'hd',
            ...(user_id ? { user_id } : {}),
          });

          const taskId = asyncResponse.id;
          const startTime = Date.now();
          const maxWaitMs = max_wait * 1000;

          // Poll until complete or timeout
          while (Date.now() - startTime < maxWaitMs) {
            const result = await client.getAsyncResult(taskId);

            if (result.task_status === 'SUCCESS' && result.image_result?.[0]?.url) {
              imageUrl = result.image_result[0].url;
              break;
            } else if (result.task_status === 'FAIL') {
              throw new Error(
                `Image generation failed: ${result.error?.message ?? 'Unknown error'}`
              );
            }

            // Still processing, wait and retry
            await sleep(poll_interval * 1000);
          }

          if (!imageUrl) {
            throw new Error(`Image generation timed out after ${max_wait} seconds`);
          }
        } else {
          // Use synchronous API
          const response = await client.generateImage({
            model,
            prompt,
            size,
            quality: quality ?? modelConfig.defaultQuality,
            ...(user_id ? { user_id } : {}),
          });

          imageUrl = response.data[0]?.url;
          if (!imageUrl) {
            throw new Error('No image URL returned from generation');
          }
        }

        // Download the image
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
          throw new Error(`Failed to download image: HTTP ${imageResponse.status}`);
        }

        const contentType = imageResponse.headers.get('content-type') ?? 'image/png';
        const buffer = Buffer.from(await imageResponse.arrayBuffer());
        const base64 = buffer.toString('base64');

        // Determine extension from content type
        const extMap: Record<string, string> = {
          'image/png': 'png',
          'image/jpeg': 'jpg',
          'image/jpg': 'jpg',
          'image/webp': 'webp',
          'image/gif': 'gif',
        };
        const ext = extMap[contentType] ?? 'png';

        // Auto-switch to file_output if base64 exceeds 1MB (MCP limit)
        const MAX_RESPONSE_SIZE = 1048576; // 1MB
        const effectiveOutput = output === 'base64' && buffer.length > MAX_RESPONSE_SIZE
          ? 'file_output'
          : output;

        if (effectiveOutput === 'file_output') {
          // Determine file path
          let filePath: string;
          if (file_output) {
            const parsed = path.parse(file_output);
            filePath = path.join(parsed.dir, `${parsed.name}.${ext}`);
          } else {
            const tmpDir = process.env.MCP_HF_WORK_DIR ?? '/tmp';
            const unique = Date.now();
            filePath = path.join(tmpDir, `zai_image_${unique}.${ext}`);
          }

          // Ensure directory exists
          await fs.mkdir(path.dirname(filePath), { recursive: true });

          // Write file
          await fs.writeFile(filePath, buffer);

          return {
            content: [{ type: 'text' as const, text: formatDownloadResponse(filePath, 'file') }],
          };
        } else {
          // Return base64
          return {
            content: [{
              type: 'image' as const,
              data: base64,
              mimeType: contentType,
            }],
          };
        }
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: formatError(error) }],
          isError: true,
        };
      }
    }
  );
}


/**
 * Start the MCP server with stdio transport.
 */
export async function startServer(config?: Config): Promise<void> {
  const serverConfig = config ?? loadConfig();
  const server = createServer(serverConfig);
  const transport = new StdioServerTransport();

  await server.connect(transport);

  // Log to stderr (stdout is used for MCP protocol)
  console.error('Z.AI Image MCP Server started');
}

export { loadConfig, type Config, type SupportedModel };
