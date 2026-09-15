import { describe, expect, it } from 'vitest'
import { heroSchema, manifestSchema } from '@/schemas/data'

describe('schemas de dados', () => {
  it('aceita herói válido e rejeita atributo inventado', () => {
    const base = { id:'arme-t',slug:'arme-t',displayName:'Arme (T)',canonicalName:'Arme (T)',shortName:'Arme T',aliases:['Arme T'],baseCharacterId:'arme',variantType:'Change',attribute:'Ruin',class:'Healer',source:{sheet:'unitdata',row:8,cells:['AA8']} }
    expect(heroSchema.safeParse(base).success).toBe(true)
    expect(heroSchema.safeParse({...base,attribute:'Spirit'}).success).toBe(false)
  })
  it('valida manifest versionado', () => {
    expect(manifestSchema.safeParse({schemaVersion:1,contentVersion:'2026.09.13.1',generatedAt:new Date().toISOString(),checksum:'x',files:{}}).success).toBe(true)
  })
})
