#!/usr/bin/env node
import { execSync } from 'child_process'
import fs from 'fs'

// Read package.json directly for dependencies and main field
const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'))
const deps = Object.keys(packageJson.dependencies || {})
const optionalPatterns = [
  '@*',      // All scoped packages (@modelcontextprotocol/*, @valibot/*, etc.)
  'effect',  // Optional schema libraries
  'sury',
  'valibot*',
]

// Generate external flags
const allExternals = [...deps, ...optionalPatterns]
const externals = allExternals.map(dep => `--external:${dep}`).join(' ')

// Build command with optimizations
const verbose = !!process.env.VERBOSE
let cmd = `esbuild src/index.ts --bundle --platform=node --target=node20 --format=esm --outfile=${packageJson.main} ${externals} --banner:js="#!/usr/bin/env node" --minify --legal-comments=none --tree-shaking=true --drop:debugger`
if (!verbose) {
  cmd += ' --log-level=warning'
}

try {
  execSync(cmd, { stdio: 'inherit' })
} catch {
  process.exit(1)
}
execSync('chmod +x dist/index.js', { stdio: 'inherit' })
