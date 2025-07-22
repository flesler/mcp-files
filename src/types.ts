import { z, ZodSchema } from 'zod'

export interface ToolConfig<S extends ZodSchema = ZodSchema> {
  name: string
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
