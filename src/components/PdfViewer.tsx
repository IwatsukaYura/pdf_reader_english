import { useEffect, useRef, useState, useCallback } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/esm/Page/AnnotationLayer.css'
import 'react-pdf/dist/esm/Page/TextLayer.css'
import { usePdfStore } from '../stores/pdfStore'
import { useAnnotationStore } from '../stores/annotationStore'
import { HighlightColor } from '../types/annotation'

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'

interface PdfViewerProps {
    selectedColor: HighlightColor
    onTextSelected: (text: string) => void
}

export function PdfViewer({ selectedColor, onTextSelected }: PdfViewerProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const pageRefs = useRef<{ [pageNum: number]: HTMLDivElement | null }>({})
    // プログラム的スクロール中はスクロールイベントで currentPage を更新しない
    const programmaticScrollRef = useRef(false)

    const [pdfUrl, setPdfUrl] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [loadError, setLoadError] = useState<string | null>(null)

    const {
        pdfPath,
        currentPage,
        numPages,
        scale,
        setNumPages,
        setCurrentPage,
        goToPage,
        scrollRequest,
        clearScrollRequest
    } = usePdfStore()
    const { highlights, addHighlight } = useAnnotationStore()

    // --- PDF URL取得 ---
    useEffect(() => {
        if (!pdfPath) {
            setPdfUrl(null)
            setLoadError(null)
            return
        }
        setIsLoading(true)
        setLoadError(null)
        setPdfUrl(null)
        window.electronAPI
            .getPdfUrl(pdfPath)
            .then((url) => {
                setPdfUrl(url)
                setIsLoading(false)
            })
            .catch((err: Error) => {
                setLoadError(`PDF読み込み失敗: ${err.message}`)
                setIsLoading(false)
            })
    }, [pdfPath])

    // --- ツールバー goToPage → scrollRequest → 該当ページへスクロール ---
    useEffect(() => {
        if (scrollRequest === null) return
        const el = pageRefs.current[scrollRequest]
        if (el) {
            programmaticScrollRef.current = true
            el.scrollIntoView({ behavior: 'smooth', block: 'start' })
            setTimeout(() => {
                programmaticScrollRef.current = false
            }, 900)
        }
        clearScrollRequest()
    }, [scrollRequest, clearScrollRequest])

    // --- スクロール時に最も表示面積の大きいページを currentPage に反映 ---
    const handleScroll = useCallback(() => {
        if (programmaticScrollRef.current) return
        const container = containerRef.current
        if (!container) return

        const containerRect = container.getBoundingClientRect()
        let bestPage = currentPage
        let maxVisible = 0

        Object.entries(pageRefs.current).forEach(([pageNumStr, el]) => {
            if (!el) return
            const rect = el.getBoundingClientRect()
            const visibleTop = Math.max(rect.top, containerRect.top)
            const visibleBottom = Math.min(rect.bottom, containerRect.bottom)
            const visibleHeight = Math.max(0, visibleBottom - visibleTop)
            if (visibleHeight > maxVisible) {
                maxVisible = visibleHeight
                bestPage = parseInt(pageNumStr, 10)
            }
        })

        if (bestPage !== currentPage) {
            setCurrentPage(bestPage)
        }
    }, [currentPage, setCurrentPage])

    useEffect(() => {
        const container = containerRef.current
        if (!container) return
        container.addEventListener('scroll', handleScroll, { passive: true })
        return () => container.removeEventListener('scroll', handleScroll)
    }, [handleScroll, numPages])

    // --- キーボード: 矢印キーでページジャンプ ---
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            const tag = (e.target as HTMLElement).tagName
            if (tag === 'INPUT' || tag === 'TEXTAREA') return
            if (e.key === 'ArrowRight') goToPage(currentPage + 1)
            if (e.key === 'ArrowLeft') goToPage(currentPage - 1)
        }
        window.addEventListener('keydown', handleKey)
        return () => window.removeEventListener('keydown', handleKey)
    }, [goToPage, currentPage])

    // --- テキスト選択 → 翻訳 ---
    const handleMouseUp = useCallback(() => {
        const text = window.getSelection()?.toString().trim() ?? ''
        if (text.length >= 1) onTextSelected(text)
    }, [onTextSelected])

    // --- 右クリック → ハイライト追加 ---
    const handleContextMenu = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault()
            const selection = window.getSelection()
            const text = selection?.toString().trim() ?? ''
            if (!text) return
            addHighlight({ page: currentPage, text, color: selectedColor, rects: [] })
            selection?.removeAllRanges()
        },
        [addHighlight, currentPage, selectedColor]
    )

    // --- 未選択状態 ---
    if (!pdfPath) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-500 select-none">
                <div className="text-8xl opacity-20 pointer-events-none">📄</div>
                <p className="text-sm font-medium">PDFファイルをここにドロップ</p>
                <p className="text-xs text-gray-600">または上の「ファイルを開く」ボタン</p>
            </div>
        )
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full gap-3 text-gray-400">
                <span className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin inline-block" />
                <span className="text-sm">読み込み中...</span>
            </div>
        )
    }

    if (loadError) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-red-400 px-8">
                <div className="text-4xl">⚠️</div>
                <p className="text-sm text-center">{loadError}</p>
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            className="flex flex-col items-center overflow-y-auto h-full bg-gray-600 pb-8"
            onMouseUp={handleMouseUp}
            onContextMenu={handleContextMenu}
        >
            {pdfUrl && (
                <Document
                    file={pdfUrl}
                    onLoadSuccess={({ numPages }) => {
                        setNumPages(numPages)
                        pageRefs.current = {}
                    }}
                    onLoadError={(error) => setLoadError(`PDF読み込みエラー: ${error.message}`)}
                    loading={
                        <div className="flex items-center justify-center gap-2 mt-12 text-gray-300">
                            <span className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin inline-block" />
                            <span>PDFをレンダリング中...</span>
                        </div>
                    }
                    error={
                        <div className="flex flex-col items-center mt-12 text-red-400 gap-2">
                            <p className="text-sm">PDFのレンダリングに失敗しました</p>
                        </div>
                    }
                >
                    {/* ===== 全ページを縦スクロールで表示 ===== */}
                    {numPages > 0 &&
                        Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
                            <div
                                key={pageNum}
                                ref={(el) => {
                                    pageRefs.current[pageNum] = el
                                }}
                                data-page={pageNum}
                                className="relative mt-4 shadow-2xl"
                            >
                                {/* ページ番号バッジ */}
                                <div className="absolute -top-5 left-0 text-xs text-gray-400 select-none">
                                    p. {pageNum}
                                </div>

                                <Page
                                    pageNumber={pageNum}
                                    scale={scale}
                                    renderAnnotationLayer={true}
                                    renderTextLayer={true}
                                    loading={
                                        <div
                                            style={{ width: Math.round(595 * scale), height: Math.round(842 * scale) }}
                                            className="bg-white animate-pulse"
                                        />
                                    }
                                />

                                {/* ハイライト一覧（このページ分） */}
                                {highlights
                                    .filter((h) => h.page === pageNum)
                                    .map((h) => (
                                        <div
                                            key={h.id}
                                            className={`absolute bottom-2 left-2 px-1.5 py-0.5 rounded text-xs text-gray-800 highlight-${h.color} opacity-90 pointer-events-none max-w-[200px] truncate`}
                                            title={h.text}
                                        >
                                            {h.text}
                                        </div>
                                    ))}
                            </div>
                        ))}
                </Document>
            )}
        </div>
    )
}
