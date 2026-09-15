import { createRootRouteWithContext, createRoute, createRouter, Link, Outlet, useParams, useRouterState } from '@tanstack/react-router'
import { BookOpen, Boxes, ChevronRight, CircleUserRound, Database, Download, Heart, Home, Info, Menu, Search, Settings, Shield, Sparkles, Swords, Trophy, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { Dataset, ImportManifest } from '@/schemas/data'
import { useAppStore } from '@/stores/app'
import { matchesSearch } from '@/lib/normalize'
import { db, exportPersonalData } from '@/lib/db'
import { HeroCard } from '@/components/hero-card'
import { AttributeBadge, Chip, ClassBadge, VariantBadge } from '@/components/badges'
import { TeamCompositionCard } from '@/components/composition-card'
import { attributeIcons, gameLabel, publicAsset, translateText } from '@/lib/pt-br'

export interface AppContext { data: Dataset; manifest: ImportManifest | null; translations: Record<string,string> }
const rootRoute=createRootRouteWithContext<AppContext>()({component:Layout})
const nav = [
  ['/', 'Início', Home], ['/heroes', 'Heróis', CircleUserRound], ['/meta/$kind', 'Meta', Trophy], ['/contents', 'Conteúdos', Swords], ['/guides', 'Guias', BookOpen], ['/settings', 'Ajustes', Settings]
] as const

function Layout() {
  const [menu, setMenu] = useState(false)
  const { searchOpen, setSearchOpen, offline, setOffline } = useAppStore()
  const path = useRouterState({ select: (state) => state.location.pathname })
  useEffect(() => {
    const online = () => setOffline(false); const off = () => setOffline(true)
    window.addEventListener('online', online); window.addEventListener('offline', off)
    const shortcut = (event: KeyboardEvent) => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setSearchOpen(true) } }
    window.addEventListener('keydown', shortcut)
    return () => { window.removeEventListener('online', online); window.removeEventListener('offline', off); window.removeEventListener('keydown', shortcut) }
  }, [setOffline, setSearchOpen])
  return <div className="app-shell">
    <aside className={`sidebar ${menu ? 'open' : ''}`}>
      <Link to="/" className="brand"><span className="brand-mark"><Sparkles size={20}/></span><span>CHASER <b>MOBILE</b></span></Link>
      <nav aria-label="Navegação principal">{nav.map(([to,label,Icon]) => <Link key={to} {...(to==='/meta/$kind'?{to,params:{kind:'pve'}}:{to})} className={path === to || (to !== '/' && path.startsWith(to.split('/').slice(0,2).join('/'))) ? 'active' : ''} onClick={()=>setMenu(false)}><Icon size={19}/><span>{label}</span></Link>)}</nav>
      <div className="sidebar-foot"><span className="status-dot"/>Dados locais e offline<Link to="/about"><Info size={16}/>Sobre</Link></div>
    </aside>
    <div className="main-area">
      {offline && <div className="offline-banner">Você está offline. A base armazenada continua disponível.</div>}
      <header className="topbar"><button className="icon-button mobile-only" onClick={()=>setMenu(!menu)} aria-label="Abrir menu">{menu?<X/>:<Menu/>}</button><div className="topbar-title"><span>Banco de dados</span><strong>Temporada atual</strong></div><button className="search-trigger" onClick={()=>setSearchOpen(true)}><Search size={18}/><span>Buscar herói, build ou conteúdo…</span><kbd>Ctrl K</kbd></button></header>
      <main><Outlet /></main>
    </div>
    <nav className="bottom-nav" aria-label="Navegação móvel">{nav.slice(0,5).map(([to,label,Icon])=><Link key={to} {...(to==='/meta/$kind'?{to,params:{kind:'pve'}}:{to})}><Icon size={20}/><span>{label}</span></Link>)}</nav>
    {searchOpen && <SearchDialog onClose={()=>setSearchOpen(false)}/>} 
  </div>
}

