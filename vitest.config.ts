import path from 'path'
import { defineConfig } from 'vitest/config'

const APP_NAME = path.basename(__dirname)

export default defineConfig(() => ({
  cacheDir: `/tmp/${APP_NAME}`,
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.test.ts'],
    exclude: ['node_modules', 'dist', 'tmp'],
    // Minimal output to conserve AI context window
    reporters: process.env.MINIMAL ? [new MinimalReporter()] : ['dot'],
    logHeapUsage: false,
    outputFile: undefined,
    silent: false,
    ui: false,
    // Minimize output noise
    disableConsoleIntercept: true, // Don't capture console.log
    // Remove useless stack traces from test case arrays
    onStackTrace: () => false, // Suppress all code frames
    // Performance optimizations
    pool: 'threads',
    poolOptions: {
      threads: { singleThread: false, useAtomics: true },
    },
    // Skip heavy operations for speed
    coverage: {
      enabled: false, // Disable by default for speed
    },
  },
  // Use ESM for better performance
  esbuild: {
    target: 'node20',
  },
}))

class MinimalReporter {
  onFinished(files: any[] = []) {
    let totalTests = 0
    let failedTests = 0
    const countAndShowTask = (task: any) => {
      if (task.type === 'test') {
        totalTests++
        if (task.result?.state === 'fail') {
          failedTests++
          console.log(`❌ ${task.name}`)
          if (task.result?.errors?.[0]) {
            const err = task.result.errors[0]
            // Simple approach: just show the first line, skip noise
            console.log(`  ${err.message.split('\n')[0]}`)
          }
        }
      }
      // Recursively count nested tasks  
      if (task.tasks) {
        task.tasks.forEach((subtask: any) => countAndShowTask(subtask))
      }
    }
    files.forEach(file => {
      if (file.tasks) {
        file.tasks.forEach((task: any) => countAndShowTask(task))
      }
    })
    // Simple summary
    console.log(`\n${failedTests > 0 ? '❌' : '✅'} ${totalTests - failedTests} passed, ${failedTests} failed`)
  }
}
