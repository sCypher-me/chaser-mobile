import { create } from 'zustand'

interface AppState {
  query: string
  searchOpen: boolean
  offline: boolean
  setQuery: (query: string) => void
  setSearchOpen: (open: boolean) => void
  setOffline: (offline: boolean) => void
}
export const useAppStore = create<AppState>((set) => ({
  query: '', searchOpen: false, offline: !navigator.onLine,
  setQuery: (query) => set({ query }), setSearchOpen: (searchOpen) => set({ searchOpen }), setOffline: (offline) => set({ offline })
}))
