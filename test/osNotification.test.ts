import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import osNotificationTool from '../src/tools/osNotification.js'
import util from '../src/util.js'

// Module variables to track mock calls
let mockExecSyncCalls: Array<{ cmd: string; args: any[] }> = []

describe('osNotification tool', () => {
  beforeEach(() => {
    // Mock util.execSync with call tracking
    vi.spyOn(util, 'execSync').mockImplementation((cmd: string, ...args: any[]) => {
      mockExecSyncCalls.push({ cmd, args })
      // Silent mock - just return success
      return ''
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    mockExecSyncCalls = []
  })

  it('should send notification with custom title', async () => {
    const result = await osNotificationTool.handler({
      message: 'Test notification from mcp-files test suite',
      title: 'Test',
    })

    expect(result).toBeTruthy()
    expect(typeof result).toBe('string')
    expect(result).toContain('Test notification from mcp-files test suite')

    // Verify execSync was called
    expect(mockExecSyncCalls.length).toBeGreaterThan(0)
  })

  it('should send notification with default title', async () => {
    const result = await osNotificationTool.handler({
      message: 'Test with default title',
    })

    expect(result).toBeTruthy()
    expect(typeof result).toBe('string')
    expect(result).toContain('mcp-files')
    expect(result).toContain('Test with default title')

    // Verify execSync was called
    expect(mockExecSyncCalls.length).toBeGreaterThan(0)
  })

  it('should handle missing notification tools gracefully', async () => {
    // Update mock to throw an error like a missing notification tool would
    vi.mocked(util.execSync).mockImplementation(() => {
      throw new Error('Command not found')
    })

    // This should throw a meaningful error
    await expect(async () => {
      await osNotificationTool.handler({
        message: 'Test notification',
        title: 'Test',
      })
    }).rejects.toThrow()
  })
})
