<template>
  <div class="container mx-auto px-4 py-8 sm:py-10">
    <header class="mb-8 sm:mb-10">
      <p class="text-sm font-semibold uppercase tracking-wide text-blue-400">
        Espace membre
      </p>
      <h1 class="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
        Bonjour{{ greetingName ? `, ${greetingName}` : '' }}
        <span class="inline-block" aria-hidden="true">👋</span>
      </h1>
      <p class="mt-3 max-w-2xl text-sm leading-relaxed text-gray-400 sm:text-base">
        Ajuste ton pseudo et ton avatar affichés sur Wingadex. Sans personnalisation, on utilise
        ton compte Google ou Discord.
      </p>
    </header>

    <!-- Profil -->
    <section
      class="mb-10 rounded-2xl border border-gray-700/80 bg-gradient-to-br from-gray-800/90 to-gray-900/90 p-6 shadow-xl ring-1 ring-white/5 sm:p-8"
    >
      <h2 class="text-lg font-bold text-white">Profil affiché</h2>
      <p class="mt-1 text-sm text-gray-400">
        Les champs vides laissent place au nom et à la photo du fournisseur OAuth.
      </p>

      <div
        v-if="profilePending"
        class="mt-6 text-sm text-gray-500"
      >
        Chargement du profil…
      </div>

      <div
        v-else-if="profileError"
        class="mt-6 rounded-lg border border-amber-600/40 bg-amber-950/30 px-4 py-3 text-sm text-amber-200"
      >
        Impossible de charger le profil. Vérifie ta connexion ou réessaie.
      </div>

      <form
        v-else
        class="mt-6 space-y-5"
        @submit.prevent="saveProfile"
      >
        <div
          v-if="!profile?.dbEnabled"
          class="rounded-lg border border-blue-500/30 bg-blue-950/25 px-4 py-3 text-sm text-blue-200"
        >
          <strong class="font-semibold">Base non connectée.</strong>
          Démarre PostgreSQL (ex. <code class="rounded bg-black/30 px-1 font-mono text-xs">docker compose up -d</code>),
          mets <code class="rounded bg-black/30 px-1 font-mono text-xs">DATABASE_URL</code> dans
          <code class="rounded bg-black/30 px-1 font-mono text-xs">.env</code>, puis
          <code class="rounded bg-black/30 px-1 font-mono text-xs">npm run db:push</code>.
          Tu peux quand même naviguer : l’affichage utilise ta session OAuth.
        </div>

        <div class="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div
            class="flex shrink-0 flex-col items-center gap-2 rounded-xl border border-gray-600 bg-gray-900/50 p-4"
          >
            <img
              v-if="previewAvatar"
              :src="previewAvatar"
              alt=""
              class="h-24 w-24 rounded-full border-2 border-gray-600 object-cover"
              width="96"
              height="96"
              @error="onPreviewAvatarError"
            />
            <div
              v-else
              class="flex h-24 w-24 items-center justify-center rounded-full border-2 border-dashed border-gray-600 bg-gray-800 text-3xl text-gray-500"
              aria-hidden="true"
            >
              ?
            </div>
            <span class="text-xs text-gray-500">Aperçu</span>
          </div>

          <div class="min-w-0 flex-1 space-y-4">
            <div>
              <label
                for="dash-pseudo"
                class="mb-1.5 block text-sm font-medium text-gray-300"
              >Pseudo Wingadex</label>
              <input
                id="dash-pseudo"
                v-model="formDisplayName"
                type="text"
                maxlength="64"
                autocomplete="nickname"
                :placeholder="oauthNamePlaceholder"
                class="w-full rounded-xl border border-gray-600 bg-gray-900 px-4 py-2.5 text-white placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
              <p class="mt-1 text-xs text-gray-500">
                Laisse vide pour garder le nom de ton compte OAuth.
              </p>
            </div>
            <div>
              <label
                for="dash-avatar"
                class="mb-1.5 block text-sm font-medium text-gray-300"
              >URL de l’image</label>
              <input
                id="dash-avatar"
                v-model="formAvatarUrl"
                type="url"
                inputmode="url"
                placeholder="https://…"
                class="w-full rounded-xl border border-gray-600 bg-gray-900 px-4 py-2.5 text-white placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
              <p class="mt-1 text-xs text-gray-500">
                Lien direct vers une image (https). Vide = avatar Google / Discord.
              </p>
            </div>
          </div>
        </div>

        <div class="flex flex-wrap gap-3">
          <button
            type="submit"
            class="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-900/25 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="savePending || !profile?.dbEnabled"
          >
            {{ savePending ? 'Enregistrement…' : 'Enregistrer' }}
          </button>
          <button
            type="button"
            class="rounded-xl border border-gray-600 bg-gray-800 px-6 py-3 text-sm font-semibold text-gray-200 transition hover:border-gray-500 hover:bg-gray-700 disabled:opacity-50"
            :disabled="savePending || !profile?.dbEnabled"
            @click="resetToOAuth"
          >
            Reprendre OAuth
          </button>
        </div>

        <p
          v-if="saveMessage"
          class="text-sm text-emerald-400"
          role="status"
        >
          {{ saveMessage }}
        </p>
        <p
          v-if="saveError"
          class="text-sm text-red-400"
          role="alert"
        >
          {{ saveError }}
        </p>
      </form>
    </section>

    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <article
        class="group relative overflow-hidden rounded-2xl border border-gray-700/80 bg-gradient-to-br from-gray-800/90 to-gray-900/90 p-6 shadow-xl ring-1 ring-white/5 transition hover:border-blue-500/40 hover:ring-blue-500/20"
      >
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-sm font-semibold text-gray-400">Session</h2>
          <span class="text-lg" aria-hidden="true">🔐</span>
        </div>
        <p class="text-xl font-bold text-white sm:text-2xl">
          {{ status === 'authenticated' ? 'Connecté' : status }}
        </p>
        <p
          v-if="userEmail"
          class="mt-2 truncate text-xs text-gray-500 sm:text-sm"
          :title="userEmail"
        >
          {{ userEmail }}
        </p>
      </article>

      <article
        class="group relative overflow-hidden rounded-2xl border border-gray-700/80 bg-gradient-to-br from-gray-800/90 to-gray-900/90 p-6 shadow-xl ring-1 ring-white/5 transition hover:border-emerald-500/40 hover:ring-emerald-500/20"
      >
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-sm font-semibold text-gray-400">Pokémon capturés</h2>
          <span class="text-lg" aria-hidden="true">✨</span>
        </div>
        <p class="text-3xl font-bold tabular-nums text-emerald-400 sm:text-4xl">—</p>
        <p class="mt-2 text-xs text-gray-500 sm:text-sm">
          Synchronisation avec la base à venir
        </p>
      </article>

      <article
        class="group relative overflow-hidden rounded-2xl border border-gray-700/80 bg-gradient-to-br from-gray-800/90 to-gray-900/90 p-6 shadow-xl ring-1 ring-white/5 transition hover:border-violet-500/40 hover:ring-violet-500/20 sm:col-span-2 lg:col-span-1"
      >
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-sm font-semibold text-gray-400">Complétion</h2>
          <span class="text-lg" aria-hidden="true">📊</span>
        </div>
        <p class="text-3xl font-bold tabular-nums text-violet-400 sm:text-4xl">—</p>
        <p class="mt-2 text-xs text-gray-500 sm:text-sm">
          Objectifs national / régional
        </p>
      </article>
    </div>

    <div class="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <NuxtLink
        to="/"
        class="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-900/25 transition hover:bg-blue-500"
      >
        Retour au Pokédex
      </NuxtLink>
      <button
        type="button"
        class="inline-flex items-center justify-center rounded-xl border border-gray-600 bg-gray-800 px-6 py-3 text-sm font-semibold text-gray-200 transition hover:border-rose-500/50 hover:bg-gray-700 hover:text-white sm:hidden"
        @click="handleSignOut"
      >
        Se déconnecter
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  auth: true,
})

