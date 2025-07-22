# MCP Tools

A comprehensive MCP server providing helpful tools for AI agents like Cursor.

## 🔧 Available Tools

### `read_symbol` - Code Symbol Extraction
Find and extract code blocks by symbol name from files.

**Features:**
- Precise line numbers for easy navigation
- Multiple symbols and files support  
- Enhanced regex patterns catch more edge cases
- Works with TypeScript, JavaScript, Prisma, GraphQL

**Usage:**
```bash
mcp-tools read_symbol "User,Organization" src/types.ts
```

### `import_symbol` - Module Inspection
Inspect types and structures from imports or modules.

**Features:**
- Node.js modules and packages
- Relative imports from your codebase
- Property inspection with dot notation
- Dynamic imports with detailed type information

**Usage:**
```bash
mcp-tools import_symbol lodash map
mcp-tools import_symbol @prisma/client
```

### `replace_text` - Advanced Search & Replace
Improved search and replace functionality that handles whitespace issues better than standard tools.

**Features:**
- Robust whitespace handling and normalization
- Exact string matching with flexible whitespace
- Clear error messages for failed matches
- Safe file operations with backup validation

**Usage:**
```bash
mcp-tools replace_text src/app.ts "old code" "new code"
```

### `os_notification` - Cross-Platform Notifications
Send OS notifications across different platforms.

**Features:**
- Linux (notify-send)
- macOS (osascript)  
- Windows/WSL (PowerShell, wsl-notify-send)
- Memoized detection for optimal performance

**Usage:**
```bash
mcp-tools os_notification "Build complete" "Success"
```

### `tools_debug` - Debug Information
Get debug information about the MCP server and context.

**Usage:**
```bash
DEBUG=true mcp-tools tools_debug
```

## 🚀 Getting Started

### Installation

```bash
npm install -g mcp-tools
```

### MCP Server Usage

**Stdio transport (default):**
```bash
mcp-tools
```

**HTTP transport:**
```bash
TRANSPORT=http mcp-tools
```

### CLI Usage

All tools can be used directly from the command line:

```bash
# Find symbols in code
mcp-tools read_symbol "MyInterface" src/types.ts

# Inspect imports
mcp-tools import_symbol lodash 

# Replace text with smart whitespace handling
mcp-tools replace_text config.json "old_value" "new_value"

# Send notifications
mcp-tools os_notification "Task completed"

# Debug info (when DEBUG=true)
mcp-tools tools_debug
```

## 🔌 MCP Integration

This server implements the [Model Context Protocol](https://modelcontextprotocol.io/) and can be used with MCP-compatible clients like:

- **Cursor** - AI code editor
- **Claude Desktop** - Anthropic's desktop app
- **Other MCP clients**

### Configuration Example

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "mcp-tools": {
      "command": "mcp-tools"
    }
  }
}
```

## 🏗️ Architecture

### Tool Structure
Each tool is self-contained in `src/tools/` with:
- Inline schema definition
- Type-safe handlers
- Comprehensive error handling
- Performance optimizations

### Key Features
- ✅ **Type Safety** - Full TypeScript with Zod validation
- ✅ **Performance** - Memoized detection and optimized execution  
- ✅ **Cross-Platform** - Works on Linux, macOS, Windows, WSL
- ✅ **Developer Friendly** - Clear error messages and helpful output
- ✅ **MCP Compliant** - Full Model Context Protocol support

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

# Test with CLI
npm run ts src/index.ts read_symbol "symbolName" file.ts
```

## 📝 License

MIT - see [LICENSE](LICENSE) file.

## 🤝 Contributing

Contributions welcome! This project provides essential tools for AI agents to interact with codebases effectively.

---

**Made for AI agents, by AI agents** 🤖✨
