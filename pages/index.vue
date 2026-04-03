<template>
  <div class="min-h-screen bg-gray-900 text-white">
    <!-- Bannière en construction -->
    <div class="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 text-black py-2 px-4 text-center font-semibold text-sm">
      <span class="animate-pulse">🚧 Site en construction - De nouvelles fonctionnalités arrivent bientôt ! 🚧</span>
      <span class="ml-3 bg-black/20 px-2 py-0.5 rounded text-xs font-mono">v0.2.0</span>
    </div>

    <!-- En-tête -->
    <header class="bg-gray-800 shadow-lg">
      <div class="container mx-auto px-4 py-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <img
              src="/pokedex.png"
              alt="Pokédex"
              class="w-16 h-16"
              @error="(e) => (e.target.style.display = 'none')"
            />
            <div>
              <h1 class="text-3xl font-bold">Wingadex</h1>
              <p class="text-gray-400 text-sm">Découvrez tous les Pokémon</p>
            </div>
          </div>

          <!-- Futur: Bouton de connexion -->
          <div class="flex items-center gap-4">
            <!-- Placeholder pour auth -->
            <button
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition text-sm font-semibold opacity-50 cursor-not-allowed"
              disabled
            >
              🔐 Connexion (bientôt)
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Contenu principal -->
    <main class="container mx-auto px-4 py-8">
      <div class="flex flex-wrap gap-2 mb-6 border-b border-gray-700 pb-4">
        <button
          type="button"
          @click="mainTab = 'pokedex'"
          :class="[
            'px-4 py-2 rounded-lg font-semibold text-sm transition',
            mainTab === 'pokedex'
              ? 'bg-blue-600 text-white ring-2 ring-blue-400'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700',
          ]"
        >
          Pokédex
        </button>
        <button
          type="button"
          @click="mainTab = 'types'"
          :class="[
            'px-4 py-2 rounded-lg font-semibold text-sm transition',
            mainTab === 'types'
              ? 'bg-violet-600 text-white ring-2 ring-violet-400'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700',
          ]"
        >
          Types &amp; faiblesses
        </button>
      </div>

      <PokemonList v-show="mainTab === 'pokedex'" />
      <KeepAlive>
        <TypeDexTab v-if="mainTab === 'types'" />
      </KeepAlive>
    </main>

    <!-- Footer -->
    <footer class="bg-gray-800 mt-12 py-6 text-center text-gray-400 text-sm">
      <p>Made with ❤️ by Winga ⚡</p>
      <p class="mt-2 text-xs">Données fournies par l'API Tyradex</p>
    </footer>
  </div>
</template>

<script setup>
const mainTab = ref('pokedex');

// Configuration SEO
useHead({
  title: "Wingadex - Pokédex Interactif",
  meta: [
    {
      name: "description",
      content:
        "Le Pokédex le plus complet avec toutes les formes, évolutions et méga-évolutions",
    },
  ],
});
</script>
