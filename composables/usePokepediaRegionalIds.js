export const usePokepediaRegionalIds = () => {
  // Cache en mémoire pour éviter les requêtes multiples
  const cache = useState('pokepedia-regional-ids-cache', () => ({}));

  /**
   * Récupère les numéros régionaux d'un Pokémon depuis Pokepedia
   * @param {string} pokemonName - Nom français du Pokémon
   * @returns {Promise<Object>} Objet avec les IDs régionaux
   */
  const fetchRegionalIds = async (pokemonName) => {
    // Vérifier le cache
    if (cache.value[pokemonName]) {
      return cache.value[pokemonName];
    }

    try {
      const url = `https://www.pokepedia.fr/api.php?action=parse&page=${encodeURIComponent(pokemonName)}&prop=wikitext&format=json&origin=*`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.error) {
        console.warn(`Pokémon ${pokemonName} non trouvé sur Pokepedia`);
        return null;
      }

      const wikitext = data.parse?.wikitext?.['*'] || '';
      const regionalIds = parseRegionalIds(wikitext, pokemonName);

      // Mettre en cache
      cache.value[pokemonName] = regionalIds;

      return regionalIds;
    } catch (error) {
      console.error(`Erreur lors de la récupération des données pour ${pokemonName}:`, error);
      return null;
    }
  };

  /**
   * Parse le wikitext pour extraire les numéros régionaux
   * @param {string} wikitext - Contenu de la page au format wikitext
   * @param {string} pokemonName - Nom du Pokémon
   * @returns {Object} Objet avec les IDs régionaux
   */
  const parseRegionalIds = (wikitext, pokemonName) => {
    const regionalIds = {};

    // Patterns pour détecter les numéros dans le wikitext
    const patterns = {
      kanto: /Kanto[^\d]*(\d{1,3})/i,
      johto: /Johto[^\d]*(\d{1,3})/i,
      hoenn: /Hoenn[^\d]*(\d{1,3})/i,
      sinnoh: /Sinnoh[^\d]*(\d{1,3})/i,
      unys: /Unys[^\d]*(\d{1,3})/i,
      kalos: /Kalos[^\d]*(?:Centre)?[^\d]*(\d{1,3})/i,
      alola: /Alola[^\d]*(?!Ultra)[^\d]*(\d{1,3})/i,
      'alola-ultra': /(?:Ultra-?Alola|Alola.*Ultra)[^\d]*(\d{1,3})/i,
      'lets-go': /Let'?s?\s*Go[^\d]*(\d{1,3})/i,
      galar: /Galar[^\d]*(\d{1,3})/i,
      hisui: /Hisui[^\d]*(\d{1,3})/i,
      paldea: /Paldea[^\d]*(\d{1,3})/i,
      'illumis-za': /(?:Illumis|Z-A)[^\d]*(\d{1,3})/i,
    };

    // Chercher les patterns dans le wikitext
    for (const [region, pattern] of Object.entries(patterns)) {
      const match = wikitext.match(pattern);
      if (match && match[1]) {
        regionalIds[region] = parseInt(match[1], 10);
      }
    }

    // Alternative : chercher dans un tableau de numéros (format courant sur Pokepedia)
    // Exemple: |numéro kanto=025
    const tablePatterns = {
      kanto: /\|\s*num[ée]ro\s*kanto\s*=\s*0*(\d{1,3})/i,
      johto: /\|\s*num[ée]ro\s*johto\s*=\s*0*(\d{1,3})/i,
      hoenn: /\|\s*num[ée]ro\s*hoenn\s*=\s*0*(\d{1,3})/i,
      sinnoh: /\|\s*num[ée]ro\s*sinnoh\s*=\s*0*(\d{1,3})/i,
      unys: /\|\s*num[ée]ro\s*unys\s*=\s*0*(\d{1,3})/i,
      kalos: /\|\s*num[ée]ro\s*kalos(?:\s*centre)?\s*=\s*0*(\d{1,3})/i,
      alola: /\|\s*num[ée]ro\s*alola\s*=\s*0*(\d{1,3})/i,
      'alola-ultra': /\|\s*num[ée]ro\s*(?:ultra[-\s]?)?alola\s*=\s*0*(\d{1,3})/i,
      galar: /\|\s*num[ée]ro\s*galar\s*=\s*0*(\d{1,3})/i,
      hisui: /\|\s*num[ée]ro\s*hisui\s*=\s*0*(\d{1,3})/i,
      paldea: /\|\s*num[ée]ro\s*paldea\s*=\s*0*(\d{1,3})/i,
    };

    for (const [region, pattern] of Object.entries(tablePatterns)) {
      const match = wikitext.match(pattern);
      if (match && match[1]) {
        regionalIds[region] = parseInt(match[1], 10);
      }
    }

    return regionalIds;
  };

  /**
   * Récupère les IDs régionaux avec fallback sur le fichier local
   * @param {number} nationalId - Numéro national du Pokémon
   * @param {string} pokemonName - Nom français du Pokémon
   * @returns {Promise<Object>} Objet avec les IDs régionaux
   */
  const getRegionalIds = async (nationalId, pokemonName) => {
    // D'abord essayer de récupérer depuis Pokepedia
    const pokepediaIds = await fetchRegionalIds(pokemonName);
    
    if (pokepediaIds && Object.keys(pokepediaIds).length > 0) {
      return pokepediaIds;
    }

    // Fallback sur le fichier local si disponible
    try {
      const localIds = await import('../data/pokedex-regional-ids.json');
      return localIds.default[nationalId] || {};
    } catch {
      return {};
    }
  };

  return {
    fetchRegionalIds,
    getRegionalIds,
  };
};

