import { describe, expect, it } from 'vitest'
import { aliasKey, baseName, matchesSearch, slugify } from '@/lib/normalize'

describe('normalização de heróis', () => {
  it('unifica notações equivalentes de variante', () => {
    expect(aliasKey('Arme (T)')).toBe(aliasKey('Arme T'))
    expect(aliasKey('Arme(T)')).toBe(aliasKey('Arme T'))
  })
  it('preserva variante no slug e encontra aliases', () => {
    expect(slugify('Arme (S)')).toBe('arme-s')
    expect(baseName('Arme (S)')).toBe('Arme')
    expect(matchesSearch(['Arme (T)', 'Arme T'], 'armet')).toBe(true)
  })
})
