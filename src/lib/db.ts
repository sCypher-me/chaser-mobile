import Dexie, { type EntityTable } from 'dexie'
import type { Dataset } from '@/schemas/data'

export interface Preference { key: string; value: unknown }
export interface OwnedHero { heroId: string; owned: boolean; updatedAt: string }
export interface RecentItem { id?: number; type: 'hero' | 'content'; itemId: string; viewedAt: string }
export interface ContentCache { key: 'active'; version: string; data: Dataset; updatedAt: string }

export const db = new Dexie('gcdc-meta') as Dexie & {
  preferences: EntityTable<Preference, 'key'>
  ownedHeroes: EntityTable<OwnedHero, 'heroId'>
  recent: EntityTable<RecentItem, 'id'>
  contentCache: EntityTable<ContentCache, 'key'>
}
db.version(1).stores({ preferences: '&key', ownedHeroes: '&heroId, owned', recent: '++id, type, itemId, viewedAt' })
db.version(2).stores({ preferences: '&key', ownedHeroes: '&heroId, owned', recent: '++id, type, itemId, viewedAt', contentCache: '&key, version' })

export async function exportPersonalData() {
  return { preferences: await db.preferences.toArray(), ownedHeroes: await db.ownedHeroes.toArray(), exportedAt: new Date().toISOString() }
}
