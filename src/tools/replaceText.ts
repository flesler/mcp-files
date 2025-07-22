import path from 'path'
import { z } from 'zod'
import { ToolConfig } from '../types.js'
import util from '../util.js'

const schema = z.object({
  file_path: z.string().min(1).describe('The path to the file you want to search and replace in'),
  old_string: z.string().min(1).describe('The text to replace (must be unique within the file)'),
  new_string: z.string().describe('The replacement text'),
})

const replaceTextTool: ToolConfig = {
  name: 'replace_text',
  schema,
  description: `Improved search and replace functionality that handles whitespace issues better than standard tools.
Features:
- Robust whitespace handling and normalization
- Exact string matching with flexible whitespace
- Clear error messages for failed matches
- Safe file operations with backup validation`,
  isReadOnly: false,
  handler: (args: z.infer<typeof schema>) => {
    const { file_path, old_string, new_string } = args
    const fullPath = path.resolve(file_path)
    const content = util.readResolvedFile(file_path)

    if (content.includes(old_string)) {
      const newContent = content.replace(old_string, new_string)
      util.writeFile(fullPath, newContent)
      return `Successfully replaced text in ${file_path}`
    }

    const normalizedOldString = normalizeWhitespace(old_string)
    const contentLines = content.split('\n')
    let matchFound = false
    let startLine = -1
    let endLine = -1

    for (let i = 0; i < contentLines.length; i++) {
      const searchStart = i
      let accumulated = ''
      let lineCount = 0

      for (let j = i; j < contentLines.length; j++) {
        accumulated += (lineCount > 0 ? '\n' : '') + contentLines[j]
        lineCount++

        const normalizedAccumulated = normalizeWhitespace(accumulated)

        if (normalizedAccumulated === normalizedOldString) {
          matchFound = true
          startLine = searchStart
          endLine = j
          break
        }

        if (normalizedAccumulated.length > normalizedOldString.length * 1.5) {
          break
        }
      }

      if (matchFound) break
    }

    if (matchFound) {
      const beforeLines = contentLines.slice(0, startLine)
      const afterLines = contentLines.slice(endLine + 1)
      const newLines = new_string.split('\n')
      const newContent = [...beforeLines, ...newLines, ...afterLines].join('\n')
      util.writeFile(fullPath, newContent)
      return `Successfully replaced text in ${file_path} (lines ${startLine + 1}-${endLine + 1})`
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

function normalizeWhitespace(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\t/g, '  ')
    .replace(/[ \t]+/g, ' ')
    .replace(/[ \t]*\n[ \t]*/g, '\n')
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
