import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// Configuration de la connexion PostgreSQL
const connectionString = useRuntimeConfig().databaseUrl

// Si la connexion n'est pas configurée, on affiche un avertissement
if (!connectionString) {
  console.warn('⚠️ DATABASE_URL non configurée. La base de données ne sera pas accessible.')
}

// Créer la connexion
export const connection = connectionString 
  ? postgres(connectionString)
  : null

// Créer l'instance Drizzle
export const db = connection 
  ? drizzle(connection, { schema })
  : null

// Helper pour vérifier si la DB est connectée
export function ensureDbConnected() {
  if (!db) {
    throw createError({
      statusCode: 500,
      message: 'Base de données non configurée. Veuillez configurer DATABASE_URL dans .env'
    })
  }
  return db
}

