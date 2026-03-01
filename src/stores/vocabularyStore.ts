import { create } from 'zustand'

export interface VocabEntry {
    id: string
    word: string
    meaning: string
    partOfSpeech?: string
    example?: string
    phonetic?: string
    sourcePdf: string
    sourcePdfName: string
    page: number
    savedAt: string
}

interface VocabularyState {
    entries: VocabEntry[]
    isLoaded: boolean
    load: () => Promise<void>
    add: (entry: Omit<VocabEntry, 'id' | 'savedAt'>) => Promise<boolean>
    remove: (id: string) => Promise<void>
}

const nanoid = () => Math.random().toString(36).slice(2, 11)

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
