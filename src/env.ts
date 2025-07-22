
const env = {
  PORT: readNumber('PORT', 4657),
  TRANSPORT: readString('TRANSPORT', 'stdio'),
  DEBUG: readBoolean('DEBUG', false),
}

function readString(key: string, def: any): string {
  return process.env[key] ?? String(def)
}

function readNumber(key: string, def: number): number {
  return Number.parseFloat(readString(key, def))
}

function readBoolean(key: string, def: boolean): boolean {
  return readString(key, def) === 'true'
}

export default env
