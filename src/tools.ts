import { z, ZodSchema } from 'zod'
import importSymbol from './tools/importSymbol.js'
import insertText from './tools/insertText.js'
import osNotification from './tools/osNotification.js'
import readSymbol from './tools/readSymbol.js'
import searchReplace from './tools/searchReplace.js'
import utilsDebug from './tools/utilsDebug.js'

interface Tool<S extends ZodSchema = ZodSchema> {
  id: string
  name: string
  schema: S
  description: string
  isResource: boolean
  isReadOnly: boolean
  isEnabled: boolean
  handler: (args: z.infer<S>) => any
  fromArgs: (args: string[]) => z.infer<S>
}

interface ToolConfig<N extends string, S extends ZodSchema = ZodSchema> {
  id: N
  name?: string
  schema: S
  description: string
  isReadOnly?: boolean
  isEnabled?: boolean
  handler: (args: z.infer<S>) => Promise<any> | any
  fromArgs: (args: string[]) => z.infer<S>
}

// Single function to define a complete tool
export function defineTool<N extends string, S extends ZodSchema = ZodSchema>(
  config: ToolConfig<N, S>,
): Tool<S> {
  return {
    id: config.id,
    name: config.name ?? config.id,
    schema: config.schema,
    description: config.description,
    isResource: false,
    isReadOnly: config.isReadOnly ?? false,
    isEnabled: config.isEnabled ?? true,
    handler: config.handler,
    fromArgs: config.fromArgs,
  }
}

const tools = {
  read_symbol: readSymbol,
  import_symbol: importSymbol,
  search_replace: searchReplace,
  insert_text: insertText,
  os_notification: osNotification,
  utils_debug: utilsDebug,
} as const satisfies Record<string, Tool<any>>

export default tools
export type { Tool }
