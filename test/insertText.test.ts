import fs from 'fs'
import insertText, { updateText } from '../src/tools/insertText.js'
import testUtil from './util.js'

async function test() {
  console.log('Testing insertText tool...')

  // Test the pure updateText function first
  console.log('\n🧪 Testing pure updateText function...')

  try {
    // Test case 1: Basic insertion at beginning
    const result1 = updateText('line 1\nline 2\nline 3', 1, 'inserted line')
    const expected1 = 'inserted line\nline 1\nline 2\nline 3'
    if (result1 !== expected1) {
      throw new Error(`Test 1 failed: expected "${expected1}", got "${result1}"`)
    }
    console.log('✅ Basic insertion at beginning')

    // Test case 2: Insertion in middle
    const result2 = updateText('line 1\nline 2\nline 3', 2, 'inserted middle')
    const expected2 = 'line 1\ninserted middle\nline 2\nline 3'
    if (result2 !== expected2) {
      throw new Error(`Test 2 failed: expected "${expected2}", got "${result2}"`)
    }
    console.log('✅ Insertion in middle')

    // Test case 3: Insertion at end (appending)
    const result3 = updateText('line 1\nline 2\nline 3', 4, 'appended line')
    const expected3 = 'line 1\nline 2\nline 3\nappended line'
    if (result3 !== expected3) {
      throw new Error(`Test 3 failed: expected "${expected3}", got "${result3}"`)
    }
    console.log('✅ Insertion at end (appending)')

    // Test case 4: Replace single line
    const result4 = updateText('line 1\nline 2\nline 3', 2, 'replaced line', 2)
    const expected4 = 'line 1\nreplaced line\nline 3'
    if (result4 !== expected4) {
      throw new Error(`Test 4 failed: expected "${expected4}", got "${result4}"`)
    }
    console.log('✅ Replace single line')

    // Test case 5: Multi-line insertion
    const result5 = updateText('line 1\nline 2\nline 3', 2, 'inserted line A\ninserted line B')
    const expected5 = 'line 1\ninserted line A\ninserted line B\nline 2\nline 3'
    if (result5 !== expected5) {
      throw new Error(`Test 5 failed: expected "${expected5}", got "${result5}"`)
    }
    console.log('✅ Multi-line insertion')

    // Test case 6: Multi-line replacement
    const result6 = updateText('line 1\nline 2\nline 3\nline 4', 2, 'replaced A\nreplaced B', 3)
    const expected6 = 'line 1\nreplaced A\nreplaced B\nline 4'
    if (result6 !== expected6) {
      throw new Error(`Test 6 failed: expected "${expected6}", got "${result6}"`)
    }
    console.log('✅ Multi-line replacement')

    // Test case 7: Empty file insertion
    const result7 = updateText('', 1, 'first line')
    const expected7 = 'first line'
    if (result7 !== expected7) {
      throw new Error(`Test 7 failed: expected "${expected7}", got "${result7}"`)
    }
    console.log('✅ Empty file insertion')

    // Test case 8: Single line file insertion at end
    const result8 = updateText('only line', 2, 'second line')
    const expected8 = 'only line\nsecond line'
    if (result8 !== expected8) {
      throw new Error(`Test 8 failed: expected "${expected8}", got "${result8}"`)
    }
    console.log('✅ Single line file insertion at end')

    // Test case 9: Error - from_line too high
    try {
      updateText('line 1\nline 2', 5, 'should fail')
      throw new Error('Test 9 should have thrown an error')
    } catch (error) {
      if (error instanceof Error && error.message.includes('from_line 5 is beyond file length')) {
        console.log('✅ Error handling for from_line too high')
      } else {
        throw new Error(`Test 9 failed with unexpected error: ${error}`)
      }
    }

    // Test case 10: Error - invalid line range
    try {
      updateText('line 1\nline 2\nline 3', 3, 'should fail', 1)
      throw new Error('Test 10 should have thrown an error')
    } catch (error) {
      if (error instanceof Error && error.message.includes('Invalid line range')) {
        console.log('✅ Error handling for invalid line range')
      } else {
        throw new Error(`Test 10 failed with unexpected error: ${error}`)
      }
    }

    // Test case 11: Empty text insertion
    const result11 = updateText('line 1\nline 2', 2, '')
    const expected11 = 'line 1\n\nline 2'
    if (result11 !== expected11) {
      throw new Error(`Test 11 failed: expected "${expected11}", got "${result11}"`)
    }
    console.log('✅ Empty text insertion')

    // Test case 12: Replace range of lines with fewer lines
    const result12 = updateText('line 1\nline 2\nline 3\nline 4\nline 5', 2, 'single replacement', 4)
    const expected12 = 'line 1\nsingle replacement\nline 5'
    if (result12 !== expected12) {
      throw new Error(`Test 12 failed: expected "${expected12}", got "${result12}"`)
    }
    console.log('✅ Replace range with fewer lines')

    // Test case 13: Replace range of lines with more lines
    const result13 = updateText('line 1\nline 2\nline 3', 2, 'replacement A\nreplacement B\nreplacement C', 2)
    const expected13 = 'line 1\nreplacement A\nreplacement B\nreplacement C\nline 3'
    if (result13 !== expected13) {
      throw new Error(`Test 13 failed: expected "${expected13}", got "${result13}"`)
    }
    console.log('✅ Replace single line with multiple lines')

    console.log('\n🎉 All pure updateText function tests passed!')

    // Test a few integration cases with file I/O for the full tool
    console.log('\n🧪 Testing insertText tool integration...')

    const tempFiles: string[] = []

    // Integration test 1: Basic file operation
    const file1 = testUtil.createTempFile('integration1', 'line 1\nline 2\nline 3')
    tempFiles.push(file1)

    await insertText.handler({
      file_path: file1,
      from_line: 2,
      text: 'integrated line',
    })

    const content1 = fs.readFileSync(file1, 'utf8')
    const expected_integration1 = 'line 1\nintegrated line\nline 2\nline 3'
    if (content1 !== expected_integration1) {
      throw new Error(`Integration test 1 failed: expected "${expected_integration1}", got "${content1}"`)
    }
    console.log('✅ Integration test: file I/O operations')

    // Integration test 2: Relative path support
    const file2 = testUtil.createTempFile('integration2', 'line 1')
    tempFiles.push(file2)
    const relativePath = file2.replace(process.cwd() + '/', '')

    await insertText.handler({
      file_path: relativePath,
      from_line: 1,
      text: 'inserted via relative path',
    })

    const content2 = fs.readFileSync(file2, 'utf8')
    const expected_integration2 = 'inserted via relative path\nline 1'
    if (content2 !== expected_integration2) {
      throw new Error(`Integration test 2 failed: expected "${expected_integration2}", got "${content2}"`)
    }
    console.log('✅ Integration test: relative path support')

    // Cleanup temp files
    testUtil.cleanupTempFiles(tempFiles)

    console.log('\n🎉 All insertText tests passed!')

  } catch (error) {
    console.error('Test failed:', error)
    throw error
  }
}

// Run the test
test()
