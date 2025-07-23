# MCP Tools

[![npm version](https://img.shields.io/npm/v/mcp-files.svg)](https://www.npmjs.com/package/mcp-files)
[![Node.js](https://img.shields.io/node/v/mcp-files.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/docker/v/flesler/mcp-files?label=docker)](https://hub.docker.com/r/flesler/mcp-files)

A comprehensive MCP server providing helpful tools for AI agents like Cursor.

## 🚀 Quick Start

### Option 1: NPX (Recommended)

Add to your MCP client config:

```bash
{
  "mcpServers": {
    "mcp-files": {
      "command": "npx",
      "args": ["-y", "mcp-files"]
    }
  }
}
```

### Option 2: Docker
```bash
# Add to your MCP client config:
{
  "mcpServers": {
    "mcp-files": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "flesler/mcp-files"
      ]
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
    "mcp-files": {
      "command": "npx",
      "args": ["-y", "mcp-files"]
    }
  }
}
```

**Docker configuration:**
```json
{
  "mcpServers": {
    "mcp-files": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "flesler/mcp-files"
      ]
    }
  }
}
```

**HTTP transport:**
```json
{
  "mcpServers": {
    "mcp-files": {
      "command": "npx",
      "args": ["-y", "mcp-files"],
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
    "mcp-files": {
      "command": "npx",
      "args": ["-y", "mcp-files"]
    }
  }
}
```

## 🛠️ **Available Tools**

| Tool | Description | Parameters |
|------|-------------|------------|
| `read_symbol` | Find and extract code blocks by symbol name from files | `symbol`, `file_paths[]?`, `limit?` |
| `import_symbol` | Import and inspect JavaScript/TypeScript modules and their properties | `module_path`, `property?` |
| `search_replace` | Search and replace with intelligent whitespace handling and automation-friendly multiple match resolution | `file_path`, `old_string`, `new_string` |
| `insert_text` | Insert/replace text at precise line ranges. Perfect for direct line operations from code citations (12:15:file.ts) and surgical edits in large files | `file_path`, `from_line`, `text`, `to_line` (optional) |
| `os_notification` | Send OS notifications using native notification systems | `message`, `title?` |

## 🎛️ Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `TRANSPORT` | `stdio` | Transport mode: `stdio` or `http` |
| `PORT` | `4657` | HTTP server port (when `TRANSPORT=http`) |
| `DEBUG` | `false` | Enable debug mode and `utils_debug` tool |

## 🖥️ Server Usage

You can either install and use `mcp-files` or `npx mcp-files`.

```bash
# Show help
mcp-files --help

# Default: stdio transport
mcp-files

# HTTP transport
TRANSPORT=http mcp-files
TRANSPORT=http PORT=8080 mcp-files

# With debug mode
DEBUG=true mcp-files
```

## 💻 CLI Usage

All tools can be used directly from the command line:

```bash
# Find symbol in code (specific file)
mcp-files read_symbol "MyInterface" src/types.ts

# Find symbol in current directory (default)
mcp-files read_symbol "MyInterface"

# Inspect imports
mcp-files import_symbol lodash get

# Replace text with smart whitespace handling
mcp-files replace_text config.json "old_value" "new_value"

# Send notifications
mcp-files os_notification "Task completed"
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

# Or search current directory
node dist/index.js read_symbol "functionName"
```

## 🛠️ Troubleshooting

### **Requirements**
- **Node.js ≥20** - This package requires Node.js version 20 or higher

### **Common Issues**

**ERR_MODULE_NOT_FOUND when running `npx mcp-files`**
- **Problem**: Error like `Cannot find module '@modelcontextprotocol/sdk/dist/esm/server/index.js'` when running `npx mcp-files`
- **Cause**: Corrupt or incomplete npx cache preventing proper dependency resolution
- **Solution**: Clear the npx cache and try again:
  ```bash
  npx clear-npx-cache
  npx mcp-files
  ```
- **Note**: This issue can occur on both Node.js v20 and v22, and the cache clear resolves it

**Tools not showing up in MCP client:**
- Verify Node.js version is 20 or higher
- Try restarting your MCP client after configuration changes

**File operations failing:**
- Ensure proper file permissions for the files you're trying to read/modify
- Use absolute paths when possible for better reliability
- Check that the target files exist and are accessible

## 📝 License

MIT - see [LICENSE](LICENSE) file.

## 🔗 Links

- 📦 **[NPM Package](https://www.npmjs.com/package/mcp-files)**
- 🐙 **[GitHub Repository](https://github.com/flesler/mcp-files)**
- 🐛 **[Report Issues](https://github.com/flesler/mcp-files/issues)**
- 📚 **[MCP Specification](https://modelcontextprotocol.io/)**

---

**Built for AI agents** 🤖
