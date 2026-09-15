import { Link } from '@tanstack/react-router'
import { ArrowUpRight, Star } from 'lucide-react'
import type { Hero } from '@/schemas/data'
import { AttributeBadge, ClassBadge, VariantBadge } from './badges'
import { publicAsset } from '@/lib/pt-br'

export function HeroAvatar({ hero, size = 'md' }: { hero: Hero; size?: 'sm' | 'md' | 'lg' }) {
  return hero.icon ? <img className={`avatar ${size}`} src={publicAsset(hero.icon)} alt={`Ícone de ${hero.displayName}`} loading="lazy" /> : <span className={`avatar placeholder ${size}`} aria-hidden>{hero.displayName.slice(0, 2).toUpperCase()}</span>
}
export function HeroCard({ hero, favorite = false }: { hero: Hero; favorite?: boolean }) {
  return <Link to="/heroes/$slug" params={{ slug: hero.slug }} className="hero-card" data-attribute={hero.attribute.toLowerCase()}>
    <div className="hero-art"><span className="hero-rune"/><HeroAvatar hero={hero} size="lg" />{favorite && <Star size={16} fill="currentColor" className="favorite" aria-label="Favorito" />}<div className="card-variant"><VariantBadge value={hero.variantType} /></div></div>
    <div className="hero-copy"><div className="hero-title"><div><strong>{hero.displayName}</strong><span>{hero.longName}</span></div><ArrowUpRight size={16}/></div><div className="badge-row"><AttributeBadge value={hero.attribute} /><ClassBadge value={hero.class} /></div></div>
  </Link>
}
