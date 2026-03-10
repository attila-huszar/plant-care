import type { Config } from 'prettier'

const config: Config = {
  endOfLine: 'lf',
  tabWidth: 2,
  semi: false,
  bracketSameLine: false,
  singleQuote: true,
  vueIndentScriptAndStyle: true,
  singleAttributePerLine: false,
  plugins: [
    '@trivago/prettier-plugin-sort-imports',
    'prettier-plugin-tailwindcss',
  ],
  importOrder: [
    '<BUILTIN_MODULES>',
    '^vue$',
    '^@vueuse(/.*)?$',
    '<THIRD_PARTY_MODULES>',

    // Workspace packages
    '^@plant-care/shared(/.*)?$',

    // App code (feature-first)
    '^@/app(/.*)?$',
    '^@/features(/.*)?$',
    '^@/components(/.*)?$',
    '^@/composables(/.*)?$',
    '^@/stores(/.*)?$',
    '^@/router(/.*)?$',
    '^@/services(/.*)?$',
    '^@/utils(/.*)?$',
    '^@/types(/.*)?$',
    '^@/assets(/.*)?$',
    '^@/styles(/.*)?$',

    '^\\.\\./',
    '^\\./',
    '^.+\\.s?css$',
  ],
  importOrderSortSpecifiers: true, // Alphabetically sort named imports inside statements
  importOrderGroupNamespaceSpecifiers: true, // Group namespace imports (* as X) separately
  importOrderCaseInsensitive: true, // Case-insensitive sorting
  importOrderSideEffects: false, // Don't reorder side-effect-only imports (e.g. `import './style.css'`)
}

export default config
