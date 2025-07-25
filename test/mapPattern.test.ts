import { mapPattern } from '../src/tools/readSymbol.js'

interface TestCase {
  input: string
  expected: string
  description: string
}

// Constants for easier maintenance
const DEFAULT_EXTENSIONS = '{d.ts,ts,tsx,js,jsx,mjs,cjs,cts,java,cs,cpp,c,h,hpp,cc,go,rs,php,swift,scss,css,less,graphql,gql,prisma,proto}'

const testCases: TestCase[] = [
  // Files with extensions - should pass through unchanged
  {
    input: 'src/app.ts',
    expected: 'src/app.ts',
    description: 'TypeScript file with extension',
  },
  {
    input: 'package.json',
    expected: `package.json/**/*.${DEFAULT_EXTENSIONS}`,
    description: 'JSON file treated as directory (JSON support removed)',
  },
  {
    input: 'styles.css',
    expected: 'styles.css',
    description: 'CSS file with extension',
  },
  {
    input: 'README.md',
    expected: `README.md/**/*.${DEFAULT_EXTENSIONS}`,
    description: 'Markdown file with extension (treated as directory since .md not in DEFAULT_EXTENSIONS)',
  },
  {
    input: 'types.d.ts',
    expected: 'types.d.ts',
    description: 'TypeScript declaration file',
  },
  {
    input: 'nested/deep/file.js',
    expected: 'nested/deep/file.js',
    description: 'Nested file with extension',
  },

  // Current directory patterns
  {
    input: '.',
    expected: `./**/*.${DEFAULT_EXTENSIONS}`,
    description: 'Current directory (dot)',
  },
  {
    input: './',
    expected: `./**/*.${DEFAULT_EXTENSIONS}`,
    description: 'Current directory with slash',
  },

  // Directory paths (no trailing slash)
  {
    input: 'src',
    expected: `src/**/*.${DEFAULT_EXTENSIONS}`,
    description: 'Simple directory name',
  },
  {
    input: 'src/components',
    expected: `src/components/**/*.${DEFAULT_EXTENSIONS}`,
    description: 'Nested directory path',
  },
  {
    input: 'test/unit/helpers',
    expected: `test/unit/helpers/**/*.${DEFAULT_EXTENSIONS}`,
    description: 'Deep nested directory',
  },
  {
    input: 'backend',
    expected: `backend/**/*.${DEFAULT_EXTENSIONS}`,
    description: 'Backend directory',
  },

  // Directory paths (with trailing slash)
  {
    input: 'src/',
    expected: `src/**/*.${DEFAULT_EXTENSIONS}`,
    description: 'Directory with trailing slash',
  },
  {
    input: 'api/routes/',
    expected: `api/routes/**/*.${DEFAULT_EXTENSIONS}`,
    description: 'Nested directory with trailing slash',
  },
  {
    input: 'frontend/components/',
    expected: `frontend/components/**/*.${DEFAULT_EXTENSIONS}`,
    description: 'Deep directory with trailing slash',
  },

  // Common glob patterns
  {
    input: '*',
    expected: `*.${DEFAULT_EXTENSIONS}`,
    description: 'Wildcard for all files in current directory',
  },
  {
    input: '*.*',
    expected: `*.${DEFAULT_EXTENSIONS}`,
    description: 'Wildcard for all files with extensions',
  },

  // Glob patterns without extensions - should add extensions
  {
    input: 'src/*',
    expected: `src/*.${DEFAULT_EXTENSIONS}`,
    description: 'Wildcard in directory',
  },
  {
    input: '**/*',
    expected: `**/*.${DEFAULT_EXTENSIONS}`,
    description: 'Recursive wildcard',
  },
  {
    input: 'src/**/*',
    expected: `src/**/*.${DEFAULT_EXTENSIONS}`,
    description: 'Recursive wildcard in directory',
  },
  {
    input: 'test/*/fixtures',
    expected: `test/*/fixtures.${DEFAULT_EXTENSIONS}`,
    description: 'Wildcard in middle of path',
  },

  // Glob patterns with brackets
  {
    input: 'src/[abc]*',
    expected: `src/[abc]*.${DEFAULT_EXTENSIONS}`,
    description: 'Character class glob pattern',
  },
  {
    input: 'test/[0-9]*',
    expected: `test/[0-9]*.${DEFAULT_EXTENSIONS}`,
    description: 'Numeric range glob pattern',
  },

  // Glob patterns with question marks
  {
    input: 'src/?est',
    expected: `src/?est.${DEFAULT_EXTENSIONS}`,
    description: 'Single character wildcard',
  },
  {
    input: 'lib/util?',
    expected: `lib/util?.${DEFAULT_EXTENSIONS}`,
    description: 'Single character wildcard at end',
  },

  // Names without extensions that look like files
  {
    input: 'README',
    expected: `README/**/*.${DEFAULT_EXTENSIONS}`,
    description: 'README without extension (treated as directory)',
  },
  {
    input: 'Dockerfile',
    expected: `Dockerfile/**/*.${DEFAULT_EXTENSIONS}`,
    description: 'Dockerfile without extension (treated as directory)',
  },
  {
    input: 'Makefile',
    expected: `Makefile/**/*.${DEFAULT_EXTENSIONS}`,
    description: 'Makefile without extension (treated as directory)',
  },

  // Complex nested patterns
  {
    input: 'apps/frontend/src',
    expected: `apps/frontend/src/**/*.${DEFAULT_EXTENSIONS}`,
    description: 'Deep nested application directory',
  },
  {
    input: 'packages/*/src',
    expected: `packages/*/src.${DEFAULT_EXTENSIONS}`,
    description: 'Monorepo package pattern',
  },
  {
    input: 'libs/shared',
    expected: `libs/shared/**/*.${DEFAULT_EXTENSIONS}`,
    description: 'Shared library directory',
  },

  // Edge cases with mixed dots and paths
  {
    input: 'src.backup',
    expected: `src.backup/**/*.${DEFAULT_EXTENSIONS}`,
    description: 'Directory name with dot (no extension)',
  },
  {
    input: 'node_modules',
    expected: `node_modules/**/*.${DEFAULT_EXTENSIONS}`,
    description: 'node_modules directory',
  },
  {
    input: 'node_modules/lodash',
    expected: `node_modules/{@types/,}lodash/**/*.${DEFAULT_EXTENSIONS}`,
    description: 'node_modules package should include @types transformation',
  },
  {
    input: 'node_modules/react/lib',
    expected: `node_modules/{@types/,}react/lib/**/*.${DEFAULT_EXTENSIONS}`,
    description: 'node_modules package with subpath should include @types transformation',
  },
  {
    input: 'node_modules/@types/node',
    expected: `node_modules/@types/node/**/*.${DEFAULT_EXTENSIONS}`,
    description: 'node_modules @types package should not be double-transformed',
  },
  {
    input: 'src/node_modules/utils',
    expected: `src/node_modules/{@types/,}utils/**/*.${DEFAULT_EXTENSIONS}`,
    description: 'nested node_modules should also get @types transformation',
  },
  {
    input: '.git',
    expected: `.git/**/*.${DEFAULT_EXTENSIONS}`,
    description: 'Hidden directory',
  },

  // Already have glob patterns with extensions - should pass through
  {
    input: 'src/**/*.ts',
    expected: 'src/**/*.ts',
    description: 'Already has TypeScript extension pattern',
  },
  {
    input: '**/*.json',
    expected: `**/*.json.${DEFAULT_EXTENSIONS}`,
    description: 'JSON pattern gets extensions appended (JSON support removed)',
  },
  {
    input: 'test/**/*.spec.js',
    expected: 'test/**/*.spec.js',
    description: 'Already has specific test file pattern',
  },

  // Patterns that would confuse the logic
  {
    input: 'src.old/backup',
    expected: `src.old/backup/**/*.${DEFAULT_EXTENSIONS}`,
    description: 'Directory path with dots in directory name',
  },
  {
    input: 'weird.folder.name',
    expected: `weird.folder.name/**/*.${DEFAULT_EXTENSIONS}`,
    description: 'Directory with multiple dots but no extension',
  },
  {
    input: 'folder/file.with.dots',
    expected: `folder/file.with.dots/**/*.${DEFAULT_EXTENSIONS}`,
    description: 'Path with dots but no recognized extension',
  },

  // Empty and minimal cases
  {
    input: '/',
    expected: `/**/*.${DEFAULT_EXTENSIONS}`,
    description: 'Root directory',
  },

  // Ignored directories (should still work normally until we add ignore logic)
  {
    input: 'node_modules',
    expected: `node_modules/**/*.${DEFAULT_EXTENSIONS}`,
    description: 'node_modules directory',
  },
  {
    input: 'dist/assets',
    expected: `dist/assets/**/*.${DEFAULT_EXTENSIONS}`,
    description: 'dist subdirectory',
  },
  {
    input: 'build',
    expected: `build/**/*.${DEFAULT_EXTENSIONS}`,
    description: 'build directory',
  },

  // Windows-style paths
  {
    input: 'src\\components',
    expected: `src\\components/**/*.${DEFAULT_EXTENSIONS}`,
    description: 'Windows-style directory path',
  },

  // Files with multiple extensions
  {
    input: 'config.test.ts',
    expected: 'config.test.ts',
    description: 'File with multiple extensions',
  },
  {
    input: 'component.stories.tsx',
    expected: 'component.stories.tsx',
    description: 'Storybook file with multiple extensions',
  },
  {
    input: 'a',
    expected: `a/**/*.${DEFAULT_EXTENSIONS}`,
    description: 'Single letter directory',
  },
  {
    input: 'A',
    expected: `A/**/*.${DEFAULT_EXTENSIONS}`,
    description: 'Single uppercase letter directory',
  },
]

function runTests() {
  console.log('🧪 Testing mapPattern function...\n')

  let passed = 0
  let failed = 0

  for (const testCase of testCases) {
    try {
      const result = mapPattern(testCase.input)
      if (result === testCase.expected) {
        console.log(`✅ PASS: ${testCase.description}`)
        console.log(`   Input: "${testCase.input}"`)
        console.log(`   Output: "${result}"`)
        passed++
      } else {
        console.error(`❌ FAIL: ${testCase.description}`)
        console.error(`   Input: "${testCase.input}"`)
        console.error(`   Expected: "${testCase.expected}"`)
        console.error(`   Got     : "${result}"`)
        failed++
      }
    } catch (error) {
      console.error(`💥 ERROR: ${testCase.description}`)
      console.error(`   Input: "${testCase.input}"`)
      console.error(`   Error: ${error}`)
      failed++
    }
    console.log('')
  }

  console.log(`🎯 Test Summary: ${passed} passed, ${failed} failed`)

  if (failed > 0) {
    console.error('❌ Some tests failed!')
    process.exit(1)
  } else {
    console.log('🎉 All mapPattern tests passed!')
  }
}

// Run tests when this module is imported (consistent with other test files)
runTests()

export { runTests as mapPatternTests }
