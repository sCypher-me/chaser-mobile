import ExcelJS from 'exceljs'
import sharp from 'sharp'
import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { datasetSchema, type Composition, type ContentMode, type EquipmentPreset, type Guide, type Hero, type HeroBuild } from '../../src/schemas/data.ts'
import { aliasKey, baseName, slugify } from '../../src/lib/normalize.ts'

const root = process.cwd()
const sourceFile = path.join(root, 'GCDC Meta Spreadsheet.xlsx')
const dataDir = path.join(root, 'public', 'data')
const assetDir = path.join(root, 'public', 'assets', 'heroes')
const uiAssetDir = path.join(root, 'public', 'assets', 'game-ui')
const reportDir = path.join(root, 'reports')
const warnings: Array<{ code: string; message: string; sheet?: string; row?: number }> = []
const errors: Array<{ code: string; message: string }> = []
const attributes = new Set(['Retribution', 'Life', 'Balance', 'Cycle', 'Ruin'])
const classes = new Set(['Tank', 'Assault', 'Healer', 'Mage', 'Ranger'])

function value(cell: ExcelJS.Cell): string {
  const raw = cell.value as unknown
  if (raw == null) return ''
  if (raw instanceof Date) return raw.toISOString()
  if (typeof raw === 'object') {
    if ('formula' in raw) {
      if (!('result' in raw) || raw.result == null) return ''
      if (typeof raw.result === 'object') {
        const resultText = (raw.result as { text?: string }).text
        return resultText || ''
      }
      return String(raw.result)
    }
    if ('text' in raw) return String(raw.text)
    const rich = (raw as { richText?: Array<{ text: string }> }).richText
    if (rich) return rich.map((part) => part.text).join('')
  }
  return String(raw).trim()
}
function validText(text: string) { return text && text !== '#REF!' && text !== '#N/A' && text !== 'undefined' }
function unique(values: string[]) { return [...new Set(values.map((item) => item.trim()).filter(validText))] }
function source(sheet: string, row: number, cells: string[]) { return { sheet, row, cells } }
function hash(data: Buffer | string) { return createHash('sha256').update(data).digest('hex') }
function findHero(name: string, aliasMap: Map<string, Hero>): Hero | undefined { return aliasMap.get(aliasKey(name)) }

await Promise.all([mkdir(dataDir, { recursive: true }), mkdir(assetDir, { recursive: true }), mkdir(uiAssetDir, { recursive: true }), mkdir(reportDir, { recursive: true })])
if (!existsSync(sourceFile)) throw new Error(`Arquivo não encontrado: ${sourceFile}`)

const workbook = new ExcelJS.Workbook()
await workbook.xlsx.readFile(sourceFile, { ignoreNodes: ['dataValidations', 'conditionalFormatting', 'extLst'] })
const unitdata = workbook.getWorksheet('unitdata')
if (!unitdata) throw new Error('Aba mestre unitdata não encontrada')

const iconsSheet = workbook.getWorksheet('Icons')
if (iconsSheet) {
  const iconTargets = new Map([
    ['32:2', 'attributes/retribution.webp'], ['32:3', 'attributes/life.webp'], ['32:4', 'attributes/balance.webp'], ['32:5', 'attributes/cycle.webp'], ['32:6', 'attributes/ruin.webp'],
    ['37:2', 'classes/tank.webp'], ['37:3', 'classes/assault.webp'], ['37:4', 'classes/mage.webp'], ['37:5', 'classes/ranger.webp'], ['37:6', 'classes/healer.webp'],
    ['45:2', 'variants/base.webp'], ['45:3', 'variants/change.webp'], ['45:4', 'variants/special.webp']
  ])
  for (const item of iconsSheet.getImages()) {
    const col = Math.floor(item.range.tl.nativeCol) + 1
    const row = Math.floor(item.range.tl.nativeRow) + 1
    const relative = iconTargets.get(`${row}:${col}`)
    if (!relative) continue
    const image = workbook.getImage(Number(item.imageId))
    if (!image?.buffer) continue
    const output = path.join(uiAssetDir, relative)
    await mkdir(path.dirname(output), { recursive: true })
    await sharp(Buffer.isBuffer(image.buffer) ? image.buffer : Buffer.from(image.buffer)).resize(96, 96, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 92, alphaQuality: 100 }).toFile(output)
  }
}

const heroImages = new Map<number, string>()
for (const image of unitdata.getImages()) {
  const col = Math.floor(image.range.tl.nativeCol) + 1
  const row = Math.floor(image.range.tl.nativeRow) + 1
  if (col === 1 && row >= 2) heroImages.set(row, image.imageId)
}

