/**
 * MCP Server for Z.AI Image Generation.
 * Exposes GLM-Image and CogView-4 models via the Model Context Protocol.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { loadConfig, type Config, type SupportedModel, type VideoSupportedModel } from './config.js';
/**
 * Create and configure the MCP server.
 */
export declare function createServer(config: Config): McpServer;
/**
 * Start the MCP server with stdio transport.
 */
export declare function startServer(config?: Config): Promise<void>;
export { loadConfig, type Config, type SupportedModel, type VideoSupportedModel };
//# sourceMappingURL=server.d.ts.map