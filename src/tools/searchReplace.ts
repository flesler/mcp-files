import _ from 'lodash'
import { z } from 'zod'
import env from '../env.js'
import { defineTool } from '../tools.js'
import util from '../util.js'

const CONTEXT_LINES = 2

const ID = 'search_replace'
const searchReplace = defineTool({
  id: ID,
  name: `${env.OVERRIDE_S_R ? '': 'better_'}${ID}`,
  schema: z.object({
    file_path: z.string().min(1).describe('Path to the file (supports relative and absolute paths)'),
    old_string: z.string().min(1).describe('Exact text to replace (must be unique in file)'),
    new_string: z.string().describe('Replacement text'),
    allow_multiple_matches: z.boolean().optional().describe('Allow multiple matches to be replaced. If false, throws error when multiple matches found (default: true)'),
  }),
  description: 'Search and replace with intelligent whitespace handling and automation-friendly multiple match resolution. Tries exact match first, falls back to flexible whitespace matching only when no matches found.',
  isReadOnly: false,
  isEnabled: env.DEBUG,
  fromArgs: ([filePath = '', oldString = '', newString = '']) => ({
    file_path: filePath,
    old_string: oldString,
    new_string: newString,
  }),
  handler: (args) => {
    const { file_path: filePath, old_string: oldString, new_string: newString, allow_multiple_matches: allowMultiple = true } = args
    const fullPath = util.resolve(filePath)
    const content = util.readFile(fullPath)

    // Validate that the replacement would actually change something
    if (oldString.includes(newString)) {
      throw new Error(`Redundant replacement: old_string already contains new_string. Old: "${oldString}", New: "${newString}"`)
    }
    // Core strategies: exact match + whitespace flexibility (matching Cursor's capability)
    const patterns = [oldString, createCursorLikePattern(oldString)]
    // Try each strategy until one works
    for (const pattern of patterns) {
      const parts = content.split(pattern)
      const matches = parts.length - 1
      if (!matches) {
        continue
      }
      if (matches > 1 && !allowMultiple) {
        throw new Error(`Multiple matches found (${matches}) for "${oldString}" in ${filePath}. Set allow_multiple_matches=true to allow replacing first occurrence, or make your search string more specific.`)
      }
      const newContent = parts.join(newString)
      util.writeFile(fullPath, newContent)
      return formatDiff(content, newContent)
    }
    throw new Error(`Could not find the specified text in ${filePath}`)
  },
})

// Helper function for Cursor-like whitespace handling
function createCursorLikePattern(text: string) {
  // Match Cursor's whitespace handling: flexible with spaces/tabs, preserve structure
  return new RegExp(_.escapeRegExp(text)
    .replace(/\s+/g, '\\s+')           // Any whitespace sequence becomes flexible
    .replace(/^\s*/, '\\s*')           // Optional leading whitespace
    .replace(/\s*$/, '\\s*')           // Optional trailing whitespace
  , 'gm')
}



export default searchReplace

function formatDiff(original: string, updated: string): string {
  const originalLines = original.split('\n')
  const newLines = updated.split('\n')

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
  const displayStart = Math.max(0, startLine - CONTEXT_LINES)
  const displayEnd = Math.min(originalLines.length - 1, endLine + CONTEXT_LINES)
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

\`\`\`\n${diffLines.join('\n')}\n\`\`\``
}
