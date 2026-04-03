<script setup>
// Nuxt auto-imports ref, watch, etc.
import megaEvolutionsZA from "../data/mega-evolutions-za.json";
import pokemonFormesAlt from "../data/pokemon-formes-alt.json";
import pokedexRegionalIds from "../data/pokedex-regional-ids.json";
import pokedexRegionauxData from "../data/pokedex-regionaux.json";
import { tyraDexFetch } from "~/utils/tyradex";

const props = defineProps({
  pokemonId: {
    type: Number,
    required: true,
  },
  selectedPokedex: {
    type: String,
    default: "national",
  },
});

// Obtenir le numéro régional d'un Pokémon
const getRegionalId = (nationalId, pokedexId) => {
  if (pokedexId === "national") return nationalId;
  
  const pokemonData = pokedexRegionalIds[nationalId];
  if (!pokemonData) return nationalId; // Fallback si pas de données
  
  const regionalId = pokemonData[pokedexId];
  return regionalId !== null && regionalId !== undefined ? regionalId : nationalId;
};

// Composable pour récupérer les IDs depuis Pokepedia
const { getRegionalIds: fetchPokepediaIds } = usePokepediaRegionalIds();

// État pour les IDs régionaux (dynamiques depuis Pokepedia)
const dynamicRegionalIds = ref({});

// Obtenir tous les numéros régionaux d'un Pokémon
const getAllRegionalIds = (nationalId) => {
  // Combiner les données locales et dynamiques
  const pokemonData = dynamicRegionalIds.value[nationalId] || pokedexRegionalIds[nationalId] || {};
  
  const regionalIds = [];
  
  // Parcourir toutes les régions
  pokedexRegionauxData.regions.forEach((region) => {
    if (region.id !== 'national' && pokemonData[region.id]) {
      regionalIds.push({
        regionId: region.id,
        regionName: region.nom,
        regionIcon: region.icon,
        number: pokemonData[region.id]
      });
    }
  });
  
  return regionalIds;
};

const emit = defineEmits(["changePokemon"]);

// État
const pokemon = ref(null);
const isLoading = ref(false);
const error = ref(null);
const currentSpriteIndex = ref(0);

// --- GESTION DES FORMES (ONGLETS) ---
const selectedForm = ref(null);
const availableForms = ref([]);

// Charger les détails du Pokémon
const loadPokemonDetails = async () => {
  try {
    isLoading.value = true;
    error.value = null;
    pokemon.value = null;
    currentSpriteIndex.value = 0;

    // Reset des états de forme
    selectedForm.value = null;
    availableForms.value = [];

    console.log("🔄 Chargement du Pokémon ID:", props.pokemonId);

    const data = await tyraDexFetch(`/pokemon/${props.pokemonId}`);

    // Injecter les formes alternatives
    if (pokemonFormesAlt[props.pokemonId]) {
      console.log("💉 Injection formes alternatives pour ID:", props.pokemonId);

      if (!data.evolution) {
        data.evolution = {};
      }
      if (!data.evolution.formes_alternatives) {
        data.evolution.formes_alternatives = [];
      }

      // Ajouter les formes alternatives
      data.evolution.formes_alternatives = [
        ...data.evolution.formes_alternatives,
        ...pokemonFormesAlt[props.pokemonId],
      ];
    }

    // Injecter les méga-évolutions Z-A
    if (megaEvolutionsZA[props.pokemonId]) {
      console.log("💉 Injection méga-évolutions Z-A pour ID:", props.pokemonId);

      if (!data.evolution) {
        data.evolution = {};
      }
      if (!data.evolution.mega) {
        data.evolution.mega = [];
      }

      // Ajouter les nouvelles mégas à celles existantes
      data.evolution.mega = [
        ...data.evolution.mega,
        ...megaEvolutionsZA[props.pokemonId],
      ];
    }

    pokemon.value = data;

    // Récupérer les IDs régionaux depuis Pokepedia en arrière-plan
    if (data.name?.fr) {
      fetchPokepediaIds(props.pokemonId, data.name.fr).then((ids) => {
        if (ids && Object.keys(ids).length > 0) {
          dynamicRegionalIds.value[props.pokemonId] = {
            national: props.pokemonId,
            ...ids
          };
        }
      }).catch((err) => {
        console.warn('Impossible de récupérer les IDs régionaux depuis Pokepedia:', err);
      });
    }

    // Initialiser les formes disponibles (Base + Régionales)
    initForms(data);

    // 🔧 Fix: Forcer l'index sur la forme "Normal" ou "Base" après chargement
    setTimeout(() => {
      const sprites = getSprites();
      const normalIndex = sprites.findIndex((s) => s.type === "Normal");
      if (normalIndex !== -1) {
        currentSpriteIndex.value = normalIndex;
      }
    }, 50);

    console.log("✅ Pokémon chargé:", data.name?.fr, data);
  } catch (err) {
    console.error("❌ Erreur chargement:", err);
    error.value = "Impossible de charger ce Pokémon";
  } finally {
    isLoading.value = false;
  }
};

// Initialiser les formes disponibles
const initForms = (data) => {
  const forms = [];

  // 1. Forme de base (Tyradex)
  forms.push({
    id: "base",
    label: "Forme Normale",
    data: data,
  });

  // 2. Formes régionales (Galar, Hisui, Alola, etc.)
  if (data.formes) {
    data.formes.forEach((f) => {
      const regionName = f.region.charAt(0).toUpperCase() + f.region.slice(1);
      forms.push({
        id: f.region,
        label: `Forme ${regionName}`,
        region: f.region,
        loading: false,
        data: null,
      });
    });
  }

  availableForms.value = forms;
  selectedForm.value = forms[0];
};

