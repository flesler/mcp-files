import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import insertText, { updateText } from '../src/tools/insertText.js'
import util from '../src/util.js'

// Module variables to store mock file content and track calls
let mockFileContent = ''
let lastReadPath = ''
let lastWritePath = ''

describe('insertText tool', () => {
  describe('updateText function', () => {
    it('should insert at beginning', () => {
      const result = updateText('line 1\nline 2\nline 3', 1, 'inserted line')
      expect(result).toBe('inserted line\nline 1\nline 2\nline 3')
    })

    it('should insert in middle', () => {
      const result = updateText('line 1\nline 2\nline 3', 2, 'inserted middle')
      expect(result).toBe('line 1\ninserted middle\nline 2\nline 3')
    })

    it('should insert at end (appending)', () => {
      const result = updateText('line 1\nline 2\nline 3', 4, 'appended line')
      expect(result).toBe('line 1\nline 2\nline 3\nappended line')
    })

    it('should replace single line', () => {
      const result = updateText('line 1\nline 2\nline 3', 2, 'replaced line', 2)
      expect(result).toBe('line 1\nreplaced line\nline 3')
    })

    it('should handle multi-line insertion', () => {
      const result = updateText('line 1\nline 2\nline 3', 2, 'inserted line A\ninserted line B')
      expect(result).toBe('line 1\ninserted line A\ninserted line B\nline 2\nline 3')
    })

    it('should handle multi-line replacement', () => {
      const result = updateText('line 1\nline 2\nline 3\nline 4', 2, 'replaced A\nreplaced B', 3)
      expect(result).toBe('line 1\nreplaced A\nreplaced B\nline 4')
    })

    it('should handle empty file insertion', () => {
      const result = updateText('', 1, 'first line')
      expect(result).toBe('first line')
    })

    it('should handle single line file insertion at end', () => {
      const result = updateText('only line', 2, 'second line')
      expect(result).toBe('only line\nsecond line')
    })

    it('should throw error for from_line too high', () => {
      expect(() => updateText('line 1\nline 2', 5, 'text')).toThrow()
    })

    it('should throw error for invalid line range', () => {
      expect(() => updateText('line 1\nline 2\nline 3', 3, 'text', 2)).toThrow()
    })

    it('should handle empty text insertion', () => {
      const result = updateText('line 1\nline 2\nline 3', 2, '')
      expect(result).toBe('line 1\n\nline 2\nline 3')
    })

    it('should replace range with fewer lines', () => {
      const result = updateText('line 1\nline 2\nline 3\nline 4\nline 5', 2, 'single replacement', 4)
      expect(result).toBe('line 1\nsingle replacement\nline 5')
    })

    it('should replace single line with multiple lines', () => {
      const result = updateText('line 1\nline 2\nline 3', 2, 'new line A\nnew line B\nnew line C', 2)
      expect(result).toBe('line 1\nnew line A\nnew line B\nnew line C\nline 3')
    })
  })

  describe('insertText tool integration', () => {
    beforeEach(() => {
      // Mock util.readFile and util.writeFile with path tracking
      vi.spyOn(util, 'readFile').mockImplementation((path) => {
        lastReadPath = path
        return mockFileContent
      })
      vi.spyOn(util, 'writeFile').mockImplementation((path, content) => {
        lastWritePath = path
        mockFileContent = content
      })
    })

    afterEach(() => {
      vi.restoreAllMocks()
      mockFileContent = ''
      lastReadPath = ''
      lastWritePath = ''
    })

    it('should handle file I/O operations', async () => {
      mockFileContent = 'test content\nline 2\nline 3'
      const testPath = '/mock/path/test.txt'

      const result = await insertText.handler({
        file_path: testPath,
        from_line: 2,
        text: 'inserted content',
      })

      expect(lastReadPath).toBe(testPath)
      expect(lastWritePath).toBe(testPath)
      expect(mockFileContent).toBe('test content\ninserted content\nline 2\nline 3')
      expect(result).toContain('test content')
    })

    it('should support relative path', async () => {
      mockFileContent = 'original content'
      const relativePath = 'relative/path/test.txt'
      const expectedResolvedPath = util.resolve(relativePath)

      const result = await insertText.handler({
        file_path: relativePath,
        from_line: 1,
        text: 'new first line',
      })

      expect(lastReadPath).toBe(expectedResolvedPath)
      expect(lastWritePath).toBe(expectedResolvedPath)
      expect(mockFileContent).toBe('new first line\noriginal content')
      expect(result).toContain('new first line')
    })
  })
})
