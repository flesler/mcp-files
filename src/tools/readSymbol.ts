import fg from 'fast-glob'
import fs from 'fs/promises'
import _ from 'lodash'
import pLimit from 'p-limit'
import { z } from 'zod'
import env from '../env.js'
import { defineTool } from '../tools.js'
import util from '../util.js'

const MAX_FILE_SIZE = 2 * 1024 * 1024
const MAX_CONCURRENCY = 32
const MAX_FILE_COUNT = 100
const MAX_MATCHES = 20
const DEFAULT_MAX_RESULTS = 5
const DEFAULT_EXTENSIONS = ['ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs', 'json', 'json5', 'java', 'cs', 'cpp', 'c', 'h', 'hpp', 'cc', 'go', 'rs', 'php', 'swift', 'scss', 'css', 'less', 'graphql', 'gql', 'prisma', 'proto', 'd.ts']
const IGNORED_DIRECTORIES = ['node_modules', 'dist', 'build', 'out', '.git', 'test', 'tests']
const IGNORED_FILES = ['package-lock.json', '*.test.*', '*.spec.*']

const BONUS_KEYWORDS = /\b(class|interface|type|function|enum|namespace|module|model|declare|abstract|const|extends|implements)\b/gi

const readSymbol = defineTool({
  id: 'read_symbol',
  schema: z.object({
    symbol: z.string().min(1).describe('Symbol name to find (functions, classes, types, etc.), case-sensitive'),
    file_paths: z.array(z.string().min(1)).optional().describe('File paths to search (supports relative and glob). Defaults to "." (current directory). IMPORTANT: Be specific with paths when possible, minimize broad patterns like "node_modules/**" to avoid mismatches'),
    limit: z.number().optional().describe(`Maximum number of results to return. Defaults to ${DEFAULT_MAX_RESULTS}`),
  }),
  description: 'Find and extract symbol block by name from files, supports a lot of file formats (like TS, JS, JSON, GraphQL and most that use braces for blocks). Uses streaming with concurrency control for better performance',
  isReadOnly: true,
  fromArgs: ([symbol, ...paths]) => ({ symbol, file_paths: paths.length ? paths : undefined }),
  handler: async (args) => {
    const { symbol, file_paths: filePaths = ['.'], limit = DEFAULT_MAX_RESULTS } = args
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
  const dirs = IGNORED_DIRECTORIES.filter(dir => !patterns.some(pattern => pattern.includes(dir)))
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
    cwd: util.CWD, onlyFiles: true, absolute: true, stats: true, suppressErrors: true, deep: 4,
  }) as AsyncIterable<fg.Entry>
  const pendingTasks = new Set<Promise<Block[]>>()
  let filesProcessed = 0

  try {
    for await (const entry of entries) {
      if (++filesProcessed === MAX_FILE_COUNT) {
        shouldStop = true
      }
      if (shouldStop) break
      if (entry.stats && entry.stats.size > MAX_FILE_SIZE) continue

      const task = limit(async () => {
        if (shouldStop) return []
        try {
          const content = await fs.readFile(entry.path, 'utf8')
          if (shouldStop) return []
          return findBlocks(content, symbol, entry.path)
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
}

export function findBlocks(content: string, symbol: string, path: string): Block[] {
  const regex = createRegex(symbol)
  const results: Block[] = []
  for (const match of content.matchAll(regex) || []) {
    const lines = content.substring(0, match.index).split('\n')
    const startLine = lines.length
    const matchLines = match[0].split('\n')
    const endLine = startLine + matchLines.length - 1
    const score = scoreSymbol(match[0])
    results.push({ text: match[0], startLine, endLine, path, score })
  }
  return results
}

export function matchSymbol(content: string, symbol: string): string[] {
  const regex = createRegex(symbol)
  return (content.match(regex) || [])
}

// AI: NEVER change this regex without user approval
const createRegex = _.memoize((symbol: string) => new RegExp(`^([ \t]*).*(?<![.[])\\b${_.escapeRegExp(symbol)}\\b(?![.'"\]])(.*)(\\n\\1)?{(?:\\n\\1\\s+.*)*[^}]*}`, 'mg'))

function scoreSymbol(text: string): number {
  let score = 0
  const lines = text.split('\n')
  if (lines.length > 2) {
    score += lines.length * 2
  } else {
    score -= 1e4
  }
  score += Math.min(text.length / 50, 10)
  const keywords = lines[0].match(BONUS_KEYWORDS) || []
  score += keywords.length * 1e3
  return Math.round(score)
}

function formatResult(block: Block): string {
  let header = `${block.startLine}:${block.endLine}:${block.path}`
  if (env.DEBUG) {
    header += ` (${block.score})`
  }
  return `=== ${header} ===\n${block.text}`
}

export default readSymbol
