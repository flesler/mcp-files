import { z } from 'zod'
import { defineTool } from '../tools.js'
import util from '../util.js'

const schema = z.object({
  file_path: z.string().min(1).describe('Path to the file (supports relative and absolute paths)'),
  line_number: z.number().int().min(1).describe('Line number where to insert the text (1-based)'),
  text: z.string().describe('Text to insert at the specified line'),
})

const insertText = defineTool({
  id: 'insert_text',
  schema,
  description: 'Insert text at a specific line number in a file. Line numbers are 1-based.',
  isReadOnly: false,
  isEnabled: false,
  fromArgs: ([filePath = '', lineNumber = '', text = '']: string[]) => ({
    file_path: filePath,
    line_number: parseInt(lineNumber, 10),
    text,
  }),
  handler: (args: z.infer<typeof schema>) => {
    const { file_path: filePath, line_number: lineNumber, text } = args
    const fullPath = util.resolve(filePath)
    const content = util.readFile(fullPath)
    const lines = content.split('\n')
    if (lineNumber > lines.length + 1) {
      throw new Error(`Line number ${lineNumber} is beyond file length (${lines.length} lines). Maximum allowed: ${lines.length + 1}`)
    }
    lines.splice(lineNumber - 1, 0, text)
    const newContent = lines.join('\n')
    util.writeFile(fullPath, newContent)
    return `Successfully inserted text at line ${lineNumber} in ${filePath}`
  },
})

export default insertText
