const publicBase = import.meta.env.BASE_URL
export function publicAsset(path: string): string {
  if (/^(?:https?:)?\/\//.test(path)) return path
  return `${publicBase}${path.replace(/^\//, '')}`
}

const labels: Record<string, string> = {
  Retribution: 'Retribuição', Life: 'Vida', Balance: 'Equilíbrio', Cycle: 'Ciclo', Ruin: 'Ruína',
  Tank: 'Defensor', Assault: 'Guerreiro', Mage: 'Mago', Ranger: 'Atirador', Healer: 'Curandeiro',
  Base: 'Base', Change: 'Alteração T', Special: 'Especial S', Unknown: 'Desconhecida',
  PVE: 'PvE', PVP: 'PvP', 'PVE/PVP': 'PvE / PvP', Helper: 'Suporte', Guardian: 'Guardião', Executioner: 'Executor',
  'Guild Boss': 'Chefe de Guilda', 'World Boss': 'Chefe Mundial', WB: 'Chefe Mundial', AoT: 'Altar do Tempo',
  'With Io': 'Com Io', 'With Eur T': 'Com Europa T', 'Below T6': 'Abaixo do T6', 'Void/Berkas': 'Vazio / Berkas', Void: 'Vazio',
  'PvP Meta': 'Meta PvP', 'PvE Comps wip': 'Composições PvE — experimental', 'World Boss (Season 2)': 'Chefe Mundial — Temporada 2',
  'Final Core': 'Núcleo Final', Raids: 'Incursões', 'Aernasis Hammer': 'Martelo de Aernasis', 'Altar of Time': 'Altar do Tempo',
  'Sea of Eternity': 'Mar da Eternidade', 'Hells Furnace Retribution': 'Fornalha do Inferno — Retribuição',
  'Hells Furnace Balance': 'Fornalha do Inferno — Equilíbrio', 'Hells Furnace Life': 'Fornalha do Inferno — Vida',
  'Berkas Lair': 'Covil de Berkas', Boss: 'Chefe', Content: 'Conteúdo', Phase: 'Fase', 'Off-Meta Units': 'Unidades fora do meta',
  "Hell's Furnace": 'Fornalha do Inferno', Changelog: 'Histórico de alterações', Descent: 'Descensão', Icon: 'Ícone',
  "[Hell's Furnace - Balance] updated": '[Fornalha do Inferno — Equilíbrio] atualizada',
  "Lire's Descent Icon added": 'Ícone da Descensão de Lire adicionado', '[PvE Meta] remix': 'Ajustes no meta PvE',
  updated: 'atualizado', added: 'adicionado',
  'Assembly e Titanic Growth': 'Assembleia e Crescimento Titânico', 'Support Party': 'Equipe de Suporte',
  'Soul Imprint': 'Impressão da Alma',
  'Gaze of Focus [CRIT]': 'Olhar do Foco [CRÍT.]', 'Gaze of Focus [CDR] General DPS Set': 'Olhar do Foco [RDT] — conjunto geral de DPS',
  'Power of Doom': 'Poder da Perdição', Sustain: 'Sustentação'
}

export const classIcons: Record<string, string> = { Tank:publicAsset('/assets/game-ui/classes/tank.webp'), Assault:publicAsset('/assets/game-ui/classes/assault.webp'), Mage:publicAsset('/assets/game-ui/classes/mage.webp'), Ranger:publicAsset('/assets/game-ui/classes/ranger.webp'), Healer:publicAsset('/assets/game-ui/classes/healer.webp') }
export const attributeIcons: Record<string, string> = { Retribution:publicAsset('/assets/game-ui/attributes/retribution.webp'), Life:publicAsset('/assets/game-ui/attributes/life.webp'), Balance:publicAsset('/assets/game-ui/attributes/balance.webp'), Cycle:publicAsset('/assets/game-ui/attributes/cycle.webp'), Ruin:publicAsset('/assets/game-ui/attributes/ruin.webp') }
export const variantIcons: Record<string, string> = { Base:publicAsset('/assets/game-ui/variants/base.webp'), Change:publicAsset('/assets/game-ui/variants/change.webp'), Special:publicAsset('/assets/game-ui/variants/special.webp') }

export function gameLabel(value: string | undefined): string {
  if (!value) return ''
  if (labels[value]) return labels[value]
  let translated = value.replace(/^Phase\s+(\d+)/i, 'Fase $1')
  for (const [source,target] of Object.entries(labels).sort(([a],[b])=>b.length-a.length)) {
    const escaped = source.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')
    translated = translated.replace(new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`,'gu'),target)
  }
  return translated
}
export function translateText(value: string | undefined, translations: Record<string,string> = {}): string { return value ? gameLabel(translations[value] || value) : '' }
