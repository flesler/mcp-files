import _ from 'lodash'
import { z } from 'zod'
import env from '../env.js'
import { defineTool } from '../tools.js'
import util from '../util.js'

const importSymbol = defineTool({
  id: 'import_symbol',
  schema: z.object({
    module_path: z.string().min(1).describe('Module path to import (e.g., "lodash", "./utils", "@package/name")'),
    property: z.string().optional().describe('Only the given property from the module is dumped'),
  }),
  description: 'Import and inspect JavaScript/TypeScript modules ala require(), or import()',
  isReadOnly: true,
  isEnabled: env.DEBUG,
  fromArgs: ([module_path = '', property]) => ({
    module_path,
    property: property || undefined,
  }),
  handler: async (args) => {
    const { module_path: modulePath, property } = args
    const resolvedPath = modulePath.startsWith('.')
      ? util.resolve(modulePath)
      : modulePath
    let module = await import(resolvedPath)
    if (module.default) {
      module = module.default
    }
    const target = property ? _.get(module, property) : module
    if (target === undefined) {
      throw new Error(`Property '${property}' not found in module '${modulePath}'`)
    }
    const output: string[] = []
    output.push(`=== ${modulePath}${property ? `.${property}` : ''} ===`)
    output.push(dumpValue(target))
    return output.join('\n')
  },
})

export default importSymbol

const MAX_VALUE_LENGTH = 300

function dumpValue(value: any): string {
  const type = typeof value
  const output: string[] = []
  if (type === 'object' && value !== null) {
    const keys = Object.keys(value).sort()
    if (keys.length > 0) {
      if (_.isArray(value)) {
        const elementType = typeof value[0]
        output.push(`${elementType}[${value.length}]`)
      } else if (_.isPlainObject(value)) {
        output.push('object')
      } else {
        output.push(`object (${value.constructor.name})`)
      }
      keys.forEach((key) => {
        if (!key.startsWith('_')) {
          output.push(`${key}: ${dump(value[key])}`)
        }
      })
      return output.join('\n')
    }
  }
  return dump(value)
}

function dump(value: any): string {
  const type = typeof value
  if (type === 'function') {
    if (isClass(value)) {
      return `class ${getClassSignature(value)}`
    }
    return `function ${getFunctionSignature(value)}`
  }
  if (_.isArray(value)) {
    const json = JSON.stringify(value)
    if (json.length <= MAX_VALUE_LENGTH) {
      return json
    }
    const type = typeof value[0]
    return `${type}[${value.length}]`
  }
  if (_.isPlainObject(value)) {
    const json = JSON.stringify(value)
    if (json.length <= MAX_VALUE_LENGTH) {
      return json
    }
    const keys = Object.keys(value)
    return `object (${keys.length} properties)`
  }
  if (type === 'object' && value !== null) {
    return value.constructor.name
  }
  return JSON.stringify(value)
}

function isClass(func: Function): boolean {
  return func.toString().startsWith('class ')
}

function getFunctionSignature(func: Function): string {
  try {
    const str = func.toString()
    const match = str.match(/\(([^)]*)\)/)
    if (match?.[1]) {
      const params = match[1].split(',').map(p => p.trim().split('=')[0]?.trim()).filter(Boolean)
      return `(${params.join(', ')})`
    }
    return '(...)'
  } catch {
    return '(...)'
  }
}

function getClassSignature(cls: Function): string {
  try {
    const match = cls.toString().match(/constructor\s*\(([^)]*)\)/)
    if (match?.[1]) {
      const params = match[1].split(',').map(p => p.trim().split('=')?.[0]?.trim()).filter(p => p)
      return `(${params.join(', ')})`
    }
    return getFunctionSignature(cls)
  } catch {
    return '(...)'
  }
}
