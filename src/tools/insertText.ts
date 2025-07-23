import { z } from 'zod'
import { defineTool } from '../tools.js'
import util from '../util.js'

const schema = z.object({
  file_path: z.string().min(1).describe('Path to the file'),
  from_line: z.number().int().min(1).describe('Starting line number (1-based)'),
  text: z.string().describe('Text to insert'),
  to_line: z.number().int().min(1).optional().describe('Replace up to this line number (1-based, inclusive). If omitted only inserts'),
})

type UpdateTextArgs = Omit<z.infer<typeof schema>, 'file_path'>

const insertText = defineTool({
  id: 'insert_text',
  schema,
  description: util.trimLines(`
    Insert or replace text at precise line ranges in files
    - Ideal for direct line-number operations (from code citations like 12:15:file.ts) and large files where context-heavy editing is inefficient.
    - TIP: Combine with read_symbol to edit any symbol anywhere without knowing its file or line range!
  `),
  isReadOnly: false,
  fromArgs: ([filePath = '', fromLine = '', text = '', toLine = '']) => ({
    file_path: filePath, from_line: parseInt(fromLine, 10), text, to_line: toLine ? parseInt(toLine, 10) : undefined,
  }),
  handler: (args) => {
    const { file_path: filePath, ...updateArgs } = args
    const fullPath = util.resolve(filePath)
    const content = util.readFile(fullPath)
    const newContent = updateText(content, updateArgs)
    util.writeFile(fullPath, newContent)
    const newLines = updateArgs.text.split('\n')
    if (updateArgs.to_line) {
      return `Successfully replaced lines ${updateArgs.from_line}-${updateArgs.to_line} with ${newLines.length} line(s) in ${filePath}`
    } else {
      return `Successfully inserted ${newLines.length} line(s) at line ${updateArgs.from_line} in ${filePath}`
    }
  },
})

export default insertText

export function updateText(content: string, args: UpdateTextArgs): string {
  const { from_line: fromLine, text, to_line: toLine } = args
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
