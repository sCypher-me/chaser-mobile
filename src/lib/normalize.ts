export function slugify(value: string): string {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\(\s*([st])\s*\)/g, '-$1').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export function aliasKey(value: string): string {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[()\s_-]+/g, '')
}

export function baseName(value: string): string {
  return value.replace(/\s*\(?[ST]\)?\s*$/i, '').trim()
}

export function matchesSearch(values: Array<string | undefined>, query: string): boolean {
  const key = aliasKey(query)
  return !key || values.some((value) => value && aliasKey(value).includes(key))
}
