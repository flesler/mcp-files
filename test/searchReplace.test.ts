import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import searchReplace from '../src/tools/searchReplace.js'
import util from '../src/util.js'

// Module variables to store mock file content and track calls
let mockFileContent = ''
let lastReadPath = ''
let lastWritePath = ''

interface TestCase {
  name: string
  source: string
  oldString: string
  newString: string
  expected: string
}

interface FailureTestCase {
  name: string
  source: string
  oldString: string
  newString: string
  expectedError?: string
}

describe('searchReplace tool', () => {
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

  const testCases: TestCase[] = [
    {
      name: 'Simple substring replacement',
      source: 'Hello world',
      oldString: 'world',
      newString: 'universe',
      expected: 'Hello universe',
    },
    {
      name: 'Multi-line function replacement',
      source: `function oldName() {
  return 'test'
}`,
      oldString: 'function oldName() {',
      newString: 'function newName() {',
      expected: `function newName() {
  return 'test'
}`,
    },
    {
      name: 'Multi-line with context',
      source: `const data = {
  method() {
    return 'old'
  }
}`,
      oldString: `method() {
    return 'old'
  }`,
      newString: `method() {
    return 'new'
  }`,
      expected: `const data = {
  method() {
    return 'new'
  }
}`,
    },
    {
      name: 'Beginning of file replacement',
      source: `// Old header
const value = 42`,
      oldString: '// Old header',
      newString: '// New header',
      expected: `// New header
const value = 42`,
    },
    {
      name: 'End of file replacement',
      source: `const value = 42
// Old footer`,
      oldString: '// Old footer',
      newString: '// New footer',
      expected: `const value = 42
// New footer`,
    },
    {
      name: 'Exact string match with spaces',
      source: 'const old value = 123',
      oldString: 'old value',
      newString: 'new value',
      expected: 'const new value = 123',
    },
    {
      name: 'Complex object replacement',
      source: `const config = {
  database: {
    host: 'localhost',
    port: 5432
  },
  cache: {
    ttl: 300
  }
}`,
      oldString: `database: {
    host: 'localhost',
    port: 5432
  }`,
      newString: `database: {
    host: 'production-db',
    port: 5432,
    ssl: true
  }`,
      expected: `const config = {
  database: {
    host: 'production-db',
    port: 5432,
    ssl: true
  },
  cache: {
    ttl: 300
  }
}`,
    },
  ]

  const expectedFailureTestCases: FailureTestCase[] = [
    {
      name: 'String not found in file',
      source: 'const value = 42',
      oldString: 'nonexistent string',
      newString: 'replacement',
      expectedError: 'Could not find the specified text',
    },
    {
      name: 'Multiple occurrences of string',
      source: `const test = 'value'
const another = 'value'
const third = 'value'`,
      oldString: '\'value\'',
      newString: '\'newValue\'',
      expectedError: 'Multiple matches found',
    },
  ]

  describe('successful replacements', () => {
    testCases.forEach((testCase) => {
      it(testCase.name, async () => {
        mockFileContent = testCase.source
        const testPath = '/mock/path/test.ts'

        const result = await searchReplace.handler({
          file_path: testPath,
          old_string: testCase.oldString,
          new_string: testCase.newString,
        })

        expect(lastReadPath).toBe(testPath)
        expect(lastWritePath).toBe(testPath)
        expect(mockFileContent).toBe(testCase.expected)
        expect(result).toContain(testCase.expected.split('\n')[0])
      })
    })
  })

  describe('expected failure cases', () => {
    expectedFailureTestCases.forEach((testCase) => {
      it(testCase.name, async () => {
        mockFileContent = testCase.source
        const testPath = '/mock/path/test.ts'

        if (testCase.expectedError) {
          let errorThrown = false
          try {
            await searchReplace.handler({
              file_path: testPath,
              old_string: testCase.oldString,
              new_string: testCase.newString,
              allow_multiple_matches: false,
            })
          } catch (error: any) {
            expect(error.message).toContain(testCase.expectedError)
            errorThrown = true
          }
          expect(errorThrown).toBe(true)
          expect(lastReadPath).toBe(testPath)
          // writeFile should not be called when there's an error
          expect(lastWritePath).toBe('')
        } else {
          const result = await searchReplace.handler({
            file_path: testPath,
            old_string: testCase.oldString,
            new_string: testCase.newString,
          })
          expect(result).toBeTruthy()
          expect(lastReadPath).toBe(testPath)
          expect(lastWritePath).toBe(testPath)
        }
      })
    })
  })
})
