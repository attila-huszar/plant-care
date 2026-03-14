import type { Config } from 'prettier'

const config: Config = {
  endOfLine: 'lf',
  tabWidth: 2,
  semi: false,
  singleQuote: true,
  plugins: ['@trivago/prettier-plugin-sort-imports'],
  importOrder: [
    '<BUILTIN_MODULES>',
    '<THIRD_PARTY_MODULES>',
    '^@/db$',
    '^@/config(/.*)?$',
    '^@/controllers(/.*)?$',
    '^@/services(/.*)?$',
    '^@/repositories(/.*)?$',
    '^@/models(/.*)?$',
    '^@/schemas(/.*)?$',
    '^@/utils(/.*)?$',
    '^@/libs(/.*)?$',
    '^@/queues(/.*)?$',
    '^@/constants(/.*)?$',
    '^@/resources(/.*)?$',
    '^@/errors(/.*)?$',
    '^@/types(/.*)?$',
    '^\\.\\./',
    '^\\./',
  ],
  importOrderSortSpecifiers: true, // Alphabetically sort named imports inside statements
  importOrderGroupNamespaceSpecifiers: true, // Group namespace imports (* as X) separately
  importOrderCaseInsensitive: true, // Case-insensitive sorting
  importOrderSideEffects: false, // Keep side-effect imports at the top
}

export default config
