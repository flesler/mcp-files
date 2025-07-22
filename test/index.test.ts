import fs from 'fs'
import util from '../src/util.js'

if (process.env.SILENT === 'true') {
  console.log = () => {}
}

console.log('🚀 Running all mcp-files tests...\n')

async function runAllTests() {
  const testModules = fs.readdirSync(util.resolve('test', util.REPO))
    .filter((file: string) => file.endsWith('.test.ts') && file !== 'index.test.ts')
    .sort()

  console.log(`Running ${testModules.length} test modules in sequence...\n`)

  try {
    for (const testModule of testModules) {
      console.log(`🔄 Starting ${testModule}`)
      await import(`./${testModule}`)
      console.log(`✅ Completed ${testModule}`)
    }
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

runAllTests().catch((err) => {
  console.error('Test suite failed:', err)
  process.exit(1)
})
