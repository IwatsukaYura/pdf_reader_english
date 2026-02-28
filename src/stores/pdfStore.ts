import { create } from 'zustand'

interface PdfState {
    pdfPath: string | null
    numPages: number
    currentPage: number
    scale: number
    // ツールバーからのページ移動リクエスト（PdfViewerがスクロールする）
    scrollRequest: number | null

    setPdfPath: (path: string) => void
    setNumPages: (n: number) => void
    /** スクロールイベントからの更新（スクロールは起こさない） */
    setCurrentPage: (page: number) => void
    /** ツールバー入力など意図的なページ移動（PdfViewerがスクロールする） */
    goToPage: (page: number) => void
    clearScrollRequest: () => void
    zoomIn: () => void
    zoomOut: () => void
    resetZoom: () => void
    fitWidth: () => void
}

export const usePdfStore = create<PdfState>((set, get) => ({
    pdfPath: null,
    numPages: 0,
    currentPage: 1,
    scale: 1.0,
    scrollRequest: null,

    setPdfPath: (path) => set({ pdfPath: path, currentPage: 1, numPages: 0, scrollRequest: null }),
    setNumPages: (n) => set({ numPages: n }),
    setCurrentPage: (page) => set({ currentPage: page }),

    goToPage: (page) => {
        const { numPages } = get()
        if (numPages === 0) return
        const clamped = Math.max(1, Math.min(page, numPages))
        set({ currentPage: clamped, scrollRequest: clamped })
    },

    clearScrollRequest: () => set({ scrollRequest: null }),

    zoomIn: () => {
        const { scale } = get()
        set({ scale: Math.min(scale + 0.25, 3.0) })
    },

    zoomOut: () => {
        const { scale } = get()
        set({ scale: Math.max(scale - 0.25, 0.5) })
    },

    resetZoom: () => set({ scale: 1.0 }),
    fitWidth: () => set({ scale: 1.5 })
}))
