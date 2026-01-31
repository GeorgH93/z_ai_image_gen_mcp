# Z.AI Image Generation MCP Server

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server that provides access to Z.AI's image generation models (GLM-Image and CogView-4) for LLM applications.

## Features

- **Synchronous Image Generation**: Generate images and get results immediately
- **Asynchronous Image Generation**: Submit long-running tasks and poll for results
- **Multiple Models**: Support for GLM-Image and CogView-4-250304 models
- **Automatic Retries**: Built-in retry logic with exponential backoff
- **Comprehensive Validation**: Input validation with clear error messages
- **Type-Safe**: Full TypeScript support with detailed type definitions

## Installation

```bash
npm install z-ai-image-mcp
```

## Configuration

Set your Z.AI API key as an environment variable:

```bash
export ZAI_API_KEY=your_api_key_here
```

Get your API key from the [Z.AI API Keys page](https://z.ai/manage-apikey/apikey-list) or sign up for the [GLM Coding Plan](https://z.ai/subscribe?ic=E7H8IV5TXG).

### Optional Configuration

| Environment Variable | Description | Default |
|---------------------|-------------|---------|
| `ZAI_API_BASE_URL` | API base URL | `https://api.z.ai/api` |
| `ZAI_DEFAULT_MODEL` | Default model | `glm-image` |
| `ZAI_DEFAULT_SIZE` | Default image size | `1280x1280` |
| `ZAI_REQUEST_TIMEOUT` | Request timeout (ms) | `60000` |
| `ZAI_MAX_RETRIES` | Max retry attempts | `3` |
| `ZAI_RETRY_DELAY` | Initial retry delay (ms) | `1000` |

## Usage

### With Claude Desktop

Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "z-ai-image": {
      "command": "npx",
      "args": ["z-ai-image-mcp"],
      "env": {
        "ZAI_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

### With Other MCP Clients

Run the server directly:

```bash
npx z-ai-image-mcp
```

Or programmatically:

```typescript
import { createServer, loadConfig } from 'z-ai-image-mcp';

const config = loadConfig();
const server = createServer(config);
// Connect to your transport...
```

### With OpenCode

Add to your OpenCode configuration (`opencode.json` or `opencode.jsonc` in your project root):

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "z-ai-image": {
      "type": "local",
      "command": ["npx", "z-ai-image-mcp"],
      "enabled": true,
      "environment": {
        "ZAI_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

Or using an environment variable reference:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "z-ai-image": {
      "type": "local",
      "command": ["npx", "z-ai-image-mcp"],
      "enabled": true,
      "environment": {
        "ZAI_API_KEY": "{env:ZAI_API_KEY}"
      }
    }
  }
}
```

**Using with OpenCode prompts:**

```
Generate a professional logo for a tech startup. use z-ai-image
```

Or add to your `AGENTS.md`:

```markdown
When generating images, use the `z-ai-image` MCP server tools.
```

**Per-agent configuration (optional):**

To enable the MCP server only for specific agents:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "z-ai-image": {
      "type": "local",
      "command": ["npx", "z-ai-image-mcp"],
      "enabled": true,
      "environment": {
        "ZAI_API_KEY": "{env:ZAI_API_KEY}"
      }
    }
  },
  "tools": {
    "z-ai-image*": false
  },
  "agent": {
    "design-agent": {
      "tools": {
        "z-ai-image*": true
      }
    }
  }
}
```

## Available Tools

### 1. `list_models`

List all available image generation models and their capabilities.

```
Use this tool to discover available models, their features, and recommended settings.
```

### 2. `generate_image`

Generate an image synchronously from a text prompt.

**Parameters:**
- `prompt` (required): Text description of the image (max 4000 characters)
- `model` (optional): `glm-image` or `cogview-4-250304` (default: `glm-image`)
- `size` (optional): Image dimensions, e.g., `1280x1280` (default: `1280x1280`)
- `quality` (optional): `hd` or `standard` (default: `hd` for GLM-Image)
- `user_id` (optional): End user ID for abuse prevention (6-128 characters)

**Example:**
```
Generate an image of a cute kitten sitting on a windowsill with a sunset background.
```

### 3. `generate_image_async`

Start an asynchronous image generation task. Returns a task ID for polling.

**Parameters:**
- `prompt` (required): Text description of the image
- `model` (optional): Only `glm-image` supports async (default: `glm-image`)
- `size` (optional): Image dimensions (default: `1280x1280`)
- `quality` (optional): Only `hd` supported for async (default: `hd`)
- `user_id` (optional): End user ID for abuse prevention

**Example:**
```
Start async generation of a complex poster design.
```

### 4. `get_async_result`

Retrieve the result of an asynchronous image generation task.

**Parameters:**
- `task_id` (required): The task ID from `generate_image_async`

**Example:**
```
Check the status of task ID "task-12345".
```

## Models

### GLM-Image

Z.AI's flagship image generation model with a hybrid autoregressive + diffusion architecture.

- **Best for**: Complex compositions, text rendering, detailed illustrations, commercial posters
- **Quality options**: `hd` (detailed, ~20s), `standard` (faster, ~5-10s)
- **Size range**: 1024-2048px per dimension (divisible by 32)
- **Recommended sizes**: 1280×1280, 1568×1056, 1056×1568, 1472×1088, 1088×1472, 1728×960, 960×1728
- **Async support**: Yes

### CogView-4-250304

General-purpose image generation with fast text understanding.

- **Best for**: General image generation, quick iterations
- **Quality options**: `hd`, `standard`
- **Size range**: 512-2048px per dimension (divisible by 16)
- **Recommended sizes**: 1024×1024, 768×1344, 864×1152, 1344×768, 1152×864, 1440×720, 720×1440
- **Async support**: No

## Error Handling

The server handles various error scenarios:

| Error Type | Description |
|-----------|-------------|
| `AUTH_ERROR` | Invalid or missing API key |
| `RATE_LIMIT` | Too many requests - will auto-retry |
| `VALIDATION_ERROR` | Invalid parameters |
| `SERVER_ERROR` | Z.AI server issues - will auto-retry |
| `NETWORK_ERROR` | Connection issues - will auto-retry |
| `TIMEOUT_ERROR` | Request timeout - will auto-retry |
| `CONTENT_FILTER` | Prompt blocked by content policy |

## Development

### Setup

```bash
git clone <repo-url>
cd z-ai-image-mcp
npm install
cp .env.example .env
# Edit .env with your API key
```

### Scripts

```bash
npm run build        # Build TypeScript
npm run dev          # Run in development mode
npm test             # Run all tests
npm run test:unit    # Run unit tests only
npm run test:integration  # Run integration tests
npm run test:e2e     # Run E2E tests
npm run test:coverage    # Run tests with coverage
npm run typecheck    # Type check without emit
```

## License

MIT

## Links

- [Z.AI Documentation](https://docs.z.ai/)
- [MCP Documentation](https://modelcontextprotocol.io/)
- [Get API Key](https://z.ai/manage-apikey/apikey-list)
- [GLM Coding Plan](https://z.ai/subscribe?ic=E7H8IV5TXG)
