import type { PackageJson } from 'types-package-json'
import util from './util.js'

const { default: pkg } = await import(
  util.resolve('package.json'), { with: { type: 'json' } }
) as { default: Partial<PackageJson> }

export default {
  ...pkg,
  version: pkg.version as `${number}.${number}.${number}`,
  author: pkg.homepage?.split('/')[3] || 'unknown',
}
