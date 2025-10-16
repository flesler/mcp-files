import { describe, expect, it } from 'vitest'
import { mapPattern } from '../../src/tools/readSymbol.js'

interface TestCase {
  description: string
  input: string
  expected: string
}

describe('readSymbol tool', () => {
  describe('mapPattern function', () => {
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
        expected: 'package.json',
        description: 'JSON file returned as-is (no glob chars)',
      },
      {
        input: 'styles.css',
        expected: 'styles.css',
        description: 'CSS file with extension',
      },
      {
        input: 'README.md',
        expected: 'README.md',
        description: 'Markdown file returned as-is (no glob chars)',
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
        expected: '.',
        description: 'Current directory returned as-is (no trailing slash)',
      },
      {
        input: './',
        expected: `./**/*.${DEFAULT_EXTENSIONS}`,
        description: 'Current directory with trailing slash searches recursively',
      },

      // Directory paths (no trailing slash)
      {
        input: 'src',
        expected: `src/**/*.${DEFAULT_EXTENSIONS}`,
        description: 'Simple directory name (no slash, no dot) searches recursively',
      },
      {
        input: 'src/components',
        expected: 'src/components',
        description: 'Nested directory path (has slash) returned as-is',
      },
      {
        input: 'test/unit/helpers',
        expected: 'test/unit/helpers',
        description: 'Deep nested directory (has slash) returned as-is',
      },
      {
        input: 'backend',
        expected: `backend/**/*.${DEFAULT_EXTENSIONS}`,
        description: 'Backend directory (no slash, no dot) searches recursively',
      },

      // Directory paths (with trailing slash)
      {
        input: 'src/',
        expected: `src/**/*.${DEFAULT_EXTENSIONS}`,
        description: 'Directory with trailing slash searches recursively',
      },
      {
        input: 'api/routes/',
        expected: `api/routes/**/*.${DEFAULT_EXTENSIONS}`,
        description: 'Nested directory with trailing slash searches recursively',
      },
      {
        input: 'frontend/components/',
        expected: `frontend/components/**/*.${DEFAULT_EXTENSIONS}`,
        description: 'Deep directory with trailing slash searches recursively',
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
        description: 'README (no slash, no dot) treated as directory',
      },
      {
        input: 'Dockerfile',
        expected: `Dockerfile/**/*.${DEFAULT_EXTENSIONS}`,
        description: 'Dockerfile (no slash, no dot) treated as directory',
      },
      {
        input: 'Makefile',
        expected: `Makefile/**/*.${DEFAULT_EXTENSIONS}`,
        description: 'Makefile (no slash, no dot) treated as directory',
      },

      // Complex nested patterns
      {
        input: 'apps/frontend/src',
        expected: 'apps/frontend/src',
        description: 'Deep nested application directory (has slash) returned as-is',
      },
      {
        input: 'packages/*/src',
        expected: `packages/*/src.${DEFAULT_EXTENSIONS}`,
        description: 'Monorepo package pattern',
      },
      {
        input: 'libs/shared',
        expected: 'libs/shared',
        description: 'Shared library directory (has slash) returned as-is',
      },

      // Edge cases with mixed dots and paths
      {
        input: 'src.backup',
        expected: 'src.backup',
        description: 'Directory name with dot returned as-is (treated as file)',
      },
      {
        input: 'node_modules',
        expected: `node_modules/**/*.${DEFAULT_EXTENSIONS}`,
        description: 'node_modules (no slash, no dot) searches recursively',
      },
      {
        input: 'node_modules/lodash',
        expected: 'node_modules/{@types/,}lodash',
        description: 'node_modules package includes @types transformation',
      },
      {
        input: 'node_modules/react/lib',
        expected: 'node_modules/{@types/,}react/lib',
        description: 'node_modules package with subpath includes @types transformation',
      },
      {
        input: 'node_modules/@types/node',
        expected: 'node_modules/@types/node',
        description: 'node_modules @types package not double-transformed',
      },
      {
        input: 'src/node_modules/utils',
        expected: 'src/node_modules/{@types/,}utils',
        description: 'nested node_modules includes @types transformation',
      },
      {
        input: '.git',
        expected: '.git',
        description: 'Hidden directory (has dot) returned as-is - use .git/ to search recursively',
      },
      {
        input: '.git/',
        expected: `.git/**/*.${DEFAULT_EXTENSIONS}`,
        description: 'Hidden directory with trailing slash searches recursively',
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
        description: 'JSON pattern already has extension, returned as-is',
      },
      {
        input: 'test/**/*.spec.js',
        expected: 'test/**/*.spec.js',
        description: 'Already has specific test file pattern',
      },

      // Patterns that would confuse the logic
      {
        input: 'src.old/backup',
        expected: 'src.old/backup',
        description: 'Directory path with dots (has slash) returned as-is',
      },
      {
        input: 'weird.folder.name',
        expected: 'weird.folder.name',
        description: 'Directory with multiple dots (has dot) returned as-is',
      },
      {
        input: 'folder/file.with.dots',
        expected: 'folder/file.with.dots',
        description: 'Path with dots (has slash) returned as-is',
      },

      // Empty and minimal cases
      {
        input: '/',
        expected: `/**/*.${DEFAULT_EXTENSIONS}`,
        description: 'Root directory with trailing slash searches recursively',
      },

      // Other commonly ignored directories
      {
        input: 'dist/assets',
        expected: 'dist/assets',
        description: 'dist subdirectory (has slash) returned as-is',
      },
      {
        input: 'build',
        expected: `build/**/*.${DEFAULT_EXTENSIONS}`,
        description: 'build directory (no slash, no dot) searches recursively',
      },

      // Windows-style paths
      {
        input: 'src\\components',
        expected: 'src\\components',
        description: 'Windows-style directory path (has backslash) returned as-is',
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
        description: 'Single letter directory (no slash, no dot) searches recursively',
      },
      {
        input: 'A',
        expected: `A/**/*.${DEFAULT_EXTENSIONS}`,
        description: 'Single uppercase letter directory (no slash, no dot) searches recursively',
      },

      // Absolute paths and shell files
      {
        input: '/home/user/.bash_functions',
        expected: '/home/user/.bash_functions',
        description: 'Absolute path to shell file returned as-is (no glob chars)',
      },
      {
        input: '/etc/config.conf',
        expected: '/etc/config.conf',
        description: 'Absolute path to config file returned as-is (no glob chars)',
      },
      {
        input: '.bashrc',
        expected: '.bashrc',
        description: 'Dotfile without extension returned as-is (no glob chars)',
      },
      {
        input: '/home/user/.bashrc',
        expected: '/home/user/.bashrc',
        description: 'Absolute path to dotfile has extension pattern, returned as-is',
      },
    ]

    testCases.forEach((testCase) => {
      it(testCase.description, () => {
        const result = mapPattern(testCase.input)
        expect(result).toBe(testCase.expected)
      })
    })
  })
})
