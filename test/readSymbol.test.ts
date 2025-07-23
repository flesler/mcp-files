import { Block, findBlocks } from '../src/tools/readSymbol.js'

interface TestCase {
  name: string
  content: string
  symbol: string
  expectedCount: number
  expectedFirst?: Partial<Block> // Expected properties of first result (highest scored)
}

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

  // One-liner functions
  {
    name: 'One-liner function',
    content: 'function quickFunc() { return 42 }',
    symbol: 'quickFunc',
    expectedCount: 1,
    expectedFirst: {
      startLine: 1,
      endLine: 1,
    },
  },

  // Multiple functions - test both are found, first one returned first (same scores)
  {
    name: 'Multiple functions - both found',
    content: `
function func1() { return 1 }
function func2() {
  return 2
}
function func1() { return 'another' }`,
    symbol: 'func1',
    expectedCount: 2,
    expectedFirst: {
      startLine: 2, // First occurrence is returned first when scores are equal
      endLine: 2,
    },
  },

  // Indented function
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

  // TypeScript interface
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

  // Class definition
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

  // Arrow functions - only matches ones with braces
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

  // Object methods
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

  // TypeScript types
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

  // Enums
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

  // Namespace
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

  // Complex class with constructor
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

  // Module declaration
  {
    name: 'Module declaration',
    content: `
declare module 'my-module' {
  export function func(): void
}`,
    symbol: 'my-module',
    expectedCount: 1,
    expectedFirst: {
      startLine: 2,
      endLine: 4,
    },
  },

  // JSON-like structure
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

  // GraphQL schema
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

  // Word boundary test - should not match partial words
  {
    name: 'Word boundary test',
    content: `
function myFunction() { return 1 }
function myFunctionExtended() { return 2 }
const myFunctionVar = 'test'`,
    symbol: 'myFunction',
    expectedCount: 1, // Should only match exact 'myFunction', not 'myFunctionExtended'
    expectedFirst: {
      startLine: 2,
      endLine: 2,
    },
  },

  // String literals with braces (should still match, overmatch is OK)
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

  // No matches found
  {
    name: 'Symbol not found',
    content: `
function otherFunction() {
  return 'something'
}`,
    symbol: 'nonExistentSymbol',
    expectedCount: 0,
  },

  // Nested functions (known limitation - might find both)
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

  // Generic functions with angle brackets
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

  // Async/await functions
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

  // Function expressions with names
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

  // Symbol in comments (should still match - overmatch is acceptable)
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

  // Very long symbol name
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

  // Symbol with numbers and underscores
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

  // Empty braces
  {
    name: 'Function with empty body',
    content: `
function emptyFunc() {}`,
    symbol: 'emptyFunc',
    expectedCount: 1,
    expectedFirst: {
      startLine: 2,
      endLine: 2,
    },
  },
]

console.log('🧪 Testing findBlocks function...\n')

let passed = 0
let failed = 0

for (let i = 0; i < testCases.length; i++) {
  const testCase = testCases[i]
  const testNum = i + 1

  try {
    console.log(`🔄 Test ${testNum}/${testCases.length}: ${testCase.name}`)

    const blocks = findBlocks(testCase.content, testCase.symbol, 'test.ts')

    // Check expected count
    if (blocks.length !== testCase.expectedCount) {
      throw new Error(`Expected ${testCase.expectedCount} blocks, got ${blocks.length}`)
    }

    // Check if we expected no results
    if (testCase.expectedCount === 0) {
      console.log('✅ PASSED: Correctly found no matches')
      passed++
      continue
    }

    // Check first result properties if specified
    if (testCase.expectedFirst && blocks.length > 0) {
      const first = blocks[0]

      if (testCase.expectedFirst.startLine !== undefined && first.startLine !== testCase.expectedFirst.startLine) {
        throw new Error(`Expected startLine ${testCase.expectedFirst.startLine}, got ${first.startLine}`)
      }

      if (testCase.expectedFirst.endLine !== undefined && first.endLine !== testCase.expectedFirst.endLine) {
        throw new Error(`Expected endLine ${testCase.expectedFirst.endLine}, got ${first.endLine}`)
      }

      // Verify the block contains the symbol
      if (!first.text.includes(testCase.symbol)) {
        throw new Error(`Block does not contain symbol '${testCase.symbol}'`)
      }
    }

    console.log('✅ PASSED: Found expected block(s)')
    passed++

  } catch (error) {
    console.log(`❌ FAILED: ${error.message}`)
    failed++
  }
}

console.log(`\n🎯 Test Summary: ${passed} passed, ${failed} failed`)

if (failed === 0) {
  console.log('🎉 All findBlocks tests passed!')
} else {
  console.log(`❌ ${failed} test(s) failed`)
  process.exit(1)
}
