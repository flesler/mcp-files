# MCP Tools

A comprehensive MCP server providing helpful tools for AI agents like Cursor.

## 🔧 Tools

### `read_symbol`
Find and extract code blocks by symbol name from files. Returns precise line numbers and full symbol definitions.

```bash
mcp-tools read_symbol "User,Organization" src/types.ts
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

### `tools_debug`
Get debug information about the MCP server environment and configuration.

```bash
DEBUG=true mcp-tools tools_debug
```

## 🚀 Setup

### Installation

```bash
npm install
npm run build
```

### MCP Server

```bash
# Stdio transport (default)
mcp-tools

# HTTP transport
TRANSPORT=http PORT=3000 mcp-tools
```

### MCP Client Configuration

Add to your MCP client (e.g., Cursor):

```json
{
  "mcpServers": {
    "mcp-tools-local": {
      "command": "node",
      "args": ["/path/to/mcp-tools/dist/index.js"]
    }
  }
}
```

## 🏗️ Architecture

- **Type-safe tools** with Zod validation
- **Self-contained modules** in `src/tools/`
- **Cross-platform support** (Linux, macOS, Windows, WSL)
- **Performance optimized** with memoization
- **Clear error handling** with descriptive messages

## 🧪 Development

```bash
# Build and test
npm run build
npm run lint:full
npm run ts test/index.test.ts

# CLI testing
node dist/index.js read_symbol "functionName" file.ts
```

## 📝 License

MIT - see [LICENSE](LICENSE) file.

---

**Built for AI agents** 🤖
