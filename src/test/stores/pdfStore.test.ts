import { describe, it, expect, beforeEach } from 'vitest'
import { usePdfStore } from '../../stores/pdfStore'

beforeEach(() => {
    usePdfStore.setState({
        pdfPath: null,
        numPages: 0,
        currentPage: 1,
        scale: 1.0,
        scrollRequest: null
    })
})

describe('pdfStore — PDF読み込み', () => {
    it('setPdfPathでcurrentPageが1にリセットされる', () => {
        usePdfStore.setState({ currentPage: 5, numPages: 10 })
        usePdfStore.getState().setPdfPath('/new/file.pdf')

        const { currentPage, numPages } = usePdfStore.getState()
        expect(currentPage).toBe(1)
        expect(numPages).toBe(0)
    })

    it('setPdfPathでscrollRequestがnullにリセットされる', () => {
        usePdfStore.setState({ scrollRequest: 3 })
        usePdfStore.getState().setPdfPath('/new/file.pdf')

        expect(usePdfStore.getState().scrollRequest).toBeNull()
    })
})

describe('pdfStore — ページナビゲーション', () => {
    it('goToPageで有効なページに移動できる', () => {
        usePdfStore.setState({ numPages: 10, currentPage: 1 })
        usePdfStore.getState().goToPage(5)

        expect(usePdfStore.getState().currentPage).toBe(5)
        expect(usePdfStore.getState().scrollRequest).toBe(5)
    })

    it('goToPageで1未満のページはclampされる', () => {
        usePdfStore.setState({ numPages: 10, currentPage: 3 })
        usePdfStore.getState().goToPage(-5)

        expect(usePdfStore.getState().currentPage).toBe(1)
    })

    it('goToPageで総ページ数超過はclampされる', () => {
        usePdfStore.setState({ numPages: 10, currentPage: 3 })
        usePdfStore.getState().goToPage(999)

        expect(usePdfStore.getState().currentPage).toBe(10)
    })

    it('numPages=0の場合goToPageは何もしない', () => {
        usePdfStore.setState({ numPages: 0, currentPage: 1 })
        usePdfStore.getState().goToPage(5)

        // numPages=0では移動しない
        expect(usePdfStore.getState().scrollRequest).toBeNull()
    })

    it('clearScrollRequestでscrollRequestがnullになる', () => {
        usePdfStore.setState({ scrollRequest: 3 })
        usePdfStore.getState().clearScrollRequest()

        expect(usePdfStore.getState().scrollRequest).toBeNull()
    })
})

describe('pdfStore — ズーム操作', () => {
    it('zoomInでscaleが0.25増加する', () => {
        usePdfStore.setState({ scale: 1.0 })
        usePdfStore.getState().zoomIn()

        expect(usePdfStore.getState().scale).toBe(1.25)
    })

    it('zoomOutでscaleが0.25減少する', () => {
        usePdfStore.setState({ scale: 1.0 })
        usePdfStore.getState().zoomOut()

        expect(usePdfStore.getState().scale).toBeCloseTo(0.75)
    })

    it('zoomInは最大3.0を超えない', () => {
        usePdfStore.setState({ scale: 3.0 })
        usePdfStore.getState().zoomIn()

        expect(usePdfStore.getState().scale).toBe(3.0)
    })

    it('zoomOutは最小0.5を下回らない', () => {
        usePdfStore.setState({ scale: 0.5 })
        usePdfStore.getState().zoomOut()

        expect(usePdfStore.getState().scale).toBe(0.5)
    })

    it('resetZoomで1.0に戻る', () => {
        usePdfStore.setState({ scale: 2.5 })
        usePdfStore.getState().resetZoom()

        expect(usePdfStore.getState().scale).toBe(1.0)
    })

    it('fitWidthで1.5になる', () => {
        usePdfStore.setState({ scale: 1.0 })
        usePdfStore.getState().fitWidth()

        expect(usePdfStore.getState().scale).toBe(1.5)
    })
})
