/**
 * Client minimal Tyradex — en-têtes recommandés par la doc officielle.
 * @see https://tyradex.app/docs
 */
export const TYRADEX_BASE = 'https://tyradex.app/api/v1'

const DEFAULT_HEADERS = {
  'User-Agent': 'Wingadex/0.2.0 (Nuxt; données Tyradex)',
  From: 'wingadex@local.dev',
  Accept: 'application/json',
}

/**
 * @param {string} path — ex. "/pokemon", "/gen/9", "/types/feu/eau"
 */
export async function tyraDexFetch(path) {
  const p = path.startsWith('/') ? path : `/${path}`
  const res = await fetch(`${TYRADEX_BASE}${p}`, { headers: DEFAULT_HEADERS })
  if (!res.ok) {
    throw new Error(`TyraDex ${res.status}: ${p}`)
  }
  return res.json()
}

/** Slug d’URL API à partir du champ `image` d’un type (…/types/plante.png). */
export function typeSlugFromImageUrl(imageUrl) {
  if (!imageUrl || typeof imageUrl !== 'string') return ''
  const m = imageUrl.match(/types\/([^./]+)\./i)
  return m ? m[1].toLowerCase() : ''
}

/** Nom affichable pour une entrée de l’API /types (simple ou double). */
export function typeEntryLabelFr(entry) {
  const fr = entry?.name?.fr
  if (Array.isArray(fr)) return fr.filter(Boolean).join(' / ')
  if (typeof fr === 'string') return fr
  const en = entry?.name?.en
  if (Array.isArray(en)) return en.filter(Boolean).join(' / ')
  if (typeof en === 'string') return en
  return 'Type'
}