const { data: sessionData, status, signOut } = useAuth()
const {
  data: profile,
  pending: profilePending,
  error: profileError,
  refresh: refreshProfile,
} = useWingadexProfile()

useHead({
  title: 'Dashboard — Wingadex',
  bodyAttrs: {
    class: 'min-h-screen bg-gray-900 antialiased',
  },
})

const userEmail = computed(() => sessionData.value?.user?.email ?? '')

const greetingName = computed(() => profile.value?.effectiveDisplayName?.trim() || '')

const formDisplayName = ref('')
const formAvatarUrl = ref('')
const previewBroken = ref(false)

const oauthNamePlaceholder = computed(
  () => profile.value?.oauthName?.trim() || 'Ton pseudo Discord / Google',
)

watch(
  profile,
  (p) => {
    if (!p) return
    formDisplayName.value = p.displayName ?? ''
    formAvatarUrl.value = p.avatarOverride ?? ''
    previewBroken.value = false
  },
  { immediate: true },
)

const previewAvatar = computed(() => {
  if (previewBroken.value) return null
  const custom = formAvatarUrl.value.trim()
  if (custom) return custom
  return profile.value?.oauthImage?.trim() || sessionData.value?.user?.image || null
})

function onPreviewAvatarError() {
  previewBroken.value = true
}

watch(formAvatarUrl, () => {
  previewBroken.value = false
})

const savePending = ref(false)
const saveMessage = ref('')
const saveError = ref('')

async function saveProfile() {
  saveMessage.value = ''
  saveError.value = ''
  if (!profile.value?.dbEnabled) {
    saveError.value = 'Configure d’abord PostgreSQL (DATABASE_URL + db:push).'
    return
  }
  savePending.value = true
  try {
    await $fetch('/api/profile', {
      method: 'PATCH',
      body: {
        displayName: formDisplayName.value.trim() || null,
        avatarOverride: formAvatarUrl.value.trim() || null,
      },
    })
    await refreshProfile()
    saveMessage.value = 'Profil enregistré.'
  } catch (e: unknown) {
    const err = e as { data?: { statusMessage?: string }; message?: string }
    saveError.value =
      err?.data?.statusMessage || err?.message || 'Enregistrement impossible.'
  } finally {
    savePending.value = false
  }
}

async function resetToOAuth() {
  formDisplayName.value = ''
  formAvatarUrl.value = ''
  previewBroken.value = false
  saveMessage.value = ''
  saveError.value = ''
  if (!profile.value?.dbEnabled) return
  await saveProfile()
}

async function handleSignOut() {
  await signOut({ callbackUrl: '/' })
}
</script>