const heroes: Hero[] = []
const assetHashes = new Map<string, string>()
let imagesExtracted = 0
let imagesDeduplicated = 0
for (let row = 2; row <= unitdata.rowCount; row++) {
  const displayName = value(unitdata.getCell(row, 27))
  const attribute = value(unitdata.getCell(row, 32))
  const heroClass = value(unitdata.getCell(row, 34))
  if (!validText(displayName) || !attributes.has(attribute) || !classes.has(heroClass)) continue
  const canonicalName = value(unitdata.getCell(row, 28)) || displayName
  const shortName = value(unitdata.getCell(row, 29)) || displayName
  const compactName = value(unitdata.getCell(row, 31))
  const variantRaw = value(unitdata.getCell(row, 35))
  const variantType = variantRaw === 'Base' || variantRaw === 'Change' || variantRaw === 'Special' ? variantRaw : 'Unknown'
  const slug = slugify(displayName)
  let icon: string | undefined
  const imageId = heroImages.get(row)
  if (imageId != null) {
    const image = workbook.getImage(Number(imageId))
    if (image?.buffer) {
      const buffer = Buffer.isBuffer(image.buffer) ? image.buffer : Buffer.from(image.buffer)
      const digest = hash(buffer)
      const existing = assetHashes.get(digest)
      if (existing) { icon = existing; imagesDeduplicated++ }
      else {
        const output = path.join(assetDir, `${slug}.webp`)
        await sharp(buffer).resize(160, 160, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 84, alphaQuality: 90 }).toFile(output)
        icon = `/assets/heroes/${slug}.webp`
        assetHashes.set(digest, icon)
        imagesExtracted++
      }
    }
  }
  const released = value(unitdata.getCell(row, 50))
  heroes.push({
    id: slug, slug, displayName, canonicalName, shortName, longName: canonicalName,
    aliases: unique([displayName, canonicalName, shortName, compactName, displayName.replace(/[()]/g, '')]),
    baseCharacterId: slugify(baseName(displayName)), variantType, attribute: attribute as Hero['attribute'], class: heroClass as Hero['class'],
    color: value(unitdata.getCell(row, 33)) || undefined, icon, releaseDate: /^\d{4}-/.test(released) ? released : undefined,
    source: source('unitdata', row, [`AA${row}`, `AB${row}`, `AC${row}`, `AF${row}`, `AH${row}`, `AI${row}`]),
    sourceExtra: { unitCode: value(unitdata.getCell(row, 36)), orderCode: value(unitdata.getCell(row, 37)), enabled: value(unitdata.getCell(row, 38)) }
  })
}

const aliasMap = new Map<string, Hero>()
for (const hero of heroes) for (const alias of hero.aliases) {
  const key = aliasKey(alias)
  const current = aliasMap.get(key)
  if (current && current.id !== hero.id) warnings.push({ code: 'AMBIGUOUS_ALIAS', message: `${alias}: ${current.displayName} / ${hero.displayName}`, sheet: 'unitdata' })
  else aliasMap.set(key, hero)
}

const builds: HeroBuild[] = []
const buildSheet = workbook.getWorksheet('Builds')
if (buildSheet) for (let row = 4; row <= buildSheet.rowCount; row += 2) {
  const display = value(buildSheet.getCell(row, 6)) || value(buildSheet.getCell(row, 3))
  const hero = findHero(display, aliasMap)
  if (!hero) { if (validText(display)) warnings.push({ code: 'UNKNOWN_BUILD_HERO', message: display, sheet: 'Builds', row }); continue }
  const traitPairs = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => {
    const col = from + i; return { name: value(buildSheet.getCell(row, col)), value: value(buildSheet.getCell(row + 1, col)) }
  }).filter((item) => validText(item.name) || validText(item.value)).map((item, index) => ({ name: validText(item.name) ? item.name : `Opção ${index + 1}`, value: item.value }))
  builds.push({
    id: `${hero.id}-${slugify(value(buildSheet.getCell(row, 9)) || 'geral')}-${row}`, heroId: hero.id,
    mode: value(buildSheet.getCell(row, 9)) || 'General', attribute: value(buildSheet.getCell(row, 7)) || hero.attribute,
    class: value(buildSheet.getCell(row, 8)) || hero.class, heroTraits: traitPairs(11, 15), chaserTraits: traitPairs(17, 22),
    ewRunes: unique([value(buildSheet.getCell(row, 24)), value(buildSheet.getCell(row, 25)), value(buildSheet.getCell(row + 1, 24)), value(buildSheet.getCell(row + 1, 25))]),
    rock: value(buildSheet.getCell(row, 26)) || value(buildSheet.getCell(row + 1, 26)) || undefined,
    accessory: value(buildSheet.getCell(row, 27)) || value(buildSheet.getCell(row + 1, 27)) || undefined,
    transcendence: unique(Array.from({ length: 9 }, (_, i) => value(buildSheet.getCell(row, 29 + i))).concat(Array.from({ length: 9 }, (_, i) => value(buildSheet.getCell(row + 1, 29 + i))))),
    source: source('Builds', row, [`F${row}`, `I${row}`, `K${row}:AK${row + 1}`])
  })
}

