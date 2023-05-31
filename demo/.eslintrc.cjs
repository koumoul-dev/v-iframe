module.exports = {
  root: true,
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    project: require('path').join(__dirname, 'tsconfig.json'),
    sourceType: 'module',
    extraFileExtensions: ['.vue']
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    '@nuxtjs/eslint-config-typescript',
    'plugin:vue/vue3-recommended'
  ],
  env: {
    browser: true
  },
  rules: {
    'vue/multi-word-component-names': 0,
    curly: 0,
    'no-console': 0
  }
}