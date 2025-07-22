import { z, ZodSchema } from 'zod'
import importSymbolTool from './tools/importSymbol.js'
import osNotificationTool from './tools/osNotification.js'
import readSymbolTool from './tools/readSymbol.js'
import replaceTextTool from './tools/replaceText.js'
import toolsDebugTool from './tools/toolsDebug.js'
import { ToolConfig } from './types.js'

interface Tool<S extends ZodSchema = ZodSchema> {
  name: string
  schema: S
  description: string
  isResource: boolean
  isReadOnly: boolean
  isEnabled: boolean
  handler: (args: z.infer<S>) => any
}

const tools = {
  [readSymbolTool.name]: createTool(readSymbolTool),
  [importSymbolTool.name]: createTool(importSymbolTool),
  [replaceTextTool.name]: createTool(replaceTextTool),
  [osNotificationTool.name]: createTool(osNotificationTool),
  [toolsDebugTool.name]: createTool(toolsDebugTool),
} as const satisfies Record<string, Tool>

function createTool(toolConfig: ToolConfig): Tool {
  return {
    name: toolConfig.name,
    schema: toolConfig.schema,
    description: toolConfig.description,
    isResource: false,
    isReadOnly: toolConfig.isReadOnly ?? false,
    isEnabled: toolConfig.isEnabled ?? true,
    handler: toolConfig.handler,
  }
}

export default tools
export type { Tool }
