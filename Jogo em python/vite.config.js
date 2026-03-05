import { defineConfig } from 'vite';
import { resolve } from 'path';
import obfuscator from 'vite-plugin-javascript-obfuscator';

export default defineConfig({
  // Força o Vite a considerar a pasta raiz
  root: '.',
  base: './',
  
  build: {
    target: 'esnext', // Otimizado para motores JS modernos
    outDir: 'dist',
    minify: 'terser',
    
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        passes: 2,
      },
      mangle: {
        toplevel: true,
        properties: { regex: /^_/ },
        keep_fnames: false,
        keep_classnames: false,
      },
      format: {
        comments: false,
        beautify: false,
      },
    },
    
    rollupOptions: {
      // FORÇA O PONTO DE ENTRADA AQUI:
      input: resolve(__dirname, 'index.html'),
      output: {
        entryFileNames: 'assets/[hash].js',
        chunkFileNames: 'assets/[hash].js',
        assetFileNames: 'assets/[hash][extname]'
      }
    },
    
    sourcemap: false,
    emptyOutDir: true,
  },
  
  plugins: [
    obfuscator({
      include: ['src/**/*.js'],
      exclude: [/node_modules/],
      apply: 'build',
      
      options: {
        compact: true,
        controlFlowFlattening: true,
        controlFlowFlatteningThreshold: 0.75,
        deadCodeInjection: true,
        deadCodeInjectionThreshold: 0.4,
        debugProtection: true,
        disableConsoleOutput: true,
        identifierNamesGenerator: 'hexadecimal',
        numbersToExpressions: true,
        selfDefending: true,
        splitStrings: true,
        stringArray: true,
        stringArrayEncoding: ['base64'],
      }
    })
  ],
  
  server: {
    port: 5173,
    strictPort: false,
    open: true,
  },
  
  preview: {
    port: 4173,
    strictPort: false,
  },
  
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