function useData() { return rootRoute.useRouteContext() }
function SearchDialog({ onClose }: { onClose: () => void }) {
  const { data } = useData(); const { query, setQuery } = useAppStore()
  const results = useMemo(() => data.heroes.filter((h)=>matchesSearch([h.displayName,h.canonicalName,...h.aliases],query)).slice(0,12),[data.heroes,query])
  return <div className="dialog-backdrop" onMouseDown={onClose}><section className="search-dialog" role="dialog" aria-modal="true" aria-label="Busca" onMouseDown={(e)=>e.stopPropagation()}><div className="search-input"><Search size={20}/><input autoFocus value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Digite um nome ou variante"/><button onClick={onClose} aria-label="Fechar"><X/></button></div><div className="search-results">{results.map((hero)=><Link key={hero.id} to="/heroes/$slug" params={{slug:hero.slug}} onClick={onClose}><span className={`mini-orb ${hero.attribute.toLowerCase()}`}/><div><strong>{hero.displayName}</strong><span>{gameLabel(hero.class)} · {gameLabel(hero.attribute)}</span></div><ChevronRight/></Link>)}{results.length===0&&<div className="empty">Nenhum resultado encontrado.</div>}</div></section></div>
}
function PageHeader({ eyebrow, title, description }: { eyebrow?: string; title: string; description?: string }) { return <header className="page-header">{eyebrow&&<span className="eyebrow">{eyebrow}</span>}<h1>{title}</h1>{description&&<p>{description}</p>}</header> }
function Stat({ value, label, icon: Icon }: { value: number|string; label: string; icon: typeof Trophy }) { return <div className="stat"><Icon/><strong>{value}</strong><span>{label}</span></div> }

function HomePage() {
  const { data, manifest, translations } = useData(); const featured = data.heroes.slice(0,8); const recent = data.changelog.slice(0,3)
  return <div className="page home-page"><section className="hero-banner"><div className="banner-copy"><div className="season-tag"><span/>Base atualizada · {manifest?.contentVersion||'offline'}</div><span className="eyebrow">Companion comunitário em português</span><h1>Domine cada<br/><em>dimensão.</em></h1><p>Builds, composições e estratégias do GrandChase organizadas em uma experiência rápida, visual e feita para jogadores.</p><div className="hero-actions"><Link to="/heroes" className="primary-button"><Search size={18}/>Explorar heróis</Link><Link to="/meta/$kind" params={{kind:'pve'}} className="secondary-button"><Trophy size={18}/>Ver meta PvE</Link></div></div><div className="banner-emblem"><div className="attribute-orbit">{Object.entries(attributeIcons).map(([name,src])=><span key={name} title={gameLabel(name)}><img src={src} alt={gameLabel(name)}/></span>)}</div><div className="core-emblem"><Sparkles size={58}/><b>CHASER</b><small>MOBILE</small></div></div></section>
    <section className="stats-grid"><Stat value={data.heroes.length} label="Heróis e variantes" icon={CircleUserRound}/><Stat value={data.builds.length} label="Builds estruturadas" icon={Shield}/><Stat value={data.compositions.length} label="Composições" icon={Boxes}/><Stat value={manifest?.contentVersion||'—'} label="Versão dos dados" icon={Database}/></section>
    <section className="section"><div className="section-head"><div><span className="eyebrow">Catálogo</span><h2>Heróis em destaque</h2></div><Link to="/heroes">Ver todos <ChevronRight size={17}/></Link></div><div className="hero-grid compact">{featured.map((hero)=><HeroCard key={hero.id} hero={hero}/>)}</div></section>
    <section className="two-column"><div className="panel"><div className="section-head"><div><span className="eyebrow">Atualizações</span><h2>Mudanças recentes</h2></div><Link to="/updates">Ver histórico</Link></div>{recent.map((item)=><article className="change" key={item.id}><time>{item.date ? new Date(item.date).toLocaleDateString('pt-BR') : 'Nota'}</time><p>{translateText(item.changes,translations)}</p></article>)}</div><div className="panel accent-panel"><span className="eyebrow">Sua coleção</span><h2>Monte o Meu Box</h2><p>Marque os heróis que você possui e descubra instantaneamente quais equipes já consegue montar.</p><Link to="/heroes" className="secondary-button"><Heart size={18}/>Adicionar heróis</Link></div></section>
  </div>
}

