import { create } from 'zustand'
import { VocabEntry } from '../types/vocab'
import { nanoid } from '../utils/nanoid'

export type { VocabEntry }

interface VocabularyState {
    entries: VocabEntry[]
    isLoaded: boolean
    load: () => Promise<void>
    add: (entry: Omit<VocabEntry, 'id' | 'savedAt'>) => Promise<boolean>
    remove: (id: string) => Promise<void>
}

export const useVocabularyStore = create<VocabularyState>((set, get) => ({
    entries: [],
    isLoaded: false,

    load: async () => {
        if (get().isLoaded) return
        try {
            const entries = await window.electronAPI.vocabGetAll()
            set({ entries, isLoaded: true })
        } catch {
            set({ isLoaded: true })
        }
    },

    add: async (entryData) => {
        const entry: VocabEntry = {
            ...entryData,
            id: `v_${nanoid()}`,
            savedAt: new Date().toISOString()
        }
        const isNew = await window.electronAPI.vocabAdd(entry)
        if (isNew) {
            set((state) => ({ entries: [entry, ...state.entries] }))
        }
        return isNew
    },

    remove: async (id) => {
        await window.electronAPI.vocabRemove(id)
        set((state) => ({ entries: state.entries.filter((e) => e.id !== id) }))
    }
}))
