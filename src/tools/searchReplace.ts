import _ from 'lodash'
import { z } from 'zod'
import env from '../env.js'
import { defineTool } from '../tools.js'
import util from '../util.js'

const schema = z.object({
  file_path: z.string().min(1).describe('Path to the file (supports relative and absolute paths)'),
  old_string: z.string().min(1).describe('Exact text to replace (must be unique in file)'),
  new_string: z.string().describe('Replacement text'),
})

const ID = 'search_replace'
const searchReplace = defineTool({
  id: ID,
  name: `${env.OVERRIDE_S_R ? '': 'better_'}${ID}`,
  schema,
  description: 'Search and replace text in files with improved whitespace handling and clear error messages.',
  isReadOnly: false,
  fromArgs: ([filePath = '', oldString = '', newString = '']: string[]) => ({
    file_path: filePath,
    old_string: oldString,
    new_string: newString,
  }),
  handler: (args: z.infer<typeof schema>) => {
    const { file_path: filePath, old_string: oldString, new_string: newString } = args
    const fullPath = util.resolve(filePath, util.CWD)
    const content = util.readFile(fullPath)
    let pattern = oldString
    if (!content.includes(pattern)) {
      pattern = _.escapeRegExp(pattern).replace(/^[ \t]+|[ \t]+$/mg, '\\s*')
    }
    if (content.includes(pattern)) {
      const newContent = content.replace(pattern, newString)
      if (!newContent.includes(newString)) {
        throw new Error(`REPLACEMENT FAILED: "${newString}" not found in final content. File NOT modified.`)
      }
      util.writeFile(fullPath, newContent)
      return formatDiff(oldString, newString, content, newContent)
    }
    throw new Error(`Could not find the specified text in ${filePath}`)
  },
})

export default searchReplace

function formatDiff(oldText: string, newText: string, originalContent: string, newContent: string): string {
  const originalLines = originalContent.split('\n')
  const newLines = newContent.split('\n')

  // Find the range of lines that changed
  let startLine = -1
  let endLine = -1

  for (let i = 0; i < Math.max(originalLines.length, newLines.length); i++) {
    if (originalLines[i] !== newLines[i]) {
      if (startLine === -1) startLine = i
      endLine = i
    }
  }

  if (startLine === -1) {
    throw new Error('Could not generate a diff for changes to the file')
  }

  // Generate diff with context
  const contextLines = 2
  const displayStart = Math.max(0, startLine - contextLines)
  const displayEnd = Math.min(originalLines.length - 1, endLine + contextLines)

  const diffLines: string[] = []

  for (let i = displayStart; i <= displayEnd; i++) {
    const oldLine = originalLines[i] || ''
    const newLine = newLines[i] || ''

    if (i < startLine || i > endLine) {
      // Context line
      diffLines.push(`  ${oldLine}`)
    } else if (oldLine !== newLine) {
      // Changed line
      if (oldLine) diffLines.push(`- ${oldLine}`)
      if (newLine) diffLines.push(`+ ${newLine}`)
    } else {
      // Unchanged line within change range
      diffLines.push(`  ${oldLine}`)
    }
  }

  return `The following diff was applied to the file:

\`\`\`
${diffLines.join('\n')}
\`\`\``
}
