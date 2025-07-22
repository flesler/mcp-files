import { env } from 'process'
import { z } from 'zod'
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
    const content = util.readResolvedFile(filePath)
    const fullPath = util.resolveAndValidateFile(filePath)
    if (content.includes(oldString)) {
      const newContent = content.replace(oldString, newString)
      writeWithValidation(fullPath, newContent, newString, filePath)
      return formatDiff(oldString, newString)
    }
    const normalizedSearch = normalizeWhitespace(oldString)
    let bestMatch: { start: number; end: number } | null = null
    for (let start = 0; start < content.length; start++) {
      for (let end = start + Math.floor(oldString.length * 0.5); end <= start + Math.floor(oldString.length * 3); end++) {
        if (end > content.length) break
        const candidate = content.substring(start, end)
        const normalizedCandidate = normalizeWhitespace(candidate)
        if (normalizedCandidate === normalizedSearch) {
          bestMatch = { start, end }
          break
        }
      }
      if (bestMatch) break
    }
    if (bestMatch) {
      const originalText = content.substring(bestMatch.start, bestMatch.end)
      const newContent = content.substring(0, bestMatch.start) + newString + content.substring(bestMatch.end)
      writeWithValidation(fullPath, newContent, newString, filePath)
      return formatDiff(originalText, newString)
    }
    const suggestions = findSimilarStrings(content, oldString)
    let errorMsg = `Could not find the specified text in ${filePath}`
    if (suggestions.length > 0) {
      errorMsg += '\n\nSimilar text found:'
      suggestions.slice(0, 3).forEach((suggestion, i) => {
        errorMsg += `\n${i + 1}. ${JSON.stringify(suggestion.text)} (${suggestion.similarity}% match)`
      })
    }
    throw new Error(errorMsg)
  },
})

export default searchReplace

function formatDiff(oldText: string, newText: string): string {
  return `The following diff was applied to the file:

\`\`\`
- ${oldText}
+ ${newText}
\`\`\``
}

function writeWithValidation(filePath: string, content: string, expectedString: string, _originalPath: string): void {
  if (!content.includes(expectedString)) {
    throw new Error(`REPLACEMENT FAILED: "${expectedString}" not found in final content. File NOT modified.`)
  }
  util.writeFile(filePath, content)
}

function normalizeWhitespace(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\s+/g, ' ')
    .replace(/\(\s*\)/g, '()')
    .replace(/\{\s*\}/g, '{}')
    .replace(/\[\s*\]/g, '[]')
    .trim()
}

interface SimilarString {
  text: string
  similarity: number
  position: number
}

function findSimilarStrings(content: string, searchString: string): SimilarString[] {
  const searchLength = searchString.length
  const contentLength = content.length
  const results: SimilarString[] = []
  const minLength = Math.max(searchLength * 0.7, 10)
  const maxLength = Math.min(searchLength * 1.3, contentLength)
  for (let i = 0; i <= contentLength - minLength; i++) {
    for (let len = minLength; len <= maxLength && i + len <= contentLength; len++) {
      const substring = content.substring(i, i + len)
      const similarity = calculateSimilarity(searchString, substring)
      if (similarity > 70) {
        results.push({ text: substring, similarity: Math.round(similarity), position: i })
      }
    }
  }
  return results
    .sort((a, b) => b.similarity - a.similarity)
    .filter((item, index, arr) => index === 0 || arr[index - 1]?.text !== item.text)
}

function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1
  if (longer.length === 0) return 100
  const editDistance = levenshteinDistance(longer, shorter)
  return ((longer.length - editDistance) / longer.length) * 100
}


function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = Array(str2.length + 1).fill(0).map(() => Array(str1.length + 1).fill(0))
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator,
      )
    }
  }
  return matrix[str2.length][str1.length]
}
