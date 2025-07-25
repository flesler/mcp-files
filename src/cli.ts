import _ from 'lodash'
import { ZodError } from 'zod'
import env from './env.js'
import logger from './logger.js'
import tools from './tools.js'
import { Tool } from './types.js'

const cli = {
  isCommand: (arg?: string) => arg && arg in tools,

  async run(args: string[]) {
    const inputCmd = args.shift()!
    const tool: Tool = (tools as any)[inputCmd]
    if (!tool) {
      throw new Error(`Unknown command: ${inputCmd}`)
    }
    env.CLI = true
    const res = await this.runTool(tool, tool.fromArgs(args))
    console.log(res)
  },

  async runTool(tool: any, args: object): Promise<string> {
    try {
      args = tool.schema.parse(args)
      const res = await tool.handler(args)
      return _.isString(res) ? res : JSON.stringify(res)
    } catch (err) {
      const params: any = { name: tool.name, args, error: err.message }
      if (err instanceof ZodError) {
        params.issues = err.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ')
      }
      logger.error('Tool execution failed', params)
      throw err
    }
  },
}

export default cli
