/**
 * Response formatters for MCP tool outputs.
 */
import type { AsyncImageGenerationResponse, AsyncResponse, AsyncVideoGenerationResponse, ImageGenerationResponse, VideoResponse } from '../client/types.js';
import { type SupportedModel } from '../config.js';
/**
 * Format a synchronous image generation response for MCP output.
 */
export declare function formatImageResponse(response: ImageGenerationResponse, model: SupportedModel): string;
/**
 * Format an async image generation response for MCP output.
 */
export declare function formatAsyncStartResponse(response: AsyncResponse): string;
/**
 * Format an async result response for MCP output.
 */
export declare function formatAsyncResultResponse(response: AsyncImageGenerationResponse): string;
/**
 * Format model list for MCP output.
 */
export declare function formatModelList(): string;
/**
 * Format an error for MCP output.
 */
export declare function formatError(error: unknown): string;
/**
 * Format a download response for MCP output.
 */
export declare function formatDownloadResponse(filePath: string, outputType: 'file' | 'base64'): string;
/**
 * Create a JSON-serializable result object for structured output.
 */
export declare function createStructuredResult(success: boolean, data?: unknown, error?: string): {
    success: boolean;
    data?: unknown;
    error?: string;
};
/**
 * Format a video generation start response for MCP output.
 */
export declare function formatVideoStartResponse(response: VideoResponse): string;
/**
 * Format an async video result response for MCP output.
 */
export declare function formatVideoResultResponse(response: AsyncVideoGenerationResponse): string;
/**
 * Format video model list for MCP output.
 */
export declare function formatVideoModelList(): string;
/**
 * Format a video download response for MCP output.
 */
export declare function formatVideoDownloadResponse(filePath: string, outputType: 'file' | 'base64'): string;
//# sourceMappingURL=formatters.d.ts.map