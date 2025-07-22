import _ from 'lodash'
import { z } from 'zod'
import { ToolConfig } from '../types.js'

const schema = z.object({
  path: z.string().min(1).describe('Module or package path to inspect'),
  property: z.string().optional().describe('Optional specific property to inspect within the module (supports dot notation)'),
})

const importSymbolTool: ToolConfig = {
  name: 'import_symbol',
  schema,
  description: `Inspect types and structures from imports or modules.
Supports:
- Node.js modules and packages
- Relative imports from your codebase
- Property inspection with dot notation
- Dynamic imports with detailed type information`,
  isReadOnly: true,
  handler: async (args: z.infer<typeof schema>) => {
    const { path: importPath, property } = args

    let module = await import(importPath)
    if (module.default) {
      module = module.default
    }
    const target = property ? _.get(module, property) : module
    if (target === undefined) {
      return `Property '${property}' not found in module '${importPath}'`
    }

    const output: string[] = []
    output.push(`=== ${importPath}${property ? `.${property}` : ''} ===`)
    output.push(dumpValue(target))
    return output.join('\n')
  },
}

export default importSymbolTool

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
    if (match) {
      const params = match[1].split(',').map(p => p.trim().split('=')[0].trim()).filter(p => p)
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
    if (match) {
      const params = match[1].split(',').map(p => p.trim().split('=')[0].trim()).filter(p => p)
      return `(${params.join(', ')})`
    }
    return getFunctionSignature(cls)
  } catch {
    return '(...)'
  }
}
