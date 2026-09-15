import { z } from 'zod'

export const sourceSchema = z.object({ sheet: z.string(), row: z.number().int(), cells: z.array(z.string()).default([]) })
export const attributeSchema = z.enum(['Retribution', 'Life', 'Balance', 'Cycle', 'Ruin'])
export const classSchema = z.enum(['Tank', 'Assault', 'Healer', 'Mage', 'Ranger'])
export const heroSchema = z.object({
  id: z.string(), slug: z.string(), displayName: z.string(), canonicalName: z.string(),
  shortName: z.string(), longName: z.string().optional(), aliases: z.array(z.string()),
  baseCharacterId: z.string(), variantType: z.enum(['Base', 'Change', 'Special', 'Unknown']),
  attribute: attributeSchema, class: classSchema, color: z.string().optional(), icon: z.string().optional(),
  releaseDate: z.string().optional(), source: sourceSchema, sourceExtra: z.record(z.string(), z.unknown()).optional()
})
export const buildSchema = z.object({
  id: z.string(), heroId: z.string(), mode: z.string(), attribute: z.string(), class: z.string(),
  heroTraits: z.array(z.object({ name: z.string(), value: z.string() })),
  chaserTraits: z.array(z.object({ name: z.string(), value: z.string() })),
  ewRunes: z.array(z.string()), rock: z.string().optional(), accessory: z.string().optional(),
  transcendence: z.array(z.string()), source: sourceSchema
})
export const compositionSchema = z.object({
  id: z.string(), contentId: z.string(), phase: z.string().optional(), title: z.string(),
  attribute: z.string().optional(), heroIds: z.array(z.string()), heroNames: z.array(z.string()),
  key: z.string().optional(), notes: z.string().optional(), alternatives: z.array(z.string()).default([]),
  experimental: z.boolean().optional(), source: sourceSchema
})
export const contentSchema = z.object({
  id: z.string(), slug: z.string(), name: z.string(), category: z.string(), attribute: z.string().optional(),
  description: z.string().optional(), compositionIds: z.array(z.string()), source: sourceSchema
})
export const guideSchema = z.object({ id: z.string(), slug: z.string(), title: z.string(), sections: z.array(z.object({ id: z.string(), title: z.string(), body: z.string(), source: sourceSchema })) })
export const changelogSchema = z.object({ id: z.string(), date: z.string().optional(), changes: z.string(), source: sourceSchema })
export const resourceSchema = z.object({ id: z.string(), title: z.string(), url: z.string().url(), source: sourceSchema })
export const equipmentSchema = z.object({ id: z.string(), name: z.string(), heroIds: z.array(z.string()), heroNames: z.array(z.string()), details: z.array(z.string()), source: sourceSchema })
export const datasetSchema = z.object({
  heroes: z.array(heroSchema), builds: z.array(buildSchema), contents: z.array(contentSchema), compositions: z.array(compositionSchema),
  equipment: z.array(equipmentSchema), guides: z.array(guideSchema), changelog: z.array(changelogSchema), resources: z.array(resourceSchema)
})
export const manifestSchema = z.object({ schemaVersion: z.literal(1), contentVersion: z.string(), generatedAt: z.string().datetime(), checksum: z.string(), files: z.record(z.string(), z.object({ checksum: z.string(), bytes: z.number() })) })

export type Hero = z.infer<typeof heroSchema>
export type HeroBuild = z.infer<typeof buildSchema>
export type Composition = z.infer<typeof compositionSchema>
export type ContentMode = z.infer<typeof contentSchema>
export type Guide = z.infer<typeof guideSchema>
export type EquipmentPreset = z.infer<typeof equipmentSchema>
export type Dataset = z.infer<typeof datasetSchema>
export type ImportManifest = z.infer<typeof manifestSchema>
