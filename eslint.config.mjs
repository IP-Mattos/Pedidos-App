import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname
})

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    ignores: ['node_modules/**', '.next/**', 'out/**', 'build/**', 'next-env.d.ts']
  },
  {
    rules: {
      // Convertir errores en warnings
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': 'warn',
      'react-hooks/exhaustive-deps': 'warn'

      // O desactivar completamente durante desarrollo
      // "@typescript-eslint/no-unused-vars": "off",
      // "no-console": "off",
    }
  }
]

export default eslintConfig