// Changer de forme
const changeForm = async (form) => {
  if (selectedForm.value.id === form.id) return;

  selectedForm.value = form;

  // 🔧 FIX 1: Réinitialiser l'index d'image lors du changement de forme
  currentSpriteIndex.value = 0;

  // Si c'est la forme de base
  if (form.id === "base") {
    pokemon.value = form.data;
    return;
  }

  // Si déjà chargé
  if (form.data) {
    pokemon.value = form.data;
    return;
  }

  // Charger depuis Tyradex
  try {
    form.loading = true;
    const regionPath = `/pokemon/${props.pokemonId}/${form.region.toLowerCase()}`;
    console.log(`🔄 Chargement forme ${form.label}:`, regionPath);

    const regionData = await tyraDexFetch(regionPath);

    // Garder les évolutions de base
    if (!regionData.evolution) {
      regionData.evolution = availableForms.value[0].data.evolution;
    }

    form.data = regionData;
    pokemon.value = regionData;
  } catch (e) {
    console.error("Erreur:", e);
    alert("Impossible de charger cette forme.");
    selectedForm.value = availableForms.value[0];
  } finally {
    form.loading = false;
  }
};

// Surveiller les changements d'ID
watch(
  () => props.pokemonId,
  (newId) => {
    if (newId) {
      console.log("👀 ID changé:", newId);
      loadPokemonDetails();
    }
  },
  { immediate: true }
);

// Obtenir les sprites disponibles (TOUTES les formes)
const getSprites = () => {
  if (!pokemon.value?.sprites) return [];

  const sprites = [];

  // Forme normale
  if (pokemon.value.sprites.regular) {
    sprites.push({
      type: "Normal",
      url: pokemon.value.sprites.regular,
      category: "Base",
    });
  }

  // Forme shiny
  if (pokemon.value.sprites.shiny) {
    sprites.push({
      type: "Shiny ✨",
      url: pokemon.value.sprites.shiny,
      category: "Base",
    });
  }

  // Formes alternatives (comme Zygarde 20%, 100%, Cœur, etc.)
  if (pokemon.value.evolution?.formes_alternatives) {
    pokemon.value.evolution.formes_alternatives.forEach((forme) => {
      if (forme.sprites?.regular) {
        sprites.push({
          type: `${forme.nom} 🔷`,
          url: forme.sprites.regular,
          category: "Forme Alternative",
          nom: forme.nom,
        });
      }
      if (forme.sprites?.shiny) {
        sprites.push({
          type: `${forme.nom} Shiny ✨🔷`,
          url: forme.sprites.shiny,
          category: "Forme Alternative",
          nom: forme.nom,
        });
      }
    });
  }

  // Gigamax (objet avec regular et shiny)
  if (pokemon.value.sprites.gmax) {
    if (pokemon.value.sprites.gmax.regular) {
      sprites.push({
        type: "Gigamax 👑",
        url: pokemon.value.sprites.gmax.regular,
        category: "Gigamax",
      });
    }
    if (pokemon.value.sprites.gmax.shiny) {
      sprites.push({
        type: "Gigamax Shiny ✨👑",
        url: pokemon.value.sprites.gmax.shiny,
        category: "Gigamax",
      });
    }
  }

  // Méga-évolutions (regular et shiny pour chaque méga)
  if (pokemon.value.evolution?.mega) {
    pokemon.value.evolution.mega.forEach((mega) => {
      // Nettoyer le nom de la pierre pour l'affichage
      const displayName = `Méga ${mega.orbe.replace(/ite|ïte|osite|usite/g, "")}`;

      if (mega.sprites?.regular) {
        sprites.push({
          type: `${displayName} ⚡`,
          url: mega.sprites.regular,
          category: "Méga",
          orbe: mega.orbe,
        });
      }
      if (mega.sprites?.shiny) {
        sprites.push({
          type: `${displayName} Shiny ✨⚡`,
          url: mega.sprites.shiny,
          category: "Méga",
          orbe: mega.orbe,
        });
      }
    });
  }

  // 🔧 LOGIQUE DE TRI SPÉCIALE POUR ZYGARDE (ID 718)
  if (pokemon.value.pokedex_id === 718) {
    // Ordre souhaité : Cœur -> 20% -> Base (50%) -> 100% -> Méga
    const order = [
      "Cœur de Zygarde",
      "Forme 20%",
      "Normal",
      "Shiny", // Shiny base (50%)
      "Forme 100%",
      "Méga",
    ];

    sprites.sort((a, b) => {
      const indexA = order.findIndex((key) => a.type.includes(key));
      const indexB = order.findIndex((key) => b.type.includes(key));

      // Si l'un des deux n'est pas dans la liste, on le met à la fin
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;

      return indexA - indexB;
    });
  }

  return sprites;
};

// Navigation sprites
const nextSprite = () => {
  const sprites = getSprites();
  if (sprites.length > 1) {
    currentSpriteIndex.value = (currentSpriteIndex.value + 1) % sprites.length;
  }
};

const previousSprite = () => {
  const sprites = getSprites();
  if (sprites.length > 1) {
    currentSpriteIndex.value =
      currentSpriteIndex.value === 0
        ? sprites.length - 1
        : currentSpriteIndex.value - 1;
  }
};

// Changer vers une évolution
const goToEvolution = (evolutionId) => {
  console.log("🔄 Navigation vers l'évolution:", evolutionId);
  emit("changePokemon", evolutionId);
};

// Obtenir toutes les pré-évolutions (triées par ID)
const getPreEvolutions = () => {
  if (!pokemon.value?.evolution?.pre) return [];

  const pre = pokemon.value.evolution.pre;
  if (pre.length === 0) return [];

  // Trier par ID pour avoir l'ordre correct
  return [...pre].sort((a, b) => a.pokedex_id - b.pokedex_id);
};

// Obtenir toutes les évolutions suivantes (triées par ID)
const getAllEvolutions = () => {
  if (!pokemon.value?.evolution?.next) return [];

  const next = pokemon.value.evolution.next;
  if (next.length === 0) return [];

  // Trier par ID pour avoir l'ordre d'évolution correct
  return [...next].sort((a, b) => a.pokedex_id - b.pokedex_id);
};

// Vérifier si c'est un cas d'évolutions multiples (comme Évoli)
const hasMultipleEvolutionPaths = () => {
  const evolutions = getAllEvolutions();
  if (evolutions.length <= 1) return false;

  // Si plusieurs évolutions ont des IDs très proches, c'est un choix multiple
  const ids = evolutions.map((e) => e.pokedex_id);
  const minId = Math.min(...ids);
  const closeEvolutions = ids.filter((id) => id <= minId + 10);

  return closeEvolutions.length > 2;
};

