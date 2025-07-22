# MCP Tools

[![npm version](https://img.shields.io/npm/v/mcp-tools.svg)](https://www.npmjs.com/package/mcp-tools)
[![Node.js](https://img.shields.io/node/v/mcp-tools.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/docker/v/flesler/mcp-tools?label=docker)](https://hub.docker.com/r/flesler/mcp-tools)

A comprehensive MCP server providing helpful tools for AI agents like Cursor.

## 🚀 Quick Start

### Option 1: NPX (Recommended)

Add to your MCP client config:

```bash
{
  "mcpServers": {
    "mcp-tools": {
      "command": "npx",
      "args": ["-y", "mcp-tools"]
    }
  }
}
```

### Option 2: Docker
```bash
# Add to your MCP client config:
{
  "mcpServers": {
    "mcp-tools": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "flesler/mcp-tools"
      ]
    }
  }
}
```

### Option 3: Local Build

Clone and build locally

```bash
git clone https://github.com/flesler/mcp-tools
cd mcp-tools
npm install && npm run build
```

Add to your MCP client config:

```json
{
  "mcpServers": {
    "mcp-tools-local": {
      "command": "node",
      "args": ["dist/index.js"]
    }
  }
}
```

## 🔧 Installation Examples

### Cursor (`~/.cursor/mcp.json`)

**Basic configuration (recommended):**
```json
{
  "mcpServers": {
    "mcp-tools": {
      "command": "npx",
      "args": ["-y", "mcp-tools"]
    }
  }
}
```

**Docker configuration:**
```json
{
  "mcpServers": {
    "mcp-tools": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "flesler/mcp-tools"
      ]
    }
  }
}
```

**HTTP transport:**
```json
{
  "mcpServers": {
    "mcp-tools": {
      "command": "npx",
      "args": ["-y", "mcp-tools"],
      "env": {
        "TRANSPORT": "http",
        "PORT": "3000"
      }
    }
  }
}
```

### Claude Desktop (`~/.config/claude_desktop_config.json`)

**Basic setup:**
```json
{
  "mcpServers": {
    "mcp-tools": {
      "command": "npx",
      "args": ["-y", "mcp-tools"]
    }
  }
}
```

## 🔧 Tools

### `read_symbol`
Find and extract code blocks by symbol name from files. Returns precise line numbers and full symbol definitions.

```bash
mcp-tools read_symbol "Tool,ToolConfig" src/types.ts
```

### `import_symbol`
Inspect modules and imports to understand their structure and available properties.

```bash
mcp-tools import_symbol lodash get
mcp-tools import_symbol ./utils helper
```

### `replace_text`
Search and replace text in files with improved whitespace handling and clear error messages.

```bash
mcp-tools replace_text src/app.ts "old code" "new code"
```

### `os_notification`
Send cross-platform OS notifications. Title defaults to current directory name.

```bash
mcp-tools os_notification "Build complete"
mcp-tools os_notification "Task done" "Custom Title"
```

## 🎛️ Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `TRANSPORT` | `stdio` | Transport mode: `stdio` or `http` |
| `PORT` | `4657` | HTTP server port (when `TRANSPORT=http`) |
| `DEBUG` | `false` | Enable debug mode and `tools_debug` tool |

## 🖥️ Server Usage

```bash
# Show help
mcp-tools --help

# Default: stdio transport
mcp-tools

# HTTP transport
TRANSPORT=http mcp-tools
TRANSPORT=http PORT=8080 mcp-tools

# With debug mode
DEBUG=true mcp-tools
```

## 💻 CLI Usage

All tools can be used directly from the command line:

```bash
# Find symbols in code
mcp-tools read_symbol "MyInterface" src/types.ts

# Inspect imports
mcp-tools import_symbol lodash get

# Replace text with smart whitespace handling
mcp-tools replace_text config.json "old_value" "new_value"

# Send notifications
mcp-tools os_notification "Task completed"
```

## 🏗️ Architecture

- **Type-safe tools** with Zod validation
- **Self-contained modules** in `src/tools/`
- **Cross-platform support** (Linux, macOS, Windows, WSL)
- **Performance optimized** with memoization
- **Clear error handling** with descriptive messages

## 🧪 Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Development mode
npm run dev

# Lint
npm run lint:full

# Test
npm run ts test/index.test.ts

# CLI testing
node dist/index.js read_symbol "functionName" file.ts
```

## 🛠️ Troubleshooting

### **Requirements**
- **Node.js ≥20** - This package requires Node.js version 20 or higher

### **Common Issues**

**Tools not showing up in MCP client:**
- Ensure the path to `dist/index.js` is correct and absolute
- Check that the MCP server is properly configured in your client
- Verify Node.js version is 20 or higher
- Try restarting your MCP client after configuration changes

**File operations failing:**
- Ensure proper file permissions for the files you're trying to read/modify
- Use absolute paths when possible for better reliability
- Check that the target files exist and are accessible

## 📝 License

MIT - see [LICENSE](LICENSE) file.

## 🔗 Links

- 📦 **[NPM Package](https://www.npmjs.com/package/mcp-tools)**
- 🐙 **[GitHub Repository](https://github.com/flesler/mcp-tools)**
- 🐛 **[Report Issues](https://github.com/flesler/mcp-tools/issues)**
- 📚 **[MCP Specification](https://modelcontextprotocol.io/)**

---

**Built for AI agents** 🤖
