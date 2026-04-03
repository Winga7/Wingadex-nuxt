<template>
  <div class="flex min-h-screen flex-col bg-gray-900 text-white">
    <header class="sticky top-0 z-20 border-b border-gray-700 bg-gray-800 shadow-lg">
      <div class="container mx-auto px-4 py-4 sm:py-5">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <NuxtLink
            to="/"
            class="flex items-center gap-3 rounded-lg outline-none ring-blue-500 transition hover:opacity-90 focus-visible:ring-2"
          >
            <img
              src="/pokedex.png"
              alt=""
              class="h-12 w-12 shrink-0"
              width="48"
              height="48"
              @error="(e) => (e.target.style.display = 'none')"
            />
            <div>
              <p class="text-lg font-bold leading-tight sm:text-xl">Wingadex</p>
              <p class="text-xs text-gray-400 sm:text-sm">Tableau de bord</p>
            </div>
          </NuxtLink>

          <div class="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            <div
              v-if="headerName || headerImage"
              class="hidden items-center gap-2 rounded-lg bg-gray-700/60 px-3 py-1.5 sm:flex"
            >
              <img
                v-if="headerImage"
                :src="headerImage"
                alt=""
                class="h-8 w-8 rounded-full border border-gray-600 object-cover"
                width="32"
                height="32"
              />
              <span class="max-w-[10rem] truncate text-sm font-medium text-gray-200">
                {{ headerName || 'Membre' }}
              </span>
            </div>
            <NuxtLink
              to="/"
              class="rounded-lg border border-gray-600 bg-gray-700/80 px-3 py-2 text-sm font-semibold text-gray-100 transition hover:bg-gray-600"
            >
              Pokédex
            </NuxtLink>
            <button
              type="button"
              class="rounded-lg bg-rose-600 px-4 py-2 text-sm font-bold text-white shadow-md shadow-rose-900/30 transition hover:bg-rose-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-400"
              @click="handleSignOut"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </div>
    </header>

    <main class="flex-1">
      <slot />
    </main>

    <footer class="border-t border-gray-800 bg-gray-900 py-5 text-center text-sm text-gray-500">
      <p>Wingadex — espace connecté</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
const { data: sessionData, signOut } = useAuth()
const { data: profile } = useWingadexProfile()

const headerName = computed(
  () =>
    profile.value?.effectiveDisplayName?.trim()
    || sessionData.value?.user?.name
    || '',
)

const headerImage = computed(
  () =>
    profile.value?.effectiveAvatarUrl?.trim()
    || sessionData.value?.user?.image
    || '',
)

async function handleSignOut() {
  await signOut({ callbackUrl: '/' })
}
</script>
