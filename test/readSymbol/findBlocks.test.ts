import { describe, expect, it } from 'vitest'
import { Block, findBlocks } from '../../src/tools/readSymbol.js'

interface TestCase {
  name: string
  content: string
  symbol: string
  expectedCount: number
  expectedFirst?: Partial<Block> // Expected properties of first result (highest scored)
}

describe('readSymbol tool', () => {
  describe('findBlocks function', () => {
    const testCases: TestCase[] = [
      // Simple multi-line functions
      {
        name: 'Simple multi-line function',
        content: `
export const myFunction = () => {
  return 'hello'
}`,
        symbol: 'myFunction',
        expectedCount: 1,
        expectedFirst: {
          startLine: 2,
          endLine: 4,
        },
      },

      {
        name: 'One-liner function',
        content: 'function quickFunc() { return 42 }',
        symbol: 'quickFunc',
        expectedCount: 0, // No newlines = quick escape
      },

      {
        name: 'Multiple functions - only multi-line found',
        content: `
function func1() { return 1 }
function func2() {
  return 2
}
function func1() { return 'another' }`,
        symbol: 'func1',
        expectedCount: 0, // One-liners don't have required indented content
      },

      {
        name: 'Indented function',
        content: `
class MyClass {
  myMethod() {
    return 'nested'
  }
}`,
        symbol: 'myMethod',
        expectedCount: 1,
        expectedFirst: {
          startLine: 3,
          endLine: 5,
        },
      },

      {
        name: 'TypeScript interface',
        content: `
interface MyInterface {
  prop: string
  method(): void
}`,
        symbol: 'MyInterface',
        expectedCount: 1,
        expectedFirst: {
          startLine: 2,
          endLine: 5,
        },
      },

      {
        name: 'Class definition',
        content: `
export class MyClass {
  constructor(private name: string) {}
  
  getName() {
    return this.name
  }
}`,
        symbol: 'MyClass',
        expectedCount: 1,
        expectedFirst: {
          startLine: 2,
          endLine: 8,
        },
      },

      {
        name: 'Arrow functions with braces',
        content: `
const arrowFunc = () => {
  console.log('arrow')
}
const arrowFunc2 = () => console.log('inline')`,
        symbol: 'arrowFunc',
        expectedCount: 1, // Only finds the one with braces
        expectedFirst: {
          startLine: 2,
          endLine: 4,
        },
      },

      {
        name: 'Object methods',
        content: `
const obj = {
  myMethod() {
    return 'object method'
  }
}`,
        symbol: 'myMethod',
        expectedCount: 1,
        expectedFirst: {
          startLine: 3,
          endLine: 5,
        },
      },

      {
        name: 'TypeScript type alias',
        content: `
type MyType = {
  id: number
  name: string
}`,
        symbol: 'MyType',
        expectedCount: 1,
        expectedFirst: {
          startLine: 2,
          endLine: 5,
        },
      },

      {
        name: 'TypeScript enum',
        content: `
enum Status {
  PENDING = 'pending',
  COMPLETED = 'completed'
}`,
        symbol: 'Status',
        expectedCount: 1,
        expectedFirst: {
          startLine: 2,
          endLine: 5,
        },
      },

      {
        name: 'TypeScript namespace',
        content: `
namespace Utils {
  export function helper() {
    return 'help'
  }
}`,
        symbol: 'Utils',
        expectedCount: 1,
        expectedFirst: {
          startLine: 2,
          endLine: 6,
        },
      },

      {
        name: 'Class with constructor and methods',
        content: `
class ComplexClass {
  constructor(
    public readonly id: string,
    private data: any
  ) {}

  process() {
    return this.data
  }
}`,
        symbol: 'ComplexClass',
        expectedCount: 1,
        expectedFirst: {
          startLine: 2,
          endLine: 11,
        },
      },

      {
        name: 'Module declaration',
        content: `
declare module 'my-module' {
  export function func(): void
}`,
        symbol: 'my-module',
        expectedCount: 0, // Symbol is quoted, so we don't match it (avoids false positives)
      },

      {
        name: 'JSON configuration object',
        content: `
const config = {
  database: {
    host: 'localhost'
  }
}`,
        symbol: 'config',
        expectedCount: 1,
        expectedFirst: {
          startLine: 2,
          endLine: 6,
        },
      },

      {
        name: 'GraphQL schema',
        content: `
type User {
  id: ID!
  name: String
  email: String
}`,
        symbol: 'User',
        expectedCount: 1,
        expectedFirst: {
          startLine: 2,
          endLine: 6,
        },
      },

      {
        name: 'Word boundary test',
        content: `
function myFunction() { return 1 }
function myFunctionExtended() { return 2 }
const myFunctionVar = 'test'`,
        symbol: 'myFunction',
        expectedCount: 0, // One-liner doesn't have required indented content
      },

      {
        name: 'String literals with braces',
        content: `
const template = \`
function fake() {
  return 'not real'
}
\`
function realFunc() {
  return 'real'
}`,
        symbol: 'realFunc',
        expectedCount: 1,
        expectedFirst: {
          startLine: 7,
          endLine: 9,
        },
      },

      {
        name: 'Symbol not found',
        content: `
function otherFunction() {
  return 'something'
}`,
        symbol: 'nonExistentSymbol',
        expectedCount: 0,
      },

      {
        name: 'Nested functions',
        content: `
function outer() {
  function inner() {
    return 'nested'
  }
  return inner()
}`,
        symbol: 'inner',
        expectedCount: 1,
        expectedFirst: {
          startLine: 3,
          endLine: 5,
        },
      },

      {
        name: 'Generic function',
        content: `
function genericFunc<T>() {
  return {} as T
}`,
        symbol: 'genericFunc',
        expectedCount: 1,
        expectedFirst: {
          startLine: 2,
          endLine: 4,
        },
      },

      {
        name: 'Async function',
        content: `
async function asyncFunc() {
  return await Promise.resolve('async')
}`,
        symbol: 'asyncFunc',
        expectedCount: 1,
        expectedFirst: {
          startLine: 2,
          endLine: 4,
        },
      },

      {
        name: 'Named function expression',
        content: `
const myVar = function namedFunc() {
  return 'named'
}`,
        symbol: 'namedFunc',
        expectedCount: 1,
        expectedFirst: {
          startLine: 2,
          endLine: 4,
        },
      },

      {
        name: 'Symbol in comments',
        content: `
// This is a comment about mySymbol
function otherFunc() {
  return 'other'
}
function mySymbol() {
  return 'real'
}`,
        symbol: 'mySymbol',
        expectedCount: 1,
        expectedFirst: {
          startLine: 6,
          endLine: 8,
        },
      },

      {
        name: 'Long symbol name',
        content: `
function thisIsAVeryLongFunctionNameThatSomeoneActuallyMightUse() {
  return 'long name'
}`,
        symbol: 'thisIsAVeryLongFunctionNameThatSomeoneActuallyMightUse',
        expectedCount: 1,
        expectedFirst: {
          startLine: 2,
          endLine: 4,
        },
      },

      {
        name: 'Symbol with numbers and underscores',
        content: `
function func_123_test() {
  return 'underscore'
}`,
        symbol: 'func_123_test',
        expectedCount: 1,
        expectedFirst: {
          startLine: 2,
          endLine: 4,
        },
      },

      {
        name: 'Function with empty body',
        content: 'function emptyFunc() {}', // Removed newlines - will trigger quick escape
        symbol: 'emptyFunc',
        expectedCount: 0, // No newlines = quick escape
      },

      {
        name: 'Minified file without newlines',
        content: 'function myFunc(){return 42;}var x=123;function anotherFunc(){console.log("test");}',
        symbol: 'myFunc',
        expectedCount: 0, // Should return early due to no newlines
      },
      {
        name: 'Huge block',
        content: ` function myFunc(){\n  var x = 1;\n  ${'a'.repeat(16e3)};\n}\n`,
        symbol: 'myFunc',
        expectedCount: 0,
      },
    ]

    testCases.forEach((testCase) => {
      it(testCase.name, () => {
        const blocks = findBlocks(testCase.content, testCase.symbol, 'test.ts', 0)

        // Check expected count
        expect(blocks.length).toBe(testCase.expectedCount)

        // Check if we expected no results
        if (testCase.expectedCount === 0) {
          return
        }

        // Check first result properties if specified
        if (testCase.expectedFirst && blocks.length > 0) {
          const first = blocks[0]

          if (testCase.expectedFirst.startLine !== undefined) {
            expect(first.startLine).toBe(testCase.expectedFirst.startLine)
          }

          if (testCase.expectedFirst.endLine !== undefined) {
            expect(first.endLine).toBe(testCase.expectedFirst.endLine)
          }

          // Verify the block contains the symbol
          expect(first.text).toContain(testCase.symbol)
        }
      })
    })
  })
})
