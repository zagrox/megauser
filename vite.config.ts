import { defineConfig, loadEnv } from 'vite';
import { fileURLToPath, URL } from 'url';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('.', import.meta.url))
      }
    },
    build: {
      rollupOptions: {
        external: ['radash', '@leeoniya/ufuzzy'], // Add any modules causing issues
        output: {
          globals: {
            radash: '_',
            '@leeoniya/ufuzzy': 'Fuzzy'
          }
        }
      }
    }
  };
});
