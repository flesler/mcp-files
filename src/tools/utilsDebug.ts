import { z } from 'zod'
import env from '../env.js'
import pkg from '../pkg.js'
import { defineTool } from '../tools.js'
import util from '../util.js'

const utilsDebug = defineTool({
  id: 'utils_debug',
  schema: z.object({}),
  description: util.trimLines(`
    Get debug information about available tools and environment.
    - ${pkg.name} version: ${pkg.version}
    `),
  isReadOnly: true,
  isEnabled: env.DEBUG,
  fromArgs: () => ({}),
  handler: (args, context) => {
    return {
      ...args, processEnv: process.env, argv: process.argv,
      env, context, version: pkg.version, CWD: util.CWD, REPO: util.REPO,
    }
  },
})

export default utilsDebug
