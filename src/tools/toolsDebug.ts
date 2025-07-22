import { z } from 'zod'
import env from '../env.js'
import pkg from '../pkg.js'
import { ToolConfig } from '../types.js'
import util from '../util.js'

const schema = z.object({})

const toolsDebugTool: ToolConfig = {
  name: 'tools_debug',
  schema,
  description: 'Get debug information about the MCP server environment and configuration.',
  isReadOnly: true,
  isEnabled: env.DEBUG,
  handler: (args: z.infer<typeof schema>) => {
    return JSON.stringify({
      ...args,
      processEnv: process.env,
      argv: process.argv,
      env,
      version: pkg.version,
      cwd: util.CWD,
    }, null, 2)
  },
}

export default toolsDebugTool
