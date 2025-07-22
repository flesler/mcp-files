import { ZodError } from 'zod'
import tools from './tools.js'

type Tools = typeof tools
type ToolName = keyof Tools

// Type-safe mapping from tool names to CLI argument parsers
type ToolMapper = {
  [K in ToolName]: (args: string[]) => Parameters<Tools[K]['handler']>[0]
}

const commands: ToolMapper = {
  read_symbol: ([symbolsArg, ...files]: string[]) => ({
    symbols: symbolsArg.split(',').map(s => s.trim()),
    files,
  }),
  import_symbol: ([path, property]: string[]) => ({
    path,
    property: property || undefined,
  }),
  replace_text: ([file_path, old_string, new_string]: string[]) => ({
    file_path,
    old_string,
    new_string,
  }),
  os_notification: ([message, title]: string[]) => ({
    message,
    title: title || undefined,
  }),
  debug: () => ({}),
}

const cli = {
  isCommand: (arg: string) => arg in commands,

  async run(args: string[]) {
    try {
      const cmd = args.shift() as ToolName
      let toolArgs: any = commands[cmd](args)
      toolArgs = tools[cmd].schema.parse(toolArgs)
      const res = await tools[cmd].handler(toolArgs)
      console.log(res)
    } catch (err) {
      if (err instanceof ZodError) {
        const issues = err.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ')
        console.error(`Error: ${issues}`)
        process.exit(1)
      }
      throw err
    }
  },
}

export default cli