function HeroesPage() {
  const { data } = useData(); const [query,setQuery]=useState(''); const [attribute,setAttribute]=useState('Todos'); const [heroClass,setClass]=useState('Todas')
  const filtered=data.heroes.filter((h)=>(attribute==='Todos'||h.attribute===attribute)&&(heroClass==='Todas'||h.class===heroClass)&&matchesSearch([h.displayName,h.canonicalName,...h.aliases],query))
  return <div className="page"><PageHeader eyebrow="Arquivo dimensional" title="Heróis" description="Encontre rapidamente cada variante, classe, atributo, build e equipamento recomendado."/><div className="filter-bar"><label className="field grow"><Search size={17}/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Buscar herói…"/></label><select value={attribute} onChange={(e)=>setAttribute(e.target.value)} aria-label="Filtrar atributo"><option value="Todos">Todos os atributos</option>{['Retribution','Life','Balance','Cycle','Ruin'].map(x=><option key={x} value={x}>{gameLabel(x)}</option>)}</select><select value={heroClass} onChange={(e)=>setClass(e.target.value)} aria-label="Filtrar classe"><option value="Todas">Todas as classes</option>{['Tank','Assault','Healer','Mage','Ranger'].map(x=><option key={x} value={x}>{gameLabel(x)}</option>)}</select></div><p className="result-count"><strong>{filtered.length}</strong> heróis encontrados</p><div className="hero-grid">{filtered.map((hero)=><HeroCard key={hero.id} hero={hero}/>)}</div>{filtered.length===0&&<div className="empty-state"><Search/><h2>Nenhum herói encontrado</h2><p>Tente remover um dos filtros.</p></div>}</div>
}

function HeroDetailPage() {
  const { data, translations }=useData(); const {slug}=useParams({strict:false}) as {slug:string}; const hero=data.heroes.find((h)=>h.slug===slug)
  const [owned,setOwned]=useState(false); useEffect(()=>{if(hero){db.ownedHeroes.get(hero.id).then((v)=>setOwned(Boolean(v?.owned))); db.recent.add({type:'hero',itemId:hero.id,viewedAt:new Date().toISOString()})}},[hero])
  if(!hero)return <NotFound/>
  const builds=data.builds.filter((b)=>b.heroId===hero.id); const equipment=data.equipment.filter((p)=>p.heroIds.includes(hero.id)); const appearances=data.compositions.filter((c)=>c.heroIds.includes(hero.id))
  const toggle=async()=>{const next=!owned;setOwned(next);await db.ownedHeroes.put({heroId:hero.id,owned:next,updatedAt:new Date().toISOString()})}
  return <div className="page"><div className="detail-hero"><div className={`detail-portrait ${hero.attribute.toLowerCase()}`}>{hero.icon?<img src={publicAsset(hero.icon)} alt={hero.displayName}/>:hero.displayName.slice(0,2)}</div><div><span className="eyebrow">{hero.variantType==='Base'?'Personagem':'Variante'}</span><h1>{hero.displayName}</h1><p>{hero.longName}</p><div className="badge-row"><AttributeBadge value={hero.attribute}/><ClassBadge value={hero.class}/><VariantBadge value={hero.variantType}/></div></div><button className={owned?'primary-button':'secondary-button'} onClick={toggle}><Heart size={18} fill={owned?'currentColor':'none'}/>{owned?'No Meu Box':'Adicionar ao Box'}</button></div>
    <div className="detail-grid"><section className="panel span-2"><div className="section-head"><div><span className="eyebrow">Recomendações</span><h2>Build ideal</h2></div></div>{builds.length?builds.map((build)=><div className="build" key={build.id}><div className="build-head"><h3>{gameLabel(build.mode)}</h3><Chip>{gameLabel(build.class)}</Chip></div><BuildGroup title="Traços do herói" items={build.heroTraits.map((x)=>`${translateText(x.name,translations)} ${x.value}`)}/><BuildGroup title="Traços do Chaser" items={build.chaserTraits.map((x)=>`${translateText(x.name,translations)} ${x.value}`)}/><BuildGroup title="Runas da arma exclusiva" items={build.ewRunes.map(x=>translateText(x,translations))}/>{build.rock&&<BuildGroup title="Pedra" items={[translateText(build.rock,translations)]}/>}<BuildGroup title="Transcendência" items={build.transcendence.map(x=>translateText(x,translations))}/></div>):<p className="muted">Nenhuma build estruturada encontrada.</p>}</section><aside className="panel"><span className="eyebrow">Equipamento</span><h2>Presets indicados</h2>{equipment.length?equipment.map((p)=><div className="preset" key={p.id}><Shield/><div><strong>{translateText(p.name,translations)}</strong><span>Usado por {p.heroNames.length} heróis</span></div></div>):<p className="muted">Sem preset relacionado.</p>}</aside></div>
    <section className="section"><div className="section-head"><div><span className="eyebrow">Relações</span><h2>Onde este herói aparece</h2></div><span>{appearances.length} composições</span></div><div className="composition-grid">{appearances.slice(0,8).map((c)=><TeamCompositionCard key={c.id} composition={c} heroes={data.heroes} translations={translations}/>)}</div></section></div>
}
function BuildGroup({title,items}:{title:string;items:string[]}){if(!items.length)return null;return <div className="build-group"><h4>{title}</h4><div className="chip-list">{items.map((item,i)=><Chip key={`${item}-${i}`}>{item}</Chip>)}</div></div>}

