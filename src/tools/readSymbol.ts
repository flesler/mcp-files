import fg from 'fast-glob'
import fs from 'fs/promises'
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
const MAX_BLOCK_LENGTH = 15e3
// Max distance from the beginning of the line to the symbol
const MAX_SYMBOL_OFFSET = 200
// Abort once we have this many matches
const MAX_MATCHES = 20
const DEFAULT_MAX_RESULTS = 5
const DEFAULT_EXTENSIONS = ['d.ts', 'ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs', 'cts', 'java', 'cs', 'cpp', 'c', 'h', 'hpp', 'cc', 'go', 'rs', 'php', 'swift', 'scss', 'css', 'less', 'graphql', 'gql', 'prisma', 'proto']
const IGNORED_DIRECTORIES = ['node_modules', 'dist', 'build', 'out', '.git']
const IGNORED_DEEP_DIRECTORIES = ['test', 'tests', 'examples', 'bin', 'runtime']
const IGNORED_FILES = ['*.test.*', '*.spec.*', '_*', '*.min.*']

const BONUS_KEYWORDS = /\b(class|interface|type|function|enum|namespace|module|model|declare|abstract|const|extends|implements)\b/gi

const readSymbol = defineTool({
  id: 'read_symbol',
  schema: z.object({
    symbol: z.string().min(1).describe('Symbol name to find (functions, classes, types, etc.), case-sensitive, supports * for wildcard'),
    file_paths: z.array(z.string().min(1)).optional().describe('File paths to search (supports relative and glob). Defaults to "." (current directory). IMPORTANT: Be specific with paths when possible, minimize broad patterns like "node_modules/**" to avoid mismatches'),
    limit: z.number().optional().describe(`Maximum number of results to return. Defaults to ${DEFAULT_MAX_RESULTS}`),
  }),
  description: 'Find and extract symbol block by name from files, supports a lot of file formats (like TS, JS, GraphQL, CSS and most that use braces for blocks). Uses streaming with concurrency control for better performance',
  isReadOnly: true,
  fromArgs: ([symbol, ...paths]) => ({ symbol, file_paths: paths.length ? paths : undefined }),
  handler: async (args) => {
    const { symbol, file_paths: filePaths = [], limit = DEFAULT_MAX_RESULTS } = args
    if (!filePaths.length) {
      filePaths.push('.')
    }
    const patterns = filePaths.map(mapPattern)
    const results: Block[] = []
    let totalFound = 0
    try {
      for await (const result of scanForSymbol(symbol, patterns)) {
        totalFound++
        results.push(result)
        if (results.length >= MAX_MATCHES) {
          break
        }
      }
    } catch (err) {
      if (!results.length) {
        throw err
      }
    }

    if (!results.length) {
      throw new Error(`Failed to find the \`${symbol}\` symbol in any files`)
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
  // Also match the @types
  pattern = pattern.replace(/node_modules\/(\w+)/g, 'node_modules/{@types/,}$1')

  const exts = `.{${DEFAULT_EXTENSIONS.join(',')}}`
  const hasKnownExtension = DEFAULT_EXTENSIONS.some(ext => pattern.endsWith(`.${ext}`))
  if (hasKnownExtension) {
    return pattern
  }
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
  const dirs = IGNORED_DIRECTORIES
    .concat(IGNORED_DEEP_DIRECTORIES.map(dir => `**/${dir}`))
    .filter(dir => !patterns.some(pattern => pattern.includes(dir)))
  const ignore = [`!**/{${IGNORED_FILES.join(',')}}`]
  if (dirs.length) {
    ignore.push(`!{${dirs.join(',')}}/**`)
  }
  return ignore
}

async function* scanForSymbol(symbol: string, patterns: string[]): AsyncGenerator<Block> {
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
          const content = await fs.readFile(util.resolve(entry.path), 'utf8')
          if (shouldStop) return []
          return findBlocks(content, symbol, entry.path, fileIndex)
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

export function findBlocks(content: string, symbol: string, path: string, fileIndex: number): Block[] {
  const results: Block[] = []
  if (!content.includes('\n')) {
    // Quick escape for large minified files
    return results
  }
  for (const match of matchSymbol(content, symbol)) {
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


export function matchSymbol(content: string, symbol: string) {
  const regex = createRegex(symbol)
  regex.lastIndex = 0
  return (content.matchAll(regex) || [])
}

// AI: NEVER change this regex without user approval
const createRegex = _.memoize((symbol: string) => new RegExp((
  // Comment line(s)
  '^(?:\\s*/[/*][^\n]*\n)*' +
  // Initial line and look behind for symbol
  `([ \t]*).{0,${MAX_SYMBOL_OFFSET}}(?<![([.\'"])` +
  // Symbol
  escapeSymbol(symbol) +
  // Look ahead until brace
  '(?![.\'")\]]).*\\s*\\{' +
  // Indented lines
  '(?:\r?\n\\1\\s+.*)+' +
  // Until closing brace
  '[^}]*\\}'
), 'mg'))

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

export default readSymbol
