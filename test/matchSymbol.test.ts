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

  // 🌟 WILDCARD TESTS
  {
    name: 'Wildcard function match',
    content: `function myFunction() {
  return 'hello'
}`,
    symbol: 'my*',
    shouldMatch: true,
    description: 'Wildcard should match function starting with my',
  },
  {
    name: 'Wildcard class match',
    content: `class UserService {
  constructor() {}
}`,
    symbol: 'User*',
    shouldMatch: true,
    description: 'Wildcard should match class starting with User',
  },
  {
    name: 'Wildcard interface match',
    content: `interface ApiResponse {
  data: any
}`,
    symbol: 'Api*',
    shouldMatch: true,
    description: 'Wildcard should match interface starting with Api',
  },
  {
    name: 'Wildcard type match',
    content: `type ConfigObject = {
  setting: string
}`,
    symbol: 'Config*',
    shouldMatch: true,
    description: 'Wildcard should match type starting with Config',
  },
  {
    name: 'Multiple wildcard match',
    content: `function handleUserRequest() {
  return 'handled'
}

function handleAdminRequest() {
  return 'admin handled'  
}`,
    symbol: 'handle*',
    shouldMatch: true,
    description: 'Wildcard should match multiple functions with same prefix',
  },
  {
    name: 'Prefix wildcard match',
    content: `function getData() {
  return data
}`,
    symbol: '*Data',
    shouldMatch: true,
    description: 'Wildcard should match function ending with Data',
  },
  {
    name: 'Middle wildcard match',
    content: `function getUserData() {
  return userData
}`,
    symbol: 'get*Data',
    shouldMatch: true,
    description: 'Wildcard should match function with pattern in middle',
  },
  {
    name: 'Multiple wildcards match',
    content: `function myGetUserData() {
  return userData
}`,
    symbol: '*Get*Data',
    shouldMatch: true,
    description: 'Multiple wildcards should match complex patterns',
  },
  {
    name: 'Single wildcard match all',
    content: `function anyFunction() {
  return 'any'
}`,
    symbol: '*',
    shouldMatch: true,
    description: 'Single wildcard should match any symbol',
  },
  {
    name: 'Wildcard no match',
    content: `function getData() {
  return data
}

function processInfo() {
  return info
}`,
    symbol: 'handle*',
    shouldMatch: false,
    description: 'Wildcard should not match when pattern not found',
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

  // Additional negative lookahead/lookbehind tests
  {
    name: 'Method call on symbol',
    content: `const result = myFunc.call()
if (condition) {
  return true
}`,
    symbol: 'myFunc',
    shouldMatch: false,
    description: 'Method calls on symbol should be filtered out by negative lookahead (dot after)',
  },

  {
    name: 'String ending with symbol (single quote)',
    content: `const message = 'Function name is myFunc'
if (condition) {
  return true
}`,
    symbol: 'myFunc',
    shouldMatch: false,
    description: 'Symbols at end of single-quoted strings should be filtered out by negative lookahead',
  },

  {
    name: 'String ending with symbol (double quote)',
    content: `const message = "Function name is myFunc"
if (condition) {
  return true
}`,
    symbol: 'myFunc',
    shouldMatch: false,
    description: 'Symbols at end of double-quoted strings should be filtered out by negative lookahead',
  },

  {
    name: 'Symbol used as array index',
    content: `const value = items[myFunc]
if (condition) {
  return true
}`,
    symbol: 'myFunc',
    shouldMatch: false,
    description: 'Symbols used as array indices should be filtered out by negative lookbehind and lookahead',
  },

  {
    name: 'Symbol as object property key',
    content: `const config = {
  myFunc: 'some value',
  other: true
}`,
    symbol: 'myFunc',
    shouldMatch: false,
    description: 'Object property keys should not match (no brace block follows)',
  },

  {
    name: 'Symbol as function parameter',
    content: `function doSomething(myFunc, other) {
  return 'result'
}`,
    symbol: 'myFunc',
    shouldMatch: false,
    description: 'Symbols used as function parameters should be filtered out by negative lookbehind (parenthesis before)',
  },

  {
    name: 'Symbol in function call parameters',
    content: `const result = process(first, myFunc)
if (result) {
  return true
}`,
    symbol: 'myFunc',
    shouldMatch: false,
    description: 'Symbols used as function call arguments should be filtered out by negative lookahead (parenthesis after)',
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
  {
    name: 'Function with ternary operator',
    content: `function myFunc() {
  return condition ? 'yes' : 'no'
}`,
    symbol: 'myFunc',
    shouldMatch: true,
    description: 'Functions with ternary operators should match (colon in body is OK)',
  },
  {
    name: 'Function with type annotation',
    content: `function myFunc(): string {
  return 'typed function'
}`,
    symbol: 'myFunc',
    shouldMatch: true,
    description: 'TypeScript functions with return type annotations should match',
  },
  {
    name: 'Windows CRLF line endings',
    content: '// Comment with CRLF\r\nfunction myFunc() {\r\n  var x = 1;\r\n  return x;\r\n}',
    symbol: 'myFunc',
    shouldMatch: true,
    description: 'Functions with Windows CRLF line endings should match (test for \\r\\n handling)',
  },
]

function runTests() {
  console.log('🧪 Running matchSymbol tests...\n')

  let passed = 0
  let failed = 0

  for (const testCase of testCases) {
    try {
      const matches = [...matchSymbol(testCase.content, testCase.symbol)].map(m => m[0])
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
