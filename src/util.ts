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
}

export default util
