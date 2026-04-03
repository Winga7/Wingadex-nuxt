import { users } from '../db/schema'
import { db } from '../db'

type OAuthUser = {
  email?: string | null
  name?: string | null
  image?: string | null
}

type OAuthAccount = {
  provider: string
  providerAccountId: string
}

/**
 * Met à jour ou insère l’utilisateur après connexion OAuth (si la DB est configurée).
 */
export async function syncOAuthUser(user: OAuthUser, account: OAuthAccount | null | undefined) {
  if (!db || !user?.email || !account) return

  await db
    .insert(users)
    .values({
      email: user.email,
      name: user.name ?? null,
      provider: account.provider,
      providerId: account.providerAccountId,
      avatar: user.image ?? null,
    })
    .onConflictDoUpdate({
      target: users.email,
      set: {
        name: user.name ?? null,
        provider: account.provider,
        providerId: account.providerAccountId,
        avatar: user.image ?? null,
        updatedAt: new Date(),
        // displayName / avatarOverride : laissés tels quels (choix utilisateur)
      },
    })
}
