import type { Config } from 'prettier'

const config: Config = {
  endOfLine: 'lf',
  tabWidth: 2,
  semi: false,
  bracketSameLine: false,
  singleQuote: true,
  vueIndentScriptAndStyle: true,
  singleAttributePerLine: false,
  plugins: ['@trivago/prettier-plugin-sort-imports'],
  importOrder: [
    '<BUILTIN_MODULES>',
    '<THIRD_PARTY_MODULES>',

    '^\\.\\./',
    '^\\./',
  ],
  importOrderSortSpecifiers: true, // Alphabetically sort named imports inside statements
  importOrderGroupNamespaceSpecifiers: true, // Group namespace imports (* as X) separately
  importOrderCaseInsensitive: true, // Case-insensitive sorting
  importOrderSideEffects: false, // Don't reorder side-effect-only imports (e.g. `import './style.css'`)
}

export default config
