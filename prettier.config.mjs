/** @type {import('prettier').Config} */
const prettierConfig = {
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  useTabs: false,
  trailingComma: 'all',
  printWidth: 100,
  bracketSpacing: true,
  arrowParens: 'always',
  endOfLine: 'lf',
  embeddedLanguageFormatting: 'auto',
  plugins: [
    'prettier-plugin-embed',
    'prettier-plugin-sql',
    'prettier-plugin-jsdoc',
  ],
};

/** @type {import('prettier-plugin-embed').PrettierPluginEmbedOptions} */
const prettierPluginEmbedConfig = {
  embeddedSqlTags: ['sql'],
};

/** @type {import('prettier-plugin-sql').SqlBaseOptions} */
const prettierPluginSqlConfig = {
  language: 'sqlite',
  keywordCase: 'upper',
};

export default {
  ...prettierConfig,
  ...prettierPluginEmbedConfig,
  ...prettierPluginSqlConfig,
};