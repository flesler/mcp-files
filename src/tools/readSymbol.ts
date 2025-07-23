import fg from 'fast-glob'
import fs from 'fs/promises'
import _ from 'lodash'
import pLimit from 'p-limit'
import { z } from 'zod'
import { defineTool } from '../tools.js'
import util from '../util.js'

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
const MAX_CONCURRENCY = 32
const MAX_FILE_COUNT = 100

const DEFAULT_EXTENSIONS = ['ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs', 'json', 'json5', 'java', 'cs', 'cpp', 'c', 'h', 'hpp', 'cc', 'go', 'rs', 'php', 'swift', 'scss', 'css', 'less', 'graphql', 'gql', 'prisma', 'proto', 'd.ts']
// Boost score for important symbol types (case-insensitive)
const TYPE_BONUS = { 'class': 20, 'interface': 18, 'type': 16, 'function': 14, 'enum': 12, 'namespace': 10, 'module': 10 }
const IGNORED_DIRECTORIES = ['node_modules', 'dist', 'build', 'out', '.git']

const readSymbol = defineTool({
  id: 'read_symbol',
  schema: z.object({
    symbol: z.string().min(1).describe('Symbol name to find (functions, classes, types, etc.), case-sensitive'),
    file_paths: z.array(z.string().min(1)).optional().describe('File paths to search (supports relative and glob). Defaults to "." (current directory). IMPORTANT: Be specific with paths when possible, minimize broad patterns like "node_modules/**" to avoid mismatches'),
  }),
  description: 'Find and extract symbol block by name from files, supports a lot of file formats (like TS, JS, JSON, GraphQL and most that use braces for blocks). Uses streaming with concurrency control for better performance',
  isReadOnly: true,
  fromArgs: ([symbol, ...paths]) => ({ symbol, file_paths: paths.length ? paths : undefined }),
  handler: async (args) => {
    const { symbol, file_paths: filePaths = ['.'] } = args
    const maxResults = Math.max(1, 10)
    const patterns = filePaths.map(mapPattern)
    const results: string[] = []
    let count = 0

    try {
      for await (const result of scanForSymbol(symbol, patterns)) {
        results.push(result)
        count++
        if (results.length >= maxResults || count >= MAX_FILE_COUNT) {
          break
        }
      }
    } catch (err) {
      if (!results.length) {
        throw err
      }
      // If we have some results, continue with what we have
    }

    if (!results.length) {
      throw new Error(`Failed to find the \`${symbol}\` symbol in any files`)
    }

    return results.join('\n\n')
  },
})

export function mapPattern(pattern: string) {
  const exts = `.{${DEFAULT_EXTENSIONS.join(',')}}`

  // Check if pattern has a recognized file extension at the end
  const hasKnownExtension = DEFAULT_EXTENSIONS.some(ext => pattern.endsWith(`.${ext}`))
  if (hasKnownExtension) {
    return pattern
  }

  // Handle special cases
  if (pattern === '.' || pattern === './') {
    return `./**/*${exts}`
  }

  // If pattern ends with / it's definitely a directory
  if (pattern.endsWith('/')) {
    const basePath = pattern.replace(/\/$/, '')
    return `${basePath}/**/*${exts}`
  }

  // Check if it looks like a directory (no glob chars and no file extension)
  const hasGlobChars = pattern.includes('*') || pattern.includes('?') || pattern.includes('[')
  const lastSegment = pattern.split('/').pop() || ''
  const hasFileExtension = /\.\w+$/.test(lastSegment) && DEFAULT_EXTENSIONS.includes(lastSegment.split('.').pop()!)

  if (!hasGlobChars && !hasFileExtension) {
    // Treat as directory
    return `${pattern}/**/*${exts}`
  }

  // Handle common glob patterns
  if (pattern === '*' || pattern === '*.*') {
    return `*${exts}`
  }

  // If no extension but has glob patterns, add extensions
  return `${pattern}${exts}`
}

