import { z } from 'zod'
import env from '../env.js'
import pkg from '../pkg.js'
import { defineTool } from '../tools.js'
import util from '../util.js'

const schema = z.object({})

const utilsDebug = defineTool({
  id: 'utils_debug',
  schema: z.object({}),
  description: 'Get debug information about available tools and environment.',
  isReadOnly: true,
  isEnabled: env.DEBUG,
  fromArgs: () => ({}),
  handler: (args: z.infer<typeof schema>) => {
    return {
      ...args,
      processEnv: process.env,
      argv: process.argv,
      env,
      version: pkg.version,
      cwd: util.CWD,
    }
  },
})

export default utilsDebug
