import { readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { datasetSchema, manifestSchema } from '../../src/schemas/data.ts'

const root = process.cwd(); const dataDir = path.join(root, 'public', 'data')
const names = ['heroes','builds','contents','compositions','equipment','guides','changelog','resources'] as const
const loaded = Object.fromEntries(await Promise.all(names.map(async (name) => [name, JSON.parse(await readFile(path.join(dataDir, `${name}.json`), 'utf8'))])))
const data = datasetSchema.parse(loaded)
manifestSchema.parse(JSON.parse(await readFile(path.join(dataDir, 'manifest.json'), 'utf8')))
const errors: string[] = []; const warnings: string[] = []
const duplicate = (values: string[], label: string) => { const seen = new Set<string>(); for (const value of values) { if (seen.has(value)) errors.push(`${label} duplicado: ${value}`); else seen.add(value) } }
duplicate(data.heroes.map((item) => item.id), 'ID de herói'); duplicate(data.heroes.map((item) => item.slug), 'Slug de herói')
const heroes = new Set(data.heroes.map((item) => item.id)); const contents = new Set(data.contents.map((item) => item.id))
for (const build of data.builds) if (!heroes.has(build.heroId)) errors.push(`Build ${build.id}: herói ausente ${build.heroId}`)
for (const comp of data.compositions) { if (!contents.has(comp.contentId)) errors.push(`Composição ${comp.id}: conteúdo ausente`); if (comp.heroIds.length < 3) errors.push(`Composição ${comp.id}: menos de 3 heróis`); for (const id of comp.heroIds) if (!heroes.has(id)) errors.push(`Composição ${comp.id}: herói ausente ${id}`) }
for (const item of data.resources) try { new URL(item.url) } catch { warnings.push(`URL inválida: ${item.url}`) }
for (const hero of data.heroes) if (!hero.icon) warnings.push(`Sem ícone: ${hero.displayName}`)
await mkdir(path.join(root, 'reports'), { recursive: true })
await writeFile(path.join(root, 'reports', 'validation-report.json'), JSON.stringify({ errors, warnings }, null, 2))
console.log(`Data valid: ${errors.length === 0}\nHeroes: ${data.heroes.length}\nBuilds: ${data.builds.length}\nCompositions: ${data.compositions.length}\nWarnings: ${warnings.length}\nErrors: ${errors.length}`)
if (errors.length) process.exitCode = 1
