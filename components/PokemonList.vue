<script setup>
// Nuxt auto-imports ref, onMounted, computed, etc.
import PokemonDetails from "./PokemonDetails.vue";
import pokedexRegionauxData from "../data/pokedex-regionaux.json";
import pokedexRegionalIds from "../data/pokedex-regional-ids.json";
import legendaryPokemon from "../data/legendary-pokemon.json";
import { tyraDexFetch, typeSlugFromImageUrl } from "~/utils/tyradex";

// État de l'application
const pokemons = ref([]);
const workingList = ref([]);
const isLoading = ref(true);
const isFilterSyncing = ref(false);
let syncRequestId = 0;
let syncTimer = null;
const showModal = ref(false);
const selectedPokemonId = ref(null);
const showScrollTop = ref(false);

// États des filtres
const searchQuery = ref("");
const selectedTypes = ref([]);
const selectedGenerations = ref([]);
const selectedPokedex = ref("national"); // Pokédex sélectionné (par défaut: national)
const showLegendaryOnly = ref(false); // Filtre pour n'afficher que les légendaires
const showUltraBeastsOnly = ref(false); // Filtre pour n'afficher que les Ultra-Chimères
const showTypeFilters = ref(true);
const showGenerationFilters = ref(true);
const showPokedexFilters = ref(true);

const availableTypes = ref([]);
/** Méta officielle Tyradex GET /gen */
const generationMeta = ref([]);
const availableGenerations = computed(() => {
  if (generationMeta.value.length > 0) {
    return [...generationMeta.value]
      .sort((a, b) => a.generation - b.generation)
      .map((g) => ({
        generation: g.generation,
        from: g.from,
        to: g.to,
        count: g.to - g.from + 1,
      }));
  }
  const generationsMap = new Map();
  pokemons.value.forEach((pokemon) => {
    const gen = pokemon.generation;
    if (gen) {
      generationsMap.set(gen, (generationsMap.get(gen) || 0) + 1);
    }
  });
  return Array.from(generationsMap.entries())
    .map(([generation, count]) => ({
      generation,
      count,
      from: null,
      to: null,
    }))
    .sort((a, b) => a.generation - b.generation);
});
const availablePokedex = ref(pokedexRegionauxData.regions);

// Obtenir le numéro régional d'un Pokémon
const getRegionalId = (nationalId, pokedexId) => {
  if (pokedexId === "national") return nationalId;
  
  const pokemonData = pokedexRegionalIds[nationalId];
  if (!pokemonData) return nationalId; // Fallback si pas de données
  
  const regionalId = pokemonData[pokedexId];
  return regionalId !== null && regionalId !== undefined ? regionalId : nationalId;
};

