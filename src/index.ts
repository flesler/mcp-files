#!/usr/bin/env node
import cli from './cli.js'
import pkg from './pkg.js'

const args = process.argv.slice(2)
const cmd = pkg.name

if (args.includes('--help') || args.includes('-h')) {
  console.log(`${pkg.author}/${cmd} ${pkg.version}
${pkg.description}

Server Usage:
  ${cmd}                    # Run MCP server with stdio transport
  TRANSPORT=http ${cmd}      # Run MCP server with HTTP transport

CLI Usage:
  ${cmd} read_symbol <symbols> <file1> [file2...]     # Find code blocks by symbol name
  ${cmd} import_symbol <path> [property]              # Inspect modules and imports
  ${cmd} replace_text <file> <old_text> <new_text>    # Advanced search and replace
  ${cmd} os_notification <message> [title]            # Send OS notifications
  ${cmd} tools_debug                                  # Debug server information

Examples:
  ${cmd} read_symbol "User,Organization" src/types.ts
  ${cmd} import_symbol lodash map
  ${cmd} replace_text src/app.ts "old code" "new code"
  ${cmd} os_notification "Build complete" "Success"
  ${cmd} tools_debug
`)
  process.exit(0)
}

if (cli.isCommand(args[0])) {
  // Run CLI command
  cli.run(args)
} else {
  // Start the MCP server
  await import('./server.js')

  // Keep the process alive for stdio transport
  process.stdin.resume()
}
