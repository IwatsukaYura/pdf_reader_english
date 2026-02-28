import { create } from 'zustand'
import { Highlight, HighlightColor, Note, AnnotationFile } from '../types/annotation'
import { createEmptyAnnotationFile } from '../utils/annotationSerializer'

interface AnnotationState {
    pdfPath: string | null
    highlights: Highlight[]
    notes: Note[]
    isDirty: boolean

    setPdfPath: (path: string) => void
    loadAnnotations: (data: AnnotationFile) => void

    addHighlight: (highlight: Omit<Highlight, 'id' | 'createdAt'>) => void
    removeHighlight: (id: string) => void
    changeHighlightColor: (id: string, color: HighlightColor) => void

    addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => void
    updateNote: (id: string, content: string) => void
    removeNote: (id: string) => void

    markClean: () => void
    getAnnotationFile: () => AnnotationFile | null
}

const nanoid = () => Math.random().toString(36).slice(2, 11)

export const useAnnotationStore = create<AnnotationState>((set, get) => ({
    pdfPath: null,
    highlights: [],
    notes: [],
    isDirty: false,

    setPdfPath: (path) => set({ pdfPath: path }),

    loadAnnotations: (data) =>
        set({ highlights: data.highlights, notes: data.notes, isDirty: false }),

    addHighlight: (highlight) =>
        set((state) => ({
            highlights: [
                ...state.highlights,
                { ...highlight, id: `h_${nanoid()}`, createdAt: new Date().toISOString() }
            ],
            isDirty: true
        })),

    removeHighlight: (id) =>
        set((state) => ({
            highlights: state.highlights.filter((h) => h.id !== id),
            isDirty: true
        })),

    changeHighlightColor: (id, color) =>
        set((state) => ({
            highlights: state.highlights.map((h) => (h.id === id ? { ...h, color } : h)),
            isDirty: true
        })),

    addNote: (note) =>
        set((state) => ({
            notes: [
                ...state.notes,
                {
                    ...note,
                    id: `n_${nanoid()}`,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            ],
            isDirty: true
        })),

    updateNote: (id, content) =>
        set((state) => ({
            notes: state.notes.map((n) =>
                n.id === id ? { ...n, content, updatedAt: new Date().toISOString() } : n
            ),
            isDirty: true
        })),

    removeNote: (id) =>
        set((state) => ({
            notes: state.notes.filter((n) => n.id !== id),
            isDirty: true
        })),

    markClean: () => set({ isDirty: false }),

    getAnnotationFile: () => {
        const { pdfPath, highlights, notes } = get()
        if (!pdfPath) return null
        const file = createEmptyAnnotationFile(pdfPath)
        file.highlights = highlights
        file.notes = notes
        return file
    }
}))
