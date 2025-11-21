# Configuration Wingadex (Nuxt 3)

## 📋 Variables d'environnement

Créez un fichier `.env` à la racine du projet avec les variables suivantes :

```env
# Base de données PostgreSQL (o2switch)
DATABASE_URL=postgresql://username:password@votre-serveur.o2switch.net:5432/nom_base

# Auth Secret (générez un secret aléatoire)
NUXT_AUTH_SECRET=votre-secret-super-securise-changez-moi

# Google OAuth (https://console.cloud.google.com/)
GOOGLE_CLIENT_ID=votre-google-client-id
GOOGLE_CLIENT_SECRET=votre-google-client-secret

# Discord OAuth (https://discord.com/developers/applications)
DISCORD_CLIENT_ID=votre-discord-client-id
DISCORD_CLIENT_SECRET=votre-discord-client-secret

# URL du site
NUXT_PUBLIC_SITE_URL=http://localhost:3000
```

## 🗄️ Configuration PostgreSQL (o2switch)

### 1. Créer la base de données

Via cPanel > PostgreSQL :
1. Créez une nouvelle base : `wingadex_db`
2. Créez un utilisateur : `wingadex_user`
3. Assignez les privilèges complets

### 2. Obtenir l'URL de connexion

```
postgresql://wingadex_user:MOT_DE_PASSE@sql.votre-domaine.o2switch.net:5432/wingadex_db
```

### 3. Générer les migrations

```bash
npm run db:generate
```

### 4. Appliquer les migrations

```bash
npm run db:push
```

## 🔐 Configuration OAuth

### Google

1. Allez sur https://console.cloud.google.com/
2. Créez un nouveau projet "Wingadex"
3. Activez l'API "Google+ API"
4. Créez des identifiants OAuth 2.0
5. Ajoutez les URLs autorisées :
   - `http://localhost:3000` (dev)
   - `https://votre-domaine.com` (prod)
6. Ajoutez les URLs de redirection :
   - `http://localhost:3000/api/auth/callback/google`
   - `https://votre-domaine.com/api/auth/callback/google`

### Discord

1. Allez sur https://discord.com/developers/applications
2. Créez une nouvelle application "Wingadex"
3. Dans OAuth2, ajoutez les redirects :
   - `http://localhost:3000/api/auth/callback/discord`
   - `https://votre-domaine.com/api/auth/callback/discord`
4. Copiez CLIENT_ID et CLIENT_SECRET

## 🚀 Démarrage

```bash
# Installer les dépendances
npm install

# Développement
npm run dev

# Production
npm run build
npm run preview
```

## 📦 Scripts disponibles

```json
"dev": "nuxt dev",              // Serveur de dev
"build": "nuxt build",           // Build production
"generate": "nuxt generate",     // Génération statique (SSG)
"preview": "nuxt preview",       // Preview de production
"db:generate": "drizzle-kit generate",  // Générer migrations
"db:push": "drizzle-kit push",          // Appliquer migrations
"db:studio": "drizzle-kit studio"       // Interface DB visuelle
```

## 🎯 Prochaines étapes

1. ✅ Configuration PostgreSQL
2. ✅ Créer les tables via migrations
3. ⏳ Configurer OAuth (Google/Discord)
4. ⏳ Implémenter les API routes (capture Pokémon)
5. ⏳ Ajouter les composants d'authentification
6. ⏳ Déployer sur o2switch