function slugForTypeName(typeNameFr) {
  const t = availableTypes.value.find((x) => x.name === typeNameFr);
  if (t?.image) {
    const s = typeSlugFromImageUrl(t.image);
    if (s) return s;
  }
  return String(typeNameFr || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

async function loadGenerationMeta() {
  try {
    const meta = await tyraDexFetch("/gen");
    generationMeta.value = Array.isArray(meta) ? meta : [];
  } catch (e) {
    console.warn("Tyradex /gen indisponible — plages de génération non affichées", e);
    generationMeta.value = [];
  }
}

async function syncWorkingList() {
  if (!pokemons.value.length) {
    workingList.value = [];
    return;
  }
  const myId = ++syncRequestId;
  isFilterSyncing.value = true;
  try {
    let base = pokemons.value;

    if (selectedGenerations.value.length > 0) {
      const arrs = await Promise.all(
        selectedGenerations.value.map((g) => tyraDexFetch(`/gen/${g}`))
      );
      const map = new Map();
      for (const arr of arrs) {
        if (!Array.isArray(arr)) continue;
        for (const p of arr) {
          map.set(p.pokedex_id, p);
        }
      }
      base = Array.from(map.values());
    }

    const st = [...selectedTypes.value];
    if (st.length === 1) {
      try {
        const slug = slugForTypeName(st[0]);
        const data = await tyraDexFetch(`/types/${slug}`);
        const ids = new Set((data.pokemons || []).map((p) => p.pokedex_id));
        base = base.filter((p) => ids.has(p.pokedex_id));
      } catch (e) {
        console.warn("Filtre type Tyradex, fallback local", e);
        base = base.filter((p) =>
          p.types?.some((t) => t.name === st[0])
        );
      }
    } else if (st.length === 2) {
      try {
        const s1 = slugForTypeName(st[0]);
        const s2 = slugForTypeName(st[1]);
        let data;
        try {
          data = await tyraDexFetch(`/types/${s1}/${s2}`);
        } catch {
          data = await tyraDexFetch(`/types/${s2}/${s1}`);
        }
        const ids = new Set((data.pokemons || []).map((p) => p.pokedex_id));
        base = base.filter((p) => ids.has(p.pokedex_id));
      } catch (e) {
        console.warn("Filtre double type Tyradex, fallback local", e);
        base = base.filter((p) => {
          const names = (p.types || []).map((t) => t.name);
          return (
            names.length === 2 &&
            st.every((n) => names.includes(n))
          );
        });
      }
    }

    if (myId !== syncRequestId) return;
    workingList.value = base;
  } catch (e) {
    console.error("syncWorkingList", e);
    if (myId !== syncRequestId) return;
    workingList.value = pokemons.value;
  } finally {
    if (myId === syncRequestId) isFilterSyncing.value = false;
  }
}

function scheduleSync() {
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => syncWorkingList(), 200);
}

watch(
  () => [...selectedGenerations.value],
  () => scheduleSync(),
  { deep: true }
);

watch(
  () => [...selectedTypes.value],
  () => scheduleSync(),
  { deep: true }
);

// Charger tous les Pokémon au démarrage
const loadPokemons = async () => {
  try {
    isLoading.value = true;
    const data = await tyraDexFetch("/pokemon");
    pokemons.value = data;
    workingList.value = data;

    const typesMap = new Map();
    data.forEach((pokemon) => {
      pokemon.types?.forEach((type) => {
        if (!typesMap.has(type.name)) {
          typesMap.set(type.name, {
            name: type.name,
            image: type.image,
            count: 0,
          });
        }
        typesMap.get(type.name).count++;
      });
    });
    availableTypes.value = Array.from(typesMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    await loadGenerationMeta();
    await syncWorkingList();
  } catch (error) {
    console.error("❌ Erreur lors du chargement:", error);
    alert("Impossible de charger les Pokémon. Vérifiez votre connexion.");
  } finally {
    isLoading.value = false;
  }
};

// Filtrer les Pokémon selon les critères (base = workingList : national + /gen + /types Tyradex)
const filteredPokemons = computed(() => {
  let filtered = workingList.value;

  // Filtre par Pokédex régional
  if (selectedPokedex.value !== "national") {
    const pokedex = availablePokedex.value.find(p => p.id === selectedPokedex.value);
    if (pokedex && pokedex.ranges) {
      filtered = filtered.filter((pokemon) => {
        const id = pokemon.pokedex_id;
        // Vérifier si l'ID est dans une des plages
        return pokedex.ranges.some(([min, max]) => id >= min && id <= max);
      });
    }
  }

  // Filtre par recherche (ID national, ID régional, nom FR, EN, JP)
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim();
    filtered = filtered.filter((pokemon) => {
      // Recherche par ID national
      if (pokemon.pokedex_id?.toString() === query) {
        return true;
      }
      // Recherche par ID régional
      const regionalId = getRegionalId(pokemon.pokedex_id, selectedPokedex.value);
      if (regionalId?.toString() === query) {
        return true;
      }
      // Recherche par nom FR, EN, JP
      return (
        pokemon.name?.fr?.toLowerCase().includes(query) ||
        pokemon.name?.en?.toLowerCase().includes(query) ||
        pokemon.name?.jp?.toLowerCase().includes(query)
      );
    });
  }

  // 1 ou 2 types : filtrage déjà fait côté Tyradex dans workingList ; 3+ : OU local
  if (selectedTypes.value.length > 2) {
    filtered = filtered.filter((pokemon) =>
      pokemon.types?.some((type) =>
        selectedTypes.value.includes(type.name)
      )
    );
  }

  // Filtre pour les légendaires uniquement
  if (showLegendaryOnly.value) {
    filtered = filtered.filter((pokemon) => {
      // Vérifier si le Pokémon est dans la liste des légendaires ou fabuleux
      const id = pokemon.pokedex_id;
      return legendaryPokemon.legendary.includes(id) || legendaryPokemon.mythical.includes(id);
    });
  }

  // Filtre pour les Ultra-Chimères uniquement
  if (showUltraBeastsOnly.value) {
    filtered = filtered.filter((pokemon) => {
      // Vérifier si le Pokémon est une Ultra-Chimère
      const id = pokemon.pokedex_id;
      return legendaryPokemon.ultrabeasts.includes(id);
    });
  }

  return filtered;
});

// Toggle filtre type
const toggleType = (typeName) => {
  const index = selectedTypes.value.indexOf(typeName);
  if (index > -1) {
    selectedTypes.value.splice(index, 1);
  } else {
    selectedTypes.value.push(typeName);
  }
};

// Toggle filtre génération
const toggleGeneration = (gen) => {
  const index = selectedGenerations.value.indexOf(gen);
  if (index > -1) {
    selectedGenerations.value.splice(index, 1);
  } else {
    selectedGenerations.value.push(gen);
  }
};

// Sélectionner un Pokédex régional
const selectPokedex = (pokedexId) => {
  selectedPokedex.value = pokedexId;
  if (pokedexId !== "national") {
    selectedGenerations.value = [];
  }
};

// Réinitialiser tous les filtres
const resetFilters = () => {
  searchQuery.value = "";
  selectedTypes.value = [];
  selectedGenerations.value = [];
  selectedPokedex.value = "national";
  showLegendaryOnly.value = false;
  showUltraBeastsOnly.value = false;
};

// Ouvrir le modal avec un Pokémon
const openPokemon = (pokemonId) => {
  console.log("🔍 Ouverture du Pokémon ID:", pokemonId);
  selectedPokemonId.value = pokemonId;
  showModal.value = true;
};

// Fermer le modal
const closeModal = () => {
  console.log("❌ Fermeture du modal");
  showModal.value = false;
  setTimeout(() => {
    selectedPokemonId.value = null;
  }, 300);
};

// Changer de Pokémon dans le modal (pour les évolutions)
const changePokemon = (pokemonId) => {
  console.log("🔄 Changement vers le Pokémon ID:", pokemonId);
  selectedPokemonId.value = pokemonId;
};

// Couleur de génération
const getGenerationColor = (gen) => {
  const colors = {
    1: "from-red-600 to-red-700",
    2: "from-yellow-600 to-yellow-700",
    3: "from-emerald-600 to-emerald-700",
    4: "from-blue-600 to-blue-700",
    5: "from-purple-600 to-purple-700",
    6: "from-pink-600 to-pink-700",
    7: "from-orange-600 to-orange-700",
    8: "from-cyan-600 to-cyan-700",
    9: "from-violet-600 to-violet-700",
  };
  return colors[gen] || "from-gray-600 to-gray-700";
};

// Gérer le bouton "Retour en haut"
const handleScroll = () => {
  showScrollTop.value = window.scrollY > 500;
};

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
};

