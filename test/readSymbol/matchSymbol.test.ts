import { describe, expect, it } from 'vitest'
import { matchSymbol } from '../../src/tools/readSymbol.js'

interface TestCase {
  name: string
  content: string
  symbol: string
  shouldMatch: boolean
}

describe('readSymbol tool', () => {
  describe('matchSymbol function', () => {
    const testCases: TestCase[] = [
      // ✅ POSITIVE CASES - Should match
      {
        name: 'Function definition',
        content: `function myFunc() {
  return 'hello'
}`,
        symbol: 'myFunc',
        shouldMatch: true,
      },
      {
        name: 'Arrow function assignment',
        content: `const myFunc = () => {
  return 'hello'  
}`,
        symbol: 'myFunc',
        shouldMatch: true,
      },
      {
        name: 'Class definition',
        content: `class MyClass {
  constructor() {}
}`,
        symbol: 'MyClass',
        shouldMatch: true,
      },
      {
        name: 'Interface definition',
        content: `interface MyInterface {
  prop: string
}`,
        symbol: 'MyInterface',
        shouldMatch: true,
      },
      {
        name: 'Type definition',
        content: `type MyType = {
  prop: string
}`,
        symbol: 'MyType',
        shouldMatch: true,
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
      },
      {
        name: 'Enum definition',
        content: `enum MyEnum {
  VALUE1 = 'value1'
}`,
        symbol: 'MyEnum',
        shouldMatch: true,
      },

      // 🌟 WILDCARD TESTS
      {
        name: 'Wildcard function match',
        content: `function myFunction() {
  return 'hello'
}`,
        symbol: 'my*',
        shouldMatch: true,
      },
      {
        name: 'Wildcard class match',
        content: `class UserService {
  constructor() {}
}`,
        symbol: 'User*',
        shouldMatch: true,
      },
      {
        name: 'Wildcard interface match',
        content: `interface ApiResponse {
  data: any
}`,
        symbol: 'Api*',
        shouldMatch: true,
      },
      {
        name: 'Wildcard type match',
        content: `type ConfigObject = {
  setting: string
}`,
        symbol: 'Config*',
        shouldMatch: true,
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
      },
      {
        name: 'Prefix wildcard match',
        content: `function getData() {
  return data
}`,
        symbol: '*Data',
        shouldMatch: true,
      },
      {
        name: 'Middle wildcard match',
        content: `function getUserData() {
  return userData
}`,
        symbol: 'get*Data',
        shouldMatch: true,
      },
      {
        name: 'Multiple wildcards match',
        content: `function myGetUserData() {
  return userData
}`,
        symbol: '*Get*Data',
        shouldMatch: true,
      },
      {
        name: 'Single wildcard match all',
        content: `function anyFunction() {
  return 'any'
}`,
        symbol: '*',
        shouldMatch: true,
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
      },
      {
        name: 'Bracket notation access',
        content: `const result = obj[myFunc]
if (condition) {
  return true
}`,
        symbol: 'myFunc',
        shouldMatch: false,
      },
      {
        name: 'String literal single quote',
        content: `const message = 'myFunc is a function'
if (condition) {
  return true
}`,
        symbol: 'myFunc',
        shouldMatch: false,
      },
      {
        name: 'String literal double quote',
        content: `const message = "myFunc is a function"
if (condition) {
  return true
}`,
        symbol: 'myFunc',
        shouldMatch: false,
      },
      {
        name: 'Array bracket access',
        content: `const item = array[myFunc]
if (condition) {
  return true
}`,
        symbol: 'myFunc',
        shouldMatch: false,
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
      },

      {
        name: 'String ending with symbol (single quote)',
        content: `const message = 'Function name is myFunc'
if (condition) {
  return true
}`,
        symbol: 'myFunc',
        shouldMatch: false,
      },

      {
        name: 'String ending with symbol (double quote)',
        content: `const message = "Function name is myFunc"
if (condition) {
  return true
}`,
        symbol: 'myFunc',
        shouldMatch: false,
      },

      {
        name: 'Symbol used as array index',
        content: `const value = items[myFunc]
if (condition) {
  return true
}`,
        symbol: 'myFunc',
        shouldMatch: false,
      },

      {
        name: 'Symbol as object property key',
        content: `const config = {
  myFunc: 'some value',
  other: true
}`,
        symbol: 'myFunc',
        shouldMatch: false,
      },

      {
        name: 'Symbol as function parameter',
        content: `function doSomething(myFunc, other) {
  return 'result'
}`,
        symbol: 'myFunc',
        shouldMatch: false,
      },

      {
        name: 'Symbol in function call parameters',
        content: `const result = process(first, myFunc)
if (result) {
  return true
}`,
        symbol: 'myFunc',
        shouldMatch: false,
      },
      {
        name: 'Single line function',
        content: 'function myFunc() { return \'hello\' }',
        symbol: 'myFunc',
        shouldMatch: false,
      },
      {
        name: 'Function call',
        content: `const result = myFunc()
if (condition) {
  return true
}`,
        symbol: 'myFunc',
        shouldMatch: false,
      },
      {
        name: 'Variable assignment',
        content: `const myFunc = someOtherFunction
if (condition) {
  return true
}`,
        symbol: 'myFunc',
        shouldMatch: false,
      },
      {
        name: 'Import statement',
        content: `import { myFunc } from './utils'
if (condition) {
  return true
}`,
        symbol: 'myFunc',
        shouldMatch: false,
      },

      // 🎯 EDGE CASES
      {
        name: 'Symbol as part of longer identifier',
        content: `function myFuncExtended() {
  return 'hello'
}`,
        symbol: 'myFunc',
        shouldMatch: false,
      },
      {
        name: 'Symbol at start of identifier',
        content: `function myFunc2() {
  return 'hello'
}`,
        symbol: 'myFunc',
        shouldMatch: false,
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
      },
      {
        name: 'Function with ternary operator',
        content: `function myFunc() {
  return condition ? 'yes' : 'no'
}`,
        symbol: 'myFunc',
        shouldMatch: true,
      },
      {
        name: 'Function with type annotation',
        content: `function myFunc(): string {
  return 'typed function'
}`,
        symbol: 'myFunc',
        shouldMatch: true,
      },
      {
        name: 'Windows CRLF line endings',
        content: '// Comment with CRLF\r\nfunction myFunc() {\r\n  var x = 1;\r\n  return x;\r\n}',
        symbol: 'myFunc',
        shouldMatch: true,
      },
      {
        name: 'Not hang forever on //////, used to happen',
        content: `\n${'/'.repeat(100)}\n\nfunction myFunc(){\n  var x = 1;\n  return x;\n}\n`,
        symbol: 'myFunc',
        shouldMatch: true,
      },
      {
        name: 'Symbol deep into the line',
        content: `\n${'a'.repeat(201)} function myFunc(){\n  var x = 1;\n  return x;\n}\n`,
        symbol: 'myFunc',
        shouldMatch: false,
      },
      {
        name: 'CSS ID selector',
        content: '#links {\n  color: blue;\n  text-decoration: none;\n}',
        symbol: '#links',
        shouldMatch: true,
      },
      {
        name: 'Single line CSS selector',
        content: '#links { color: blue; text-decoration: none; }',
        symbol: '#links',
        shouldMatch: false,
      },
      {
        name: 'CSS class selector',
        content: '.navbar {\n  background: white;\n  padding: 10px;\n}',
        symbol: '.navbar',
        shouldMatch: true,
      },
      {
        name: 'CSS pseudo-class',
        content: 'a:hover {\n  color: red;\n  cursor: pointer;\n}',
        symbol: ':hover',
        shouldMatch: true,
      },
      {
        name: 'CSS attribute selector',
        content: '[data-theme="dark"] {\n  background: black;\n  color: white;\n}',
        symbol: '[data-theme="dark"]',
        shouldMatch: true,
      },
    ]

    testCases.forEach((testCase) => {
      it(`${testCase.name} - should ${testCase.shouldMatch ? 'match' : 'not match'}`, () => {
        const matches = [...matchSymbol(testCase.content, [testCase.symbol])]
        const hasMatch = matches.length > 0

        if (testCase.shouldMatch) {
          expect(hasMatch).toBe(true)
          expect(matches.length).toBeGreaterThan(0)
        } else {
          expect(hasMatch).toBe(false)
          expect(matches.length).toBe(0)
        }
      })
    })

    // Multi-symbol tests
    describe('Multi-symbol functionality', () => {
      it('should find multiple symbols in content', () => {
        const content = `
function myFunc() {
  return 'hello'
}

class MyClass {
  constructor() {}
}

interface MyInterface {
  prop: string
}
`
        const matches = [...matchSymbol(content, ['myFunc', 'MyClass', 'MyInterface'])]
        expect(matches.length).toBe(3)
      })

      it('should find only matching symbols from array', () => {
        const content = `
function existingFunc() {
  return 'exists'
}

class ExistingClass {
  constructor() {}
}
`
        const matches = [...matchSymbol(content, ['existingFunc', 'nonExistent', 'ExistingClass'])]
        expect(matches.length).toBe(2)
      })

      it('should work with single symbol in array', () => {
        const content = `
function myFunc() {
  return 'hello'
}
`
        const matches = [...matchSymbol(content, ['myFunc'])]
        expect(matches.length).toBe(1)
      })

      it('should find no matches when no symbols exist', () => {
        const content = `
function otherFunc() {
  return 'other'
}
`
        const matches = [...matchSymbol(content, ['nonExistent1', 'nonExistent2'])]
        expect(matches.length).toBe(0)
      })

      it('should work with wildcards in multi-symbol search', () => {
        const content = `
function getUserData() {
  return 'user data'
}

function getAdminData() {
  return 'admin data'
}

function processInfo() {
  return 'info'
}
`
        const matches = [...matchSymbol(content, ['get*', 'process*'])]
        expect(matches.length).toBe(3)
      })
    })
  })
})
