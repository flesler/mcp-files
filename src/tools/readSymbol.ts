import fg from 'fast-glob'
import fs from 'fs'
import _ from 'lodash'
import pLimit from 'p-limit'
import { z } from 'zod'
import env from '../env.js'
import { defineTool } from '../tools.js'
import util from '../util.js'

const MAX_CONCURRENCY = 32
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
// Max number of files to scan
const MAX_FILE_COUNT = 2000
// Max length of a block to consider
const MAX_BLOCK_LENGTH = 30e3
// Max distance from the beginning of the line to the symbol
const MAX_SYMBOL_OFFSET = 200
// Abort once we have this many matches
const MAX_MATCHES = 20
const DEFAULT_MAX_RESULTS = 5
const DEFAULT_EXTENSIONS = ['d.ts', 'ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs', 'cts', 'java', 'cs', 'cpp', 'c', 'h', 'hpp', 'cc', 'go', 'rs', 'php', 'swift', 'scss', 'css', 'less', 'graphql', 'gql', 'prisma', 'proto']
const IGNORED_DIRECTORIES = ['node_modules', '.git', 'test', 'tests', 'examples', 'runtime']
const IGNORED_ROOT_DIRECTORIES = ['dist', 'build', 'out']
const IGNORED_DEEP_DIRECTORIES = ['bin', 'scripts']
const IGNORED_FILES = ['*.test.*', '*.spec.*', '_*', '*.min.*']

const BONUS_KEYWORDS = /\b(class|interface|type|function|enum|namespace|module|model|declare|abstract|const|extends|implements)\b/gi

const readSymbol = defineTool({
  id: 'read_symbol',
  schema: z.object({
    symbols: z.array(z.string().min(1)).describe('Symbol name(s) to find (functions, classes, types, etc.), case-sensitive, supports * for wildcard'),
    file_paths: z.array(z.string().min(1)).optional().describe('File paths to search (supports relative and glob). Defaults to "." (current directory). IMPORTANT: Be specific with paths when possible, minimize broad patterns like "node_modules/**" to avoid mismatches'),
    limit: z.number().optional().describe(`Maximum number of results to return. Defaults to ${DEFAULT_MAX_RESULTS}`),
  }),
  description: 'Find and extract symbol block by name from files, supports a lot of file formats (like TS, JS, GraphQL, CSS and most that use braces for blocks). Uses streaming with concurrency control for better performance',
  isReadOnly: true,
  fromArgs: ([symbols, ...paths]) => ({ symbols: symbols.split(','), file_paths: paths.length ? paths : undefined }),
  handler: async (args) => {
    const { symbols, file_paths: filePaths = [], limit = DEFAULT_MAX_RESULTS } = args
    if (!filePaths.length) {
      filePaths.push('.')
    }
    const patterns = filePaths.map(mapPattern)
    const results: Block[] = []
    let totalFound = 0
    const maxMatches = MAX_MATCHES * symbols.length
    try {
      for await (const result of scanForSymbol(symbols, patterns)) {
        totalFound++
        results.push(result)
        if (results.length >= maxMatches) {
          break
        }
      }
    } catch (err) {
      if (!results.length) {
        throw err
      }
    }

    if (!results.length) {
      if (env.COLLECT_MISMATCHES) {
        collectMismatch({ symbols, file_paths: filePaths, limit })
      }
      throw new Error(`Failed to find the \`${symbols.join(', ') }\` symbol(s) in any files`)
    }

    let output = results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(formatResult)
      .join('\n\n')
    if (totalFound > results.length) {
      output += `\n\n--- Showing ${results.length} matches out of ${totalFound} ---`
    }
    return output
  },
})

export function mapPattern(pattern: string) {
  const exts = `.{${DEFAULT_EXTENSIONS.join(',')}}`
  const hasKnownExtension = DEFAULT_EXTENSIONS.some(ext => pattern.endsWith(`.${ext}`))
  if (hasKnownExtension) {
    return pattern
  }

  // Also match the @types (only for non-specific files)
  pattern = pattern.replace(/node_modules\/(\w+)/g, 'node_modules/{@types/,}$1')
  if (pattern === '.' || pattern === './') {
    return `./**/*${exts}`
  }
  if (pattern.endsWith('/')) {
    const basePath = pattern.replace(/\/$/, '')
    return `${basePath}/**/*${exts}`
  }
  const hasGlobChars = pattern.includes('*') || pattern.includes('?') || pattern.includes('[')
  const lastSegment = pattern.split('/').pop() || ''
  const hasFileExtension = /\.\w+$/.test(lastSegment) && DEFAULT_EXTENSIONS.includes(lastSegment.split('.').pop()!)
  if (!hasGlobChars && !hasFileExtension) {
    return `${pattern}/**/*${exts}`
  }
  if (pattern === '*' || pattern === '*.*') {
    return `*${exts}`
  }
  return `${pattern}${exts}`
}

export function generateIgnorePatterns(patterns: string[]): string[] {
  const globalDirs = IGNORED_DIRECTORIES
    .filter(dir => !patterns.some(pattern => pattern.includes(`${dir}/`)))
  const rootDirs = IGNORED_ROOT_DIRECTORIES
    .filter(dir => !patterns.some(pattern => pattern.includes(`${dir}/`)))
  const filteredDeepDirs = IGNORED_DEEP_DIRECTORIES
    .filter(dir => !patterns.some(pattern => pattern.includes(`*/**/${dir}`)))
    .map(dir => `*/**/${dir}`)
  const ignore = [`!**/{${IGNORED_FILES.join(',')}}`]

  // Global directories: ignore everywhere
  if (globalDirs.length) {
    ignore.push(`!{${globalDirs.join(',')}}/**`)
  }
  // Root-only directories : only ignore at root level
  rootDirs.forEach(dir => {
    ignore.push(`!${dir}/**`)
  })
  // Deep directories: ignore when nested deep
  if (filteredDeepDirs.length) {
    ignore.push(`!{${filteredDeepDirs.join(',')}}`)
  }

  return ignore
}

