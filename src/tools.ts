import type { ZodSchema } from 'zod'
import importSymbol from './tools/importSymbol.js'
import insertText from './tools/insertText.js'
import osNotification from './tools/osNotification.js'
import readSymbol from './tools/readSymbol.js'
import searchReplace from './tools/searchReplace.js'
import utilsDebug from './tools/utilsDebug.js'
import type { Tool, ToolConfig } from './types.js'

export function defineTool<N extends string, S extends ZodSchema = ZodSchema>(
  config: ToolConfig<N, S>,
): Tool<S> {
  return {
    isResource: false,
    isReadOnly: false,
    isEnabled: true,
    name: config.name ?? config.id,
    ...config,
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
