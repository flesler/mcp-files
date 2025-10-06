import { describe, expect, it } from 'vitest'
import { optimizeCode } from '../../src/tools/readSymbol.js'

interface TestCase {
  name: string
  input: string
  expected: string
}

describe('readSymbol tool', () => {
  describe('optimizeCode function', () => {
    const testCases: TestCase[] = [
      {
        name: 'strips line comments',
        input: `function test() {
  // This is a comment
  const x = 1;
  return x;
}`,
        expected: `function test() {
\tconst x = 1;
\treturn x;
}`,
      },
      {
        name: 'strips block comments',
        input: `function test() {
  const x = 1; /* inline comment */
  /* block comment */
  return x;
}`,
        expected: `function test() {
\tconst x = 1;
\treturn x;
}`,
      },
      {
        name: 'strips multiline block comments',
        input: `function test() {
  /* This is a multiline
     block comment */
  const x = 1;
  return x;
}`,
        expected: `function test() {
\tconst x = 1;
\treturn x;
}`,
      },
      {
        name: 'collapses multiple consecutive newlines',
        input: `function test() {
  const x = 1;


  const y = 2;



  return x + y;
}`,
        expected: `function test() {
\tconst x = 1;
\tconst y = 2;
\treturn x + y;
}`,
      },
      {
        name: 'removes base indentation',
        input: `    function test() {
      const x = 1;
      if (x > 0) {
        return x;
      }
      return 0;
    }`,
        expected: `function test() {
\tconst x = 1;
\tif (x > 0) {
\t\treturn x;
\t}
\treturn 0;
}`,
      },
      {
        name: 'handles mixed tabs and spaces',
        input: `\t\tfunction test() {
\t\t\tconst x = 1;
\t\t\treturn x;
\t\t}`,
        expected: `function test() {
\tconst x = 1;
\treturn x;
}`,
      },
      {
        name: 'handles complex case with comments, newlines, and indentation',
        input: `    // Leading comment
    function complexTest() {
      // Inline comment
      const x = 1;

      /* Block comment */
      const y = 2;


      // Multiple blank lines above


      if (x > 0) {
        // Nested comment
        return x + y;
      }

      return 0;
    }`,
        expected: `function complexTest() {
\tconst x = 1;
\tconst y = 2;
\tif (x > 0) {
\t\treturn x + y;
\t}
\treturn 0;
}`,
      },
      {
        name: 'preserves empty string',
        input: '',
        expected: '',
      },
      {
        name: 'handles single line',
        input: 'const x = 1;',
        expected: 'const x = 1;',
      },
      {
        name: 'converts 4-space indentation to tabs',
        input: `function test() {
    const x = 1;
    if (x > 0) {
        return x;
    }
    return 0;
}`,
        expected: `function test() {
\tconst x = 1;
\tif (x > 0) {
\t\treturn x;
\t}
\treturn 0;
}`,
      },
      {
        name: 'strips line-start hash comments (Bash/Python/GraphQL)',
        input: `# This is a bash comment
type User {
  id: ID!
  # another comment
  name: String
}

def hello():
    # Python comment
    x = 1
    return x`,
        expected: `type User {
\tid: ID!
\tname: String
}
def hello():
\t\tx = 1
\t\treturn x`,
      },
      {
        name: 'preserves hash in strings and code',
        input: `def get_color():
    color = "#FF0000"
    url = "https://example.com#anchor"
    # This comment is removed
    return color`,
        expected: `def get_color():
\tcolor = "#FF0000"
\turl = "https://example.com#anchor"
\treturn color`,
      },
      {
        name: 'strips single-line triple-quote comments',
        input: `type User {
  """Single line description"""
  id: ID!
  name: String
}

def hello():
    """Single line docstring"""
    return "world"`,
        expected: `type User {
\tid: ID!
\tname: String
}
def hello():
\t\treturn "world"`,
      },
      {
        name: 'strips multi-line triple-quote comments',
        input: `type User {
  """
  This is a multi-line
  GraphQL description
  """
  id: ID!
  name: String
}

def hello():
    """Python docstring
    with multiple lines"""
    return "world"`,
        expected: `type User {
\tid: ID!
\tname: String
}
def hello():
\t\treturn "world"`,
      },
    ]

    testCases.forEach(({ name, input, expected }) => {
      it(name, () => {
        const result = optimizeCode(input)
        expect(result).toBe(expected)
      })
    })
  })
})
