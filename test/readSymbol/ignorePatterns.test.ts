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

    const testCases: TestCase[] = [
      {
        description: 'Should ignore all default directories when none specified',
        input: ['src/**/*.ts'],
        expected: [
          NEGATIVE_FILES,
          '!{node_modules,.git,test,tests,examples,runtime}/**',
          '!dist/**',
          '!build/**',
          '!out/**',
          '!{*/**/bin,*/**/scripts}',
        ],
      },

      {
        description: 'Should NOT ignore node_modules when explicitly included',
        input: ['src/**/*.ts', 'node_modules/@types/**/*.d.ts'],
        expected: [
          NEGATIVE_FILES,
          '!{.git,test,tests,examples,runtime}/**',
          '!dist/**',
          '!build/**',
          '!out/**',
          '!{*/**/bin,*/**/scripts}',
        ],
      },

      {
        description: 'Should NOT ignore dist when explicitly included',
        input: ['dist/assets/**/*.js'],
        expected: [
          NEGATIVE_FILES,
          '!{node_modules,.git,test,tests,examples,runtime}/**',
          '!build/**',
          '!out/**',
          '!{*/**/bin,*/**/scripts}',
        ],
      },

      {
        description: 'Should only ignore directories not explicitly requested',
        input: ['node_modules/', 'dist/', 'build/'],
        expected: [
          NEGATIVE_FILES,
          '!{.git,test,tests,examples,runtime}/**',
          '!out/**',
          '!{*/**/bin,*/**/scripts}',
        ],
      },

      {
        description: 'Should ignore files and remaining directories when most directories explicitly requested',
        input: ['node_modules/', 'dist/', 'build/', 'out/', '.git/'],
        expected: [
          NEGATIVE_FILES,
          '!{test,tests,examples,runtime}/**',
          '!{*/**/bin,*/**/scripts}',
        ],
      },

      {
        description: 'Should ignore files and remaining directories when most directories explicitly requested',
        input: ['node_modules/', 'dist/', 'build/', 'out/', '.git/', '*/**/bin', '*/**/scripts'],
        expected: [
          NEGATIVE_FILES,
          '!{test,tests,examples,runtime}/**',
        ],
      },

      {
        description: 'Should ignore all when no ignored dirs mentioned except test is included',
        input: ['src/**/*.ts', 'test/**/*.ts', 'docs/**/*.md'],
        expected: [
          NEGATIVE_FILES,
          '!{node_modules,.git,tests,examples,runtime}/**',
          '!dist/**',
          '!build/**',
          '!out/**',
          '!{*/**/bin,*/**/scripts}',
        ],
      },

      {
        description: 'Should ignore all default directories when using current directory pattern "."',
        input: ['.'],
        expected: [
          NEGATIVE_FILES,
          '!{node_modules,.git,test,tests,examples,runtime}/**',
          '!dist/**',
          '!build/**',
          '!out/**',
          '!{*/**/bin,*/**/scripts}',
        ],
      },

      {
        description: 'Should NOT ignore **/bin when explicitly included with glob pattern',
        input: ['src/**/*.ts', '*/**/bin/**/*.js'],
        expected: [
          NEGATIVE_FILES,
          '!{node_modules,.git,test,tests,examples,runtime}/**',
          '!dist/**',
          '!build/**',
          '!out/**',
          '!{*/**/scripts}',
        ],
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