// Obtenir les méga-évolutions si disponibles
const getMegaEvolutions = () => {
  if (!pokemon.value?.evolution?.mega) return [];
  return pokemon.value.evolution.mega;
};

// Obtenir les formes alternatives si disponibles
const getFormesAlternatives = () => {
  if (!pokemon.value?.evolution?.formes_alternatives) return [];
  return pokemon.value.evolution.formes_alternatives;
};

// Couleur selon multiplicateur de résistance
const getResistanceClass = (multiplier) => {
  if (multiplier === 0) return "bg-gray-900 border border-gray-700 opacity-50";
  if (multiplier >= 2) return "bg-red-800";
  if (multiplier <= 0.5) return "bg-green-800";
  return "bg-gray-700";
};

// Obtenir l'image d'un type par son nom
const getTypeImage = (typeName) => {
  // Normaliser le nom du type (minuscules, sans accents)
  const normalized = typeName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return `https://raw.githubusercontent.com/Yarkis01/TyraDex/images/types/${normalized}.png`;
};
</script>

<template>
  <div class="text-white">
    <!-- CHARGEMENT -->
    <div
      v-if="isLoading"
      class="flex flex-col items-center justify-center py-20"
    >
      <div
        class="animate-spin rounded-full h-20 w-20 border-4 border-blue-500 border-t-transparent mb-4"
      ></div>
      <p class="text-xl text-gray-400">Chargement...</p>
    </div>

    <!-- ERREUR -->
    <div v-else-if="error" class="text-center py-20">
      <p class="text-2xl text-red-500 mb-4">{{ error }}</p>
      <p class="text-gray-400">ID demandé: {{ pokemonId }}</p>
    </div>

    <!-- CONTENU POKÉMON -->
    <div v-else-if="pokemon">
      <!-- SÉLECTEUR DE FORMES (ONGLETS) -->
      <div
        v-if="availableForms.length > 1"
        class="flex flex-wrap gap-2 mb-6 justify-center"
      >
        <button
          v-for="form in availableForms"
          :key="form.id"
          @click="changeForm(form)"
          :disabled="form.loading"
          class="px-4 py-2 rounded-full font-semibold transition-all flex items-center gap-2"
          :class="[
            selectedForm.id === form.id
              ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-400'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white',
          ]"
        >
          <span
            v-if="form.loading"
            class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"
          ></span>
          {{ form.label }}
        </button>
      </div>

      <!-- SECTION 1: Image et infos principales -->
      <div class="grid lg:grid-cols-[1fr_1.5fr] gap-8 mb-8">
        <!-- Colonne gauche: Image -->
        <div>
          <div class="bg-gray-800 rounded-xl p-6">
            <!-- Galerie d'images -->
            <div class="relative h-80 flex items-center justify-center mb-4">
              <template v-if="getSprites().length > 0">
                <!-- Bouton précédent -->
                <button
                  v-if="getSprites().length > 1"
                  @click="previousSprite"
                  class="absolute left-0 top-1/2 -translate-y-1/2 bg-gray-700 hover:bg-gray-600 text-white p-3 rounded-l-lg z-10 transition"
                >
                  ←
                </button>

                <!-- Image -->
                <img
                  :src="getSprites()[currentSpriteIndex].url"
                  :alt="pokemon.name?.fr"
                  class="max-h-full max-w-full object-contain"
                />

                <!-- Bouton suivant -->
                <button
                  v-if="getSprites().length > 1"
                  @click="nextSprite"
                  class="absolute right-0 top-1/2 -translate-y-1/2 bg-gray-700 hover:bg-gray-600 text-white p-3 rounded-r-lg z-10 transition"
                >
                  →
                </button>
              </template>
            </div>

            <!-- Indicateur du type d'image avec compteur -->
            <div
              class="text-center rounded-lg py-3 font-semibold"
              :class="{
                'bg-gradient-to-r from-purple-700 to-purple-900':
                  getSprites()[currentSpriteIndex]?.category === 'Méga',
                'bg-gradient-to-r from-cyan-700 to-cyan-900':
                  getSprites()[currentSpriteIndex]?.category === 'Forme Alternative',
                'bg-gradient-to-r from-green-700 to-emerald-900':
                  getSprites()[currentSpriteIndex]?.category ===
                  'Forme Spéciale',
                'bg-gradient-to-r from-pink-700 to-pink-900':
                  getSprites()[currentSpriteIndex]?.category === 'Gigamax',
                'bg-gray-700':
                  getSprites()[currentSpriteIndex]?.category === 'Base',
              }"
            >
              <div class="text-lg">
                {{ getSprites()[currentSpriteIndex]?.type || "Normal" }}
              </div>
              <div
                v-if="getSprites().length > 1"
                class="text-xs text-gray-300 mt-1"
              >
                {{ currentSpriteIndex + 1 }} / {{ getSprites().length }} formes
              </div>
            </div>

            <!-- Miniatures cliquables -->
            <div
              v-if="getSprites().length > 1"
              class="mt-4 grid grid-cols-4 gap-2"
            >
              <button
                v-for="(sprite, index) in getSprites()"
                :key="index"
                @click="currentSpriteIndex = index"
                :class="[
                  currentSpriteIndex === index
                    ? 'ring-4 ring-blue-500 scale-110'
                    : 'hover:scale-105 opacity-70 hover:opacity-100',
                  sprite.category === 'Méga'
                    ? 'bg-purple-900/50'
                    : sprite.category === 'Forme Alternative'
                    ? 'bg-cyan-900/50'
                    : sprite.category === 'Forme Spéciale'
                    ? 'bg-green-900/50'
                    : sprite.category === 'Régionale'
                    ? 'bg-orange-900/50'
                    : sprite.category === 'Gigamax'
                    ? 'bg-pink-900/50'
                    : 'bg-gray-700/50',
                ]"
                class="rounded-lg p-1 transition-all transform relative group"
                :title="sprite.type"
              >
                <img
                  :src="sprite.url"
                  :alt="sprite.type"
                  class="w-full h-full object-contain"
                />
                <!-- Tooltip au survol -->
                <div
                  class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none"
                >
                  {{ sprite.type }}
                </div>
              </button>
            </div>
          </div>
        </div>

        <!-- Colonne droite: Infos -->
        <div>
          <!-- Nom et identité -->
          <div class="mb-6">
            <h1 class="text-5xl font-bold mb-3">{{ pokemon.name?.fr }}</h1>
            <p class="text-xl text-gray-400 mb-2">
              {{ pokemon.name?.en }} • {{ pokemon.name?.jp }}
            </p>
            <p class="text-lg text-gray-300">
              <span class="font-semibold">N° {{ pokemon.pokedex_id }} (National)</span>
              •
              Génération {{ pokemon.generation }}
            </p>
            <p class="text-gray-400 italic mt-2">{{ pokemon.category }}</p>
            
            <!-- Tous les numéros régionaux -->
            <div v-if="getAllRegionalIds(pokemon.pokedex_id).length" class="mt-4 bg-gray-800/50 rounded-lg p-4">
              <h4 class="text-sm font-semibold text-gray-400 mb-3">📚 Numéros dans les Pokédex régionaux</h4>
              <div class="flex flex-wrap gap-2">
                <div
                  v-for="regional in getAllRegionalIds(pokemon.pokedex_id)"
                  :key="regional.regionId"
                  class="bg-gray-700 px-3 py-2 rounded-lg flex items-center gap-2"
                >
                  <span class="text-lg">{{ regional.regionIcon }}</span>
                  <span class="font-semibold text-blue-400">N° {{ regional.number }}</span>
                  <span class="text-gray-400 text-sm">{{ regional.regionName }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Types -->
          <div class="mb-6">
            <h3 class="text-xl font-bold mb-3">Types</h3>
            <div class="flex gap-3">
              <span
                v-for="type in pokemon.types"
                :key="type.name"
                class="flex items-center gap-2 px-5 py-2.5 bg-gray-700 rounded-full text-lg font-semibold"
              >
                <img
                  :src="type.image"
                  :alt="type.name"
                  class="w-7 h-7 object-contain"
                  @error="(e) => (e.target.style.display = 'none')"
                />
                {{ type.name }}
              </span>
            </div>
          </div>

          <!-- Taille et Poids -->
          <div class="grid grid-cols-2 gap-4 mb-6">
            <div class="bg-gray-800 rounded-lg p-4">
              <p class="text-gray-400 text-sm mb-1">Taille</p>
              <p class="text-3xl font-bold">{{ pokemon.height }}</p>
            </div>
            <div class="bg-gray-800 rounded-lg p-4">
              <p class="text-gray-400 text-sm mb-1">Poids</p>
              <p class="text-3xl font-bold">{{ pokemon.weight }}</p>
            </div>
          </div>

          <!-- Talents -->
          <div v-if="pokemon.talents?.length" class="mb-6">
            <h3 class="text-xl font-bold mb-3">Talents</h3>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="talent in pokemon.talents"
                :key="talent.name"
                :class="talent.tc ? 'bg-purple-700' : 'bg-gray-700'"
                class="px-4 py-2 rounded-lg"
              >
                {{ talent.name }}
                <span v-if="talent.tc" class="text-xs ml-1">(Caché)</span>
              </span>
            </div>
          </div>

          <!-- Informations de capture et reproduction -->
          <div class="grid grid-cols-2 gap-4">
            <!-- Ratio de sexe -->
            <div v-if="pokemon.sexe" class="bg-gray-800 rounded-lg p-4">
              <h4 class="text-sm font-semibold text-gray-400 mb-2">
                Répartition des sexes
              </h4>
              <div class="flex items-center gap-2">
                <div class="flex-1">
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-blue-400">♂ Mâle</span>
                    <span class="font-bold">{{ pokemon.sexe.male }}%</span>
                  </div>
                  <div class="bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div
                      class="bg-blue-500 h-full"
                      :style="`width: ${pokemon.sexe.male}%`"
                    ></div>
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-2 mt-2">
                <div class="flex-1">
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-pink-400">♀ Femelle</span>
                    <span class="font-bold">{{ pokemon.sexe.female }}%</span>
                  </div>
                  <div class="bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div
                      class="bg-pink-500 h-full"
                      :style="`width: ${pokemon.sexe.female}%`"
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Taux de capture -->
            <div v-if="pokemon.catch_rate" class="bg-gray-800 rounded-lg p-4">
              <h4 class="text-sm font-semibold text-gray-400 mb-2">
                Taux de capture 🎣
              </h4>
              <div class="flex items-center gap-3">
                <span class="text-3xl font-bold text-green-400">
                  {{ pokemon.catch_rate }}
                </span>
                <div class="flex-1">
                  <div class="bg-gray-700 rounded-full h-3 overflow-hidden">
                    <div
                      class="bg-green-500 h-full"
                      :style="`width: ${Math.min(
                        (pokemon.catch_rate / 255) * 100,
                        100
                      )}%`"
                    ></div>
                  </div>
                  <p class="text-xs text-gray-400 mt-1">
                    {{
                      pokemon.catch_rate < 50
                        ? "Très difficile"
                        : pokemon.catch_rate < 100
                        ? "Difficile"
                        : pokemon.catch_rate < 190
                        ? "Moyen"
                        : "Facile"
                    }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Groupes d'œufs -->
            <div
              v-if="pokemon.egg_groups?.length"
              class="bg-gray-800 rounded-lg p-4"
            >
              <h4 class="text-sm font-semibold text-gray-400 mb-2">
                Groupes d'Œufs 🥚
              </h4>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="group in pokemon.egg_groups"
                  :key="group"
                  class="bg-orange-700 px-3 py-1 rounded-full text-sm"
                >
                  {{ group }}
                </span>
              </div>
            </div>

            <!-- Expérience -->
            <div v-if="pokemon.level_100" class="bg-gray-800 rounded-lg p-4">
              <h4 class="text-sm font-semibold text-gray-400 mb-2">
                Exp. pour Niveau 100 📈
              </h4>
              <p class="text-2xl font-bold text-yellow-400">
                {{ pokemon.level_100.toLocaleString("fr-FR") }}
              </p>
              <p class="text-xs text-gray-400 mt-1">Courbe d'expérience</p>
            </div>
          </div>
        </div>
      </div>

      <!-- SECTION 2: Statistiques -->
      <div v-if="pokemon.stats" class="bg-gray-800 rounded-xl p-6 mb-8">
        <h2 class="text-3xl font-bold mb-6">📊 Statistiques</h2>
        <div class="grid md:grid-cols-2 gap-x-8 gap-y-4">
          <div
            v-for="(value, key) in {
              hp: { label: 'PV', color: 'bg-green-500' },
              atk: { label: 'Attaque', color: 'bg-red-500' },
              def: { label: 'Défense', color: 'bg-blue-500' },
              spe_atk: { label: 'Att. Spé.', color: 'bg-purple-500' },
              spe_def: { label: 'Déf. Spé.', color: 'bg-yellow-500' },
              vit: { label: 'Vitesse', color: 'bg-pink-500' },
            }"
            :key="key"
          >
            <div>
              <div class="flex justify-between mb-2">
                <span class="font-semibold">{{ value.label }}</span>
                <span class="font-bold">{{ pokemon.stats[key] }}</span>
              </div>
              <div class="bg-gray-700 rounded-full h-3 overflow-hidden">
                <div
                  :class="value.color"
                  class="h-full transition-all duration-500 rounded-full"
                  :style="`width: ${Math.min(
                    (pokemon.stats[key] / 255) * 100,
                    100
                  )}%`"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- SECTION 3: Évolutions -->
      <div
        v-if="
          pokemon.evolution &&
          (getPreEvolutions().length ||
            getAllEvolutions().length ||
            getFormesAlternatives().length ||
            getMegaEvolutions().length)
        "
        class="bg-gray-800 rounded-xl p-6 mb-8"
      >
        <h2 class="text-3xl font-bold mb-6">🔄 Chaîne d'évolution</h2>

        <!-- Note pour les évolutions multiples -->
        <div
          v-if="hasMultipleEvolutionPaths()"
          class="mb-4 text-center text-sm text-yellow-400 bg-yellow-900/30 rounded-lg p-3"
        >
          💡 Ce Pokémon peut évoluer de différentes façons selon les conditions
        </div>

        <!-- CAS SPÉCIAL ÉVOLI : Évolutions en grille -->
        <div v-if="pokemon.pokedex_id === 133 && getAllEvolutions().length" class="mb-6">
          <h3 class="text-xl font-semibold text-green-400 mb-4">
            🌟 Évolutions possibles d'Évoli
          </h3>
          
          <!-- Évoli au centre -->
          <div class="flex justify-center mb-6">
            <div class="bg-blue-900 border-4 border-blue-500 rounded-lg p-6">
              <img
                :src="pokemon.sprites?.regular"
                :alt="pokemon.name?.fr"
                class="w-40 h-40 object-contain mx-auto mb-2"
                @error="(e) => (e.target.style.display = 'none')"
              />
              <p class="text-center font-bold text-xl">{{ pokemon.name?.fr }}</p>
              <p class="text-center text-sm text-gray-400">
                N° {{ pokemon.pokedex_id }}
              </p>
            </div>
          </div>

          <!-- Grille des évolutions -->
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
            <button
              v-for="evo in getAllEvolutions()"
              :key="evo.pokedex_id"
              @click="goToEvolution(evo.pokedex_id)"
              class="bg-gray-700 hover:bg-gray-600 rounded-lg p-4 transition transform hover:scale-105 flex flex-col"
            >
              <img
                :src="`https://raw.githubusercontent.com/Yarkis01/TyraDex/images/sprites/${evo.pokedex_id}/regular.png`"
                :alt="evo.name"
                class="w-24 h-24 object-contain mx-auto mb-2"
                @error="(e) => (e.target.style.display = 'none')"
              />
              <p class="text-center font-bold mb-1">{{ evo.name }}</p>
              <p class="text-center text-xs text-gray-400 mb-2">
                N° {{ evo.pokedex_id }}
              </p>
              <p class="text-center text-xs text-yellow-400 bg-yellow-900/30 rounded px-2 py-1">
                {{ evo.condition }}
              </p>
            </button>
          </div>

          <p class="text-center text-sm text-yellow-400 mt-6 bg-yellow-900/30 rounded-lg p-3 max-w-2xl mx-auto">
            💡 Toutes ces évolutions partent directement d'Évoli selon différentes conditions
          </p>
        </div>

        <!-- Chaîne d'évolution complète (autres Pokémon) -->
        <div
          v-else-if="getPreEvolutions().length || getAllEvolutions().length"
          class="mb-6"
        >
          <h3 class="text-xl font-semibold text-green-400 mb-4">
            {{
              hasMultipleEvolutionPaths()
                ? "Évolutions possibles"
                : "Chaîne d'évolution"
            }}
          </h3>
          <div class="flex items-center gap-4 flex-wrap justify-center">
            <!-- Pré-évolutions -->
            <template
              v-for="preEvo in getPreEvolutions()"
              :key="preEvo.pokedex_id"
            >
              <button
                @click="goToEvolution(preEvo.pokedex_id)"
                class="bg-gray-700 hover:bg-gray-600 rounded-lg p-4 transition transform hover:scale-105"
              >
                <img
                  :src="`https://raw.githubusercontent.com/Yarkis01/TyraDex/images/sprites/${preEvo.pokedex_id}/regular.png`"
                  :alt="preEvo.name"
                  class="w-32 h-32 object-contain mx-auto mb-2"
                  @error="(e) => (e.target.style.display = 'none')"
                />
                <p class="text-center font-bold">{{ preEvo.name }}</p>
                <p class="text-center text-sm text-gray-400">
                  N° {{ preEvo.pokedex_id }}
                </p>
              </button>

              <div class="text-center flex-shrink-0">
                <div class="text-3xl mb-2">→</div>
                <p class="text-xs text-gray-400 max-w-[100px] break-words">
                  {{ preEvo.condition }}
                </p>
              </div>
            </template>

            <!-- Pokémon actuel -->
            <div class="bg-blue-900 border-4 border-blue-500 rounded-lg p-4">
              <img
                :src="pokemon.sprites?.regular"
                :alt="pokemon.name?.fr"
                class="w-32 h-32 object-contain mx-auto mb-2"
                @error="(e) => (e.target.style.display = 'none')"
              />
              <p class="text-center font-bold">{{ pokemon.name?.fr }}</p>
              <p class="text-center text-sm text-gray-400">
                N° {{ pokemon.pokedex_id }}
              </p>
            </div>

            <!-- Évolutions suivantes -->
            <template v-for="evo in getAllEvolutions()" :key="evo.pokedex_id">
              <div class="text-center flex-shrink-0">
                <div class="text-3xl mb-2">→</div>
                <p class="text-xs text-gray-400 max-w-[100px] break-words">
                  {{ evo.condition }}
                </p>
              </div>

              <button
                @click="goToEvolution(evo.pokedex_id)"
                :class="
                  pokemon.pokedex_id === evo.pokedex_id
                    ? 'bg-blue-900 border-4 border-blue-500'
                    : 'bg-gray-700 hover:bg-gray-600'
                "
                class="rounded-lg p-4 transition transform hover:scale-105"
              >
                <img
                  :src="`https://raw.githubusercontent.com/Yarkis01/TyraDex/images/sprites/${evo.pokedex_id}/regular.png`"
                  :alt="evo.name"
                  class="w-32 h-32 object-contain mx-auto mb-2"
                  @error="(e) => (e.target.style.display = 'none')"
                />
                <p class="text-center font-bold">{{ evo.name }}</p>
                <p class="text-center text-sm text-gray-400">
                  N° {{ evo.pokedex_id }}
                </p>
              </button>
            </template>
          </div>
        </div>

        <!-- CAS SPÉCIAL ZYGARDE : Formes + Méga dans une seule chaîne -->
        <div v-if="pokemon.pokedex_id === 718 && (getFormesAlternatives().length || getMegaEvolutions().length)" class="mt-6">
          <h3 class="text-xl font-semibold text-cyan-400 mb-4">
            🔷 Formes de Zygarde
          </h3>
          <div class="flex items-center gap-4 flex-wrap justify-center">
            <!-- 1. Cœur -->
            <template
              v-for="forme in getFormesAlternatives().filter(
                (f) => f.nom.includes('Cœur')
              )"
              :key="forme.nom"
            >
              <div
                class="bg-cyan-900 border-4 border-cyan-500 rounded-lg p-4"
              >
                <img
                  :src="forme.sprites?.regular"
                  :alt="forme.nom"
                  class="w-32 h-32 object-contain mx-auto mb-2"
                  @error="(e) => (e.target.style.display = 'none')"
                />
                <p class="text-center font-bold text-cyan-200">
                  {{ forme.nom }}
                </p>
              </div>
              <div class="text-center flex-shrink-0">
                <div class="text-3xl mb-2 text-cyan-400">🔷</div>
              </div>
            </template>

            <!-- 2. Forme 20% -->
            <template
              v-for="forme in getFormesAlternatives().filter(
                (f) => f.nom.includes('20%')
              )"
              :key="forme.nom"
            >
              <div
                class="bg-cyan-900 border-4 border-cyan-500 rounded-lg p-4"
              >
                <img
                  :src="forme.sprites?.regular"
                  :alt="forme.nom"
                  class="w-32 h-32 object-contain mx-auto mb-2"
                  @error="(e) => (e.target.style.display = 'none')"
                />
                <p class="text-center font-bold text-cyan-200">
                  {{ forme.nom }}
                </p>
              </div>
              <div class="text-center flex-shrink-0">
                <div class="text-3xl mb-2 text-cyan-400">🔷</div>
              </div>
            </template>

            <!-- 3. Forme de base (50%) -->
            <div class="bg-blue-900 border-4 border-blue-500 rounded-lg p-4">
              <img
                :src="pokemon.sprites?.regular"
                :alt="pokemon.name?.fr"
                class="w-32 h-32 object-contain mx-auto mb-2"
                @error="(e) => (e.target.style.display = 'none')"
              />
              <p class="text-center font-bold">{{ pokemon.name?.fr }}</p>
              <p class="text-center text-sm text-gray-400">
                N° {{ pokemon.pokedex_id }} (50%)
              </p>
            </div>

            <!-- 4. Forme 100% -->
            <template
              v-for="forme in getFormesAlternatives().filter(
                (f) => !f.nom.includes('Cœur') && !f.nom.includes('20%')
              )"
              :key="forme.nom"
            >
              <div class="text-center flex-shrink-0">
                <div class="text-3xl mb-2 text-cyan-400">🔷</div>
              </div>
              <div
                class="bg-cyan-900 border-4 border-cyan-500 rounded-lg p-4"
              >
                <img
                  :src="forme.sprites?.regular"
                  :alt="forme.nom"
                  class="w-32 h-32 object-contain mx-auto mb-2"
                  @error="(e) => (e.target.style.display = 'none')"
                />
                <p class="text-center font-bold text-cyan-200">
                  {{ forme.nom }}
                </p>
              </div>
            </template>

            <!-- 5. Méga-Zygarde (part de la forme 100%) -->
            <template v-for="mega in getMegaEvolutions()" :key="mega.orbe">
              <div class="text-center flex-shrink-0">
                <div class="text-3xl mb-2 text-purple-400">⚡</div>
                <p class="text-xs text-purple-300 max-w-[100px] break-words font-semibold">
                  {{ mega.orbe }}
                </p>
              </div>
              <div class="bg-purple-900 border-4 border-purple-500 rounded-lg p-4">
                <img
                  :src="mega.sprites?.regular"
                  :alt="`Méga-${pokemon.name?.fr}`"
                  class="w-32 h-32 object-contain mx-auto mb-2"
                  @error="(e) => (e.target.style.display = 'none')"
                />
                <p class="text-center font-bold text-purple-200">
                  Méga-{{ pokemon.name?.fr }}
                </p>
                <p class="text-center text-xs text-purple-300 mt-1">
                  {{ mega.orbe }}
                </p>
              </div>
            </template>
          </div>
          <p class="text-center text-sm text-yellow-400 mt-4 bg-yellow-900/30 rounded-lg p-3">
            💡 Note : La méga-évolution de Zygarde part de sa forme 100% (Parfaite), pas de sa forme de base
          </p>
        </div>

        <!-- CAS SPÉCIAL FLOETTE : Formes + Méga uniquement depuis Fleur Éternelle -->
        <div v-else-if="pokemon.pokedex_id === 670 && (getFormesAlternatives().length || getMegaEvolutions().length)" class="mt-6">
          <h3 class="text-xl font-semibold text-cyan-400 mb-4">
            🌸 Formes de Floette
          </h3>
          
          <!-- Floette de base -->
          <div class="flex justify-center mb-6">
            <div class="bg-blue-900 border-4 border-blue-500 rounded-lg p-4">
              <img
                :src="pokemon.sprites?.regular"
                :alt="pokemon.name?.fr"
                class="w-32 h-32 object-contain mx-auto mb-2"
                @error="(e) => (e.target.style.display = 'none')"
              />
              <p class="text-center font-bold">{{ pokemon.name?.fr }}</p>
              <p class="text-center text-sm text-gray-400">
                N° {{ pokemon.pokedex_id }}
              </p>
            </div>
          </div>

          <div class="text-center text-sm text-gray-400 mb-4">⬇️</div>

          <!-- Formes de fleurs normales (5 fleurs colorées) -->
          <div class="mb-6">
            <h4 class="text-center text-lg font-semibold text-cyan-300 mb-4">Formes de fleurs normales</h4>
            <div class="grid grid-cols-5 gap-3 max-w-4xl mx-auto">
              <div
                v-for="forme in getFormesAlternatives().filter(
                  (f) => !f.nom.includes('Éternelle')
                )"
                :key="forme.nom"
                class="bg-cyan-900/50 border-2 border-cyan-600 rounded-lg p-3"
              >
                <img
                  :src="forme.sprites?.regular"
                  :alt="forme.nom"
                  class="w-24 h-24 object-contain mx-auto mb-2"
                  @error="(e) => (e.target.style.display = 'none')"
                />
                <p class="text-center text-xs font-semibold text-cyan-200">
                  {{ forme.nom }}
                </p>
              </div>
            </div>
            <p class="text-center text-xs text-gray-400 mt-2 italic">Ces formes ne peuvent PAS méga-évoluer</p>
          </div>

          <div class="text-center text-sm text-gray-400 mb-4">⬇️</div>

          <!-- Fleur Éternelle (SEULE à pouvoir méga-évoluer) -->
          <div class="flex items-center gap-4 justify-center flex-wrap">
            <template
              v-for="forme in getFormesAlternatives().filter(
                (f) => f.nom.includes('Éternelle')
              )"
              :key="forme.nom"
            >
              <div
                class="bg-yellow-900 border-4 border-yellow-500 rounded-lg p-4 shadow-lg shadow-yellow-500/50"
              >
                <img
                  :src="forme.sprites?.regular"
                  :alt="forme.nom"
                  class="w-32 h-32 object-contain mx-auto mb-2"
                  @error="(e) => (e.target.style.display = 'none')"
                />
                <p class="text-center font-bold text-yellow-200 text-lg">
                  {{ forme.nom }}
                </p>
                <p class="text-center text-xs text-yellow-300 mt-1">
                  ⭐ Forme spéciale (AZ)
                </p>
              </div>

              <!-- Flèche vers méga -->
              <template v-if="getMegaEvolutions().length">
                <div class="text-center flex-shrink-0">
                  <div class="text-3xl mb-2 text-purple-400">⚡</div>
                  <p class="text-xs text-purple-300 font-semibold">
                    Floettite
                  </p>
                </div>

                <!-- Méga-Floette -->
                <div
                  v-for="mega in getMegaEvolutions()"
                  :key="mega.orbe"
                  class="bg-purple-900 border-4 border-purple-500 rounded-lg p-4"
                >
                  <img
                    :src="mega.sprites?.regular"
                    :alt="`Méga-${pokemon.name?.fr}`"
                    class="w-32 h-32 object-contain mx-auto mb-2"
                    @error="(e) => (e.target.style.display = 'none')"
                  />
                  <p class="text-center font-bold text-purple-200">
                    Méga-{{ pokemon.name?.fr }}
                  </p>
                  <p class="text-center text-xs text-purple-300 mt-1">
                    {{ mega.orbe }}
                  </p>
                </div>
              </template>
            </template>
          </div>

          <p class="text-center text-sm text-yellow-400 mt-6 bg-yellow-900/30 rounded-lg p-3 max-w-3xl mx-auto">
            💡 Note : SEULE la forme "Fleur Éternelle" (le Floette d'AZ) peut méga-évoluer. Les 5 autres formes de fleurs restent sous leur forme normale.
          </p>
        </div>

        <!-- Formes Alternatives (autres Pokémon) -->
        <div v-else-if="getFormesAlternatives().length" class="mt-6">
          <h3 class="text-xl font-semibold text-cyan-400 mb-4">
            🔷 Formes Alternatives
          </h3>
          <div class="flex items-center gap-4 flex-wrap justify-center">
            <!-- Formes "avant" le Pokémon de base -->
            <template
              v-for="forme in getFormesAlternatives().filter(
                (f) => f.nom.includes('Cœur')
              )"
              :key="forme.nom"
            >
              <div
                class="bg-cyan-900 border-4 border-cyan-500 rounded-lg p-4"
              >
                <img
                  :src="forme.sprites?.regular"
                  :alt="forme.nom"
                  class="w-32 h-32 object-contain mx-auto mb-2"
                  @error="(e) => (e.target.style.display = 'none')"
                />
                <p class="text-center font-bold text-cyan-200">
                  {{ forme.nom }}
                </p>
              </div>
              <div class="text-center flex-shrink-0">
                <div class="text-3xl mb-2 text-cyan-400">🔷</div>
              </div>
            </template>

            <!-- Forme 20% -->
            <template
              v-for="forme in getFormesAlternatives().filter(
                (f) => f.nom.includes('20%')
              )"
              :key="forme.nom"
            >
              <div
                class="bg-cyan-900 border-4 border-cyan-500 rounded-lg p-4"
              >
                <img
                  :src="forme.sprites?.regular"
                  :alt="forme.nom"
                  class="w-32 h-32 object-contain mx-auto mb-2"
                  @error="(e) => (e.target.style.display = 'none')"
                />
                <p class="text-center font-bold text-cyan-200">
                  {{ forme.nom }}
                </p>
              </div>
              <div class="text-center flex-shrink-0">
                <div class="text-3xl mb-2 text-cyan-400">🔷</div>
              </div>
            </template>

            <!-- Pokémon de base -->
            <div class="bg-blue-900 border-4 border-blue-500 rounded-lg p-4">
              <img
                :src="pokemon.sprites?.regular"
                :alt="pokemon.name?.fr"
                class="w-32 h-32 object-contain mx-auto mb-2"
                @error="(e) => (e.target.style.display = 'none')"
              />
              <p class="text-center font-bold">{{ pokemon.name?.fr }}</p>
              <p class="text-center text-sm text-gray-400">
                N° {{ pokemon.pokedex_id }}
              </p>
            </div>

            <!-- Formes "après" le Pokémon de base -->
            <template
              v-for="forme in getFormesAlternatives().filter(
                (f) => !f.nom.includes('Cœur') && !f.nom.includes('20%')
              )"
              :key="forme.nom"
            >
              <div class="text-center flex-shrink-0">
                <div class="text-3xl mb-2 text-cyan-400">🔷</div>
              </div>
              <div
                class="bg-cyan-900 border-4 border-cyan-500 rounded-lg p-4"
              >
                <img
                  :src="forme.sprites?.regular"
                  :alt="forme.nom"
                  class="w-32 h-32 object-contain mx-auto mb-2"
                  @error="(e) => (e.target.style.display = 'none')"
                />
                <p class="text-center font-bold text-cyan-200">
                  {{ forme.nom }}
                </p>
              </div>
            </template>
          </div>
        </div>

        <!-- Méga-Évolutions (autres Pokémon, sauf Zygarde et Floette) -->
        <div v-if="getMegaEvolutions().length && pokemon.pokedex_id !== 718 && pokemon.pokedex_id !== 670" class="mt-6">
          <h3 class="text-xl font-semibold text-purple-400 mb-4">
            ⭐ Méga-Évolutions
          </h3>
          <div class="flex items-center gap-4 flex-wrap justify-center">
            <!-- CAS STANDARD (Tous les Pokémon) -->
              <!-- Pokémon de base -->
              <div class="bg-blue-900 border-4 border-blue-500 rounded-lg p-4">
                <img
                  :src="pokemon.sprites?.regular"
                  :alt="pokemon.name?.fr"
                  class="w-32 h-32 object-contain mx-auto mb-2"
                  @error="(e) => (e.target.style.display = 'none')"
                />
                <p class="text-center font-bold">{{ pokemon.name?.fr }}</p>
                <p class="text-center text-sm text-gray-400">
                  N° {{ pokemon.pokedex_id }}
                </p>
              </div>

              <!-- Chaque méga-évolution -->
              <template v-for="mega in getMegaEvolutions()" :key="mega.orbe">
                <div class="text-center flex-shrink-0">
                  <div class="text-3xl mb-2 text-purple-400">⚡</div>
                  <p
                    class="text-xs text-purple-300 max-w-[100px] break-words font-semibold"
                  >
                    {{ mega.orbe }}
                  </p>
                </div>

                <div
                  class="bg-purple-900 border-4 border-purple-500 rounded-lg p-4"
                >
                  <img
                    :src="mega.sprites?.regular"
                    :alt="`Méga-${pokemon.name?.fr}`"
                    class="w-32 h-32 object-contain mx-auto mb-2"
                    @error="(e) => (e.target.style.display = 'none')"
                  />
                  <p class="text-center font-bold text-purple-200">
                    {{
                      mega.orbe.includes("Forme") || mega.orbe.includes("Cœur")
                        ? mega.orbe
                        : `Méga-${pokemon.name?.fr}`
                    }}
                  </p>
                  <p class="text-center text-xs text-purple-300 mt-1">
                    {{ mega.orbe }}
                  </p>
                </div>
              </template>
          </div>
        </div>
      </div>

      <!-- SECTION 4: Résistances -->
      <div
        v-if="pokemon.resistances?.length"
        class="bg-gray-800 rounded-xl p-6"
      >
        <h2 class="text-3xl font-bold mb-6">🛡️ Résistances & Faiblesses</h2>

        <div
          class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-3 mb-6"
        >
          <div
            v-for="resistance in pokemon.resistances"
            :key="resistance.name"
            :class="getResistanceClass(resistance.multiplier)"
            class="rounded-lg p-2 flex flex-col items-center justify-center gap-1 transition hover:scale-105"
          >
            <img
              :src="getTypeImage(resistance.name)"
              :alt="resistance.name"
              class="w-8 h-8 object-contain"
              @error="(e) => (e.target.style.display = 'none')"
            />
            <p class="font-bold text-xs">{{ resistance.name }}</p>
            <p class="text-xs font-bold">×{{ resistance.multiplier }}</p>
          </div>
        </div>

        <!-- Légende -->
        <div class="flex flex-wrap gap-4 text-sm border-t border-gray-700 pt-4">
          <div class="flex items-center gap-2">
            <div class="w-4 h-4 bg-red-800 rounded"></div>
            <span>Faible (×2+)</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-4 h-4 bg-green-800 rounded"></div>
            <span>Résistant (×0.5-)</span>
          </div>
          <div class="flex items-center gap-2">
            <div
              class="w-4 h-4 bg-gray-900 border border-gray-700 rounded"
            ></div>
            <span>Immunisé (×0)</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
