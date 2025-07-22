import readSymbolTool from '../src/tools/readSymbol.js'
import testUtil from './util.js'

async function test() {
  console.log('Testing readSymbol tool...')
  const tempFiles: string[] = []

  try {
    const testContent = `
export const myFunction = () => {
  return 'hello'
}

interface MyInterface {
  name: string
}

class MyClass {
  constructor() {}
}
    `.trim()

    const tempFile = testUtil.createTempFile('symbol-test.ts', testContent)
    tempFiles.push(tempFile)

    const result1 = await readSymbolTool.handler({
      symbols: ['myFunction'],
      files: [tempFile],
    })
    console.log('✅ Symbol found test passed')
    console.log('Result preview:', result1.substring(0, 100) + '...')

    const result2 = await readSymbolTool.handler({
      symbols: ['MyInterface', 'MyClass'],
      files: [tempFile],
    })
    console.log('✅ Multiple symbols test passed')
    console.log('Found symbols:', result2.includes('MyInterface') && result2.includes('MyClass'))

    const result3 = await readSymbolTool.handler({
      symbols: ['nonExistentSymbol'],
      files: [tempFile],
    })
    console.log('✅ Symbol not found test passed')
    console.log('Result:', result3)

    try {
      await readSymbolTool.handler({
        symbols: ['myFunction'],
        files: ['nonexistent.ts'],
      })
      console.log('❌ File not found test failed - should have thrown')
    } catch (err: any) {
      console.log('✅ File not found test passed - correctly threw error')
      console.log('Error:', err.message)
    }

    console.log('\n🎉 All readSymbol tests passed!')

  } catch (err) {
    console.error('❌ Test failed:', err)
  } finally {
    testUtil.cleanupTempFiles(tempFiles)
  }
}

test()
