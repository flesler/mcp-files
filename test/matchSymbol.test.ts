import { matchSymbol } from '../src/tools/readSymbol.js'

interface TestCase {
  name: string
  content: string
  symbol: string
  shouldMatch: boolean
  description: string
}

const testCases: TestCase[] = [
  // ✅ POSITIVE CASES - Should match
  {
    name: 'Function definition',
    content: `function myFunc() {
  return 'hello'
}`,
    symbol: 'myFunc',
    shouldMatch: true,
    description: 'Basic function definition',
  },
  {
    name: 'Arrow function assignment',
    content: `const myFunc = () => {
  return 'hello'  
}`,
    symbol: 'myFunc',
    shouldMatch: true,
    description: 'Arrow function assigned to const',
  },
  {
    name: 'Class definition',
    content: `class MyClass {
  constructor() {}
}`,
    symbol: 'MyClass',
    shouldMatch: true,
    description: 'Class definition',
  },
  {
    name: 'Interface definition',
    content: `interface MyInterface {
  prop: string
}`,
    symbol: 'MyInterface',
    shouldMatch: true,
    description: 'TypeScript interface',
  },
  {
    name: 'Type definition',
    content: `type MyType = {
  prop: string
}`,
    symbol: 'MyType',
    shouldMatch: true,
    description: 'TypeScript type alias',
  },
  {
    name: 'Object method',
    content: `const obj = {
  myMethod() {
    return 'hello'
  }
}`,
    symbol: 'myMethod',
    shouldMatch: true,
    description: 'Object method definition',
  },
  {
    name: 'Enum definition',
    content: `enum MyEnum {
  VALUE1 = 'value1'
}`,
    symbol: 'MyEnum',
    shouldMatch: true,
    description: 'TypeScript enum',
  },

  // ❌ NEGATIVE CASES - Should NOT match
  {
    name: 'Property access',
    content: `const result = obj.myFunc()
if (condition) {
  return true
}`,
    symbol: 'myFunc',
    shouldMatch: false,
    description: 'Property access should be filtered out by negative lookahead',
  },
  {
    name: 'Bracket notation access',
    content: `const result = obj[myFunc]
if (condition) {
  return true
}`,
    symbol: 'myFunc',
    shouldMatch: false,
    description: 'Bracket notation should be filtered out by negative lookbehind',
  },
  {
    name: 'String literal single quote',
    content: `const message = 'myFunc is a function'
if (condition) {
  return true
}`,
    symbol: 'myFunc',
    shouldMatch: false,
    description: 'String literals should be filtered out by negative lookahead',
  },
  {
    name: 'String literal double quote',
    content: `const message = "myFunc is a function"
if (condition) {
  return true
}`,
    symbol: 'myFunc',
    shouldMatch: false,
    description: 'String literals should be filtered out by negative lookahead',
  },
  {
    name: 'Array bracket access',
    content: `const item = array[myFunc]
if (condition) {
  return true
}`,
    symbol: 'myFunc',
    shouldMatch: false,
    description: 'Array bracket access should be filtered out by negative lookbehind',
  },
  {
    name: 'Single line function',
    content: 'function myFunc() { return \'hello\' }',
    symbol: 'myFunc',
    shouldMatch: true,
    description: 'Single line functions match but get negative scores (filtered in final results)',
  },
  {
    name: 'Function call',
    content: `const result = myFunc()
if (condition) {
  return true
}`,
    symbol: 'myFunc',
    shouldMatch: false,
    description: 'Function calls without definitions should not match',
  },
  {
    name: 'Variable assignment',
    content: `const myFunc = someOtherFunction
if (condition) {
  return true
}`,
    symbol: 'myFunc',
    shouldMatch: false,
    description: 'Simple variable assignments should not match',
  },
  {
    name: 'Import statement',
    content: `import { myFunc } from './utils'
if (condition) {
  return true
}`,
    symbol: 'myFunc',
    shouldMatch: false,
    description: 'Import statements should not match',
  },

  // 🎯 EDGE CASES
  {
    name: 'Symbol as part of longer identifier',
    content: `function myFuncExtended() {
  return 'hello'
}`,
    symbol: 'myFunc',
    shouldMatch: false,
    description: 'Word boundary should prevent partial matches',
  },
  {
    name: 'Symbol at start of identifier',
    content: `function myFunc2() {
  return 'hello'
}`,
    symbol: 'myFunc',
    shouldMatch: false,
    description: 'Word boundary should prevent partial matches',
  },
  {
    name: 'Nested object method',
    content: `const config = {
  handlers: {
    myFunc() {
      return 'nested'
    }
  }
}`,
    symbol: 'myFunc',
    shouldMatch: true,
    description: 'Nested object methods should match',
  },
]

function runTests() {
  console.log('🧪 Running matchSymbol tests...\n')

  let passed = 0
  let failed = 0

  for (const testCase of testCases) {
    try {
      const matches = matchSymbol(testCase.content, testCase.symbol)
      const hasMatch = matches.length > 0

      if (hasMatch === testCase.shouldMatch) {
        console.log(`✅ ${testCase.name}`)
        passed++
      } else {
        console.log(`❌ ${testCase.name}`)
        console.log(`   Expected: ${testCase.shouldMatch ? 'match' : 'no match'}`)
        console.log(`   Got: ${hasMatch ? 'match' : 'no match'}`)
        console.log(`   Description: ${testCase.description}`)
        if (hasMatch && matches[0]) {
          console.log(`   Matched: "${matches[0].replace(/\n/g, '\\n')}"`)
        }
        console.log()
        failed++
      }
    } catch (error) {
      console.log(`💥 ${testCase.name} - Error: ${error}`)
      failed++
    }
  }

  console.log(`\n🎯 Test Summary: ${passed} passed, ${failed} failed`)

  if (failed > 0) {
    console.log('❌ Some tests failed!')
    process.exit(1)
  } else {
    console.log('🎉 All matchSymbol tests passed!')
  }
}

// Run tests when this module is imported (consistent with other test files)
runTests()

export { runTests as matchSymbolTests }
