# Linting and Git Hooks Setup

This document describes the linting and git hooks configuration for the Utro E2E Test project.

## Installed Tools

### ESLint

- **Version**: 8.57.1
- **Parser**: @typescript-eslint/parser
- **Plugins**:
  - @typescript-eslint/eslint-plugin
  - eslint-plugin-cypress (v3.6.0 - compatible with ESLint 8)
  - eslint-plugin-prettier
- **Configuration**: `.eslintrc.json`

### Prettier

- **Configuration**: `.prettierrc.json`
- **Ignore**: `.prettierignore`
- **Settings**:
  - Semi-colons: enabled
  - Single quotes: enabled
  - Print width: 100
  - Tab width: 2 spaces
  - Line endings: LF

### Husky

- **Version**: 9.1.7
- **Hook Location**: `.husky/pre-commit`
- **Purpose**: Runs linters before each commit

### lint-staged

- **Version**: 16.2.7
- **Purpose**: Runs linters only on staged files
- **Configuration**: Defined in `package.json`

## Available Scripts

```bash
# Run ESLint on all files
pnpm run lint

# Run ESLint with auto-fix
pnpm run lint:fix

# Format all files with Prettier
pnpm run format

# Check formatting without making changes
pnpm run format:check
```

## Pre-commit Hook

The pre-commit hook automatically runs `lint-staged` which will:

1. Run ESLint with auto-fix on staged `.ts` and `.js` files
2. Run Prettier on staged `.ts`, `.js`, `.json`, and `.md` files

This ensures all committed code is properly linted and formatted.

## ESLint Rules

Key rules configured:

- **@typescript-eslint/no-explicit-any**: warn (discourages `any` type)
- **@typescript-eslint/no-unused-vars**: error (unused variables must start with `_`)
- **cypress/no-unnecessary-waiting**: warn (avoid arbitrary waits in tests)
- **cypress/assertion-before-screenshot**: warn (assert before screenshots)
- **no-console**: warn (console statements should be removed)

## Ignoring Files

ESLint ignores:

- `node_modules/`
- `dist/`
- `*.config.js`
- `*.config.ts`

Prettier ignores:

- `node_modules`
- `dist`
- `coverage`
- `*.tsbuildinfo`
- `.DS_Store`
- `pnpm-lock.yaml`

## Troubleshooting

### ESLint cache issues

If you see stale errors, clear the ESLint cache:

```bash
rm -rf .eslintcache node_modules/.cache
```

### Husky not working

If the pre-commit hook doesn't run, ensure Husky is properly initialized:

```bash
pnpm exec husky init
```

### TypeScript parsing errors

The configuration intentionally doesn't include `project: "./tsconfig.json"` in parser options to avoid type-checking during linting, which speeds up the process and avoids tsconfig path issues.