const contentSheets = ['PvP Meta','World Boss','World Boss (Season 2)','Final Core','Raids','Aernasis Hammer','Altar of Time','Sea of Eternity','Hells Furnace Retribution','Hells Furnace Balance','Hells Furnace Life','Berkas Lair','Guild Boss','PvE Comps wip']
const compositions: Composition[] = []
const contents: ContentMode[] = []
for (const sheetName of contentSheets) {
  const sheet = workbook.getWorksheet(sheetName); if (!sheet) continue
  const contentId = slugify(sheetName)
  let phase = ''
  for (let row = 1; row <= sheet.rowCount; row++) {
    const a = value(sheet.getCell(row, 1))
    if (/^(phase|stage|part|team|party|wave)\b/i.test(a)) phase = a
    const names = [1, 2, 3, 4].map((col) => value(sheet.getCell(row, col)))
    const matched = names.map((name) => findHero(name, aliasMap))
    if (matched.filter(Boolean).length < 3) continue
    const previous = [1,2,3,4].map((col) => value(sheet.getCell(row - 1, col))).filter((item) => attributes.has(item))
    const key = [5,6,7].map((col) => value(sheet.getCell(row, col))).find((item) => item.length > 35 && item.includes('_'))
    const notes = [8,9,10,11,12,13,14,15].map((col) => value(sheet.getCell(row, col))).find((item) => item.length > 15 && item !== key)
    const alternatives = unique(Array.from({ length: Math.max(0, sheet.columnCount - 6) }, (_, i) => value(sheet.getCell(row, 7 + i))).filter((name) => Boolean(findHero(name, aliasMap))))
    compositions.push({ id: `${contentId}-${row}`, contentId, phase: phase || undefined, title: `${sheetName}${phase ? ` · ${phase}` : ''}`, attribute: previous[0],
      heroIds: matched.filter((item): item is Hero => Boolean(item)).map((item) => item.id), heroNames: names.filter(validText), key, notes,
      alternatives, experimental: sheetName === 'PvE Comps wip', source: source(sheetName, row, [`A${row}:D${row}`, ...(key ? [`E${row}`] : [])]) })
  }
  contents.push({ id: contentId, slug: contentId, name: sheetName.replace('Hells', "Hell's"), category: sheetName.includes('Boss') ? 'Boss' : sheetName.includes('PvP') ? 'PvP' : 'Conteúdo',
    attribute: sheetName.match(/Retribution|Balance|Life/)?.[0], compositionIds: compositions.filter((comp) => comp.contentId === contentId).map((comp) => comp.id), source: source(sheetName, 1, ['A1']) })
}

const equipment: EquipmentPreset[] = []
const equipmentSheet = workbook.getWorksheet('Equipment')
if (equipmentSheet) for (let row = 1; row <= equipmentSheet.rowCount; row++) {
  const marker = value(equipmentSheet.getCell(row, 1))
  const heroNames = unique(Array.from({ length: equipmentSheet.columnCount - 5 }, (_, i) => value(equipmentSheet.getCell(row, 6 + i))).filter((name) => Boolean(findHero(name, aliasMap))))
  if (heroNames.length === 0 || !marker || marker === 'Characters') continue
  const id = `${slugify(marker)}-${row}`
  equipment.push({ id, name: marker, heroIds: heroNames.map((name) => findHero(name, aliasMap)!.id), heroNames, details: [], source: source('Equipment', row, [`A${row}`, `F${row}:X${row}`]) })
}

const guideSheets: Array<[string,string]> = [['Beginners Guide v5.3','Guia para Iniciantes'],['Assemble! + TG','Assembly e Titanic Growth'],['Support Party','Support Party'],['Soul Imprint','Soul Imprint'],['Equipment Presets','Presets de Equipamento']]
const guides: Guide[] = guideSheets.map(([sheetName, title]) => {
  const sheet = workbook.getWorksheet(sheetName)!
  const sections: Guide['sections'] = []
  const seen = new Set<string>()
  for (let row = 1; row <= sheet.rowCount; row++) {
    const texts = unique(Array.from({ length: sheet.columnCount }, (_, i) => value(sheet.getCell(row, i + 1))).filter((text) => text.length > 2))
    if (!texts.length) continue
    const body = texts.join(' · '); if (seen.has(body)) continue; seen.add(body)
    sections.push({ id: `${slugify(sheetName)}-${row}`, title: texts[0].slice(0, 90), body, source: source(sheetName, row, [`A${row}:${sheet.getColumn(sheet.columnCount).letter}${row}`]) })
  }
  return { id: slugify(sheetName), slug: slugify(sheetName), title, sections }
})

