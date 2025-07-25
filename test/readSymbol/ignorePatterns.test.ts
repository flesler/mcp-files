import { describe, expect, it } from 'vitest'
import { generateIgnorePatterns } from '../../src/tools/readSymbol.js'

interface TestCase {
  description: string
  input: string[]
  expected: string[]
}

describe('readSymbol tool', () => {
  describe('generateIgnorePatterns function', () => {
    const NEGATIVE_FILES = '!**/{*.test.*,*.spec.*,_*,*.min.*}'
    const DEFAULT_IGNORED_DIRS = '{node_modules,dist,build,out,.git,**/test,**/tests,**/examples,**/bin,**/runtime}'

    const testCases: TestCase[] = [
      {
        description: 'Should ignore all default directories when none specified',
        input: ['src/**/*.ts'],
        expected: [NEGATIVE_FILES, `!${DEFAULT_IGNORED_DIRS}/**`],
      },

      {
        description: 'Should NOT ignore node_modules when explicitly included',
        input: ['src/**/*.ts', 'node_modules/@types/**/*.d.ts'],
        expected: [NEGATIVE_FILES, `!${DEFAULT_IGNORED_DIRS.replace('node_modules,', '')}/**`],
      },

      {
        description: 'Should NOT ignore dist when explicitly included',
        input: ['dist/assets/**/*.js'],
        expected: [NEGATIVE_FILES, `!${DEFAULT_IGNORED_DIRS.replace('dist,', '')}/**`],
      },

      {
        description: 'Should only ignore directories not explicitly requested',
        input: ['node_modules', 'dist', 'build'],
        expected: [NEGATIVE_FILES, `!${DEFAULT_IGNORED_DIRS.replace('node_modules,dist,build,', '')}/**`],
      },

      {
        description: 'Should ignore files and remaining directories when most directories explicitly requested',
        input: ['node_modules', 'dist', 'build', 'out', '.git'],
        expected: [NEGATIVE_FILES, `!${DEFAULT_IGNORED_DIRS.replace('node_modules,dist,build,out,.git,', '')}/**`],
      },

      {
        description: 'Should ignore files and remaining directories when most directories explicitly requested',
        input: ['node_modules', 'dist', 'build', 'out', '.git', '**/test', '**/tests'],
        expected: [NEGATIVE_FILES, `!${DEFAULT_IGNORED_DIRS.replace('node_modules,dist,build,out,.git,**/test,**/tests,', '')}/**`],
      },

      {
        description: 'Should ignore all when no ignored dirs mentioned except test is included',
        input: ['src/**/*.ts', 'test/**/*.ts', 'docs/**/*.md'],
        expected: [NEGATIVE_FILES, `!${DEFAULT_IGNORED_DIRS}/**`],
      },

      {
        description: 'Should ignore all default directories when using current directory pattern "."',
        input: ['.'],
        expected: [NEGATIVE_FILES, `!${DEFAULT_IGNORED_DIRS}/**`],
      },

      {
        description: 'Should NOT ignore **/test when explicitly included with glob pattern',
        input: ['src/**/*.ts', '**/test/**/*.ts'],
        expected: [NEGATIVE_FILES, `!${DEFAULT_IGNORED_DIRS.replace('**/test,', '')}/**`],
      },
    ]

    testCases.forEach((testCase) => {
      it(testCase.description, () => {
        const result = generateIgnorePatterns(testCase.input)
        expect(result).toEqual(testCase.expected)
      })
    })
  })
})