// Charger au montage
onMounted(() => {
  loadPokemons();
  window.addEventListener("scroll", handleScroll);
});

// Nettoyer au démontage (onUnmounted auto-importé par Nuxt)
onUnmounted(() => {
  window.removeEventListener("scroll", handleScroll);
  clearTimeout(syncTimer);
});
</script>

<template>
  <div>
    <!-- Chargement -->
    <div
      v-if="isLoading"
      class="flex flex-col items-center justify-center py-20"
    >
      <div
        class="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mb-4"
      ></div>
      <p class="text-gray-400 text-lg">Chargement des Pokémon...</p>
    </div>

    <!-- Contenu principal -->
    <div v-else>
      <!-- Titre (non sticky) -->
      <div class="mb-6">
        <h2 class="text-2xl font-bold mb-1">⭐ Liste des Pokémon</h2>
      </div>

      <!-- Section recherche sticky (compact) -->
      <div
        class="sticky top-0 z-40 bg-gray-900 pb-3 pt-2 -mx-4 px-4 shadow-lg mb-4"
      >
        <!-- Compteur et bouton reset -->
        <div class="mb-3 flex items-center justify-between flex-wrap gap-3">
          <p class="text-gray-400 text-sm flex items-center gap-2 flex-wrap">
            <span
              v-if="isFilterSyncing"
              class="inline-block h-4 w-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin shrink-0"
              title="Mise à jour des filtres Tyradex…"
            />
            <span class="text-blue-400 font-semibold text-lg">{{
              filteredPokemons.length
            }}</span>
            / {{ pokemons.length }} Pokémon
            {{
              filteredPokemons.length !== pokemons.length
                ? "trouvés"
                : "disponibles"
            }}
          </p>

          <!-- Bouton reset filtres -->
          <button
            v-if="
              searchQuery ||
              selectedTypes.length > 0 ||
              selectedGenerations.length > 0 ||
              selectedPokedex !== 'national' ||
              showLegendaryOnly ||
              showUltraBeastsOnly
            "
            @click="resetFilters"
            class="px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded-lg transition text-sm font-semibold"
          >
            ✕ Réinitialiser
          </button>
        </div>

        <!-- Barre de recherche et bouton légendaires -->
        <div class="flex gap-2">
          <!-- Barre de recherche -->
          <div class="relative flex-1">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="🔍 Rechercher par nom (FR, EN, JP) ou ID..."
              class="w-full bg-gray-800 text-white px-4 py-2.5 rounded-lg border-2 border-gray-700 focus:border-blue-500 focus:outline-none text-sm transition"
            />
            <button
              v-if="searchQuery"
              @click="searchQuery = ''"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-lg"
            >
              ✕
            </button>
          </div>

          <!-- Bouton filtre légendaires -->
          <button
            @click="showLegendaryOnly = !showLegendaryOnly"
            :class="
              showLegendaryOnly
                ? 'bg-gradient-to-r from-yellow-600 to-orange-600 ring-2 ring-yellow-400'
                : 'bg-gray-700 hover:bg-gray-600'
            "
            class="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg transition-all text-sm font-bold shadow-lg whitespace-nowrap"
            :title="showLegendaryOnly ? 'Désactiver le filtre légendaires' : 'Afficher uniquement les légendaires'"
          >
            <span class="text-lg">✨</span>
            <span class="hidden sm:inline">Légendaires</span>
            <span v-if="showLegendaryOnly" class="text-yellow-200">✓</span>
          </button>

          <!-- Bouton filtre Ultra-Chimères -->
          <button
            @click="showUltraBeastsOnly = !showUltraBeastsOnly"
            :class="
              showUltraBeastsOnly
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 ring-2 ring-purple-400'
                : 'bg-gray-700 hover:bg-gray-600'
            "
            class="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg transition-all text-sm font-bold shadow-lg whitespace-nowrap"
            :title="showUltraBeastsOnly ? 'Désactiver le filtre Ultra-Chimères' : 'Afficher uniquement les Ultra-Chimères'"
          >
            <span class="text-lg">🌀</span>
            <span class="hidden md:inline">UC</span>
            <span v-if="showUltraBeastsOnly" class="text-purple-200">✓</span>
          </button>
        </div>
      </div>
      <!-- Fin section sticky -->

      <!-- Filtres détaillés (non sticky, défilent avec la page) -->
      <div class="mb-6">
        <!-- Filtre par Pokédex régional -->
        <div class="mb-4 bg-gray-800 rounded-lg p-3">
          <button
            @click="showPokedexFilters = !showPokedexFilters"
            class="w-full flex items-center justify-between text-sm font-bold hover:text-blue-400 transition"
          >
            <span>Filtrer par Pokédex régional</span>
            <span
              class="text-sm transition-transform duration-300"
              :class="showPokedexFilters ? 'rotate-180' : ''"
            >
              ▼
            </span>
          </button>

          <Transition name="slide">
            <div v-show="showPokedexFilters" class="mt-3">
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="pokedex in availablePokedex"
                  :key="pokedex.id"
                  @click="selectPokedex(pokedex.id)"
                  :class="
                    selectedPokedex === pokedex.id
                      ? 'ring-2 ring-blue-400 bg-blue-700'
                      : 'bg-gray-700 hover:bg-gray-600'
                  "
                  class="flex items-center gap-2 px-3 py-2 rounded-md transition-all text-sm font-medium"
                  :title="pokedex.description"
                >
                  <span class="text-lg">{{ pokedex.icon }}</span>
                  <span>{{ pokedex.nom }}</span>
                  <span
                    v-if="selectedPokedex === pokedex.id"
                    class="text-blue-300 text-xs ml-1"
                    >✓</span
                  >
                </button>
              </div>
              <p class="text-xs text-gray-400 mt-2 italic">
                Sélectionnez un Pokédex pour voir uniquement les Pokémon disponibles dans ce jeu/région
              </p>
            </div>
          </Transition>
        </div>

        <!-- Filtres par type -->
        <div class="mb-3 bg-gray-800 rounded-lg p-3">
          <button
            @click="showTypeFilters = !showTypeFilters"
            class="w-full flex items-center justify-between text-sm font-bold hover:text-blue-400 transition"
          >
            <span>Filtrer par type</span>
            <span
              class="text-sm transition-transform duration-300"
              :class="showTypeFilters ? 'rotate-180' : ''"
            >
              ▼
            </span>
          </button>

          <Transition name="slide">
            <div v-show="showTypeFilters" class="mt-3">
              <div class="flex flex-wrap gap-2.5">
                <button
                  v-for="type in availableTypes"
                  :key="type.name"
                  @click="toggleType(type.name)"
                  :class="
                    selectedTypes.includes(type.name)
                      ? 'ring-2 ring-blue-400 bg-gray-700'
                      : 'bg-gray-700 hover:bg-gray-600'
                  "
                  class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all text-xs"
                >
                  <img
                    :src="type.image"
                    :alt="type.name"
                    class="w-4 h-4 object-contain"
                    @error="(e) => (e.target.style.display = 'none')"
                  />
                  <span class="font-medium">{{ type.name }}</span>
                  <span class="text-gray-400">({{ type.count }})</span>
                  <span
                    v-if="selectedTypes.includes(type.name)"
                    class="text-blue-400 text-xs ml-0.5"
                    >✓</span
                  >
                </button>
              </div>
              <p
                v-if="selectedTypes.length === 2"
                class="text-xs text-violet-300 mt-2"
              >
                Combinaison <strong>double type</strong> exacte (endpoint Tyradex
                <code class="text-[10px] bg-gray-900 px-1 rounded">/types/a/b</code>).
              </p>
              <p
                v-else-if="selectedTypes.length === 1"
                class="text-xs text-violet-300/90 mt-2"
              >
                Filtre via l’API Tyradex
                <code class="text-[10px] bg-gray-900 px-1 rounded">/types/&lt;type&gt;</code>
                (tous les Pokémon de ce type).
              </p>
              <p
                v-else-if="selectedTypes.length > 2"
                class="text-xs text-amber-200/90 mt-2"
              >
                Plus de 2 types : filtre <strong>OU</strong> en local sur la liste
                courante.
              </p>
            </div>
          </Transition>
        </div>

        <!-- Filtres par génération -->
        <div class="mb-4 bg-gray-800 rounded-lg p-3">
          <button
            @click="showGenerationFilters = !showGenerationFilters"
            class="w-full flex items-center justify-between text-sm font-bold hover:text-blue-400 transition"
          >
            <span>Filtrer par génération</span>
            <span
              class="text-sm transition-transform duration-300"
              :class="showGenerationFilters ? 'rotate-180' : ''"
            >
              ▼
            </span>
          </button>

          <Transition name="slide">
            <div v-show="showGenerationFilters" class="mt-3">
              <p class="text-xs text-gray-400 mb-2 italic">
                Plages et listes officielles Tyradex
                <code class="text-[10px] bg-gray-900 px-1 rounded not-italic">GET /gen</code>
                ·
                <code class="text-[10px] bg-gray-900 px-1 rounded not-italic">GET /gen/&lt;n&gt;</code>
              </p>
              <div
                class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-9 gap-2"
              >
                <button
                  v-for="gen in availableGenerations"
                  :key="gen.generation"
                  @click="toggleGeneration(gen.generation)"
                  :class="[
                    selectedGenerations.includes(gen.generation)
                      ? 'ring-2 ring-white'
                      : 'hover:opacity-90',
                    `bg-gradient-to-br ${getGenerationColor(gen.generation)}`,
                  ]"
                  class="relative rounded-lg p-2 transition-all text-xs font-medium"
                >
                  <div class="text-center">
                    <div class="text-base font-bold mb-0.5">
                      Gen {{ gen.generation }}
                    </div>
                    <div
                      v-if="gen.from != null && gen.to != null"
                      class="text-[9px] opacity-80 leading-tight"
                    >
                      N°{{ gen.from }}–{{ gen.to }}
                    </div>
                    <div class="text-[10px] opacity-90">
                      {{ gen.count }} Poké
                    </div>
                  </div>
                  <div
                    v-if="selectedGenerations.includes(gen.generation)"
                    class="absolute top-1 right-1 bg-white text-green-600 rounded-full w-3.5 h-3.5 flex items-center justify-center text-[10px] font-bold"
                  >
                    ✓
                  </div>
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </div>
      <!-- Fin filtres détaillés -->

      <!-- Message si aucun résultat -->
      <div
        v-if="filteredPokemons.length === 0"
        class="text-center py-12 bg-gray-800 rounded-lg"
      >
        <div class="text-4xl mb-3">😢</div>
        <p class="text-lg font-bold mb-1">Aucun Pokémon trouvé</p>
        <p class="text-gray-400 mb-4 text-sm">
          Essayez de modifier vos critères de recherche
        </p>
        <button
          @click="resetFilters"
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition text-sm font-semibold"
        >
          Réinitialiser les filtres
        </button>
      </div>

      <!-- Grille de Pokémon -->
      <div
        v-else
        class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
      >
        <div
          v-for="pokemon in filteredPokemons"
          :key="pokemon.pokedex_id"
          @click="openPokemon(pokemon.pokedex_id)"
          class="bg-gray-800 rounded-lg p-4 cursor-pointer hover:bg-gray-700 hover:scale-105 transition-all shadow-lg hover:shadow-xl"
        >
          <!-- Image -->
          <div class="relative aspect-square mb-2">
            <img
              :src="pokemon.sprites?.regular"
              :alt="pokemon.name?.fr"
              class="w-full h-full object-contain"
              loading="lazy"
              @error="
                (e) => (e.target.src = 'https://via.placeholder.com/150?text=?')
              "
            />
          </div>

          <!-- Numéro (régional ou national) -->
          <p class="text-xs text-gray-400 text-center mb-1">
            <template v-if="selectedPokedex !== 'national'">
              <span class="font-semibold text-blue-400">
                N° {{ getRegionalId(pokemon.pokedex_id, selectedPokedex) }}
              </span>
              <span class="text-gray-500 text-[10px] ml-1">
                (Nat. {{ pokemon.pokedex_id }})
              </span>
            </template>
            <template v-else>
              N° {{ pokemon.pokedex_id }}
            </template>
          </p>

          <!-- Nom -->
          <h3 class="text-center font-semibold mb-2 truncate">
            {{ pokemon.name?.fr }}
          </h3>

          <!-- Types -->
          <div class="flex justify-center gap-1 flex-wrap">
            <span
              v-for="type in pokemon.types"
              :key="type.name"
              class="px-2 py-1 rounded-full text-xs bg-gray-700"
            >
              {{ type.name }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL -->
    <Transition name="modal">
      <div
        v-if="showModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click="closeModal"
      >
        <!-- Fond sombre -->
        <div class="absolute inset-0 bg-black bg-opacity-75"></div>

        <!-- Contenu du modal -->
        <div
          @click.stop
          class="relative bg-gray-900 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto"
        >
          <!-- Bouton fermer -->
          <button
            @click="closeModal"
            class="sticky top-4 right-4 float-right z-10 bg-red-600 hover:bg-red-700 text-white rounded-full w-10 h-10 flex items-center justify-center text-xl font-bold transition-colors shadow-lg"
            title="Fermer"
          >
            ✕
          </button>

          <!-- Détails du Pokémon -->
          <div class="p-6">
            <PokemonDetails
              v-if="selectedPokemonId"
              :pokemon-id="selectedPokemonId"
              :selected-pokedex="selectedPokedex"
              @change-pokemon="changePokemon"
            />
          </div>
        </div>
      </div>
    </Transition>

    <!-- Bouton retour en haut -->
    <Transition name="fade">
      <button
        v-if="showScrollTop"
        @click="scrollToTop"
        class="fixed bottom-8 right-8 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-2xl transition-all transform hover:scale-110 z-50"
        title="Retour en haut"
      >
        <svg
          class="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M5 10l7-7m0 0l7 7m-7-7v18"
          />
        </svg>
      </button>
    </Transition>
  </div>
</template>

<style scoped>
/* Animation du modal */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .relative,
.modal-leave-active .relative {
  transition: transform 0.3s ease;
}

.modal-enter-from .relative {
  transform: scale(0.9);
}

.modal-leave-to .relative {
  transform: scale(0.9);
}

/* Animation slide pour les filtres */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.slide-enter-from,
.slide-leave-to {
  max-height: 0;
  opacity: 0;
  transform: translateY(-10px);
}

.slide-enter-to,
.slide-leave-from {
  max-height: 1000px;
  opacity: 1;
  transform: translateY(0);
}
</style>
