// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  // Disable SSR - Client-Only SPA (Socket.io needs client-side only)
  ssr: false,

  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@vueuse/nuxt',
  ],

  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || 'https://maas-api.portall.com.tr',
      socketUrl: process.env.NUXT_PUBLIC_SOCKET_URL || 'https://maas-api.portall.com.tr',
    },
  },

  css: ['~/assets/css/main.css'],

  tailwindcss: {
    cssPath: '~/assets/css/main.css',
    configPath: 'tailwind.config.ts',
  },

  app: {
    head: {
      title: 'MAAS - Water Meter Reading Platform',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Remote Water Meter Reading Platform' },
      ],
      link: [
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap',
        },
      ],
    },
  },

  typescript: {
    strict: true,
  },

  // Vite configuration for Cloudflare tunnel
  vite: {
    server: {
      host: '0.0.0.0', // Listen on all network interfaces
      allowedHosts: [
        'maas-app.portall.com.tr',
        'localhost',
        '.portall.com.tr', // Allow all subdomains
      ],
      hmr: {
        clientPort: 443, // Use HTTPS port for Cloudflare tunnel
      },
    },
  },
})

