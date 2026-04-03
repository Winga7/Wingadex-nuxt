import { getServerSession } from '#auth'
import type { H3Event } from 'h3'

/**
 * Session Next Auth : email obligatoire pour lier le profil DB.
 */
export async function requireSessionEmail(event: H3Event) {
  const session = await getServerSession(event)
  const email = session?.user?.email?.trim()
  if (!email) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Non authentifié ou email indisponible',
    })
  }
  return { session, email }
}
