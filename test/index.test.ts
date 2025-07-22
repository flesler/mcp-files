console.log('🚀 Running all mcp-files tests...\n')

async function runAllTests() {
  const testModules = [
    'readSymbol.test.ts',
    'importSymbol.test.ts',
    'searchReplace.test.ts',
    'osNotification.test.ts',
  ]

  console.log(`Running ${testModules.length} test modules in parallel...\n`)

  const testPromises = testModules.map(async (testModule) => {
    console.log(`🔄 Starting ${testModule}`)

    try {
      await import(`./${testModule}`)
      console.log(`✅ Completed ${testModule}`)
    } catch (err) {
      console.error(`❌ Failed ${testModule}:`, err)
      throw err
    }
  })

  try {
    await Promise.all(testPromises)
    console.log(`\n${'='.repeat(50)}`)
    console.log('🎯 All tests completed successfully!')
    console.log(`${'='.repeat(50)}`)
  } catch (err) {
    console.log(`\n${'='.repeat(50)}`)
    console.log('💥 Some tests failed!')
    console.log(`${'='.repeat(50)}`)
    throw err
  }
}

runAllTests().catch(console.error)
 