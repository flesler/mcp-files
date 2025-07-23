import { z, ZodSchema } from 'zod'

export interface ToolResult {
  success: boolean
  output: string
  error?: string
}

export interface ToolConfig<N extends string, S extends ZodSchema = ZodSchema> {
  id: N
  name?: string
  schema: S
  description: string
  isReadOnly?: boolean
  isEnabled?: boolean
  isResource?: boolean
  handler: (args: z.infer<S>, context?: any) => Promise<any> | any
  fromArgs: (args: string[]) => z.infer<S>
}

export type Tool<S extends ZodSchema = ZodSchema> = Required<ToolConfig<string, S>>
