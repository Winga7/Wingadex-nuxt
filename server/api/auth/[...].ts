import { NuxtAuthHandler } from '#auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import DiscordProvider from 'next-auth/providers/discord'
import GoogleProvider from 'next-auth/providers/google'
import { syncOAuthUser } from '../../utils/syncOAuthUser'

function googleProvider(config: ReturnType<typeof useRuntimeConfig>) {
  if (!config.googleClientId || !config.googleClientSecret) return null
  // next-auth v4 : export par défaut pour le handler Nitro
  // @ts-expect-error default export CJS
  return GoogleProvider.default({
    clientId: config.googleClientId,
    clientSecret: config.googleClientSecret,
  })
}

function discordProvider(config: ReturnType<typeof useRuntimeConfig>) {
  if (!config.discordClientId || !config.discordClientSecret) return null
  // @ts-expect-error default export CJS
  return DiscordProvider.default({
    clientId: config.discordClientId,
    clientSecret: config.discordClientSecret,
  })
}

function demoCredentialsProvider() {
  // @ts-expect-error export CJS default (next-auth 4)
  const Credentials = CredentialsProvider.default ?? CredentialsProvider
  return Credentials({
    name: 'Démo (dev)',
    credentials: {
      email: {
        label: 'Email',
        type: 'email',
        placeholder: 'demo@wingadex.local',
      },
    },
    async authorize(credentials) {
      const email = credentials?.email?.trim()
      if (email === 'demo@wingadex.local') {
        return {
          id: 'demo-local',
          name: 'Trainer démo',
          email: 'demo@wingadex.local',
          image: null,
        }
      }
      return null
    },
  })
}

const config = useRuntimeConfig()

const providers: unknown[] = []

const google = googleProvider(config)
if (google) providers.push(google)

const discord = discordProvider(config)
if (discord) providers.push(discord)

if (providers.length === 0) {
  if (import.meta.dev) {
    console.warn(
      '[auth] Aucun OAuth configuré : mode démo activé (email: demo@wingadex.local).',
    )
    providers.push(demoCredentialsProvider())
  } else {
    throw new Error(
      'Auth : configurez GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET et/ou DISCORD_* en production.',
    )
  }
}

export default NuxtAuthHandler({
  secret: config.authSecret,
  pages: {
    signIn: '/auth/signin',
  },
  providers,
  callbacks: {
    async signIn({ user, account }) {
      try {
        await syncOAuthUser(user, account)
      } catch (e) {
        console.error('[auth] syncOAuthUser', e)
      }
      return true
    },
  },
})
