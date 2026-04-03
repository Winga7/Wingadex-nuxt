export type WingadexProfile = {
  dbEnabled: boolean
  email: string
  oauthName: string | null
  oauthImage: string | null
  displayName: string | null
  avatarOverride: string | null
  effectiveDisplayName: string
  effectiveAvatarUrl: string | null
}

export function useWingadexProfile() {
  return useFetch<WingadexProfile>('/api/profile', {
    key: 'wingadex-profile',
  })
}
