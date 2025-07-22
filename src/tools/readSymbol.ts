import fs from 'fs'
import { globSync } from 'glob'
import _ from 'lodash'
import { createRequire } from 'module'
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
    const maxResults = Math.max(symbols.length * 3, 10) // Allow more matches but still reasonable

    fileLoop: for (const filePath of expandedFiles) {
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
  return _(filePaths).flatMap(listFiles).uniq()
    .filter(file => !/\.map$/i.test(file))
    .sortBy(scoreFile).value()
}

function listFiles(file: string): string[] {
  let path = util.resolve(file)
  console.log({ path })
  try {
    const stat = fs.statSync(path)
    console.log({ stat })
    if (stat.isFile()) {
      return [file]
    }
    if (stat.isDirectory()) {
      path += '/*'
    }
  } catch {}
  try {
    if (path.includes('*') || path.includes('?') || path.includes('[')) {
      return globSync(path, { cwd: util.CWD, maxDepth: 2 })
    }
  } catch {}
  try {
    return [getRequire().resolve(file)]
  } catch {
    return [path]
  }
}

// Prioritize index files, TS, etc. Those we know can have symbols
const PRIORITY = ['index.', '.ts', '.js', '.json', '.graphql', '.prisma'].reverse()

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
