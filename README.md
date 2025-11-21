# 🎮 Wingadex - Pokédex Interactif Nuxt 3

Pokédex complet avec système d'authentification et de progression personnel.

## ✨ Fonctionnalités

✅ **Actuelles (migrées) :**
- 🔍 Recherche avancée (ID, nom FR/EN/JP)
- 🎨 Filtres par type et génération
- 📊 Statistiques complètes
- 🌟 Toutes les formes (Shiny, Gigamax, Méga-évolutions, formes régionales)
- 🔄 Chaînes d'évolution complètes
- 📱 Interface moderne et responsive
- ⚡ Performance optimale (Nuxt 3)

⏳ **À venir (migration en cours) :**
- 🔐 Authentification (Google/Discord)
- 📈 Progression personnelle
- ✅ Marquer les Pokémon capturés
- 🏆 Statistiques de complétion
- 💬 Notes personnelles sur les Pokémon

## 🚀 Installation

### 1. Cloner et installer

```bash
cd Pokedex-Nuxt3
npm install
```

### 2. Configuration (optionnelle pour l'instant)

Le Pokédex fonctionne **sans configuration** pour consulter les Pokémon.

Pour activer les fonctionnalités d'authentification et de progression, voir [CONFIGURATION.md](./CONFIGURATION.md).

### 3. Lancer en développement

```bash
npm run dev
```

Ouvrez http://localhost:3000 🎉

## 📂 Structure du projet

```
Pokedex-Nuxt3/
├── pages/
│   └── index.vue              # Page principale
├── components/
│   ├── PokemonList.vue        # Liste avec filtres
│   └── PokemonDetails.vue     # Détails d'un Pokémon
├── server/
│   ├── api/
│   │   └── health.get.ts      # Health check
│   └── db/
│       ├── schema.ts          # Schéma PostgreSQL
│       └── index.ts           # Connexion DB
├── data/
│   └── mega-evolutions-za.json  # Données Pokémon Z-A
├── public/
│   └── images/megas/          # Images méga-évolutions
└── assets/
    └── css/main.css           # Styles globaux
```

## 🛠️ Technologies

- **Nuxt 3** - Framework Vue.js full-stack
- **Vue 3** - Framework frontend
- **Tailwind CSS** - Styles modernes
- **PostgreSQL** - Base de données (o2switch)
- **Drizzle ORM** - ORM TypeScript
- **NextAuth.js** - Authentification OAuth
- **Tyradex API** - Données Pokémon

## 📊 API disponibles

### Publiques (sans auth)

- `GET /api/health` - Health check

### Privées (après implémentation auth)

- `POST /api/pokemon/catch` - Capturer un Pokémon
- `GET /api/pokemon/my-collection` - Ma collection
- `GET /api/user/progress` - Ma progression

## 🔧 Scripts disponibles

```bash
npm run dev        # Serveur de développement
npm run build      # Build pour production
npm run preview    # Preview de la build

# Base de données (après config PostgreSQL)
npm run db:generate  # Générer migrations
npm run db:push      # Appliquer migrations
npm run db:studio    # Interface visuelle DB
```

## 📝 Différences avec Pokedexv2

| Aspect | Pokedexv2 (Vue + Vite) | Pokedex-Nuxt3 |
|--------|------------------------|---------------|
| **Framework** | Vue 3 + Vite | Nuxt 3 |
| **Backend** | ❌ Aucun | ✅ API routes |
| **Base de données** | ❌ Aucune | ✅ PostgreSQL |
| **Auth** | ❌ Non | ✅ OAuth (à venir) |
| **Auto-imports** | ❌ Non | ✅ Oui |
| **SSR** | ❌ Non | ✅ Oui |
| **Performance** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

## 🎯 Prochaines étapes

1. ✅ Migration du code Vue.js → **FAIT**
2. ✅ Configuration Nuxt + Tailwind → **FAIT**
3. ✅ Schéma PostgreSQL → **FAIT**
4. ⏳ Configurer PostgreSQL sur o2switch
5. ⏳ Implémenter OAuth (Google/Discord)
6. ⏳ Créer les API routes de capture
7. ⏳ Ajouter les composants d'authentification
8. ⏳ Déployer sur o2switch

## 📖 Documentation

- [Configuration complète](./CONFIGURATION.md)
- [Nuxt 3 Documentation](https://nuxt.com)
- [Drizzle ORM](https://orm.drizzle.team)
- [Tyradex API](https://tyradex.app/api/v1)

## 🤝 Support

Pour toute question sur la migration ou la configuration, consultez [CONFIGURATION.md](./CONFIGURATION.md).

---

**Powered by Nuxt 3 ⚡ | Données Tyradex 🎮**
