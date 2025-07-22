import fs from 'fs'

const testUtil = {
  createTempFile(name: string, content: string): string {
    const tempPath = `tmp/temp-${name}-${Date.now()}.test`
    fs.writeFileSync(tempPath, content)
    return tempPath
  },

  cleanupTempFiles(paths: string[]) {
    paths.forEach(path => {
      try {
        fs.unlinkSync(path)
      } catch {
        // Ignore cleanup errors
      }
    })
  },
}

export default testUtil