export function generateIgnorePatterns(patterns: string[]): string[] {
  const dirsToIgnore = IGNORED_DIRECTORIES.filter(dir => !patterns.some(pattern => pattern.includes(dir)))
  // Generate single pattern with commas: !{node_modules,dist,build}/**
  return dirsToIgnore.length ? [`!{${dirsToIgnore.join(',')}}/**`] : []
}

async function* scanForSymbol(symbol: string, patterns: string[]): AsyncGenerator<string> {
  const limit = pLimit(MAX_CONCURRENCY)
  let shouldStop = false

  const ignorePatterns = generateIgnorePatterns(patterns)
  const allPatterns = [...patterns, ...ignorePatterns]
  const entries = fg.stream(allPatterns, {
    cwd: util.CWD,
    onlyFiles: true,
    absolute: true,
    stats: true,
    suppressErrors: true, // avoid crashes from file access errors
    deep: 4,
  }) as AsyncIterable<fg.Entry>

  const pendingTasks = new Set<Promise<string[]>>()

  try {
    for await (const entry of entries) {
      if (shouldStop) break

      // Skip files that are too large
      if (entry.stats && entry.stats.size > MAX_FILE_SIZE) continue

      const task = limit(async () => {
        if (shouldStop) return []

        try {
          const content = await fs.readFile(entry.path, 'utf8')
          if (shouldStop) return []
          const results: string[] = []
          const blocks = findBlocks(content, symbol)
          for (const block of blocks) {
            if (shouldStop) return []
            results.push(formatResult(block, symbol, entry.path))
          }
          return results
        } catch {
          // silently skip unreadable files
          return []
        }
      })

      pendingTasks.add(task)
      const taskResults = await task
      pendingTasks.delete(task)

      for (const result of taskResults) {
        yield result
      }
    }
  } finally {
    shouldStop = true // hard stop any latecomers
    await Promise.allSettled([...pendingTasks]) // drain & clean
  }
}

export interface Block {
  block: string
  startLine: number
  endLine: number
  score: number
}

export function findBlocks(content: string, symbol: string): Block[] {
  const regex = new RegExp(`^([ \t]*).*\\b${symbol}\\b.*(\\n\\1)?{(?:\\n\\1\\s+.*)*[^}]*}`, 'mg')
  const matches = content.matchAll(regex) || []
  const results: Block[] = []
  for (const match of matches) {
    const lines = content.substring(0, match.index).split('\n')
    const startLine = lines.length
    const matchLines = match[0].split('\n')
    const endLine = startLine + matchLines.length - 1
    const score = scoreSymbol(match[0])
    results.push({ block: match[0], startLine, endLine, score })
  }
  // Sort by score (higher is better) and return
  return results.sort((a, b) => b.score - a.score)
}

function scoreSymbol(block: string): number {
  let score = 0

  // Prefer multi-line symbols over single-line
  const lineCount = block.split('\n').length
  if (lineCount > 2) {
    score += lineCount * 2 // Bonus for each additional line
  } else {
    score -= 10 // Penalty for single-line matches
  }
  // Boost score for important symbol types (case-insensitive)
  const typeMatches = block.match(typeBonusRegex()) || []
  for (const match of typeMatches) {
    const key = match.toLowerCase() as keyof typeof TYPE_BONUS
    const bonus = TYPE_BONUS[key] || 2
    score += bonus
  }
  // Small bonus for longer, more detailed symbols
  score += Math.min(block.length / 50, 10)
  return Math.round(score)
}

function formatResult(block: Block, symbol: string, filePath: string): string {
  // Match the format used by AIs in Cursor
  const header = `${symbol} @ ${block.startLine}:${block.endLine}:${filePath}`
  return `=== ${header} ===\n${block.block}`
}

const typeBonusRegex = _.memoize(() => new RegExp(`\\b(${Object.keys(TYPE_BONUS).join('|')})\\b`, 'gi'))

export default readSymbol
