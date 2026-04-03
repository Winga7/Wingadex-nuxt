// https://nuxt.com/docs/api/configuration/nuxt-config

const siteUrl = (process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')
const defaultAuthBaseURL = `${siteUrl}/api/auth`

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  
  modules: [
    '@nuxtjs/tailwindcss',
    '@sidebase/nuxt-auth',
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
      siteUrl,
      /** Indique si Google / Discord sont configurés (sans exposer les secrets). */
      authGoogleEnabled: Boolean(
        process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
      ),
      authDiscordEnabled: Boolean(
        process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET,
      ),
      /** Démo credentials uniquement si aucun OAuth et build dev (aligné sur le handler). */
      authDemoEnabled:
        process.env.NODE_ENV === 'development' &&
        !(
          process.env.GOOGLE_CLIENT_ID &&
          process.env.GOOGLE_CLIENT_SECRET
        ) &&
        !(
          process.env.DISCORD_CLIENT_ID &&
          process.env.DISCORD_CLIENT_SECRET
        ),
    }
  },

  auth: {
    baseURL: process.env.NUXT_AUTH_ORIGIN || defaultAuthBaseURL,
    provider: {
      type: 'authjs',
      trustHost: true,
    },
    globalAppMiddleware: {
      isEnabled: false,
    },
    sessionRefresh: {
      enableOnWindowFocus: true,
    },
  },

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
