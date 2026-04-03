// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  
  modules: [
    '@nuxtjs/tailwindcss',
    // '@sidebase/nuxt-auth' // Désactivé : réinstaller avec `npx nuxt module add sidebase-auth` ou `npm i @sidebase/nuxt-auth` avant de décommenter
  ],

  runtimeConfig: {
    // Private (server-only)
    databaseUrl: process.env.DATABASE_URL || '',
    authSecret: process.env.NUXT_AUTH_SECRET || 'votre-secret-aleatoire-securise-changez-moi',
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    discordClientId: process.env.DISCORD_CLIENT_ID || '',
    discordClientSecret: process.env.DISCORD_CLIENT_SECRET || '',
    
    // Public (exposed to client) — surchargé par NUXT_PUBLIC_SITE_URL (.env)
    public: {
      siteUrl: 'http://localhost:3000'
    }
  },

  // Configuration auth désactivée temporairement
  // auth: {
  //   origin: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  //   enableGlobalAppMiddleware: false,
  //   provider: {
  //     type: 'authjs'
  //   }
  // },

  app: {
    head: {
      title: 'Wingadex - Pokédex Interactif',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Le Pokédex le plus complet avec système de progression' }
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/pokedex.png' }
      ]
    }
  }
})
