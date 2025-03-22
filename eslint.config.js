import typescriptEslint from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginImport from 'eslint-plugin-import';
import eslintPluginPrettier from 'eslint-plugin-prettier';
import unusedImports from 'eslint-plugin-unused-imports';

export default [
    {
        ignores: [
            '**/node_modules/**',
            '**/.next/**',
            '**/dist/**',
            '**/build/**',
            '**/coverage/**',
            '**/out/**',
            '**/public/**',
            '**/artifacts/**',
            '**/cache/**',
            '**/typechain-types/**',
            '**/.git/**',
            '**/.vscode/**',
            '**/.idea/**',
            '**/.husky/**',
            '**/.vercel/**',
            '**/.turbo/**',
            '**/.output/**',
            '**/.cache/**',
            '**/.DS_Store',
        ],
    },
    eslintConfigPrettier,
    {
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            parser: typescriptParser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
            },
        },
        plugins: {
            '@typescript-eslint': typescriptEslint,
            'unused-imports': unusedImports,
            import: eslintPluginImport,
            prettier: eslintPluginPrettier,
        },
        rules: {
            'unused-imports/no-unused-imports': 'error',
            'unused-imports/no-unused-vars': [
                'warn',
                { vars: 'all', varsIgnorePattern: '^_', args: 'after-used', argsIgnorePattern: '^_' },
            ],
            'import/no-duplicates': 'error',
            'import/order': [
                'error',
                {
                    groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'object', 'type'],
                    alphabetize: { order: 'asc' },
                    'newlines-between': 'always'
                },
            ],
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unused-vars': 'warn',
            'prettier/prettier': 'warn',
        },
    },
];