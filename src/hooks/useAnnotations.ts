import { useCallback, useEffect } from 'react'
import { useAnnotationStore } from '../stores/annotationStore'

export function useAnnotations() {
    const store = useAnnotationStore()

    // Cmd+S でアノテーション保存
    useEffect(() => {
        const handleKeyDown = async (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault()
                await saveAnnotations()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    const saveAnnotations = useCallback(async () => {
        const file = store.getAnnotationFile()
        if (!file || !store.pdfPath) return
        await window.electronAPI.saveAnnotation(store.pdfPath, file)
        store.markClean()
    }, [store])

    const loadAnnotations = useCallback(async (pdfPath: string) => {
        store.setPdfPath(pdfPath)
        const data = await window.electronAPI.loadAnnotation(pdfPath)
        if (data) {
            store.loadAnnotations(data as Parameters<typeof store.loadAnnotations>[0])
        }
    }, [store])

    return {
        highlights: store.highlights,
        notes: store.notes,
        isDirty: store.isDirty,
        addHighlight: store.addHighlight,
        removeHighlight: store.removeHighlight,
        changeHighlightColor: store.changeHighlightColor,
        addNote: store.addNote,
        updateNote: store.updateNote,
        removeNote: store.removeNote,
        saveAnnotations,
        loadAnnotations
    }
}
