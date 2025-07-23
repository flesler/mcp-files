import _ from 'lodash'
import { z } from 'zod'
import env from '../env.js'
import { defineTool } from '../tools.js'
import util from '../util.js'

const ID = 'search_replace'
const searchReplace = defineTool({
  id: ID,
  name: `${env.OVERRIDE_S_R ? '': 'better_'}${ID}`,
  schema: z.object({
    file_path: z.string().min(1).describe('Path to the file (supports relative and absolute paths)'),
    old_string: z.string().min(1).describe('Exact text to replace (must be unique in file)'),
    new_string: z.string().describe('Replacement text'),
  }),
  description: 'Search and replace with intelligent whitespace handling and automation-friendly multiple match resolution. Tries exact match first, falls back to flexible whitespace matching.',
  isReadOnly: false,
  fromArgs: ([filePath = '', oldString = '', newString = '']) => ({
    file_path: filePath,
    old_string: oldString,
    new_string: newString,
  }),
  handler: (args) => {
    const { file_path: filePath, old_string: oldString, new_string: newString } = args
    const fullPath = util.resolve(filePath)
    const content = util.readFile(fullPath)

    // Core strategies: exact match + whitespace flexibility (matching Cursor's capability)
    const strategies = [
      {
        name: 'exact',
        pattern: oldString,
        isRegex: false,
      },
      {
        name: 'whitespace_flexible',
        pattern: createCursorLikePattern(oldString),
        isRegex: true,
      },
    ]

    let foundMatch = false
    let newContent = content
    let usedStrategy = ''
    let matchDetails = ''

    for (const strategy of strategies) {
      try {
        if (strategy.isRegex) {
          const regex = new RegExp(strategy.pattern, 'gm')
          const matches = content.match(regex)

          if (matches && matches.length === 1) {
            // Exactly one match found
            newContent = content.replace(regex, newString)
            foundMatch = true
            usedStrategy = strategy.name
            matchDetails = `Found 1 match using ${strategy.name} strategy`
            break
          } else if (matches && matches.length > 1) {
            // Multiple matches - this is ambiguous, try next strategy
            continue
          }
        } else {
          // Simple string matching
          if (content.includes(strategy.pattern)) {
            const occurrences = (content.match(new RegExp(_.escapeRegExp(strategy.pattern), 'g')) || []).length

            if (occurrences === 1) {
              // Single match - proceed
              newContent = content.replace(strategy.pattern, newString)
              foundMatch = true
              usedStrategy = strategy.name
              matchDetails = `Found 1 match using ${strategy.name} strategy`
              break
            } else if (occurrences > 1) {
              // Multiple matches - this is our core value: proceed with first match
              newContent = content.replace(strategy.pattern, newString)
              foundMatch = true
              usedStrategy = strategy.name
              matchDetails = `Found ${occurrences} matches, replaced first occurrence using ${strategy.name} strategy`
              break
            }
          }
        }
      } catch (error) {
        // Strategy failed, try next one
        continue
      }
    }

    if (!foundMatch) {
      const searchableContent = content.length > 500 ? content.substring(0, 500) + '...' : content
      throw new Error(`Could not find the specified text in ${filePath}. Tried all strategies:\n` +
        `- Original text: "${oldString}"\n` +
        `- File content preview: "${searchableContent.replace(/\n/g, '\\n')}"`)
    }

    // Verify the replacement was successful
    if (!newContent.includes(newString) && newString.length > 0) {
      throw new Error(`REPLACEMENT FAILED: "${newString}" not found in final content. File NOT modified.`)
    }

    util.writeFile(fullPath, newContent)
    return formatDiff(content, newContent, usedStrategy, matchDetails)
  },
})

// Helper function for Cursor-like whitespace handling
function createCursorLikePattern(text: string): string {
  // Match Cursor's whitespace handling: flexible with spaces/tabs, preserve structure
  return _.escapeRegExp(text)
    .replace(/\s+/g, '\\s+')           // Any whitespace sequence becomes flexible
    .replace(/^\s*/, '\\s*')           // Optional leading whitespace
    .replace(/\s*$/, '\\s*')           // Optional trailing whitespace
}



export default searchReplace

function formatDiff(original: string, updated: string, strategy?: string, details?: string): string {
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

  let result = 'The following diff was applied to the file:'
  if (strategy && details) {
    result += `\n\n🎯 ${details}`
  }

  result += `\n\n\`\`\`\n${diffLines.join('\n')}\n\`\`\``

  return result
}
