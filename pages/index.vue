<template>
  <div class="min-h-screen bg-gray-900 text-white">
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
      <PokemonList />
    </main>

    <!-- Footer -->
    <footer class="bg-gray-800 mt-12 py-6 text-center text-gray-400 text-sm">
      <p>Made with ❤️ by Winga ⚡</p>
      <p class="mt-2 text-xs">Données fournies par l'API Tyradex</p>
    </footer>
  </div>
</template>

<script setup>
// Auto-import du composant PokemonList grâce à Nuxt
// Pas besoin d'importer explicitement

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
