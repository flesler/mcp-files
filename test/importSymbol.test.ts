import { describe, expect, it } from 'vitest'
import importSymbolTool from '../src/tools/importSymbol.js'

describe('importSymbol tool', () => {
  it('should import a simple built-in module property', async () => {
    const result = await importSymbolTool.handler({
      module_path: 'path',
      property: 'resolve',
    })

    expect(result).toContain('=== path.resolve ===')
    expect(result).toContain('function')
  })

  it('should import a utility function', async () => {
    const result = await importSymbolTool.handler({
      module_path: 'path',
      property: 'join',
    })

    expect(result).toContain('function')
  })

  it('should import fs module constants', async () => {
    const result = await importSymbolTool.handler({
      module_path: 'fs',
      property: 'constants',
    })

    expect(result).toContain('F_OK')
  })

  it('should throw error for non-existent property', async () => {
    await expect(importSymbolTool.handler({
      module_path: 'path',
      property: 'nonExistentProperty',
    })).rejects.toThrow(/not found/)
  })

  it('should throw error for non-existent module', async () => {
    await expect(importSymbolTool.handler({
      module_path: 'this-module-definitely-does-not-exist-12345',
    })).rejects.toThrow()
  })
})
