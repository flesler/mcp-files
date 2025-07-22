import { globSync } from 'glob'
import _ from 'lodash'
import { createRequire } from 'module'
import path from 'path'
import { z } from 'zod'
import { defineTool } from '../tools.js'
import util from '../util.js'

const schema = z.object({
  symbols: z.array(z.string().min(1)).describe('Symbol names to find (functions, classes, types, etc.)'),
  file_paths: z.array(z.string().min(1)).describe('File paths to search (supports relative paths, glob patterns, and package names)'),
})

const readSymbol = defineTool({
  id: 'read_symbol',
  schema,
  description: 'Find and extract code blocks by symbol name from files. Supports glob patterns and package names for file matching.',
  isReadOnly: true,
  fromArgs: ([symbols, ...paths]: string[]) => ({
    symbols: symbols.split(',').map(s => s.trim()),
    file_paths: paths,
  }),
  handler: (args: z.infer<typeof schema>) => {
    const { symbols, file_paths: filePaths } = args
    const expandedFiles = expandGlobPatterns(filePaths)
    const showSymbolName = symbols.length > 1
    const results: string[] = []
    for (const filePath of expandedFiles) {
      const content = util.readResolvedFile(filePath)
      for (const symbol of symbols) {
        const blocks = findBlocks(content, symbol)
        if (!blocks.length) {
          continue
        }
        results.push(...blocks.map(block => formatResult(block, symbol, filePath, showSymbolName)))
        if (results.length > symbols.length + 1) {
          throw new Error(`Too many symbol matches found (${results.length} matches for ${symbols.length} symbols). Please be more specific`)
        }
      }
      if (results.length >= symbols.length) {
        break
      }
    }
    if (!results.length) {
      throw new Error('No symbols found in any files')
    }
    return results.join('\n\n')
  },
})

export default readSymbol

interface Block {
  block: string
  startLine: number
  endLine: number
}

function findBlocks(content: string, symbol: string): Block[] {
  const regex = new RegExp(`^([ \t]*).*\\b${symbol}\\b.*(\\n\\1)?{(?:\\n\\1\\s+.*)*[^}]*}`, 'mg')
  const matches = content.matchAll(regex) || []
  const results: Block[] = []
  for (const match of matches) {
    const lines = content.substring(0, match.index).split('\n')
    const startLine = lines.length
    const matchLines = match[0].split('\n')
    const endLine = startLine + matchLines.length - 1
    results.push({ block: match[0].trim(), startLine, endLine })
  }
  return results
}

function formatResult(block: Block, symbol: string, filePath: string, showSymbolName: boolean): string {
  // Match the format used by AIs in Cursor
  let header = `${block.startLine}:${block.endLine}:${filePath}`
  if (showSymbolName) {
    header = `${symbol} @ ${header}`
  }
  return `=== ${header} ===\n${block.block}`
}

function expandGlobPatterns(filePaths: string[]): string[] {
  const expandedFiles: string[] = []
  for (const file of filePaths) {
    if (isPackageName(file)) {
      expandedFiles.push(resolvePackageFile(file))
    } else if (file.includes('*') || file.includes('?') || file.includes('[')) {
      const matches = globSync(file)
      expandedFiles.push(...matches)
    } else {
      expandedFiles.push(file)
    }
  }
  const uniqueFiles = [...new Set(expandedFiles)]
  return _.sortBy(uniqueFiles, scoreFile)
}

function scoreFile(file: string): number {
  const ext = file.split('.').pop()?.toLowerCase()
  if (ext === 'ts') return 100
  if (ext === 'js') return 90
  return 0
}

function isPackageName(file: string): boolean {
  if (file.includes('/') && !file.startsWith('@')) return false
  if (file.includes('\\')) return false
  if (file.startsWith('@')) return true
  return !file.includes('/') && !file.includes('\\')
}

function resolvePackageFile(packageName: string): string {
  try {
    const require = createRequire(path.join(util.CWD, 'package.json'))
    const packagePath = require.resolve(packageName)
    return packagePath
  } catch (err) {
    throw new Error(`Package '${packageName}' not found or not installed`)
  }
}
