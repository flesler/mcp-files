/** This file is for the Cursor agent to extract code blocks by symbol name */
import { z } from 'zod'
import { ToolConfig } from '../types.js'
import util from '../util.js'

const schema = z.object({
  symbols: z.array(z.string().min(1)).describe('Symbol names to find (array of strings)'),
  files: z.array(z.string().min(1)).describe('One or more file paths to search'),
})

const readSymbolTool: ToolConfig = {
  name: 'read_symbol',
  schema,
  description: `Find and extract code blocks by symbol name from files.
Features:
- Precise line numbers for easy navigation
- Multiple symbols and files support
- Enhanced regex patterns catch more edge cases
- Works with TypeScript, JavaScript, Prisma, GraphQL`,
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

interface CodeBlockResult {
  block: string
  startLine: number
  endLine: number
  matchType: string
}

function findCodeBlocks(content: string, symbol: string): CodeBlockResult[] {
  const regex = new RegExp(`^.*\\b${symbol}\\b.*\n?{(?:\n[ \t].*)*\n[ \t]*}?`, 'mg')
  const matches = content.match(regex)
  if (!matches) return []

  const results: CodeBlockResult[] = []
  for (const match of matches) {
    const matchStart = content.indexOf(match)
    const beforeMatch = content.substring(0, matchStart)
    const startLine = beforeMatch.split('\n').length
    const matchLines = match.split('\n').length
    const endLine = startLine + matchLines - 1

    const firstLine = match.split('\n')[0].trim()
    let matchType = 'declaration'
    if (firstLine.includes('const ') || firstLine.includes('let ') || firstLine.includes('var ')) {
      matchType = 'variable'
    } else if (firstLine.includes('function ')) {
      matchType = 'function'
    } else if (firstLine.includes('class ')) {
      matchType = 'class'
    } else if (firstLine.includes('interface ') || firstLine.includes('type ')) {
      matchType = 'type'
    } else if (firstLine.includes('enum ')) {
      matchType = 'enum'
    } else if (firstLine.includes('model ')) {
      matchType = 'Prisma model'
    } else if (/^\s*\w+\s*[=:]/.test(firstLine)) {
      matchType = 'assignment'
    }

    results.push({ block: match.trim(), startLine, endLine, matchType })
  }
  return results
}

function formatResults(results: CodeBlockResult[], symbol: string, filePath: string, showFilename: boolean, _multipleSymbols: boolean): string {
  const filePrefix = showFilename ? ` in ${filePath}` : ''
  const output: string[] = []

  if (results.length === 1) {
    const result = results[0]
    output.push(`=== ${symbol}${filePrefix} (lines ${result.startLine}-${result.endLine}) ===`)
    output.push(result.block)
  } else {
    output.push(`=== Found ${results.length} matches for '${symbol}'${filePrefix} ===`)
    results.forEach((result, index) => {
      output.push(`--- Match ${index + 1}: ${result.matchType} (lines ${result.startLine}-${result.endLine}) ---`)
      output.push(result.block)
    })
  }
  return output.join('\n')
}
