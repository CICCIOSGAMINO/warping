import { defineConfig } from 'vite'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
	build: {
		// lib: {entry: 'src/koren-app.js',formats: ['es'],},
		outDir: './dist',
		assetsDir: './',
		rollupOptions: {
			input: {
				main: resolve(__dirname, 'index.html')
			}
		}
	},
	server: {
		port: 3000,
	},
})