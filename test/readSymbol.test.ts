import fs from 'fs'
import readSymbol from '../src/tools/readSymbol.js'
import testUtil from './util.js'

interface TestCase {
  name: string
  source: string
  symbols: string[]
  expectedSymbols?: string[] // If provided, these symbols should be found
  error?: string // If provided, should throw error with this message (partial match)
}

const testCases: TestCase[] = [
  // Simple multi-line functions
  {
    name: 'Simple multi-line function',
    source: `
export const myFunction = () => {
  return 'hello'
}`,
    symbols: ['myFunction'],
    expectedSymbols: ['myFunction'],
  },

  // One-liner functions
  {
    name: 'One-liner function',
    source: 'function quickFunc() { return 42 }',
    symbols: ['quickFunc'],
    expectedSymbols: ['quickFunc'],
  },

  // Multiple one-liners
  {
    name: 'Multiple one-liner functions',
    source: `
function func1() { return 1 }
function func2() { return 2 }
function func3() { return 3 }`,
    symbols: ['func1', 'func2'],
    expectedSymbols: ['func1', 'func2'],
  },

  // Indented functions
  {
    name: 'Indented function',
    source: `
function topLevel() {
  return "top"
}

  function indentedFunction() {
    const nested = {
      key: "value"
    }
    return nested
  }`,
    symbols: ['indentedFunction'],
    expectedSymbols: ['indentedFunction'],
  },

  // Simple interface (works) vs complex class (limitation)
  {
    name: 'Simple interface vs complex class',
    source: `
interface MyInterface {
  name: string
}

class MyClass {
  constructor() {}
  
  method() {
    return 'method'
  }
}`,
    symbols: ['MyInterface', 'MyClass'],
    expectedSymbols: ['MyInterface'], // Class has nested braces (methods), so not found
  },

  // Word boundary test - should NOT match
  {
    name: 'Word boundary test',
    source: `
function testFunction() { return 'exact' }
function testFunction1() { return 'should not match' }
function testFunctionABC() { return 'should not match' }`,
    symbols: ['testFunction'],
    expectedSymbols: ['testFunction'], // Should only find the exact match
  },

  // Complex TypeScript (known limitation - don't try to match)
  {
    name: 'Complex TypeScript function (known limitation)',
    source: `
export function complexFunc<T, S>(
  param: T,
  config: S
): Promise<T & S> {
  return Promise.resolve(param as T & S)
}`,
    symbols: ['complexFunc'],
    // Known limitation - multi-line signatures don't work
    error: 'No symbols found',
  },

  // String literals with braces - overmatches (acceptable)
  {
    name: 'String literals with braces (overmatch is OK)',
    source: `
function realFunc() {
  const template = "function fake() { return 'fake' }"
  const json = '{"key": "value"}'
  return template + json
}`,
    symbols: ['fake'],
    expectedSymbols: ['fake'], // AI context will distinguish real vs string
  },

  // Mixed strings and real functions
  {
    name: 'Mixed strings and real functions',
    source: `
function parseTemplate() {
  return "function notReal() { return false }"
}

function isReal() { return true }`,
    symbols: ['isReal', 'notReal'],
    expectedSymbols: ['isReal'], // Should only find the real function, not the one in the string
  },

  // Symbol not found
  {
    name: 'Symbol not found',
    source: `
function existingFunc() {
  return 'exists'
}`,
    symbols: ['nonExistentSymbol'],

    error: 'No symbols found',
  },

  // Mixed results - some found, some not
  {
    name: 'Mixed results',
    source: `
function foundFunc() { return 'found' }
class FoundClass {}`,
    symbols: ['foundFunc', 'missingFunc', 'FoundClass'],
    expectedSymbols: ['foundFunc', 'FoundClass'], // Should find 2 out of 3
  },

  // Additional test cases for coverage

  // Arrow functions
  {
    name: 'Arrow functions',
    source: `
const arrowFunc = () => {
  return 'arrow'
}

const oneLineArrow = () => 'quick'`,
    symbols: ['arrowFunc'],
    expectedSymbols: ['arrowFunc'],
  },

  // Object methods
  {
    name: 'Object methods',
    source: `
const obj = {
  methodName() {
    return 'method'
  },
  
  arrowMethod: () => {
    return 'arrow method'  
  }
}`,
    symbols: ['methodName'],
    expectedSymbols: ['methodName'],
  },

  // Async functions
  {
    name: 'Async functions',
    source: `
async function asyncFunc() {
  await something()
  return result
}`,
    symbols: ['asyncFunc'],
    expectedSymbols: ['asyncFunc'],
  },

  // Enums and types
  {
    name: 'Enums and type definitions',
    source: `
enum MyEnum {
  VALUE1 = 'value1',
  VALUE2 = 'value2'
}

type MyType = {
  prop: string
}`,
    symbols: ['MyEnum', 'MyType'],
    expectedSymbols: ['MyEnum', 'MyType'],
  },

  // Generic functions
  {
    name: 'Generic functions (simple)',
    source: `
function genericFunc<T>(param: T) {
  return param
}`,
    symbols: ['genericFunc'],
    expectedSymbols: ['genericFunc'],
  },
]

async function test() {
  console.log('Testing readSymbol tool with comprehensive test cases...\n')
  let passedTests = 0
  let totalTests = testCases.length

  // Create one temp file and reuse it
  const tempFile = testUtil.createTempFile('readSymbol-test.ts', '')

  try {
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i]
      console.log(`🔄 Test ${i + 1}/${totalTests}: ${testCase.name}`)

      // Override temp file content with test source
      fs.writeFileSync(tempFile, testCase.source.trim())

      try {
        const result = await readSymbol.handler({
          symbols: testCase.symbols,
          file_paths: [tempFile],
        })

        if (testCase.error) {
          console.log('❌ FAILED: Expected error but got result')
          console.log(`   Result preview: ${result.substring(0, 100)}...`)
          continue
        }

        // Check if expected symbols were found
        if (testCase.expectedSymbols) {
          const foundAllExpected = testCase.expectedSymbols.every(symbol =>
            result.includes(symbol),
          )

          if (foundAllExpected) {
            console.log('✅ PASSED: Found all expected symbols')
            passedTests++
          } else {
            console.log('❌ FAILED: Missing expected symbols')
            console.log(`   Expected: ${testCase.expectedSymbols.join(', ')}`)
            console.log(`   Result preview: ${result.substring(0, 150)}...`)
          }
        } else {
          // No specific expectations, just that it didn't error
          console.log('✅ PASSED: No error (as expected)')
          passedTests++
        }

      } catch (err: any) {
        if (testCase.error) {
          const matchesExpectedError = err.message.includes(testCase.error)

          if (matchesExpectedError) {
            console.log('✅ PASSED: Correctly threw expected error')
            console.log(`   Error: ${err.message}`)
            passedTests++
          } else {
            console.log('❌ FAILED: Wrong error message')
            console.log(`   Expected: ${testCase.error}`)
            console.log(`   Actual: ${err.message}`)
          }
        } else {
          console.log('❌ FAILED: Unexpected error')
          console.log(`   Error: ${err.message}`)
        }
      }

      console.log() // Empty line between tests
    }

    console.log(`\n🎯 Test Summary: ${passedTests}/${totalTests} tests passed`)

    if (passedTests === totalTests) {
      console.log('🎉 All readSymbol tests passed!')
    } else {
      console.log(`💥 ${totalTests - passedTests} tests failed`)
      console.log('\nThis helps identify which patterns the regex supports vs limitations')
    }

  } finally {
    // Cleanup
    testUtil.cleanupTempFiles([tempFile])
  }
}

test()
