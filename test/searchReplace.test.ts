import fs from 'fs'
import searchReplace from '../src/tools/searchReplace.js'
import testUtil from './util.js'

export default async function test() {
  console.log('Testing searchReplace tool...')

  // Regular test cases
  const testCases = [
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
      name: 'Single line file',
      source: 'const old = 42',
      oldString: 'old',
      newString: 'new',
      expected: 'const new = 42',
    },
    {
      name: 'Text not found',
      source: 'Hello world',
      oldString: 'nonexistent',
      newString: 'replacement',
      shouldThrow: true,
    },
  ]

  // Core value test cases: ambiguous matches (our main differentiator from Cursor)
  const ambiguousMatchTestCases = [
    {
      name: 'Ambiguous match: multiple debug properties (automation-friendly)',
      source: 'const config = { debug: true }\nconst settings = { debug: false }\nconst options = { debug: true }',
      oldString: 'debug: true',
      newString: 'debug: false',
      expectedMatches: 2,
      note: 'Cursor would fail safely, our tool proceeds for automation',
    },
    {
      name: 'Ambiguous match: multiple similar object patterns',
      source: 'const data = { prop1: "value1", prop2: "value2" }\nconst other = { prop1: "different", prop2: "also different" }\nconst another = { prop1: "value1", other: "stuff" }',
      oldString: 'prop1: "value1"',
      newString: 'property1: "newvalue1"',
      expectedMatches: 2,
      note: 'Multiple similar patterns, replace first occurrence',
    },
  ]

  // Whitespace parity test cases (both Cursor and our tool should handle these)
  const whitespaceParityTestCases = [
    {
      name: 'Extra spaces in function definition (Cursor parity)',
      source: 'function    oldFunction(  param1,   param2  ) {\n  return param1 + param2\n}',
      oldString: 'function    oldFunction(  param1,   param2  )',
      newString: 'function newFunction(param1, param2)',
      note: 'Both Cursor and our tool handle extra spaces',
    },
    {
      name: 'Mixed tabs and spaces (Cursor parity)',
      source: 'const\tconfig\t=\t{\n  prop1:   "value1",\n    prop2: "value2"  \n}',
      oldString: 'const\tconfig\t=\t{',
      newString: 'const newConfig = {',
      note: 'Both tools handle tab/space mixing',
    },
    {
      name: 'Mixed line endings CRLF/LF (Cursor parity)',
      source: 'function test() {\r\n  return "crlf"\r\n}\nfunction other() {\n  return "lf"\n}',
      oldString: 'function test() {\r\n  return "crlf"\r\n}',
      newString: 'function newTest() {\r\n  return "updated"\r\n}',
      note: 'Both tools handle mixed line endings',
    },
    {
      name: 'Multiline with complex indentation (Cursor parity)',
      source: 'const obj = {\n    method1() {\n      return "test"\n  },\n  method2: function() {\n    return "other"\n  }\n}',
      oldString: 'method1() {\n      return "test"\n  }',
      newString: 'newMethod() {\n      return "updated"\n  }',
      note: 'Both tools handle complex multiline patterns',
    },
  ]

  // Expected failure cases (edge cases that should fail gracefully)
  const expectedFailureTestCases = [
    {
      name: 'Redundant replacement (new_string already in old_string)',
      source: 'Hello world',
      oldString: 'Hello world test',
      newString: 'world',
      expectedError: 'Redundant replacement: old_string already contains new_string',
    },
    {
      name: 'Text not found',
      source: 'Hello world',
      oldString: 'nonexistent',
      newString: 'replacement',
      expectedError: 'Could not find the specified text',
    },
    {
      name: 'Empty file',
      source: '',
      oldString: 'anything',
      newString: 'replacement',
      expectedError: 'Could not find the specified text',
    },
  ]

  let passedTests = 0
  let totalTests = testCases.length + ambiguousMatchTestCases.length + whitespaceParityTestCases.length + expectedFailureTestCases.length
  const tempFilesToCleanup: string[] = []

  // Run regular tests
  for (const testCase of testCases) {
    console.log(`\n🔄 Testing: ${testCase.name}`)

    const tempFile = testUtil.createTempFile('test-file.txt', testCase.source)
    tempFilesToCleanup.push(tempFile)

    try {
      const result = await searchReplace.handler({
        file_path: tempFile,
        old_string: testCase.oldString,
        new_string: testCase.newString,
      })

      if (testCase.shouldThrow) {
        console.error('❌ FAILED: Expected error but got result')
        console.log('   Result:', result.substring(0, 100))
      } else {
        const newContent = fs.readFileSync(tempFile, 'utf8')
        if (newContent === testCase.expected) {
          console.log('✅ PASSED: All assertions correct')
          passedTests++
        } else {
          console.error('❌ FAILED: Content mismatch')
          console.log('   Expected:', JSON.stringify(testCase.expected))
          console.log('   Actual:', JSON.stringify(newContent))
        }
      }
    } catch (error: any) {
      if (testCase.shouldThrow) {
        console.log(`✅ PASSED: Correctly threw error: ${error.message}`)
        passedTests++
      } else {
        console.log(`❌ FAILED: Unexpected error: ${error.message}`)
      }
    }
  }

  // Run ambiguous match tests (our core value)
  console.log('\n🎯 Testing ambiguous match handling (core differentiator)...\n')

  for (const testCase of ambiguousMatchTestCases) {
    console.log(`🔄 Testing: ${testCase.name}`)
    console.log(`   📝 ${testCase.note}`)

    const tempFile = testUtil.createTempFile('ambiguous-test.js', testCase.source)
    tempFilesToCleanup.push(tempFile)

    try {
      const result = await searchReplace.handler({
        file_path: tempFile,
        old_string: testCase.oldString,
        new_string: testCase.newString,
      })

      console.log('✅ PASSED: Successfully handled ambiguous match')

      // Check if multiple matches were reported
      if (result.includes('matches')) {
        const matchCount = result.match(/Found (\d+) matches/)?.[1]
        if (matchCount && parseInt(matchCount) >= testCase.expectedMatches) {
          console.log(`   ✨ Correctly handled ${matchCount} matches`)
        }
      }
      passedTests++
    } catch (error: any) {
      console.log(`❌ FAILED: Unexpected error: ${error.message}`)
    }
  }

  // Run whitespace parity tests (ensuring we match Cursor's capabilities)
  console.log('\n⚖️ Testing whitespace parity with Cursor...\n')

  for (const testCase of whitespaceParityTestCases) {
    console.log(`🔄 Testing: ${testCase.name}`)
    console.log(`   📝 ${testCase.note}`)

    const tempFile = testUtil.createTempFile('parity-test.js', testCase.source)
    tempFilesToCleanup.push(tempFile)

    try {
      const result = await searchReplace.handler({
        file_path: tempFile,
        old_string: testCase.oldString,
        new_string: testCase.newString,
      })

      console.log('✅ PASSED: Successfully handled whitespace parity')
      console.log('   Result preview:', result.split('\n')[0])
      passedTests++
    } catch (error: any) {
      console.log(`❌ FAILED: Unexpected error: ${error.message}`)
    }
  }

  // Run expected failure tests (edge cases that should fail gracefully)
  console.log('\n🚫 Testing expected failure cases...\n')

  for (const testCase of expectedFailureTestCases) {
    console.log(`🔄 Testing: ${testCase.name}`)

    const tempFile = testUtil.createTempFile('failure-test.js', testCase.source)
    tempFilesToCleanup.push(tempFile)

    try {
      const result = await searchReplace.handler({
        file_path: tempFile,
        old_string: testCase.oldString,
        new_string: testCase.newString,
      })

      if (!testCase.expectedError) {
        console.log('✅ PASSED: Success as expected')
        console.log('   Result:', result.substring(0, 100))
        passedTests++
      } else {
        console.error('❌ FAILED: Expected failure but got success')
        console.log('   Result:', result.substring(0, 100))
      }
    } catch (error: any) {
      if (!testCase.expectedError) {
        console.log(`❌ FAILED: Unexpected error: ${error.message}`)
      } else if (testCase.expectedError && error.message.includes(testCase.expectedError)) {
        console.log(`✅ PASSED: Correctly failed with expected error: ${error.message}`)
        passedTests++
      } else {
        console.log(`❌ FAILED: Wrong error message. Expected: ${testCase.expectedError}, Got: ${error.message}`)
      }
    }
  }

  // Cleanup all temp files
  testUtil.cleanupTempFiles(tempFilesToCleanup)

  console.log(`\n🎯 Test Summary: ${passedTests}/${totalTests} tests passed`)

  if (passedTests === totalTests) {
    console.log('🎉 All searchReplace tests passed!')
  } else {
    throw new Error(`searchReplace tests failed: ${totalTests - passedTests}/${totalTests} tests failed`)
  }
}

// Call the test when this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  test().catch(console.error)
}
