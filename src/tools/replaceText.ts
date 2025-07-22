import path from 'path'
import { z } from 'zod'
import { ToolConfig } from '../types.js'
import util from '../util.js'

const schema = z.object({
  file_path: z.string().min(1).describe('Path to the file to modify (supports relative paths, absolute preferred)'),
  old_string: z.string().min(1).describe('Exact text to replace (must be unique in file)'),
  new_string: z.string().describe('Replacement text'),
})

const replaceTextTool: ToolConfig = {
  name: 'replace_text',
  schema,
  description: 'Search and replace text in files with improved whitespace handling and clear error messages.',
  isReadOnly: false,
  handler: (args: z.infer<typeof schema>) => {
    const { file_path, old_string, new_string } = args
    const fullPath = path.resolve(file_path)
    const content = util.readResolvedFile(file_path)

    // First try exact match
    if (content.includes(old_string)) {
      const newContent = content.replace(old_string, new_string)
      writeWithValidation(fullPath, newContent, new_string, file_path)
      return `Successfully replaced text in ${file_path}`
    }

    // Try flexible whitespace matching - find text that normalizes to the same thing
    const normalizedSearch = normalizeWhitespace(old_string)
    let bestMatch: { start: number; end: number } | null = null

    // Search through all possible substrings
    for (let start = 0; start < content.length; start++) {
      for (let end = start + Math.floor(old_string.length * 0.5); end <= start + Math.floor(old_string.length * 3); end++) {
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
      // RUTHLESS replacement: insert new_string exactly as provided
      const newContent = content.substring(0, bestMatch.start) +
                        new_string +
                        content.substring(bestMatch.end)
      writeWithValidation(fullPath, newContent, new_string, file_path)
      return `Successfully replaced text in ${file_path} (flexible whitespace match)`
    }

    const suggestions = findSimilarStrings(content, old_string)
    let errorMsg = `Could not find the specified text in ${file_path}`

    if (suggestions.length > 0) {
      errorMsg += '\n\nSimilar text found:'
      suggestions.slice(0, 3).forEach((suggestion, i) => {
        errorMsg += `\n${i + 1}. ${JSON.stringify(suggestion.text)} (${suggestion.similarity}% match)`
      })
    }

    return errorMsg
  },
}

export default replaceTextTool

function writeWithValidation(filePath: string, content: string, expectedString: string, _originalPath: string): void {
  // RUTHLESS VALIDATION: Ensure expectedString is actually in the final content BEFORE writing
  if (!content.includes(expectedString)) {
    throw new Error(`REPLACEMENT FAILED: "${expectedString}" not found in final content. File NOT modified.`)
  }

  // Only write if validation passes
  util.writeFile(filePath, content)
}

function normalizeWhitespace(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\s+/g, ' ')     // ALL whitespace (spaces, tabs, newlines) -> single space
    .replace(/\(\s*\)/g, '()') // Empty parentheses: ( ) -> ()
    .replace(/\{\s*\}/g, '{}') // Empty braces: { } -> {}
    .replace(/\[\s*\]/g, '[]') // Empty brackets: [ ] -> []
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
    .filter((item, index, arr) => index === 0 || arr[index - 1].text !== item.text)
}

function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1
  if (longer.length === 0) return 100
  const editDistance = levenshteinDistance(longer, shorter)
  return ((longer.length - editDistance) / longer.length) * 100
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null))

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
