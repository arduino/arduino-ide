module.exports = {
  parser: '@typescript-eslint/parser', // Specifies the ESLint parser
  parserOptions: {
    ecmaVersion: 2020, // Allows for the parsing of modern ECMAScript features
    sourceType: 'module', // Allows for the use of imports
    ecmaFeatures: {
      jsx: true, // Allows for the parsing of JSX
    },
  },
  ignorePatterns: [
    'node_modules/*',
    '**/node_modules/*',
    '.github/*',
    '.browser_modules/*',
    'docs/*',
    'scripts/*',
    'electron-app/lib/*',
    'electron-app/src-gen/*',
    'electron-app/gen-webpack*.js',
    '!electron-app/webpack.config.js',
    'electron-app/plugins/*',
    'arduino-ide-extension/src/node/cli-protocol',
    '**/lib/*',
  ],
  settings: {
    react: {
      version: 'detect', // Tells eslint-plugin-react to automatically detect the version of React to use
    },
  },
  extends: [
    'plugin:@typescript-eslint/recommended', // Uses the recommended rules from the @typescript-eslint/eslint-plugin
    'plugin:react/recommended', // Uses the recommended rules from @eslint-plugin-react
    'plugin:react-hooks/recommended', // Uses recommended rules from react hooks
    'plugin:prettier/recommended',
    'prettier', // Uses eslint-config-prettier to disable ESLint rules from @typescript-eslint/eslint-plugin that would conflict with prettier
  ],
  plugins: ['prettier', 'unused-imports'],
  rules: {
    '@typescript-eslint/no-unused-expressions': 'off',
    '@typescript-eslint/no-namespace': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/no-empty-function': 'warn',
    '@typescript-eslint/no-empty-interface': 'warn',
    'no-unused-vars': 'off',
    'unused-imports/no-unused-imports': 'error',
    'unused-imports/no-unused-vars': [
      'warn',
      {
        vars: 'all',
        varsIgnorePattern: '^_',
        args: 'after-used',
        argsIgnorePattern: '^_',
      },
    ],
    'react/display-name': 'warn',
    eqeqeq: ['error', 'smart'],
    'guard-for-in': 'off',
    'id-blacklist': 'off',
    'id-match': 'off',
    'no-underscore-dangle': 'off',
    'no-unused-expressions': 'off',
    'no-var': 'error',
    radix: 'error',
    'prettier/prettier': 'warn',
  },
};
