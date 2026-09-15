import { Check, Copy } from 'lucide-react'
import { useState } from 'react'
import type { Composition, Hero } from '@/schemas/data'
import { HeroAvatar } from './hero-card'
import { AttributeBadge } from './badges'
import { gameLabel, translateText } from '@/lib/pt-br'

export function TeamCompositionCard({ composition, heroes, translations = {} }: { composition: Composition; heroes: Hero[]; translations?: Record<string,string> }) {
  const [copied, setCopied] = useState(false)
  const byId = new Map(heroes.map((hero) => [hero.id, hero]))
  const copy = async () => { if (!composition.key) return; await navigator.clipboard.writeText(composition.key); setCopied(true); setTimeout(() => setCopied(false), 1800) }
  return <article className="composition-card">
    <header><div><span className="eyebrow">{gameLabel(composition.phase) || 'Composição'}</span><h3>{translateText(composition.title,translations)}</h3></div>{composition.attribute && <AttributeBadge value={composition.attribute} />}</header>
    <div className="team-grid">{composition.heroNames.map((name, i) => { const hero = byId.get(composition.heroIds[i]); return <div className="team-slot" key={`${name}-${i}`}>{hero ? <HeroAvatar hero={hero} /> : <span className="avatar placeholder md">{name.slice(0, 2)}</span>}<span>{name}</span></div> })}</div>
    {composition.notes && <p>{translateText(composition.notes,translations)}</p>}
    {composition.alternatives.length > 0 && <p className="muted"><strong>Alternativas:</strong> {composition.alternatives.join(', ')}</p>}
    {composition.key && <button className="copy-button" onClick={copy}>{copied ? <Check size={16}/> : <Copy size={16}/>} {copied ? 'Chave copiada' : 'Copiar chave'}</button>}
  </article>
}