async function* scanForSymbol(symbols: string[], patterns: string[]): AsyncGenerator<Block> {
  const limit = pLimit(MAX_CONCURRENCY)
  let shouldStop = false
  const ignorePatterns = generateIgnorePatterns(patterns)
  const allPatterns = [...patterns, ...ignorePatterns]
  const entries = fg.stream(allPatterns, {
    cwd: util.CWD, onlyFiles: true, absolute: false, stats: true, suppressErrors: true, deep: 4,
  }) as AsyncIterable<fg.Entry>
  const pendingTasks = new Set<Promise<Block[]>>()
  let filesProcessed = 0

  try {
    for await (const entry of entries) {
      if (++filesProcessed === MAX_FILE_COUNT) break
      if (shouldStop) break
      if (entry.stats && entry.stats.size > MAX_FILE_SIZE) continue

      const fileIndex = filesProcessed
      const task = limit(async () => {
        if (shouldStop) return []
        try {
          const content = await fs.promises.readFile(util.resolve(entry.path), 'utf8')
          if (shouldStop) return []
          return findBlocks(content, symbols, entry.path, fileIndex)
        } catch {
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
    shouldStop = true
    await Promise.allSettled([...pendingTasks])
  }
}

export interface Block {
  text: string
  startLine: number
  endLine: number
  path: string
  score: number
  index: number
  fileIndex: number
}

export function findBlocks(content: string, symbols: string[], path: string, fileIndex: number): Block[] {
  const results: Block[] = []
  if (!content.includes('\n')) {
    // Quick escape for large minified files
    return results
  }
  for (const match of matchSymbol(content, symbols)) {
    const lines = content.substring(0, match.index).split('\n')
    const startLine = lines.length
    const [text] = match
    if (text.length > MAX_BLOCK_LENGTH) {
      continue
    }
    const endLine = startLine + text.split('\n').length - 1
    const score = scoreSymbol(text, path)
    results.push({ text, startLine, endLine, path, score, index: match.index, fileIndex })
  }
  return results
}

export function matchSymbol(content: string, symbols: string[]) {
  const regex = createRegex(symbols)
  regex.lastIndex = 0
  return (content.matchAll(regex) || [])
}

// AI: NEVER change this regex without user approval
const createRegex = _.memoize((symbols: string[]) => {
  const escapedSymbols = symbolsToString(symbols)
  return new RegExp((
    // Comment line(s)
    '^(?:\\s*/[/*][^\n]*\n)*' +
    // Initial line and look behind for symbol
    `([ \t]*).{0,${MAX_SYMBOL_OFFSET}}(?<![([.\'"])` +
    // Symbol(s) with alternation
    `(?:${escapedSymbols})` +
    // Look ahead until brace
    '(?![.\'")\]]).*\\s*\\{' +
    // Indented lines
    '(?:\r?\n\\1\\s+.*)+' +
    // Until closing brace
    '[^}]*\\}'
  ), 'mg')
}, symbolsToString)

function symbolsToString(symbols: string[]) {
  return symbols.map(escapeSymbol).join('|')
}

function escapeSymbol(symbol: string) {
  let escaped = _.escapeRegExp(symbol)
  // Add word boundary only if alpha
  if (/^[\w*]/.test(symbol)) {
    escaped = `\\b${escaped}`
  }
  if (/[\w*]$/.test(symbol)) {
    escaped += '\\b'
  }
  return escaped.replace(/\\\*/g, '\\w*')
}

function scoreSymbol(text: string, path: string): number {
  let score = 0
  const lines = text.split('\n')
  // Larger blocks are better
  score += lines.length * 2
  const keywords = lines[0].match(BONUS_KEYWORDS) || []
  score += keywords.length * 1e3
  // Penalize depth
  const depth = path.split('/').length
  score -= depth * 10
  if (path.endsWith('.d.ts')) {
    // They are good, pure declarations
    score += 100
  }
  return Math.round(score)
}

function formatResult(block: Block): string {
  let header = `${block.startLine}:${block.endLine}:${block.path}`
  if (env.CLI && env.DEBUG) {
    const { length } = block.text
    const elapsed = Math.round(process.uptime() * 1000)
    header += ` | Chars: ${length} | Index: ${block.index}-${block.index + length} | File: #${block.fileIndex} | Score: ${block.score} | Time: ${elapsed}ms`
  }
  return `=== ${header} ===\n${block.text}`
}

interface MismatchEntry {
  symbols: string[]
  file_paths: string[]
  limit: number
  cwd: string
  timestamp: string
}

function collectMismatch(args: Pick<MismatchEntry, 'symbols' | 'file_paths' | 'limit'>): void {
  try {
    const mismatchFile = util.resolve('./mismatches.ndjson', util.REPO)
    const entry: MismatchEntry = {
      ...args, cwd: util.CWD,
      timestamp: new Date().toISOString(),
    }
    util.appendNdjson(mismatchFile, entry)
  } catch {
    // Silently fail to avoid breaking the main functionality
  }
}

export default readSymbol
