// ESLint: solo errores que rompen en ejecución (variables sin declarar) y avisos de lo que sobra.
// El formato no se revisa: el código sigue su propio estilo compacto (ver docs/arquitectura.md).
import globals from 'globals';

export default [
  { ignores: ['www/', 'dist-windows/', 'android/', 'node_modules/', 'web/src/ui/componentes/gameIcons.js'] },
  {
    files: ['web/src/**/*.js'],
    languageOptions: { ecmaVersion: 2024, sourceType: 'module', globals: { ...globals.browser, ...globals.worker, __PERSONAJES_PRUEBA__: 'readonly', __RAMA__: 'readonly' } },
  },
  {
    files: ['tests/**/*.js', 'tools/**/*.mjs', 'eslint.config.js', 'web/vite.config.js'],
    languageOptions: { ecmaVersion: 2024, sourceType: 'module', globals: globals.node },
  },
  {
    files: ['**/*.{js,mjs}'],
    rules: {
      'no-undef': 'error',
      'no-unused-vars': ['error', { args: 'none', caughtErrors: 'none' }],
    },
  },
];
