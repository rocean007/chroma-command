import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const siteUrl = (env.VITE_SITE_URL || '').replace(/\/$/, '') || 'http://localhost:5173'

  return {
    plugins: [
      react(),
      {
        name: 'seo-site-url-and-files',
        transformIndexHtml(html) {
          return html.replace(/%SITE_URL%/g, siteUrl)
        },
        closeBundle() {
          const outDir = path.resolve(__dirname, 'dist')
          if (!fs.existsSync(outDir)) return
          const robots = `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`
          const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteUrl}/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`
          fs.writeFileSync(path.join(outDir, 'robots.txt'), robots)
          fs.writeFileSync(path.join(outDir, 'sitemap.xml'), sitemap)
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
    build: {
      target: 'esnext',
      sourcemap: true,
    },
  }
})
