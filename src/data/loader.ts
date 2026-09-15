import { datasetSchema, manifestSchema, type Dataset, type ImportManifest } from '@/schemas/data'
import { db } from '@/lib/db'

const empty: Dataset = { heroes: [], builds: [], contents: [], compositions: [], equipment: [], guides: [], changelog: [], resources: [] }
export interface LoadedContent { data: Dataset; manifest: ImportManifest | null; translations: Record<string,string> }
let promise: Promise<LoadedContent> | null = null

async function json<T>(base: string, file: string): Promise<T> {
  const response = await fetch(`${base}/${file}`, { cache: 'no-cache' })
  if (!response.ok) throw new Error(`Falha ao carregar ${file}`)
  return response.json() as Promise<T>
}

export function loadDataset() {
  if (promise) return promise
  promise = (async () => {
    const base = import.meta.env.VITE_CONTENT_BASE_URL || `${import.meta.env.BASE_URL}data`
    try {
      const manifest = manifestSchema.parse(await json(base, 'manifest.json'))
      const [heroes, builds, contents, compositions, equipment, guides, changelog, resources] = await Promise.all(
        ['heroes.json','builds.json','contents.json','compositions.json','equipment.json','guides.json','changelog.json','resources.json'].map((file) => json<unknown>(base, file))
      )
      const data = datasetSchema.parse({ heroes, builds, contents, compositions, equipment, guides, changelog, resources })
      await db.contentCache.put({ key: 'active', version: manifest.contentVersion, data, updatedAt: new Date().toISOString() })
      const translations = await json<Record<string,string>>(base, 'pt-BR.json').catch(() => ({}))
      return { data, manifest, translations }
    } catch (error) {
      console.error(error)
      const cached = await db.contentCache.get('active')
      if (cached) return { data: datasetSchema.parse(cached.data), manifest: null, translations: {} }
      return { data: empty, manifest: null, translations: {} }
    }
  })()
  return promise
}
