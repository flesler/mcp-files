import { z } from 'zod'
import { defineTool } from '../tools.js'
import util from '../util.js'

const CONTEXT_LINES = 2

const schema = z.object({
  file_path: z.string().min(1).describe('Path to the file'),
  from_line: z.number().int().min(1).describe('Starting line number (1-based)'),
  text: z.string().describe('Text to insert'),
  to_line: z.number().int().min(1).optional().describe('Replace up to this line number (1-based, inclusive). If omitted only inserts'),
})

const insertText = defineTool({
  id: 'insert_text',
  schema,
  description: util.trimLines(`
    Insert or replace text at precise line ranges in files
    - Ideal for direct line-number operations (from code citations like 12:15:file.ts) and large files where context-heavy editing is inefficient.
    - TIP: Combine with read_symbol to edit any symbol anywhere without knowing its file or line range!
  `),
  isReadOnly: false,
  fromArgs: ([filePath, fromLine, text, toLine]) => ({
    file_path: filePath, from_line: util.int(fromLine)!, text, to_line: util.int(toLine),
  }),
  handler: (args) => {
    const fullPath = util.resolve(args.file_path)
    const content = util.readFile(fullPath)
    const newContent = updateText(content, args.from_line, args.text, args.to_line)
    util.writeFile(fullPath, newContent)
    return getContext(newContent, args.from_line, args.text, fullPath)
  },
})

export default insertText

export function updateText(content: string, fromLine: number, text: string, toLine?: number): string {
  const endLine = toLine ?? fromLine
  if (endLine < fromLine) {
    throw new Error(`Invalid line range: to_line (${endLine}) cannot be less than from_line (${fromLine})`)
  }
  const lines = content === '' ? [] : content.split('\n')
  if (fromLine > lines.length + 1) {
    throw new Error(`from_line ${fromLine} is beyond file length (${lines.length} lines). Maximum allowed: ${lines.length + 1}`)
  }
  if (toLine && endLine > lines.length) {
    throw new Error(`to_line ${endLine} is beyond file length (${lines.length} lines). Maximum allowed: ${lines.length}`)
  }
  const linesToRemove = toLine ? (endLine - fromLine + 1) : 0
  const newLines = text.split('\n')
  lines.splice(fromLine - 1, linesToRemove, ...newLines)
  return lines.join('\n')
}

function getContext(content: string, fromLine: number, text: string, path: string): string {
  const lines = content.split('\n')
  const newLines = text.split('\n')
  // Show from_line - 2 to from_line + newLines.length + 2
  const startLine = Math.max(0, fromLine - 1 - CONTEXT_LINES)
  const endLine = Math.min(lines.length, fromLine - 1 + newLines.length + CONTEXT_LINES)
  const header = `=== ${startLine + 1}:${endLine + 1}:${path} ===`
  return `${header}\n${lines.slice(startLine, endLine).join('\n')}`
}
