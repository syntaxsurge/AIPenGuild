import typescriptEslint from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginImport from 'eslint-plugin-import';
import eslintPluginPrettier from 'eslint-plugin-prettier';

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
            import: eslintPluginImport,
            prettier: eslintPluginPrettier,
        },
        rules: {
            'import/no-duplicates': 'error',
            'import/order': [
                'error',
                {
                    alphabetize: {
                        order: 'asc',
                    },
                },
            ],
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unused-vars': 'warn',
            'prettier/prettier': [
                'warn',
                {
                    arrowParens: 'always',
                    semi: false,
                    trailingComma: 'none',
                    tabWidth: 2,
                    endOfLine: 'auto',
                    useTabs: false,
                    singleQuote: true,
                    printWidth: 120,
                    jsxSingleQuote: true,
                },
            ],
        },
    },
];