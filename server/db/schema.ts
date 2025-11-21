import { pgTable, serial, text, integer, boolean, timestamp, unique } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

/**
 * Table des utilisateurs
 */
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  provider: text('provider'), // 'google', 'discord', etc.
  providerId: text('provider_id'),
  avatar: text('avatar'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

/**
 * Table des Pokémon capturés par les utilisateurs
 */
export const userPokemons = pgTable('user_pokemons', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  pokemonId: integer('pokemon_id').notNull(), // ID Pokédex National
  isShiny: boolean('is_shiny').default(false).notNull(),
  isCaught: boolean('is_caught').default(true).notNull(),
  formName: text('form_name'), // Ex: "Galar", "Hisui", "Mega X", etc.
  notes: text('notes'), // Notes personnelles
  caughtAt: timestamp('caught_at').defaultNow().notNull()
}, (table) => {
  return {
    // Un utilisateur ne peut pas capturer 2x le même Pokémon (même forme)
    unq: unique().on(table.userId, table.pokemonId, table.formName)
  }
})

/**
 * Table de progression globale de l'utilisateur
 */
export const userProgress = pgTable('user_progress', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  totalCaught: integer('total_caught').default(0).notNull(),
  totalShiny: integer('total_shiny').default(0).notNull(),
  completionPercentage: integer('completion_percentage').default(0).notNull(),
  favoriteType: text('favorite_type'), // Type le plus capturé
  lastCaughtPokemonId: integer('last_caught_pokemon_id'),
  lastUpdated: timestamp('last_updated').defaultNow().notNull()
})

/**
 * Relations entre les tables
 */
export const usersRelations = relations(users, ({ many, one }) => ({
  pokemons: many(userPokemons),
  progress: one(userProgress, {
    fields: [users.id],
    references: [userProgress.userId]
  })
}))

export const userPokemonsRelations = relations(userPokemons, ({ one }) => ({
  user: one(users, {
    fields: [userPokemons.userId],
    references: [users.id]
  })
}))

export const userProgressRelations = relations(userProgress, ({ one }) => ({
  user: one(users, {
    fields: [userProgress.userId],
    references: [users.id]
  })
}))

// Types TypeScript générés automatiquement
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

export type UserPokemon = typeof userPokemons.$inferSelect
export type NewUserPokemon = typeof userPokemons.$inferInsert

export type UserProgress = typeof userProgress.$inferSelect
export type NewUserProgress = typeof userProgress.$inferInsert

