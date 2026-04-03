<script setup>
import { tyraDexFetch, typeEntryLabelFr } from '~/utils/tyradex'

const types = ref([])
const isLoading = ref(true)
const loadError = ref(null)
const selected = ref(null)

const spriteUrl = (entry) => {
  const s = entry?.sprites
  if (typeof s === 'string') return s
  if (Array.isArray(s) && s.length) return s[0]
  return ''
}

const pokemonCount = (entry) => {
  const list = entry?.pokemons
  return Array.isArray(list) ? list.length : 0
}

const multiplierClass = (m) => {
  if (m <= 0) return 'text-emerald-400'
  if (m < 1) return 'text-green-400'
  if (m === 1) return 'text-gray-300'
  if (m === 2) return 'text-orange-400'
  if (m === 4) return 'text-red-400'
  return 'text-red-300'
}

onMounted(async () => {
  try {
    isLoading.value = true
    loadError.value = null
    const data = await tyraDexFetch('/types')
    const arr = Array.isArray(data)
      ? data
      : Array.isArray(data?.types)
        ? data.types
        : []
    types.value = arr
    if (types.value.length && !selected.value) {
      selected.value = types.value[0]
    }
  } catch (e) {
    console.error(e)
    loadError.value = 'Impossible de charger la liste des types (Tyradex).'
  } finally {
    isLoading.value = false
  }
})

const selectType = (entry) => {
  selected.value = entry
}
</script>

<template>
  <div class="type-dex-tab">
    <div class="mb-6">
      <h2 class="text-2xl font-bold mb-1">Types &amp; faiblesses</h2>
      <p class="text-gray-400 text-sm">
        Données
        <a
          href="https://tyradex.app/docs/types/liste"
          class="text-blue-400 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
          >Tyradex</a
        >
        — multiplicateurs de dégâts subis par type (ou combinaison double-type).
      </p>
    </div>

    <div
      v-if="isLoading"
      class="flex flex-col items-center justify-center py-20 text-gray-400"
    >
      <div
        class="animate-spin rounded-full h-14 w-14 border-4 border-violet-500 border-t-transparent mb-4"
      />
      Chargement des types…
    </div>

    <div
      v-else-if="loadError"
      class="bg-red-900/40 border border-red-700 rounded-lg p-4 text-red-200"
    >
      {{ loadError }}
    </div>

    <div v-else class="flex flex-col lg:flex-row gap-6">
      <!-- Grille des types -->
      <div
        class="lg:w-[min(100%,28rem)] flex flex-wrap gap-2 content-start max-h-[70vh] overflow-y-auto pr-1"
      >
        <button
          v-for="(entry, idx) in types"
          :key="idx"
          type="button"
          @click="selectType(entry)"
          :class="[
            'flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium transition border',
            selected === entry
              ? 'bg-violet-700 border-violet-400 ring-2 ring-violet-400/60'
              : 'bg-gray-800 border-gray-700 hover:bg-gray-700 hover:border-gray-600',
          ]"
        >
          <img
            v-if="spriteUrl(entry)"
            :src="spriteUrl(entry)"
            alt=""
            class="w-5 h-5 object-contain"
            loading="lazy"
          />
          <span class="truncate max-w-[10rem]">{{ typeEntryLabelFr(entry) }}</span>
          <span class="text-gray-500">({{ pokemonCount(entry) }})</span>
        </button>
      </div>

      <!-- Détail faiblesses -->
      <div
        v-if="selected"
        class="flex-1 bg-gray-800/80 rounded-xl border border-gray-700 p-5 min-h-[320px]"
      >
        <div class="flex flex-wrap items-center gap-3 mb-4">
          <img
            v-if="spriteUrl(selected)"
            :src="spriteUrl(selected)"
            alt=""
            class="w-12 h-12 object-contain"
          />
          <div>
            <h3 class="text-xl font-bold">{{ typeEntryLabelFr(selected) }}</h3>
            <p class="text-gray-400 text-sm">
              {{ pokemonCount(selected) }} Pokémon dans cette catégorie (Tyradex)
            </p>
          </div>
        </div>

        <h4 class="text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wide">
          Résistances / faiblesses (dégâts subis)
        </h4>
        <div
          class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-[50vh] overflow-y-auto"
        >
          <div
            v-for="row in selected.resistances || []"
            :key="row.name"
            class="bg-gray-900/80 rounded-lg px-3 py-2 flex justify-between items-center gap-2 text-sm"
          >
            <span class="truncate">{{ row.name }}</span>
            <span
              class="font-mono font-bold shrink-0"
              :class="multiplierClass(row.multiplier)"
            >
              ×{{ row.multiplier }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