function MetaPage(){const {data,translations}=useData();const {kind}=useParams({strict:false}) as {kind:string};const pvp=kind==='pvp';const comps=data.compositions.filter((c)=>pvp?c.contentId==='pvp-meta':c.contentId!=='pvp-meta'&&!c.experimental);return <div className="page"><PageHeader eyebrow="Estratégia competitiva" title={`Meta ${pvp?'PvP':'PvE'}`} description={pvp?'Composições, chaves e observações para enfrentar a arena.':'Equipes recomendadas por conteúdo, fase e atributo.'}/><div className="tabs"><Link to="/meta/$kind" params={{kind:'pve'}}>Meta PvE</Link><Link to="/meta/$kind" params={{kind:'pvp'}}>Meta PvP</Link></div><div className="composition-grid">{comps.map((c)=><TeamCompositionCard key={c.id} composition={c} heroes={data.heroes} translations={translations}/>)}</div></div>}
function ContentsPage(){const {data}=useData();return <div className="page"><PageHeader eyebrow="Desafios" title="Conteúdos" description="Equipes e estratégias organizadas por modo e fase."/><div className="content-grid">{data.contents.filter((c)=>c.id!=='pvp-meta'&&c.id!=='pve-comps-wip').map((content)=><Link className="content-card" key={content.id} to="/content/$slug" params={{slug:content.slug}}><span className="content-icon"><Swords/></span><div><span className="eyebrow">{gameLabel(content.category)}</span><h2>{gameLabel(content.name)}</h2><p>{content.compositionIds.length} composições</p></div><ChevronRight/></Link>)}</div></div>}
function ContentDetailPage(){const {data,translations}=useData();const {slug}=useParams({strict:false}) as {slug:string};const content=data.contents.find((c)=>c.slug===slug);if(!content)return <NotFound/>;const comps=data.compositions.filter((c)=>c.contentId===content.id);return <div className="page"><PageHeader eyebrow={gameLabel(content.category)} title={gameLabel(content.name)} description={`${comps.length} composições verificadas na planilha.`}/><div className="composition-grid">{comps.map((c)=><TeamCompositionCard key={c.id} composition={c} heroes={data.heroes} translations={translations}/>)}</div></div>}
function GuidesPage(){const {data}=useData();return <div className="page"><PageHeader eyebrow="Aprenda" title="Guias" description="O conteúdo da planilha reorganizado em seções navegáveis."/><div className="content-grid">{data.guides.map((guide)=><Link className="content-card" key={guide.id} to="/guides/$slug" params={{slug:guide.slug}}><span className="content-icon"><BookOpen/></span><div><h2>{gameLabel(guide.title)}</h2><p>{guide.sections.length} seções</p></div><ChevronRight/></Link>)}</div></div>}
function GuideDetailPage(){const {data,translations}=useData();const {slug}=useParams({strict:false}) as {slug:string};const guide=data.guides.find((g)=>g.slug===slug);if(!guide)return <NotFound/>;return <div className="page guide-page"><PageHeader eyebrow="Guia" title={gameLabel(guide.title)}/><nav className="toc">{guide.sections.slice(0,20).map((s)=><a key={s.id} href={`#${s.id}`}>{translateText(s.title,translations)}</a>)}</nav>{guide.sections.map((section)=><section id={section.id} className="guide-section" key={section.id}><h2>{translateText(section.title,translations)}</h2><p>{translateText(section.body,translations)}</p></section>)}</div>}
function UpdatesPage(){const {data,translations}=useData();return <div className="page"><PageHeader eyebrow="Base de dados" title="Atualizações"/ ><div className="timeline">{data.changelog.map((item)=><article key={item.id}><time>{item.date?new Date(item.date).toLocaleDateString('pt-BR'):'—'}</time><p>{translateText(item.changes,translations)}</p></article>)}</div></div>}
function ReleasePage(){const {data}=useData();const ordered=[...data.heroes].filter((h)=>h.releaseDate).sort((a,b)=>a.releaseDate!.localeCompare(b.releaseDate!));return <div className="page"><PageHeader eyebrow="Histórico" title="Ordem de lançamento"/><div className="release-list">{ordered.map((hero,i)=><Link key={hero.id} to="/heroes/$slug" params={{slug:hero.slug}}><span>{i+1}</span><strong>{hero.displayName}</strong><AttributeBadge value={hero.attribute}/><time>{new Date(hero.releaseDate!).toLocaleDateString('pt-BR')}</time></Link>)}</div></div>}
function SettingsPage(){const {manifest}=useData();const [automatic,setAutomatic]=useState(true);const download=async()=>{const data=await exportPersonalData();const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));a.download='chaser-mobile-personal.json';a.click()};return <div className="page narrow"><PageHeader eyebrow="Preferências" title="Ajustes"/><section className="panel settings-list"><label><div><strong>Atualização automática</strong><span>Verificar novas versões da base ao abrir</span></div><input type="checkbox" checked={automatic} onChange={(e)=>setAutomatic(e.target.checked)}/></label><button onClick={download}><div><strong>Exportar dados pessoais</strong><span>Meu Box e preferências em JSON</span></div><Download/></button><div><div><strong>Versão do app</strong><span>1.0.0</span></div></div><div><div><strong>Versão dos dados</strong><span>{manifest?.contentVersion||'Indisponível'}</span></div></div></section></div>}
function AboutPage(){const {data,manifest}=useData();return <div className="page narrow"><PageHeader eyebrow="Chaser Mobile" title="Sobre" description="Companion moderno construído a partir da GCDC Meta Spreadsheet."/><section className="panel prose"><h2>Projeto comunitário não oficial</h2><p>GrandChase e suas propriedades pertencem aos respectivos detentores de direitos. Este aplicativo não possui vínculo oficial com a KOG.</p><p>A base atual contém <strong>{data.heroes.length}</strong> heróis e variantes e <strong>{data.compositions.length}</strong> composições.</p><p className="muted">Dados: {manifest?.contentVersion||'—'} · Schema 1</p></section></div>}
function NotFound(){return <div className="page"><div className="empty-state"><Info/><h1>Página não encontrada</h1><Link to="/">Voltar ao início</Link></div></div>}

