import type { ReactNode } from 'react'
import { attributeIcons, classIcons, gameLabel, variantIcons } from '@/lib/pt-br'

const attributeClass: Record<string, string> = { Retribution: 'retribution', Life: 'life', Balance: 'balance', Cycle: 'cycle', Ruin: 'ruin' }
export function AttributeBadge({ value }: { value: string }) { return <span className={`badge attribute ${attributeClass[value] || ''}`}>{attributeIcons[value]&&<img src={attributeIcons[value]} alt=""/>}{gameLabel(value)}</span> }
export function ClassBadge({ value }: { value: string }) { return <span className="badge class-badge">{classIcons[value]&&<img src={classIcons[value]} alt=""/>}{gameLabel(value)}</span> }
export function VariantBadge({ value }: { value: string }) { return value === 'Base' ? null : <span className="badge variant">{variantIcons[value]&&<img src={variantIcons[value]} alt=""/>}{gameLabel(value)}</span> }
export function Chip({ children }: { children: ReactNode }) { return <span className="badge">{children}</span> }
