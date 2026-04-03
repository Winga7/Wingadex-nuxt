import { users } from '../db/schema'
import { db } from '../db'
import { requireSessionEmail } from '../utils/requireSessionEmail'

function parseOptionalUrl(raw: string) {
  const t = raw.trim()
  if (!t) return null
  if (t.length > 2048) {
    throw createError({
      statusCode: 400,
      statusMessage: 'URL trop longue (max 2048 caractères)',
    })
  }
  let url: URL
  try {
    url = new URL(t)
  } catch {
    throw createError({
      statusCode: 400,
      statusMessage: 'URL d’image invalide',
    })
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Utilise une URL http ou https',
    })
  }
  return t
}

export default defineEventHandler(async (event) => {
  const { session, email } = await requireSessionEmail(event)

  if (!db) {
    throw createError({
      statusCode: 503,
      statusMessage:
        'Base de données non configurée. Ajoute DATABASE_URL dans .env et lance npm run db:push',
    })
  }

  const body = await readBody<{
    displayName?: string | null
    avatarOverride?: string | null
  }>(event)

  if (!body || (typeof body !== 'object')) {
    throw createError({ statusCode: 400, statusMessage: 'Corps JSON attendu' })
  }

  if (!('displayName' in body) && !('avatarOverride' in body)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Envoie displayName et/ou avatarOverride',
    })
  }

  const setPatch: {
    displayName?: string | null
    avatarOverride?: string | null
    updatedAt: Date
  } = { updatedAt: new Date() }

  if ('displayName' in body) {
    const v = body.displayName
    if (v === null || v === undefined) {
      setPatch.displayName = null
    } else if (typeof v === 'string') {
      const t = v.trim()
      setPatch.displayName = t.length === 0 ? null : t.slice(0, 64)
    } else {
      throw createError({ statusCode: 400, statusMessage: 'displayName invalide' })
    }
  }

  if ('avatarOverride' in body) {
    const v = body.avatarOverride
    if (v === null || v === undefined) {
      setPatch.avatarOverride = null
    } else if (typeof v === 'string') {
      setPatch.avatarOverride = parseOptionalUrl(v)
    } else {
      throw createError({ statusCode: 400, statusMessage: 'avatarOverride invalide' })
    }
  }

  await db
    .insert(users)
    .values({
      email,
      name: session.user?.name ?? null,
      avatar: session.user?.image ?? null,
      displayName:
        setPatch.displayName !== undefined ? setPatch.displayName : null,
      avatarOverride:
        setPatch.avatarOverride !== undefined ? setPatch.avatarOverride : null,
    })
    .onConflictDoUpdate({
      target: users.email,
      set: {
        ...(setPatch.displayName !== undefined
          ? { displayName: setPatch.displayName }
          : {}),
        ...(setPatch.avatarOverride !== undefined
          ? { avatarOverride: setPatch.avatarOverride }
          : {}),
        updatedAt: setPatch.updatedAt,
      },
    })

  return { ok: true }
})
