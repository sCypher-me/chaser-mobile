import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const dataDir = path.join(root, 'public', 'data')
const guides = JSON.parse(await readFile(path.join(dataDir, 'guides.json'), 'utf8')) as Array<{sections:Array<{title:string;body:string}>}>
const changelog = JSON.parse(await readFile(path.join(dataDir, 'changelog.json'), 'utf8')) as Array<{changes:string}>
const compositions = JSON.parse(await readFile(path.join(dataDir, 'compositions.json'), 'utf8')) as Array<{notes?:string}>
const equipment = JSON.parse(await readFile(path.join(dataDir, 'equipment.json'), 'utf8')) as Array<{name:string}>

const candidates = new Set<string>()
for (const guide of guides) for (const section of guide.sections) { candidates.add(section.title); candidates.add(section.body) }
for (const item of changelog) candidates.add(item.changes)
for (const item of compositions) if (item.notes) candidates.add(item.notes)
for (const item of equipment) candidates.add(item.name)

const properOnly = /^[\p{L}\d ()+&'./:[\]-]{1,35}$/u
const englishSignal = /\b(the|and|or|to|for|with|without|this|that|your|from|is|are|was|were|will|updated|added|removed|changed|new|guide|party|damage|skill|attack|enemy|hero|characters|default|works|check|choose|recommended|equipment|set|support|beginner|phase|season|general|power|focus|gaze|sustain|below|higher|only|most|when|build)\b/i
const sourceTexts = [...candidates].filter((text) => text.length > 2 && (englishSignal.test(text) || (!properOnly.test(text) && /[a-z]{4}/i.test(text))))
const existingPath = path.join(dataDir, 'pt-BR.json')
const translated: Record<string,string> = {}

const manual: Record<string,string> = {
  "Default Ruin PvP meta. Most people run this. Auto friendly. Low investment. Wins most games. Stalled only by higher Relics. BP is not applicable.": 'Composição padrão do meta PvP de Ruína. É a escolha mais usada, funciona bem no automático, exige pouco investimento e vence a maioria das partidas. Só costuma ser travada por Relíquias mais altas. O PB não se aplica.',
  'For higher relic defenses that can stall you for whatever reason. Not sure how needed this is personally but it does work better if you can tank without Asin (T)': 'Para defesas com Relíquias mais altas que conseguem segurar sua equipe. A necessidade varia, mas funciona melhor quando você consegue resistir sem Asin (T).',
  "Only works against all Cycle comps. Asin (T), Zero, &/or Ryan will stall Nelia, even with Dio present. Cannot fight Ayla (who's usually open anyways) Cope with me & use Nelia!": 'Funciona apenas contra composições totalmente de Ciclo. Asin (T), Zero e/ou Ryan conseguem segurar Nelia, mesmo com Dio presente. Não funciona contra Ayla, que normalmente fica disponível. Ainda assim, use Nelia!',
  'Default Cycle PvP meta. Not auto friendly but higher ranking PvP players choice for attack.': 'Composição padrão do meta PvP de Ciclo. Não funciona tão bem no automático, mas é a escolha ofensiva de jogadores das classificações mais altas.',
  'If you know for certain Asin (T) & Ayla are not present, this is easliy a win. Ayla should be Descent 10 & Ryan needs at least D0': 'Se você tiver certeza de que Asin (T) e Ayla não estão presentes, esta composição vence com facilidade. Ayla deve estar no Despertar 10 e Ryan precisa de pelo menos D0.',
  "Deia literally cannot die within the first 20~ seconds in a PvP setting. Auto friendly and doesn't require Descent, unlike Ayla": 'Deia praticamente não pode morrer durante os primeiros 20 segundos no PvP. Funciona bem no automático e, ao contrário de Ayla, não exige Despertar.'
}
Object.assign(translated, manual)

const pending = sourceTexts.filter((text) => !translated[text])
const phrases: Array<[RegExp,string]> = [
  [/Tutorials, Info Dumping, & Things To Consider Before You Start/gi,'Tutoriais, informações e pontos a considerar antes de começar'],
  [/Go to the yellow to actually start/gi,'Vá para a área amarela para começar de verdade'],
  [/Classes & Attributes \(Elements\?\)/gi,'Classes e atributos (elementos?)'],
  [/Every unit, exclusive weapon they use, & their corresponding pet is free! There are no banners for obtaining anything!/gi,'Cada unidade, sua arma exclusiva e o pet correspondente são gratuitos! Não existem banners para obter esses itens!'],
  [/Equipment sets also don't need to be grinded out for specific sub-stas or anything\. So building a unit is very much easy\./gi,'Os conjuntos de equipamento também não exigem farm de subatributos específicos. Por isso, montar uma unidade é bem simples.'],
  [/Sustain \+ DMG Reductions/gi,'Sustentação + redução de dano'], [/Shields \+ Shields/gi,'Escudos e mais escudos'], [/Keeps your party alive/gi,'Mantém sua equipe viva'],
  [/\(De\)buffers/gi,'Aplica bônus e penalidades'], [/Increase DPS's DMG/gi,'Amplifica o dano do DPS'], [/Little DMG Reduction/gi,'Pequena redução de dano'], [/Are Not DPS/gi,'Não atua como DPS'],
  [/Offers Healing/gi,'Oferece cura'], [/SP Party Resources/gi,'Gera recursos de SP para a equipe'], [/HP Recovery \+ Sustain/gi,'Recuperação de PV + sustentação'],
  [/Magical DPS/gi,'DPS mágico'], [/Physical DPS/gi,'DPS físico'], [/Only job is to kill things/gi,'Sua função é causar dano e derrotar inimigos'],
  [/Heroes That Can Use It/gi,'Heróis que podem usar'], [/Bring Your Own DPS Edition/gi,'Versão com seu próprio DPS'],
  [/Vs Red Enemies/gi,'Contra inimigos vermelhos'], [/Vs Blue Enemies/gi,'Contra inimigos azuis'], [/Vs Green Enemies/gi,'Contra inimigos verdes'], [/Vs Anything/gi,'Contra qualquer formação'],
  [/Preset Name/gi,'Nome do preset'], [/Additional Stat/gi,'Atributo adicional'], [/True Damage Chance/gi,'Chance de dano verdadeiro'], [/Increase Boss DMG/gi,'Aumento de dano contra chefes'],
  [/Crit Chance \+ DMG/gi,'Chance e dano crítico'], [/PvP DMG Increase/gi,'Aumento de dano no PvP'], [/PvP DMG Decrease/gi,'Redução de dano recebido no PvP'],
  [/Basic DMG Increase/gi,'Aumento de dano básico'], [/Skill DMG Increase/gi,'Aumento de dano de habilidade'], [/Max HP/gi,'PV máximo'],
  [/Grand Chase/gi,'GrandChase'], [/Beginner'?s Guide/gi,'Guia para iniciantes'], [/Support Party/gi,'Equipe de suporte'], [/Soul Imprint/gi,'Impressão da Alma'],
  [/World Boss/gi,'Chefe Mundial'], [/Guild Boss/gi,'Chefe de Guilda'], [/Aernasis Hammer/gi,'Martelo de Aernasis'], [/Release Order/gi,'Ordem de lançamento'],
  [/make sure/gi,'certifique-se de'], [/you can/gi,'você pode'], [/you will/gi,'você vai'], [/you should/gi,'você deve'], [/you need/gi,'você precisa'],
  [/do not/gi,'não'], [/does not/gi,'não'], [/did not/gi,'não'], [/cannot/gi,'não pode'], [/can not/gi,'não pode'], [/at least/gi,'pelo menos'],
  [/in order to/gi,'para'], [/as well as/gi,'assim como'], [/for example/gi,'por exemplo'], [/for the first time/gi,'pela primeira vez'], [/every day/gi,'todos os dias'],
  [/one of/gi,'um dos'], [/how to/gi,'como'], [/used for/gi,'usado para'], [/is used/gi,'é usado'], [/are used/gi,'são usados'], [/need to/gi,'precisa'],
  [/a little/gi,'um pouco'], [/a lot of/gi,'muitos'], [/most of/gi,'a maioria de'], [/instead of/gi,'em vez de'], [/depending on/gi,'dependendo de'],
  [/skill damage/gi,'dano de habilidade'], [/basic attack/gi,'ataque básico'], [/normal attack/gi,'ataque normal'], [/attack speed/gi,'velocidade de ataque'],
  [/cooldown reduction/gi,'redução de recarga'], [/critical chance/gi,'chance de crítico'], [/critical damage/gi,'dano crítico'], [/physical damage/gi,'dano físico'], [/magic damage/gi,'dano mágico'],
  [/damage reduction/gi,'redução de dano'], [/damage increase/gi,'aumento de dano'], [/combat power/gi,'poder de combate'], [/exclusive weapon/gi,'arma exclusiva'],
  [/daily missions/gi,'missões diárias'], [/weekly missions/gi,'missões semanais'], [/party members/gi,'membros da equipe'], [/off-meta/gi,'fora do meta'],
  [/was added/gi,'foi adicionado'], [/were added/gi,'foram adicionados'], [/was updated/gi,'foi atualizado'], [/were updated/gi,'foram atualizados'],
  [/has been/gi,'foi'], [/have been/gi,'foram'], [/according to/gi,'de acordo com'], [/more than/gi,'mais de'], [/less than/gi,'menos de']
]
const words: Record<string,string> = {
  the:'o',a:'um',an:'um',for:'para',you:'você',your:'seu',yours:'seus',are:'são',is:'é',was:'foi',were:'foram',be:'ser',been:'sido',being:'sendo',
  with:'com',without:'sem',this:'este',that:'que',these:'estes',those:'aqueles',from:'de',to:'para',of:'de',in:'em',on:'em',at:'em',by:'por',as:'como',
  and:'e',or:'ou',but:'mas',if:'se',then:'então',than:'que',not:'não',only:'apenas',also:'também',all:'todos',any:'qualquer',some:'alguns',each:'cada',
  every:'cada',both:'ambos',one:'um',two:'dois',first:'primeiro',last:'último',more:'mais',most:'maioria',less:'menos',same:'mesmo',other:'outro',own:'próprio',
  will:'vai',can:'pode',should:'deve',may:'pode',must:'deve',have:'ter',has:'tem',had:'teve',get:'obter',gets:'obtém',use:'use',uses:'usa',using:'usando',used:'usado',
  need:'precisa',needs:'precisa',unlock:'desbloquear',unlocks:'desbloqueia',obtain:'obter',choose:'escolha',select:'selecione',check:'verifique',keep:'mantenha',
  increase:'aumentar',increases:'aumenta',decrease:'reduzir',reduce:'reduzir',gain:'ganhar',receive:'receber',remove:'remover',removed:'removido',change:'alteração',changed:'alterado',
  added:'adicionado',updated:'atualizado',edited:'editado',revised:'revisado',fixed:'corrigido',started:'iniciado',new:'novo',old:'antigo',current:'atual',available:'disponível',
  unit:'unidade',units:'unidades',hero:'herói',heroes:'heróis',character:'personagem',characters:'personagens',enemy:'inimigo',enemies:'inimigos',boss:'chefe',party:'equipe',
  game:'jogo',content:'conteúdo',guide:'guia',page:'página',tab:'aba',list:'lista',table:'tabela',name:'nome',key:'chave',keys:'chaves',icon:'ícone',icons:'ícones',
  build:'build',builds:'builds',equipment:'equipamento',preset:'preset',set:'conjunto',material:'material',rewards:'recompensas',reward:'recompensa',missions:'missões',mission:'missão',
  skill:'habilidade',skills:'habilidades',attack:'ataque',damage:'dano',healing:'cura',shield:'escudo',buff:'bônus',debuff:'penalidade',chance:'chance',cooldown:'recarga',
  class:'classe',attribute:'atributo',attributes:'atributos',tank:'defensor',assault:'guerreiro',mage:'mago',ranger:'atirador',healer:'curandeiro',
  retribution:'Retribuição',life:'Vida',balance:'Equilíbrio',cycle:'Ciclo',ruin:'Ruína',physical:'físico',magic:'mágico',critical:'crítico',normal:'normal',basic:'básico',
  meta:'meta',tier:'nível',pve:'PvE',pvp:'PvP',dps:'DPS',fsi:'FSI',chaser:'Chaser',traits:'traços',trait:'traço',growth:'crescimento',assembly:'Assembleia',
  story:'história',cubes:'cubos',cube:'cubo',daily:'diário',weekly:'semanal',free:'grátis',good:'bom',best:'melhor',recommended:'recomendado',important:'importante',
  where:'onde',when:'quando',what:'o que',which:'qual',who:'quem',why:'por que',after:'depois',before:'antes',until:'até',during:'durante',while:'enquanto',
  things:'coisas',everything:'tudo',anything:'qualquer coisa',there:'lá',here:'aqui',them:'eles',their:'seus',they:'eles',she:'ela',her:'dela',it:'isso',
  very:'muito',slightly:'levemente',fully:'totalmente',certain:'certo',general:'geral',higher:'maior',lower:'menor',low:'baixo',high:'alto',minimum:'mínimo',maximum:'máximo',
  mode:'modo',stages:'fases',stage:'fase',phase:'fase',season:'temporada',order:'ordem',release:'lançamento',support:'suporte',beginner:'iniciante',accessories:'acessórios',
  points:'pontos',point:'ponto',time:'tempo',day:'dia',week:'semana',level:'nível',account:'conta',box:'Box',green:'verde',red:'vermelho',blue:'azul',gold:'dourado',purple:'roxo',
  final:'final',power:'poder',focus:'foco',gaze:'olhar',sustain:'sustentação',below:'abaixo',above:'acima',works:'funciona',work:'funcionar',kill:'derrotar',
  because:'porque',however:'porém',still:'ainda',just:'apenas',like:'como',per:'por',into:'em',again:'novamente',now:'agora',currently:'atualmente',probably:'provavelmente',
  tutorials:'tutoriais',info:'informações',dumping:'detalhes',consider:'considerar',start:'começar',skip:'pular',actually:'realmente',yellow:'amarelo',
  elements:'elementos',exclusive:'exclusiva',weapon:'arma',corresponding:'correspondente',pet:'pet',banners:'banners',obtaining:'obter',sets:'conjuntos',grinded:'farmados',specific:'específicos',
  sub:'sub',stats:'atributos',building:'montar',easy:'fácil',reductions:'reduções',shields:'escudos',keeps:'mantém',alive:'viva',offers:'oferece',recovery:'recuperação',resources:'recursos',
  magical:'mágico',explosion:'explosão',pew:'disparo',follow:'seguem',color:'cores',wheel:'círculo',clash:'conflitam',advantageous:'vantajoso',bonus:'bônus',shares:'compartilha',
  balanced:'balanceado',assuming:'considerando',full:'completo',times:'momentos',restrictions:'restrições',later:'depois',modes:'modos',meaning:'significando',variety:'variedade',shift:'mudar',
  such:'tal',would:'poderia',say:'dizer',anyways:'mesmo assim',daunting:'assustador',sounds:'parece',many:'muitos',events:'eventos',functions:'recursos',quickly:'rapidamente',said:'essas',
  redesigned:'reformulado',ordered:'organizado',too:'muito',niche:'específicos',actual:'reais',global:'global',comps:'composições',playlist:'lista de vídeos',backtrack:'revisar',update:'atualizar',sleepy:'com sono',
  changes:'mudanças',reflect:'refletir',adjusted:'ajustadas',sea:'mar',eternity:'eternidade',examples:'exemplos',video:'vídeo',videos:'vídeos',finish:'terminar',remaining:'restantes',
  names:'nomes',sorted:'ordenados',based:'com base',transcendence:'transcendência',beat:'concluir',world:'mundo',ticket:'bilhete',rank:'nível',upgrade:'evoluir',through:'pela',job:'função',
  parties:'equipes',drop:'usar',ultimates:'supremos',help:'ajudar',want:'quer',method:'método',well:'também',spawn:'geram',random:'aleatórios',take:'derrubar',down:'abaixo',artifacts:'artefatos',
  farming:'farmar',goes:'anda',hand:'mão',exchange:'troca',market:'mercado',nice:'bom',simulator:'simulador',dungeon:'masmorra',challenges:'desafios',floors:'andares',harder:'difíceis',
  function:'recurso',recommened:'recomendado',conjunction:'conjunto',tickets:'bilhetes',entire:'completo',roster:'elenco',let:'permite',built:'montada',gives:'oferece',five:'cinco',gated:'limitadas',
  types:'tipos',needed:'necessários',reaching:'alcançar',milestones:'marcos',similar:'semelhante',score:'pontuação',squid:'lula',hit:'acerte',stuff:'conteúdo',although:'embora',hands:'mãos',
  open:'abrir',left:'deixará',copies:'cópias',reset:'redefinir',reminder:'lembrete',spend:'usar',soon:'logo',possible:'possível',back:'de volta',excuse:'motivo',something:'algo',match:'acompanhar',
  edition:'versão',durable:'resistente',aoe:'área',properly:'corretamente',theory:'teoria',unkillable:'imortais',invincibility:'invencibilidade',present:'presente',spam:'usar repetidamente'
}
function preserveCase(original:string,replacement:string){return original[0]===original[0]?.toUpperCase()?replacement[0].toUpperCase()+replacement.slice(1):replacement}
function offlineTranslate(text:string){
  let result=text
  for(const [pattern,replacement] of phrases) result=result.replace(pattern,replacement)
  result=result.replace(/\b[A-Za-z]+\b/g,(word)=>words[word.toLowerCase()]?preserveCase(word,words[word.toLowerCase()]):word)
  return result.replace(/\s+([,.;!?])/g,'$1').replace(/\s{2,}/g,' ').trim()
}
for (const original of sourceTexts) translated[original] = offlineTranslate(original)
Object.assign(translated, manual)

const payload = JSON.stringify(Object.fromEntries(Object.entries(translated).sort(([a],[b])=>a.localeCompare(b))), null, 2)
await writeFile(existingPath, payload)
const manifestPath = path.join(dataDir, 'manifest.json')
const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as {files:Record<string,{checksum:string;bytes:number}>;checksum:string}
manifest.files['pt-BR.json'] = { checksum:createHash('sha256').update(payload).digest('hex'), bytes:Buffer.byteLength(payload) }
manifest.checksum = createHash('sha256').update(JSON.stringify(manifest.files)).digest('hex')
await writeFile(manifestPath, JSON.stringify(manifest,null,2))
console.log(`Textos pt-BR: ${Object.keys(translated).length}\nPendências: ${pending.filter((item)=>!translated[item]).length}`)
