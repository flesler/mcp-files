import { execSync as nodeExecSync } from 'child_process'
import fs from 'fs'
import { dirname, isAbsolute, resolve } from 'path'
import { fileURLToPath } from 'url'

/** Object.keys() with more accurate types */
export type KeysOf<T> = Array<keyof T>

const util = {
  // From Cursor
  CWD: process.env.WORKSPACE_FOLDER_PATHS || process.cwd(),
  // Relative to the project root
  ROOT: resolve(dirname(fileURLToPath(import.meta.url)), '..'),

  /** Resolve a path relative to the project root (avoids __dirname recreation everywhere) */
  resolve(path: string): string {
    if (isAbsolute(path)) {
      return path
    }
    return resolve(util.ROOT, path)
  },

  readFile(path: string, def?: string): string {
    if (!util.exists(path)) {
      return def || ''
    }
    return fs.readFileSync(path, 'utf-8')
  },

  writeFile(path: string, content: string): void {
    util.mkdirp(dirname(path))
    fs.writeFileSync(path, content, 'utf-8')
  },

  mkdirp(path: string): void {
    if (!util.exists(path)) {
      fs.mkdirSync(path, { recursive: true })
    }
  },

  ext(path: string): string {
    const match = path.match(/\.(\w{2,5})$/)
    return match ? match[1] : ''
  },

  isFile(path: string): boolean {
    return !!util.ext(path)
  },

  exists(path: string): boolean {
    return fs.existsSync(path)
  },

  /** Object.keys() with more accurate types */
  keysOf<T extends object>(obj: T): KeysOf<T> {
    return Object.keys(obj) as KeysOf<T>
  },

  trimLines(str: string): string {
    return str.replace(/^ +\n?/gm, '').trim()
  },

  clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(value, max))
  },

  resolveAndValidateFile(filePath: string): string {
    const fullPath = resolve(filePath)
    if (!util.exists(fullPath)) {
      throw new Error(`File not found: ${filePath}`)
    }
    return fullPath
  },

  readResolvedFile(filePath: string): string {
    const fullPath = util.resolveAndValidateFile(filePath)
    return util.readFile(fullPath)
  },

  execSync(command: string, options?: Parameters<typeof nodeExecSync>[1]): string | Buffer {
    return nodeExecSync(command, options)
  },
}

export default util

export function indent(lines: string[], indentSize = 2): string[] {
  const indentStr = ' '.repeat(indentSize)
  return lines.map(line => `${indentStr}${line}`)
}

export function notNil<T>(value: T | null | undefined): value is T {
  return value != null
}

// File system utilities for testability
export function readFile(filePath: string, encoding: BufferEncoding = 'utf-8'): string {
  return fs.readFileSync(filePath, encoding)
}

export function writeFile(filePath: string, content: string, encoding: BufferEncoding = 'utf-8'): void {
  fs.writeFileSync(filePath, content, encoding)
}

export function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath)
}

// Command execution wrapper for testability
export function execSync(command: string, options?: Parameters<typeof nodeExecSync>[1]): string | Buffer {
  return nodeExecSync(command, options)
}
