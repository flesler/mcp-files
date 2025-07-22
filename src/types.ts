import { z, ZodSchema } from 'zod'

export interface ToolConfig<N extends string, S extends ZodSchema = ZodSchema> {
  name: N
  schema: S
  description: string
  isReadOnly?: boolean
  isEnabled?: boolean
  handler: (args: z.infer<S>) => Promise<string> | string
}

export interface ToolResult {
  success: boolean
  output: string
  error?: string
}
