import { eq } from 'drizzle-orm'
import { users } from '../db/schema'
import { db } from '../db'
import { requireSessionEmail } from '../utils/requireSessionEmail'

export default defineEventHandler(async (event) => {
  const { session, email } = await requireSessionEmail(event)

  if (!db) {
    return {
      dbEnabled: false,
      email,
      oauthName: session.user?.name ?? null,
      oauthImage: session.user?.image ?? null,
      displayName: null,
      avatarOverride: null,
      effectiveDisplayName: session.user?.name?.trim() || 'Dresseur',
      effectiveAvatarUrl: session.user?.image?.trim() || null,
    }
  }

  const [row] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1)

  const oauthName = row?.name ?? session.user?.name ?? null
  const oauthImage = row?.avatar ?? session.user?.image ?? null
  const customDisplay = row?.displayName?.trim() || null
  const customAvatar = row?.avatarOverride?.trim() || null

  const effectiveDisplayName =
    customDisplay || oauthName?.trim() || 'Dresseur'
  const effectiveAvatarUrl = customAvatar || oauthImage?.trim() || null

  return {
    dbEnabled: true,
    email,
    oauthName,
    oauthImage,
    displayName: row?.displayName ?? null,
    avatarOverride: row?.avatarOverride ?? null,
    effectiveDisplayName,
    effectiveAvatarUrl,
  }
})
