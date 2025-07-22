/** This file is for the Cursor agent to extract code blocks by symbol name */
import { z } from 'zod'
import { ToolConfig } from '../types.js'
import util from '../util.js'

const schema = z.object({
  symbols: z.array(z.string().min(1)).describe('Symbol names to find (functions, classes, types, etc.)'),
  files: z.array(z.string().min(1)).describe('File paths to search (supports relative paths, absolute preferred)'),
})

const readSymbolTool: ToolConfig = {
  name: 'read_symbol',
  schema,
  description: 'Find and extract code blocks by symbol name from files. Returns precise line numbers and full symbol definitions.',
  isReadOnly: true,
  handler: (args: z.infer<typeof schema>) => {
    const { symbols, files } = args
    const showFilename = files.length > 1
    const results: string[] = []

    for (const filePath of files) {
      const content = util.readResolvedFile(filePath)

      for (const symbol of symbols) {
        const codeBlocks = findCodeBlocks(content, symbol)

        if (codeBlocks.length === 0) {
          if (symbols.length === 1 && files.length === 1) {
            return `Symbol '${symbol}' not found in ${filePath}`
          }
          continue
        }

        results.push(formatResults(codeBlocks, symbol, filePath, showFilename, symbols.length > 1))
      }
    }

    return results.length > 0 ? results.join('\n\n') : 'No symbols found in any files'
  },
}

export default readSymbolTool

interface CodeBlock {
  block: string
  startLine: number
  endLine: number
}

function findCodeBlocks(content: string, symbol: string): CodeBlock[] {
  const regex = new RegExp(`^.*\\b${symbol}\\b.*\n?{(?:\n[ \t].*)*\n[ \t]*}?`, 'mg')
  const matches = content.matchAll(regex)
  if (!matches) return []

  const results: CodeBlock[] = []
  for (const match of matches) {
    const lines = content.substring(0, match.index).split('\n')
    const startLine = lines.length
    const matchLines = match[0].split('\n')
    const endLine = startLine + matchLines.length - 1

    results.push({ block: match[0].trim(), startLine, endLine })
  }

  return results
}

function formatResults(codeBlocks: CodeBlock[], symbol: string, filePath: string, showFilename: boolean, showSymbolName: boolean): string {
  const results: string[] = []

  for (const block of codeBlocks) {
    const parts: string[] = []

    // Add symbol name if multiple symbols
    if (showSymbolName) {
      parts.push(symbol)
    }

    // Add filename if multiple files
    if (showFilename) {
      parts.push(`in ${filePath}`)
    }

    // Add line range
    parts.push(`(lines ${block.startLine}-${block.endLine})`)

    const header = parts.length > 0 ? `=== ${parts.join(' ')} ===` : `=== ${symbol} ===`
    results.push(`${header}\n${block.block}`)
  }

  return results.join('\n\n')
}
