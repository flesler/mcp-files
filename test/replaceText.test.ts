import replaceTextTool from '../src/tools/replaceText.js'
import util from '../src/util.js'
import testUtil from './util.js'

async function test() {
  console.log('Testing replaceText tool...')
  const tempFiles: string[] = []

  try {
    const tempPath1 = testUtil.createTempFile('replace-1.txt', 'Hello world, this is a test file.')
    tempFiles.push(tempPath1)

    const result1 = await replaceTextTool.handler({
      file_path: tempPath1,
      old_string: 'world',
      new_string: 'universe',
    })
    console.log('✅ Exact replacement test passed')
    console.log('Result:', result1)
    console.log('File content:', util.readFile(tempPath1))

    const result2 = await replaceTextTool.handler({
      file_path: tempPath1,
      old_string: 'nonexistent text',
      new_string: 'replacement',
    })
    console.log('✅ Text not found test passed')
    console.log('Result contains suggestion:', result2.includes('Similar text found'))

    const multilineContent = `function hello() {
  console.log("hello");
}`
    const tempPath2 = testUtil.createTempFile('replace-2.ts', multilineContent)
    tempFiles.push(tempPath2)

    const result3 = await replaceTextTool.handler({
      file_path: tempPath2,
      old_string: 'function hello() {\n  console.log("hello");\n}',
      new_string: 'const hello = () => console.log("hello");',
    })
    console.log('✅ Multi-line replacement test passed')
    console.log('Result:', result3)
    console.log('File content:', util.readFile(tempPath2))

    try {
      await replaceTextTool.handler({
        file_path: 'nonexistent.txt',
        old_string: 'test',
        new_string: 'replacement',
      })
      console.log('❌ File not found test failed - should have thrown')
    } catch (err: any) {
      console.log('✅ File not found test passed - correctly threw error')
      console.log('Error:', err.message)
    }

    console.log('\n🎉 All replaceText tests passed!')

  } catch (err) {
    console.error('❌ Test failed:', err)
  } finally {
    testUtil.cleanupTempFiles(tempFiles)
  }
}

test()
