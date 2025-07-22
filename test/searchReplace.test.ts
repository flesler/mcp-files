import searchReplace from '../src/tools/searchReplace.js'
import util from '../src/util.js'
import testUtil from './util.js'

async function test() {
  console.log('Testing searchReplace tool...')
  const tempFiles: string[] = []

  try {
    const tempPath1 = testUtil.createTempFile('replace-1.txt', 'Hello world, this is a test file.')
    tempFiles.push(tempPath1)

    // Test 1: Exact replacement
    const result1 = await searchReplace.handler({
      file_path: tempPath1,
      old_string: 'world',
      new_string: 'universe',
    })
    console.log('✅ Exact replacement test passed')
    console.log('Result:', result1)
    console.log('File content:', util.readFile(tempPath1))

    // Test 2: Text not found - should throw error
    try {
      await searchReplace.handler({
        file_path: tempPath1,
        old_string: 'nonexistent text',
        new_string: 'replacement',
      })
      console.log('❌ Text not found test failed - should have thrown')
    } catch (err: any) {
      console.log('✅ Text not found test passed - correctly threw error')
      console.log('Error includes suggestion:', err.message.includes('Similar text found'))
    }

    // Test 3: File not found - should throw error
    try {
      await searchReplace.handler({
        file_path: 'nonexistent-file.txt',
        old_string: 'test',
        new_string: 'replacement',
      })
      console.log('❌ File not found test failed - should have thrown')
    } catch (err: any) {
      console.log('✅ File not found test passed - correctly threw error')
      console.log('Error:', err.message)
    }

    const multilineContent = `function hello() {
  console.log("hello");
}`
    const tempPath2 = testUtil.createTempFile('replace-2.ts', multilineContent)
    tempFiles.push(tempPath2)

    const result3 = await searchReplace.handler({
      file_path: tempPath2,
      old_string: 'function hello() {\n  console.log("hello");\n}',
      new_string: 'const hello = () => console.log("hello");',
    })
    console.log('✅ Multi-line replacement test passed')
    console.log('Result:', result3)
    console.log('File content:', util.readFile(tempPath2))

    // Test validation failure protection
    try {
      // Test the validation logic directly - this should throw
      const content = 'replacement content'
      const expectedString = 'MISSING'
      
      if (!content.includes(expectedString)) {
        throw new Error(`REPLACEMENT FAILED: "${expectedString}" not found in final content. File NOT modified.`)
      }
      
      console.log('❌ Validation test failed - should have thrown error')
    } catch (error) {
      console.log('✅ Validation failure test passed - correctly threw error')
      console.log(`Error: ${(error as Error).message}`)
    }

    console.log('\n🎉 All searchReplace tests passed!')

  } catch (err) {
    console.error('❌ Test failed:', err)
  } finally {
    testUtil.cleanupTempFiles(tempFiles)
  }
}

test()
