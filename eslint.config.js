import nextjs from 'next/core-web-vitals'

export default [
  nextjs,
  {
    rules: {
      'react/no-unescaped-entities': 'off'
    },
    linterOptions: {
      reportUnusedDisableDirectives: true
    }
  }
] 