const changelog: Array<{ id: string; date?: string; changes: string; source: ReturnType<typeof source> }> = []
const changelogSheet = workbook.getWorksheet('Changelog')
if (changelogSheet) for (let row = 1; row <= changelogSheet.rowCount; row++) {
  const date = value(changelogSheet.getCell(row, 1)); const changes = value(changelogSheet.getCell(row, 2)) || (!/^\d{4}-/.test(date) ? date : '')
  if (changes.length > 2) changelog.push({ id: `change-${row}`, date: /^\d{4}-/.test(date) ? date : undefined, changes, source: source('Changelog', row, [`A${row}`, `B${row}`]) })
}
const resources: Array<{ id: string; title: string; url: string; source: ReturnType<typeof source> }> = []
for (const sheet of workbook.worksheets) sheet.eachRow((row, rowNumber) => row.eachCell((cell) => {
  if (!cell.hyperlink || !/^https?:\/\//i.test(cell.hyperlink)) return
  resources.push({ id: `resource-${resources.length + 1}`, title: value(cell) || new URL(cell.hyperlink).hostname, url: cell.hyperlink, source: source(sheet.name, rowNumber, [cell.address]) })
}))

const dataset = datasetSchema.parse({ heroes, builds, contents, compositions, equipment, guides, changelog, resources })
const files: Record<string, unknown> = { 'heroes.json': dataset.heroes, 'builds.json': dataset.builds, 'contents.json': dataset.contents, 'compositions.json': dataset.compositions,
  'equipment.json': dataset.equipment, 'guides.json': dataset.guides, 'changelog.json': dataset.changelog, 'resources.json': dataset.resources,
  'release-order.json': [...heroes].filter((hero) => hero.releaseDate).sort((a,b) => a.releaseDate!.localeCompare(b.releaseDate!)).map((hero, index) => ({ heroId: hero.id, order: index + 1, releaseDate: hero.releaseDate, source: hero.source })) }
const manifestFiles: Record<string, { checksum: string; bytes: number }> = {}
for (const [name, records] of Object.entries(files)) {
  const payload = JSON.stringify(records)
  await writeFile(path.join(dataDir, name), payload)
  manifestFiles[name] = { checksum: hash(payload), bytes: Buffer.byteLength(payload) }
}
const now = new Date()
const contentVersion = `${now.getUTCFullYear()}.${String(now.getUTCMonth()+1).padStart(2,'0')}.${String(now.getUTCDate()).padStart(2,'0')}.1`
const manifest = { schemaVersion: 1 as const, contentVersion, generatedAt: now.toISOString(), checksum: hash(JSON.stringify(manifestFiles)), files: manifestFiles }
await writeFile(path.join(dataDir, 'manifest.json'), JSON.stringify(manifest, null, 2))
const report = { generatedAt: now.toISOString(), source: path.basename(sourceFile), counts: { heroes: heroes.length, builds: builds.length, contents: contents.length, compositions: compositions.length, equipment: equipment.length, guides: guides.length, imagesExtracted, imagesDeduplicated }, warnings, errors }
await writeFile(path.join(reportDir, 'import-report.json'), JSON.stringify(report, null, 2))
await writeFile(path.join(reportDir, 'import-report.md'), `# Relatório de importação\n\nGerado em ${report.generatedAt}.\n\n| Item | Total |\n|---|---:|\n${Object.entries(report.counts).map(([key,total])=>`| ${key} | ${total} |`).join('\n')}\n\n## Avisos (${warnings.length})\n\n${warnings.map((warning)=>`- **${warning.code}** ${warning.sheet || ''}${warning.row ? `:${warning.row}` : ''} — ${warning.message}`).join('\n') || 'Nenhum.'}\n\n## Erros (${errors.length})\n\n${errors.map((error)=>`- **${error.code}** — ${error.message}`).join('\n') || 'Nenhum.'}\n`)
console.log(`Heroes: ${heroes.length}\nBuilds: ${builds.length}\nContents: ${contents.length}\nCompositions: ${compositions.length}\nImages extracted: ${imagesExtracted}\nImages deduplicated: ${imagesDeduplicated}\nWarnings: ${warnings.length}\nErrors: ${errors.length}`)
