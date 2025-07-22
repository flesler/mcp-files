import importSymbolTool from '../src/tools/importSymbol.js'

async function test() {
  console.log('Testing importSymbol tool...')

  try {
    // Test 1: Import a simple built-in module property
    const result1 = await importSymbolTool.handler({
      path: 'path',
      property: 'resolve'
    })
    console.log('✅ Built-in module property test passed')
    console.log('Result preview:', result1.substring(0, 150) + '...')

    // Test 2: Import a utility function
    const result2 = await importSymbolTool.handler({
      path: 'path',
      property: 'join'
    })
    console.log('✅ Utility function test passed')
    console.log('Function type:', result2.includes('function'))

    // Test 3: Import fs module constants
    const result3 = await importSymbolTool.handler({
      path: 'fs',
      property: 'constants'
    })
    console.log('✅ Module constants test passed')
    console.log('Has constants:', result3.includes('F_OK'))

    // Test 4: Import non-existent property
    const result4 = await importSymbolTool.handler({
      path: 'path',
      property: 'nonExistentProperty'
    })
    console.log('✅ Non-existent property test passed')
    console.log('Result:', result4)

    // Test 5: Import non-existent module (should throw)
    try {
      await importSymbolTool.handler({
        path: 'this-module-definitely-does-not-exist-12345'
      })
      console.log('❌ Non-existent module test failed - should have thrown')
    } catch (err: any) {
      console.log('✅ Non-existent module test passed - correctly threw error')
      console.log('Error type:', err.message.includes('Cannot find module') || err.message.includes('not found'))
    }

    console.log('\n🎉 All importSymbol tests passed!')

  } catch (err) {
    console.error('❌ Test failed:', err)
  }
}

test() 