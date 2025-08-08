import cli from './cli.js'
import pkg from './pkg.js'
import server from './server.js'

const args = process.argv.slice(2)
if (args.length === 0) {
  await server.start()
} else if (cli.isCommand(args[0])) {
  // Run CLI command
  await cli.run(args)
} else if (args[0] === '--check') {
  process.exit(0)
} else {
  const cmd = pkg.name
  console.log(`${pkg.author}/${cmd} ${pkg.version}
${pkg.description}

Server Usage:
  ${cmd}                    # Run MCP server with stdio transport
  TRANSPORT=http ${cmd}      # Run MCP server with HTTP transport

CLI Usage:
  ${cmd} read_symbol <symbol> <file1> [file2...]      # Find code blocks by symbol name
  ${cmd} import_symbol <module_path> [property]       # Inspect modules and imports  
  ${cmd} search_replace <file> <old_text> <new_text>    # Search and replace with whitespace handling
  ${cmd} insert_text <file> <from_line> <text> [to_line] # Insert or replace text at line range (1-based)
  ${cmd} os_notification <message> [title]            # Send OS notifications (title defaults to current directory)
  ${cmd} utils_debug                                  # Get debug information

Examples:
  ${cmd} read_symbol "ToolConfig" src/types.ts
  ${cmd} import_symbol lodash get
  ${cmd} search_replace src/app.ts "old code" "new code"
  ${cmd} insert_text src/app.ts 10 "console.log('debug')"     # Insert at line 10
  ${cmd} insert_text src/app.ts 10 "new code" 12          # Replace lines 10-12
  ${cmd} os_notification "Build complete"
  ${cmd} utils_debug
`)
  process.exit(0)
}

// Library exports - available for programmatic usage
export { default as cli } from './cli.js'
export { default as tools } from './tools.js'
export type { Tool } from './types.js'

