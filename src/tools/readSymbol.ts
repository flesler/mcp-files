import fs from 'fs'
import _ from 'lodash'
import { createRequire } from 'module'
import { z } from 'zod'
import { defineTool } from '../tools.js'
import util from '../util.js'

const readSymbol = defineTool({
  id: 'read_symbol',
  schema: z.object({
    symbols: z.array(z.string().min(1)).describe('Symbol names to find (functions, classes, types, etc.), case-sensitive'),
    file_paths: z.array(z.string().min(1)).describe('File paths to search (supports relative paths, glob patterns, and require() package names). IMPORTANT: Be specific with paths, minimize broad patterns like "node_modules/**/*.ts" which are slow and more likely to match false positives'),
  }),
  description: 'Find and extract symbol(s) block by name from files, supports a lot of file formats (like TS, JS, JSON, GraphQL and most that use braces for blocks). For better performance and accuracy, prefer targeted directories rather than broad recursive searches',
  isReadOnly: true,
  fromArgs: ([symbols, ...paths]) => ({
    symbols: symbols.split(',').map(s => s.trim()),
    file_paths: paths,
  }),
  handler: (args) => {
    const { symbols, file_paths: filePaths } = args
    const expandedFiles = expandGlobPatterns(filePaths)
    const showSymbolName = symbols.length > 1
    const results: string[] = []
    const maxResults = Math.max(symbols.length * 3, 10) // Allow more matches but still reasonable

    fileLoop: for (const filePath of expandedFiles) {
      try {
        const fullPath = util.resolve(filePath)
        const content = util.readFile(fullPath)
        for (const symbol of symbols) {
          const blocks = findBlocks(content, symbol)
          if (!blocks.length) {
            continue
          }
          results.push(...blocks.map(block => formatResult(block, symbol, filePath, showSymbolName)))

          // Early return if we have enough results across files
          if (results.length >= maxResults) {
            break fileLoop
          }
        }
      } catch {
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
    results.push({ block: match[0], startLine, endLine })
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
  return _(filePaths).flatMap(listFiles).uniq()
    .filter(file => !/\.map$/i.test(file))
    .filter(file => {
      // Filter out directories - only include files
      try {
        const stat = fs.statSync(util.resolve(file))
        return stat.isFile()
      } catch {
        return true // Include if we can't stat (might be package, etc.)
      }
    })
    .sortBy(scoreFile).value()
}

function listFiles(file: string): string[] {
  // Check for glob patterns first (before trying to stat)
  if (file.includes('*') || file.includes('?') || file.includes('[')) {
    try {
      return util.glob(file)
    } catch {
      return []
    }
  }

  try {
    const path = util.resolve(file)
    const stat = fs.statSync(path)
    if (stat.isFile()) {
      return [path]
    }
    if (stat.isDirectory()) {
      return util.glob(`${path.replace(/\/$/, '')}/**/*`)
    }
  } catch {}
  try {
    // Try as package
    return [getRequire().resolve(file)]
  } catch {
    return [file]
  }
}

// Prioritize index files, TS, etc. Those we know can have symbols
const PRIORITY = ['index.', '.d.ts', '.ts', '.js', '.json', '.graphql', '.prisma'].reverse()

function scoreFile(file: string): number {
  let score = 0
  for (let i = 0; i < PRIORITY.length; i++) {
    if (file.includes(PRIORITY[i])) {
      score -= i + 1
    }
  }
  return -score
}

const getRequire = _.memoize(() => {
  return createRequire(util.resolve('package.json'))
})

