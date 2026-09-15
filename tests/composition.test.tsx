import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { TeamCompositionCard } from '@/components/composition-card'
import type { Composition } from '@/schemas/data'

describe('composição', () => {
  it('copia a chave exatamente como importada', async () => {
    const writeText=vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator,{clipboard:{writeText}})
    const composition:Composition={id:'x',contentId:'pvp-meta',title:'Equipe',heroIds:[],heroNames:['Arme','Amy','Elesis','Lire'],key:'Arme_Amy_HASH_ABC123',alternatives:[],source:{sheet:'PvP Meta',row:5,cells:['E5']}}
    render(<TeamCompositionCard composition={composition} heroes={[]}/>)
    fireEvent.click(screen.getByRole('button',{name:/copiar chave/i}))
    expect(writeText).toHaveBeenCalledWith('Arme_Amy_HASH_ABC123')
    expect(await screen.findByText('Chave copiada')).toBeInTheDocument()
  })
})
