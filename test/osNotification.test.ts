import osNotificationTool from '../src/tools/osNotification.js'

async function test() {
  console.log('Testing osNotification tool...')

  try {
    try {
      const result1 = await osNotificationTool.handler({
        message: 'Test notification from mcp-tools test suite',
        title: 'Test',
      })
      console.log('✅ Notification test passed')
      console.log('Result:', result1)
      console.log('  (If you saw a notification popup, the test worked!)')
    } catch (err: any) {
      if (err.message.includes('No notification method available')) {
        console.log('⚠️  No notification method available on this system')
        console.log('   This is expected if notify-send, osascript, etc. are not installed')
      } else {
        throw err
      }
    }

    try {
      const result2 = await osNotificationTool.handler({
        message: 'Test with default title',
      })
      console.log('✅ Default title test passed')
      console.log('Result:', result2)
    } catch (err: any) {
      if (err.message.includes('No notification method available')) {
        console.log('⚠️  Default title test skipped (no notification method)')
      } else {
        throw err
      }
    }

    console.log('\n🎉 All osNotification tests completed!')
    console.log('Note: These tests require notification tools to be installed to fully verify functionality')

  } catch (err) {
    console.error('❌ Test failed:', err)
  }
}

test()