const indexRoute=createRoute({getParentRoute:()=>rootRoute,path:'/',component:HomePage})
const heroesRoute=createRoute({getParentRoute:()=>rootRoute,path:'/heroes',component:HeroesPage})
const heroRoute=createRoute({getParentRoute:()=>rootRoute,path:'/heroes/$slug',component:HeroDetailPage})
const metaRoute=createRoute({getParentRoute:()=>rootRoute,path:'/meta/$kind',component:MetaPage})
const contentsRoute=createRoute({getParentRoute:()=>rootRoute,path:'/contents',component:ContentsPage})
const contentRoute=createRoute({getParentRoute:()=>rootRoute,path:'/content/$slug',component:ContentDetailPage})
const guidesRoute=createRoute({getParentRoute:()=>rootRoute,path:'/guides',component:GuidesPage})
const guideRoute=createRoute({getParentRoute:()=>rootRoute,path:'/guides/$slug',component:GuideDetailPage})
const updatesRoute=createRoute({getParentRoute:()=>rootRoute,path:'/updates',component:UpdatesPage})
const releaseRoute=createRoute({getParentRoute:()=>rootRoute,path:'/release-order',component:ReleasePage})
const settingsRoute=createRoute({getParentRoute:()=>rootRoute,path:'/settings',component:SettingsPage})
const aboutRoute=createRoute({getParentRoute:()=>rootRoute,path:'/about',component:AboutPage})
const notFoundRoute=createRoute({getParentRoute:()=>rootRoute,path:'/$404',component:NotFound})
const routeTree=rootRoute.addChildren([indexRoute,heroesRoute,heroRoute,metaRoute,contentsRoute,contentRoute,guidesRoute,guideRoute,updatesRoute,releaseRoute,settingsRoute,aboutRoute,notFoundRoute])
export function createAppRouter(context:AppContext){return createRouter({routeTree,context,basepath:import.meta.env.BASE_URL,defaultPreload:'intent',scrollRestoration:true})}
declare module '@tanstack/react-router' { interface Register { router: ReturnType<typeof createAppRouter> } }
