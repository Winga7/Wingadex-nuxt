<template>
  <div
    class="relative min-h-screen overflow-hidden bg-gray-950 text-white"
  >
    <!-- Fond décoratif discret -->
    <div
      class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(59,130,246,0.22),transparent)]"
      aria-hidden="true"
    />
    <div
      class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_100%_50%,rgba(139,92,246,0.12),transparent)]"
      aria-hidden="true"
    />

    <header class="relative border-b border-white/10 bg-gray-900/40 backdrop-blur-md">
      <div class="container mx-auto flex items-center justify-between px-4 py-4">
        <NuxtLink
          to="/"
          class="group flex items-center gap-2 text-sm font-semibold text-gray-300 transition hover:text-white"
        >
          <span
            class="inline-block transition group-hover:-translate-x-0.5"
            aria-hidden="true"
          >←</span>
          Wingadex
        </NuxtLink>
        <img
          src="/pokedex.png"
          alt=""
          class="h-9 w-9 opacity-90"
          width="36"
          height="36"
          @error="(e) => (e.target.style.display = 'none')"
        />
      </div>
    </header>

    <main class="relative mx-auto flex min-h-[calc(100vh-4.5rem)] max-w-lg flex-col justify-center px-4 py-12">
      <div
        class="rounded-2xl border border-white/10 bg-gray-900/70 p-8 shadow-2xl shadow-black/40 ring-1 ring-white/5 backdrop-blur-sm sm:p-10"
      >
        <h1 class="text-center text-2xl font-bold tracking-tight sm:text-3xl">
          Connexion
        </h1>
        <p class="mt-2 text-center text-sm text-gray-400 sm:text-base">
          Choisis un compte — rapide, sans mot de passe sur Wingadex.
        </p>

        <div class="mt-8 flex flex-col gap-3">
          <button
            v-if="hasGoogle"
            type="button"
            class="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200/90 bg-white px-4 py-3.5 text-sm font-semibold text-gray-800 shadow-md transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="pending"
            @click="signInWith('google')"
          >
            <svg
              class="h-5 w-5 shrink-0"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continuer avec Google
          </button>

          <button
            v-if="hasDiscord"
            type="button"
            class="flex w-full items-center justify-center gap-3 rounded-xl bg-[#5865F2] px-4 py-3.5 text-sm font-semibold text-white shadow-md shadow-indigo-950/50 transition hover:bg-[#4752C4] disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="pending"
            @click="signInWith('discord')"
          >
            <svg
              class="h-5 w-5 shrink-0 text-white"
              viewBox="0 0 24 24"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"
              />
            </svg>
            Continuer avec Discord
          </button>

          <div
            v-if="hasDemo"
            class="rounded-xl border border-amber-500/40 bg-amber-950/35 p-4 ring-1 ring-amber-500/20"
          >
            <p class="text-xs font-semibold text-amber-200">
              Mode démo (dev uniquement)
            </p>
            <p class="mt-1 text-xs text-amber-100/85">
              Email :
              <code class="rounded bg-black/35 px-1.5 py-0.5 font-mono text-[11px]">demo@wingadex.local</code>
            </p>
            <button
              type="button"
              class="mt-3 w-full rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-bold text-gray-900 transition hover:bg-amber-400 disabled:opacity-60"
              :disabled="pending"
              @click="signInWith('credentials', { email: 'demo@wingadex.local' })"
            >
              Se connecter en démo
            </button>
          </div>
        </div>

        <p
          v-if="error"
          class="mt-6 rounded-lg border border-red-500/30 bg-red-950/40 px-3 py-2 text-center text-sm text-red-300"
          role="alert"
        >
          {{ error }}
        </p>

        <p class="mt-8 border-t border-white/10 pt-6 text-center text-xs leading-relaxed text-gray-500">
          Google et Discord gèrent l’identité : Wingadex ne reçoit ni ne stocke de mot de passe.
        </p>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false,
  auth: {
    unauthenticatedOnly: true,
    navigateAuthenticatedTo: '/dashboard',
  },
})

useHead({
  title: 'Connexion — Wingadex',
  bodyAttrs: {
    class: 'min-h-screen bg-gray-950 antialiased',
  },
})

const { signIn } = useAuth()
const config = useRuntimeConfig()

const pending = ref(false)
const error = ref('')

const hasGoogle = computed(() => config.public.authGoogleEnabled)
const hasDiscord = computed(() => config.public.authDiscordEnabled)
const hasDemo = computed(() => config.public.authDemoEnabled)

async function signInWith(
  provider: string,
  extra?: Record<string, string>,
) {
  error.value = ''
  pending.value = true
  try {
    const result = await signIn(provider, {
      callbackUrl: '/dashboard',
      ...extra,
    })
    if (result?.error) {
      error.value =
        result.error === 'CredentialsSignin'
          ? 'Identifiants invalides.'
          : String(result.error)
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Connexion impossible.'
  } finally {
    pending.value = false
  }
}
</script>
