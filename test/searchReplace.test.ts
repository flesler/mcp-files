import searchReplace from '../src/tools/searchReplace.js'
import util from '../src/util.js'

interface TestCase {
  name: string
  source: string
  find: string
  replace: string
  expectedContent: string
  expectedDiff: string
  error?: string
}

const testCases: TestCase[] = [
  {
    name: 'Simple substring replacement',
    source: 'Hello world, this is a test file.',
    find: 'world',
    replace: 'universe',
    expectedContent: 'Hello universe, this is a test file.',
    expectedDiff: `The following diff was applied to the file:

\`\`\`
- Hello world, this is a test file.
+ Hello universe, this is a test file.
\`\`\``,
  },
  {
    name: 'Multi-line function replacement',
    source: `function hello() {
  console.log("hello");
}`,
    find: `function hello() {
  console.log("hello");
}`,
    replace: 'const hello = () => console.log("hello");',
    expectedContent: 'const hello = () => console.log("hello");',
    expectedDiff: `The following diff was applied to the file:

\`\`\`
- function hello() {
+ const hello = () => console.log("hello");
-   console.log("hello");
- }
\`\`\``,
  },
  {
    name: 'Multi-line with context',
    source: `Line 1 keep
Line 2 CHANGE
Line 3 keep
Line 4 CHANGE
Line 5 keep`,
    find: `Line 2 CHANGE
Line 3 keep
Line 4 CHANGE`,
    replace: `Line 2 MODIFIED
Line 3 keep
Line 4 MODIFIED`,
    expectedContent: `Line 1 keep
Line 2 MODIFIED
Line 3 keep
Line 4 MODIFIED
Line 5 keep`,
    expectedDiff: `The following diff was applied to the file:

\`\`\`
  Line 1 keep
- Line 2 CHANGE
+ Line 2 MODIFIED
  Line 3 keep
- Line 4 CHANGE
+ Line 4 MODIFIED
  Line 5 keep
\`\`\``,
  },
  {
    name: 'Beginning of file replacement',
    source: `First line
Second line
Third line`,
    find: 'First line',
    replace: 'FIRST LINE',
    expectedContent: `FIRST LINE
Second line
Third line`,
    expectedDiff: `The following diff was applied to the file:

\`\`\`
- First line
+ FIRST LINE
  Second line
  Third line
\`\`\``,
  },
  {
    name: 'End of file replacement',
    source: `First line
Second line
Third line`,
    find: 'Third line',
    replace: 'THIRD LINE',
    expectedContent: `First line
Second line
THIRD LINE`,
    expectedDiff: `The following diff was applied to the file:

\`\`\`
  First line
  Second line
- Third line
+ THIRD LINE
\`\`\``,
  },
  {
    name: 'Single line file',
    source: 'Just one line',
    find: 'one',
    replace: 'single',
    expectedContent: 'Just single line',
    expectedDiff: `The following diff was applied to the file:

\`\`\`
- Just one line
+ Just single line
\`\`\``,
  },
  {
    name: 'Text not found',
    source: 'Hello world',
    find: 'nonexistent',
    replace: 'replacement',
    expectedContent: 'Hello world', // Not used when error expected
    expectedDiff: '', // Not used when error expected
    error: 'Could not find the specified text in test-file.txt',
  },
]

async function test() {
  console.log('Testing searchReplace tool...')

  // Mock file operations
  const originalReadFile = util.readFile
  const originalWriteFile = util.writeFile
  const originalResolve = util.resolve

  let mockFileContent = ''
  let writeCallCount = 0
  let writtenContent = ''

  util.readFile = (path: string) => {
    if (path === '/mock/test-file.txt') {
      return mockFileContent
    }
    throw new Error(`File not found: ${path}`)
  }

  util.writeFile = (path: string, content: string) => {
    writeCallCount++
    writtenContent = content
  }

  util.resolve = (path: string) => {
    if (path === 'test-file.txt') {
      return '/mock/test-file.txt'
    }
    return path
  }

  try {
    let passedTests = 0
    let totalTests = testCases.length

    for (const testCase of testCases) {
      try {
        console.log(`\n🔄 Testing: ${testCase.name}`)

        // Setup
        mockFileContent = testCase.source
        writeCallCount = 0
        writtenContent = ''

        if (testCase.error) {
          // Expect this test to throw
          try {
            await searchReplace.handler({
              file_path: 'test-file.txt',
              old_string: testCase.find,
              new_string: testCase.replace,
            })
            console.log('❌ FAILED: Expected error but none was thrown')
            continue
          } catch (err: any) {
            if (!err.message.includes(testCase.error)) {
              console.log(`❌ FAILED: Wrong error message. Expected: "${testCase.error}", Got: "${err.message}"`)
              continue
            }
            console.log(`✅ PASSED: Correctly threw error: ${err.message}`)
            passedTests++
            continue
          }
        }

        // Execute
        const result = await searchReplace.handler({
          file_path: 'test-file.txt',
          old_string: testCase.find,
          new_string: testCase.replace,
        })

        // Verify file was written correctly
        if (writeCallCount !== 1) {
          console.log(`❌ FAILED: Expected 1 write call, got ${writeCallCount}`)
          continue
        }

        if (writtenContent !== testCase.expectedContent) {
          console.log('❌ FAILED: Content mismatch')
          console.log(`Expected: ${JSON.stringify(testCase.expectedContent)}`)
          console.log(`Got: ${JSON.stringify(writtenContent)}`)
          continue
        }

        // Verify diff output
        if (result !== testCase.expectedDiff) {
          console.log('❌ FAILED: Diff mismatch')
          console.log(`Expected:\n${testCase.expectedDiff}`)
          console.log(`Got:\n${result}`)
          continue
        }

        console.log('✅ PASSED: All assertions correct')
        passedTests++

      } catch (err) {
        console.log(`❌ FAILED: Unexpected error: ${err}`)
      }
    }

    console.log(`\n🎯 Test Summary: ${passedTests}/${totalTests} tests passed`)

    if (passedTests === totalTests) {
      console.log('🎉 All searchReplace tests passed!')
    } else {
      console.log('❌ Some tests failed!')
    }

  } finally {
    // Restore original functions
    util.readFile = originalReadFile
    util.writeFile = originalWriteFile
    util.resolve = originalResolve
  }
}

test()
