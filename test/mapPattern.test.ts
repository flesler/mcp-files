import { mapPattern } from '../src/tools/readSymbol.js'

interface TestCase {
  input: string
  expected: string
  description: string
}

const testCases: TestCase[] = [
  // Files with extensions - should pass through unchanged
  {
    input: 'src/app.ts',
    expected: 'src/app.ts',
    description: 'TypeScript file with extension',
  },
  {
    input: 'package.json',
    expected: 'package.json',
    description: 'JSON file with extension',
  },
  {
    input: 'styles.css',
    expected: 'styles.css',
    description: 'CSS file with extension',
  },
  {
    input: 'README.md',
    expected: 'README.md/**/*.{ts,tsx,js,jsx,mjs,cjs,json,json5,java,cs,cpp,c,h,hpp,cc,go,rs,php,swift,scss,css,less,graphql,gql,prisma,proto,d.ts}',
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
    expected: './**/*.{ts,tsx,js,jsx,mjs,cjs,json,json5,java,cs,cpp,c,h,hpp,cc,go,rs,php,swift,scss,css,less,graphql,gql,prisma,proto,d.ts}',
    description: 'Current directory (dot)',
  },
  {
    input: './',
    expected: './**/*.{ts,tsx,js,jsx,mjs,cjs,json,json5,java,cs,cpp,c,h,hpp,cc,go,rs,php,swift,scss,css,less,graphql,gql,prisma,proto,d.ts}',
    description: 'Current directory with slash',
  },

  // Directory paths (no trailing slash)
  {
    input: 'src',
    expected: 'src/**/*.{ts,tsx,js,jsx,mjs,cjs,json,json5,java,cs,cpp,c,h,hpp,cc,go,rs,php,swift,scss,css,less,graphql,gql,prisma,proto,d.ts}',
    description: 'Simple directory name',
  },
  {
    input: 'src/components',
    expected: 'src/components/**/*.{ts,tsx,js,jsx,mjs,cjs,json,json5,java,cs,cpp,c,h,hpp,cc,go,rs,php,swift,scss,css,less,graphql,gql,prisma,proto,d.ts}',
    description: 'Nested directory path',
  },
  {
    input: 'test/unit/helpers',
    expected: 'test/unit/helpers/**/*.{ts,tsx,js,jsx,mjs,cjs,json,json5,java,cs,cpp,c,h,hpp,cc,go,rs,php,swift,scss,css,less,graphql,gql,prisma,proto,d.ts}',
    description: 'Deep nested directory',
  },
  {
    input: 'backend',
    expected: 'backend/**/*.{ts,tsx,js,jsx,mjs,cjs,json,json5,java,cs,cpp,c,h,hpp,cc,go,rs,php,swift,scss,css,less,graphql,gql,prisma,proto,d.ts}',
    description: 'Backend directory',
  },

  // Directory paths (with trailing slash)
  {
    input: 'src/',
    expected: 'src/**/*.{ts,tsx,js,jsx,mjs,cjs,json,json5,java,cs,cpp,c,h,hpp,cc,go,rs,php,swift,scss,css,less,graphql,gql,prisma,proto,d.ts}',
    description: 'Directory with trailing slash',
  },
  {
    input: 'api/routes/',
    expected: 'api/routes/**/*.{ts,tsx,js,jsx,mjs,cjs,json,json5,java,cs,cpp,c,h,hpp,cc,go,rs,php,swift,scss,css,less,graphql,gql,prisma,proto,d.ts}',
    description: 'Nested directory with trailing slash',
  },
  {
    input: 'frontend/components/',
    expected: 'frontend/components/**/*.{ts,tsx,js,jsx,mjs,cjs,json,json5,java,cs,cpp,c,h,hpp,cc,go,rs,php,swift,scss,css,less,graphql,gql,prisma,proto,d.ts}',
    description: 'Deep directory with trailing slash',
  },

  // Common glob patterns
  {
    input: '*',
    expected: '*.{ts,tsx,js,jsx,mjs,cjs,json,json5,java,cs,cpp,c,h,hpp,cc,go,rs,php,swift,scss,css,less,graphql,gql,prisma,proto,d.ts}',
    description: 'Wildcard for all files in current directory',
  },
  {
    input: '*.*',
    expected: '*.{ts,tsx,js,jsx,mjs,cjs,json,json5,java,cs,cpp,c,h,hpp,cc,go,rs,php,swift,scss,css,less,graphql,gql,prisma,proto,d.ts}',
    description: 'Wildcard for all files with extensions',
  },

  // Glob patterns without extensions - should add extensions
  {
    input: 'src/*',
    expected: 'src/*.{ts,tsx,js,jsx,mjs,cjs,json,json5,java,cs,cpp,c,h,hpp,cc,go,rs,php,swift,scss,css,less,graphql,gql,prisma,proto,d.ts}',
    description: 'Wildcard in directory',
  },
  {
    input: '**/*',
    expected: '**/*.{ts,tsx,js,jsx,mjs,cjs,json,json5,java,cs,cpp,c,h,hpp,cc,go,rs,php,swift,scss,css,less,graphql,gql,prisma,proto,d.ts}',
    description: 'Recursive wildcard',
  },
  {
    input: 'src/**/*',
    expected: 'src/**/*.{ts,tsx,js,jsx,mjs,cjs,json,json5,java,cs,cpp,c,h,hpp,cc,go,rs,php,swift,scss,css,less,graphql,gql,prisma,proto,d.ts}',
    description: 'Recursive wildcard in directory',
  },
  {
    input: 'test/*/fixtures',
    expected: 'test/*/fixtures.{ts,tsx,js,jsx,mjs,cjs,json,json5,java,cs,cpp,c,h,hpp,cc,go,rs,php,swift,scss,css,less,graphql,gql,prisma,proto,d.ts}',
    description: 'Wildcard in middle of path',
  },

  // Glob patterns with brackets
  {
    input: 'src/[abc]*',
    expected: 'src/[abc]*.{ts,tsx,js,jsx,mjs,cjs,json,json5,java,cs,cpp,c,h,hpp,cc,go,rs,php,swift,scss,css,less,graphql,gql,prisma,proto,d.ts}',
    description: 'Character class glob pattern',
  },
  {
    input: 'test/[0-9]*',
    expected: 'test/[0-9]*.{ts,tsx,js,jsx,mjs,cjs,json,json5,java,cs,cpp,c,h,hpp,cc,go,rs,php,swift,scss,css,less,graphql,gql,prisma,proto,d.ts}',
    description: 'Numeric range glob pattern',
  },

  // Glob patterns with question marks
  {
    input: 'src/?est',
    expected: 'src/?est.{ts,tsx,js,jsx,mjs,cjs,json,json5,java,cs,cpp,c,h,hpp,cc,go,rs,php,swift,scss,css,less,graphql,gql,prisma,proto,d.ts}',
    description: 'Single character wildcard',
  },
  {
    input: 'lib/util?',
    expected: 'lib/util?.{ts,tsx,js,jsx,mjs,cjs,json,json5,java,cs,cpp,c,h,hpp,cc,go,rs,php,swift,scss,css,less,graphql,gql,prisma,proto,d.ts}',
    description: 'Single character wildcard at end',
  },

  // Names without extensions that look like files
  {
    input: 'README',
    expected: 'README/**/*.{ts,tsx,js,jsx,mjs,cjs,json,json5,java,cs,cpp,c,h,hpp,cc,go,rs,php,swift,scss,css,less,graphql,gql,prisma,proto,d.ts}',
    description: 'README without extension (treated as directory)',
  },
  {
    input: 'Dockerfile',
    expected: 'Dockerfile/**/*.{ts,tsx,js,jsx,mjs,cjs,json,json5,java,cs,cpp,c,h,hpp,cc,go,rs,php,swift,scss,css,less,graphql,gql,prisma,proto,d.ts}',
    description: 'Dockerfile without extension (treated as directory)',
  },
  {
    input: 'Makefile',
    expected: 'Makefile/**/*.{ts,tsx,js,jsx,mjs,cjs,json,json5,java,cs,cpp,c,h,hpp,cc,go,rs,php,swift,scss,css,less,graphql,gql,prisma,proto,d.ts}',
    description: 'Makefile without extension (treated as directory)',
  },

  // Complex nested patterns
  {
    input: 'apps/frontend/src',
    expected: 'apps/frontend/src/**/*.{ts,tsx,js,jsx,mjs,cjs,json,json5,java,cs,cpp,c,h,hpp,cc,go,rs,php,swift,scss,css,less,graphql,gql,prisma,proto,d.ts}',
    description: 'Deep nested application directory',
  },
  {
    input: 'packages/*/src',
    expected: 'packages/*/src.{ts,tsx,js,jsx,mjs,cjs,json,json5,java,cs,cpp,c,h,hpp,cc,go,rs,php,swift,scss,css,less,graphql,gql,prisma,proto,d.ts}',
    description: 'Monorepo package pattern',
  },
  {
    input: 'libs/shared',
    expected: 'libs/shared/**/*.{ts,tsx,js,jsx,mjs,cjs,json,json5,java,cs,cpp,c,h,hpp,cc,go,rs,php,swift,scss,css,less,graphql,gql,prisma,proto,d.ts}',
    description: 'Shared library directory',
  },

  // Edge cases with mixed dots and paths
  {
    input: 'src.backup',
    expected: 'src.backup/**/*.{ts,tsx,js,jsx,mjs,cjs,json,json5,java,cs,cpp,c,h,hpp,cc,go,rs,php,swift,scss,css,less,graphql,gql,prisma,proto,d.ts}',
    description: 'Directory name with dot (no extension)',
  },
  {
    input: 'node_modules',
    expected: 'node_modules/**/*.{ts,tsx,js,jsx,mjs,cjs,json,json5,java,cs,cpp,c,h,hpp,cc,go,rs,php,swift,scss,css,less,graphql,gql,prisma,proto,d.ts}',
    description: 'node_modules directory',
  },
  {
    input: '.git',
    expected: '.git/**/*.{ts,tsx,js,jsx,mjs,cjs,json,json5,java,cs,cpp,c,h,hpp,cc,go,rs,php,swift,scss,css,less,graphql,gql,prisma,proto,d.ts}',
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
    expected: '**/*.json',
    description: 'Already has JSON extension pattern',
  },
  {
    input: 'test/**/*.spec.js',
    expected: 'test/**/*.spec.js',
    description: 'Already has specific test file pattern',
  },

  // Patterns that would confuse the logic
  {
    input: 'src.old/backup',
    expected: 'src.old/backup/**/*.{ts,tsx,js,jsx,mjs,cjs,json,json5,java,cs,cpp,c,h,hpp,cc,go,rs,php,swift,scss,css,less,graphql,gql,prisma,proto,d.ts}',
    description: 'Directory path with dots in directory name',
  },
  {
    input: 'weird.folder.name',
    expected: 'weird.folder.name/**/*.{ts,tsx,js,jsx,mjs,cjs,json,json5,java,cs,cpp,c,h,hpp,cc,go,rs,php,swift,scss,css,less,graphql,gql,prisma,proto,d.ts}',
    description: 'Directory with multiple dots but no extension',
  },
  {
    input: 'folder/file.with.dots',
    expected: 'folder/file.with.dots/**/*.{ts,tsx,js,jsx,mjs,cjs,json,json5,java,cs,cpp,c,h,hpp,cc,go,rs,php,swift,scss,css,less,graphql,gql,prisma,proto,d.ts}',
    description: 'Path with dots but no recognized extension',
  },

  // Empty and minimal cases
  {
    input: '/',
    expected: '/**/*.{ts,tsx,js,jsx,mjs,cjs,json,json5,java,cs,cpp,c,h,hpp,cc,go,rs,php,swift,scss,css,less,graphql,gql,prisma,proto,d.ts}',
    description: 'Root directory',
  },

  // Ignored directories (should still work normally until we add ignore logic)
  {
    input: 'node_modules',
    expected: 'node_modules/**/*.{ts,tsx,js,jsx,mjs,cjs,json,json5,java,cs,cpp,c,h,hpp,cc,go,rs,php,swift,scss,css,less,graphql,gql,prisma,proto,d.ts}',
    description: 'node_modules directory',
  },
  {
    input: 'dist/assets',
    expected: 'dist/assets/**/*.{ts,tsx,js,jsx,mjs,cjs,json,json5,java,cs,cpp,c,h,hpp,cc,go,rs,php,swift,scss,css,less,graphql,gql,prisma,proto,d.ts}',
    description: 'dist subdirectory',
  },
  {
    input: 'build',
    expected: 'build/**/*.{ts,tsx,js,jsx,mjs,cjs,json,json5,java,cs,cpp,c,h,hpp,cc,go,rs,php,swift,scss,css,less,graphql,gql,prisma,proto,d.ts}',
    description: 'build directory',
  },

  // Windows-style paths
  {
    input: 'src\\components',
    expected: 'src\\components/**/*.{ts,tsx,js,jsx,mjs,cjs,json,json5,java,cs,cpp,c,h,hpp,cc,go,rs,php,swift,scss,css,less,graphql,gql,prisma,proto,d.ts}',
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
    expected: 'a/**/*.{ts,tsx,js,jsx,mjs,cjs,json,json5,java,cs,cpp,c,h,hpp,cc,go,rs,php,swift,scss,css,less,graphql,gql,prisma,proto,d.ts}',
    description: 'Single letter directory',
  },
  {
    input: 'A',
    expected: 'A/**/*.{ts,tsx,js,jsx,mjs,cjs,json,json5,java,cs,cpp,c,h,hpp,cc,go,rs,php,swift,scss,css,less,graphql,gql,prisma,proto,d.ts}',
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
        console.log(`❌ FAIL: ${testCase.description}`)
        console.log(`   Input: "${testCase.input}"`)
        console.log(`   Expected: "${testCase.expected}"`)
        console.log(`   Got: "${result}"`)
        failed++
      }
    } catch (error) {
      console.log(`💥 ERROR: ${testCase.description}`)
      console.log(`   Input: "${testCase.input}"`)
      console.log(`   Error: ${error}`)
      failed++
    }
    console.log('')
  }

  console.log(`🎯 Test Summary: ${passed} passed, ${failed} failed`)

  if (failed > 0) {
    console.log('❌ Some tests failed!')
    process.exit(1)
  } else {
    console.log('🎉 All mapPattern tests passed!')
  }
}

// Run tests when this module is imported (consistent with other test files)
runTests()

export { runTests as mapPatternTests }
