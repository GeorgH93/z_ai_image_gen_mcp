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
