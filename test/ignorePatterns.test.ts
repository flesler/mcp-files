import { generateIgnorePatterns } from '../src/tools/readSymbol.js'

interface TestCase {
  input: string[]
  expected: string[]
  description: string
}

const testCases: TestCase[] = [
  {
    input: ['src/**/*.ts'],
    expected: ['!**/{package-lock.json,*.test.*,*.spec.*}', '!{node_modules,dist,build,out,.git,test,tests}/**'],
    description: 'Should ignore all default directories when none specified',
  },

  {
    input: ['src/**/*.ts', 'node_modules/@types/**/*.d.ts'],
    expected: ['!**/{package-lock.json,*.test.*,*.spec.*}', '!{dist,build,out,.git,test,tests}/**'],
    description: 'Should NOT ignore node_modules when explicitly included',
  },

  {
    input: ['dist/assets/**/*.js'],
    expected: ['!**/{package-lock.json,*.test.*,*.spec.*}', '!{node_modules,build,out,.git,test,tests}/**'],
    description: 'Should NOT ignore dist when explicitly included',
  },

  {
    input: ['node_modules', 'dist', 'build'],
    expected: ['!**/{package-lock.json,*.test.*,*.spec.*}', '!{out,.git,test,tests}/**'],
    description: 'Should only ignore directories not explicitly requested',
  },

  {
    input: ['node_modules', 'dist', 'build', 'out', '.git'],
    expected: ['!**/{package-lock.json,*.test.*,*.spec.*}', '!{test,tests}/**'],
    description: 'Should ignore files and remaining directories when most directories explicitly requested',
  },

  {
    input: ['node_modules', 'dist', 'build', 'out', '.git', 'test', 'tests'],
    expected: ['!**/{package-lock.json,*.test.*,*.spec.*}'],
    description: 'Should ignore only files when all directories explicitly requested',
  },

  {
    input: ['src/**/*.ts', 'test/**/*.ts', 'docs/**/*.md'],
    expected: ['!**/{package-lock.json,*.test.*,*.spec.*}', '!{node_modules,dist,build,out,.git,tests}/**'],
    description: 'Should ignore all when no ignored dirs mentioned except test is included',
  },

  {
    input: ['.'],
    expected: ['!**/{package-lock.json,*.test.*,*.spec.*}', '!{node_modules,dist,build,out,.git,test,tests}/**'],
    description: 'Should ignore all default directories when using current directory pattern "."',
  },
]

console.log('🧪 Testing generateIgnorePatterns function...\n')

let passed = 0
let failed = 0

for (let i = 0; i < testCases.length; i++) {
  const testCase = testCases[i]
  const testNum = i + 1

  try {
    console.log(`🔄 Test ${testNum}/${testCases.length}: ${testCase.description}`)

    const result = generateIgnorePatterns(testCase.input)
    const matches = JSON.stringify(result) === JSON.stringify(testCase.expected)

    if (matches) {
      console.log('✅ PASSED: Generated expected pattern')
      passed++
    } else {
      throw new Error(`Expected ${JSON.stringify(testCase.expected)}, got ${JSON.stringify(result)}`)
    }

  } catch (error) {
    console.log(`❌ FAILED: ${error.message}`)
    failed++
  }
}

console.log(`\n🎯 Test Summary: ${passed} passed, ${failed} failed`)

if (failed === 0) {
  console.log('🎉 All generateIgnorePatterns tests passed!')
} else {
  console.log(`❌ ${failed} test(s) failed`)
  process.exit(1)
}
