import { useEffect, useRef, useState, useCallback } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/esm/Page/AnnotationLayer.css'
import 'react-pdf/dist/esm/Page/TextLayer.css'
import { usePdfStore } from '../stores/pdfStore'
import { useAnnotationStore } from '../stores/annotationStore'
import { HighlightColor, HighlightRect, HIGHLIGHT_COLOR_MAP } from '../types/annotation'

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'

interface PdfViewerProps {
    selectedColor: HighlightColor
    /** 🔤 翻訳ボタンが押された時のみ呼ばれる（API節約） */
    onTranslateRequest: (text: string) => void
    /** 📝 メモ追加ボタンが押された時 */
    onAddNoteRequest: (text: string, page: number) => void
}

interface SelectionPopup {
    /** ビューポート座標（センター） */
    viewX: number
    viewY: number
    text: string
    /** ハイライト用に事前キャプチャした座標 */
    rects: HighlightRect[]
}

const HIGHLIGHT_BG: Record<HighlightColor, string> = HIGHLIGHT_COLOR_MAP

export function PdfViewer({ selectedColor, onTranslateRequest, onAddNoteRequest }: PdfViewerProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const pageRefs = useRef<{ [pageNum: number]: HTMLDivElement | null }>({})
    const programmaticScrollRef = useRef(false)

    const [pdfUrl, setPdfUrl] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [loadError, setLoadError] = useState<string | null>(null)
    /** 選択ポップアップ */
    const [popup, setPopup] = useState<SelectionPopup | null>(null)

    const {
        pdfPath, currentPage, numPages, scale,
        setNumPages, setCurrentPage, goToPage, scrollRequest, clearScrollRequest
    } = usePdfStore()
    const { highlights, addHighlight } = useAnnotationStore()

    // --- PDF URL取得 ---
    useEffect(() => {
        if (!pdfPath) { setPdfUrl(null); setLoadError(null); return }
        setIsLoading(true); setLoadError(null); setPdfUrl(null)
        window.electronAPI.getPdfUrl(pdfPath)
            .then((url) => { setPdfUrl(url); setIsLoading(false) })
            .catch((err: Error) => { setLoadError(`PDF読み込み失敗: ${err.message}`); setIsLoading(false) })
    }, [pdfPath])

    // --- scrollRequest → スムーズスクロール ---
    useEffect(() => {
        if (scrollRequest === null) return
        const el = pageRefs.current[scrollRequest]
        if (el) {
            programmaticScrollRef.current = true
            el.scrollIntoView({ behavior: 'smooth', block: 'start' })
            setTimeout(() => { programmaticScrollRef.current = false }, 900)
        }
        clearScrollRequest()
    }, [scrollRequest, clearScrollRequest])

    // --- スクロール追跡 ---
    const handleScroll = useCallback(() => {
        if (programmaticScrollRef.current) return
        const container = containerRef.current
        if (!container) return
        const containerRect = container.getBoundingClientRect()
        let bestPage = currentPage; let maxVisible = 0
        Object.entries(pageRefs.current).forEach(([k, el]) => {
            if (!el) return
            const r = el.getBoundingClientRect()
            const v = Math.max(0, Math.min(r.bottom, containerRect.bottom) - Math.max(r.top, containerRect.top))
            if (v > maxVisible) { maxVisible = v; bestPage = parseInt(k, 10) }
        })
        if (bestPage !== currentPage) setCurrentPage(bestPage)
    }, [currentPage, setCurrentPage])

    useEffect(() => {
        const c = containerRef.current
        if (!c) return
        c.addEventListener('scroll', handleScroll, { passive: true })
        return () => c.removeEventListener('scroll', handleScroll)
    }, [handleScroll, numPages])

    // --- キーボード ---
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            const tag = (e.target as HTMLElement).tagName
            if (tag === 'INPUT' || tag === 'TEXTAREA') return
            if (e.key === 'ArrowRight') goToPage(currentPage + 1)
            if (e.key === 'ArrowLeft') goToPage(currentPage - 1)
            if (e.key === 'Escape') setPopup(null)
        }
        window.addEventListener('keydown', handleKey)
        return () => window.removeEventListener('keydown', handleKey)
    }, [goToPage, currentPage])

    // --- 選択範囲の座標キャプチャ ---
    const captureRects = useCallback(
        (selection: Selection, pageNum: number): HighlightRect[] => {
            const pageEl = pageRefs.current[pageNum]
            if (!pageEl || !selection.rangeCount) return []
            const pageRect = pageEl.getBoundingClientRect()
            return Array.from(selection.getRangeAt(0).getClientRects())
                .filter((r) => r.width > 1 && r.height > 1)
                .map((r) => ({
                    x: (r.left - pageRect.left) / scale,
                    y: (r.top - pageRect.top) / scale,
                    width: r.width / scale,
                    height: r.height / scale
                }))
        },
        [scale]
    )

    // --- テキスト選択 → ポップアップ表示（APIは呼ばない） ---
    const handleMouseUp = useCallback(() => {
        // サイドパネル内でのクリックはスキップ（mouseUpがバブルしてくる場合）
        const selection = window.getSelection()
        const text = selection?.toString().trim() ?? ''

        if (text.length < 1) {
            setPopup(null)
            return
        }

        if (!selection?.rangeCount) return
        const range = selection.getRangeAt(0)
        const selRect = range.getBoundingClientRect()

        // ポップアップをテキスト選択範囲の上に表示
        setPopup({
            viewX: (selRect.left + selRect.right) / 2,
            viewY: selRect.top,
            text,
            rects: captureRects(selection, currentPage)
        })
    }, [captureRects, currentPage])

    // ポップアップ外クリックで閉じる
    useEffect(() => {
        if (!popup) return
        const close = (e: MouseEvent) => {
            const target = e.target as HTMLElement
            if (!target.closest('[data-selection-popup]')) setPopup(null)
        }
        // mousedown でポップアップ外を検知
        window.addEventListener('mousedown', close)
        return () => window.removeEventListener('mousedown', close)
    }, [popup])

    // ========== ポップアップのアクションハンドラ ==========

    const handlePopupTranslate = useCallback(() => {
        if (!popup) return
        onTranslateRequest(popup.text)  // ← ここで初めてDeepL APIを呼ぶ
        setPopup(null)
    }, [popup, onTranslateRequest])

    const handlePopupHighlight = useCallback(() => {
        if (!popup) return
        addHighlight({ page: currentPage, text: popup.text, color: selectedColor, rects: popup.rects })
        window.getSelection()?.removeAllRanges()
        setPopup(null)
    }, [popup, addHighlight, currentPage, selectedColor])

    const handlePopupNote = useCallback(() => {
        if (!popup) return
        onAddNoteRequest(popup.text, currentPage)
        window.getSelection()?.removeAllRanges()
        setPopup(null)
    }, [popup, onAddNoteRequest, currentPage])

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
        <>
            <div
                ref={containerRef}
                className="flex flex-col items-center overflow-y-auto h-full bg-gray-600 pb-8"
                onMouseUp={handleMouseUp}
            >
                {pdfUrl && (
                    <Document
                        file={pdfUrl}
                        onLoadSuccess={({ numPages }) => { setNumPages(numPages); pageRefs.current = {} }}
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
                        {numPages > 0 && Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
                            <div
                                key={pageNum}
                                ref={(el) => { pageRefs.current[pageNum] = el }}
                                data-page={pageNum}
                                className="relative mt-4 shadow-2xl"
                            >
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

                                {/* ハイライトオーバーレイ */}
                                {highlights.filter((h) => h.page === pageNum).map((h) =>
                                    h.rects.length > 0 ? (
                                        h.rects.map((rect, i) => (
                                            <div
                                                key={`${h.id}-${i}`}
                                                className="absolute pointer-events-none"
                                                style={{
                                                    left: rect.x * scale,
                                                    top: rect.y * scale,
                                                    width: rect.width * scale,
                                                    height: rect.height * scale,
                                                    backgroundColor: HIGHLIGHT_BG[h.color],
                                                    opacity: 0.45,
                                                    mixBlendMode: 'multiply'
                                                }}
                                            />
                                        ))
                                    ) : (
                                        <div
                                            key={h.id}
                                            className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded text-xs text-gray-800 pointer-events-none max-w-xs truncate"
                                            style={{ backgroundColor: HIGHLIGHT_BG[h.color], opacity: 0.85 }}
                                            title={h.text}
                                        >
                                            {h.text}
                                        </div>
                                    )
                                )}
                            </div>
                        ))}
                    </Document>
                )}
            </div>

            {/* ===== 選択ポップアップ ===== */}
            {popup && (
                <div
                    data-selection-popup
                    className="fixed z-50 flex items-stretch bg-gray-900 border border-gray-600 rounded-xl shadow-2xl overflow-hidden"
                    style={{
                        left: popup.viewX,
                        top: popup.viewY - 8,
                        transform: 'translate(-50%, -100%)'
                    }}
                    // mousedown を飲み込んでポップアップが閉じないようにする
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    {/* 🔤 翻訳ボタン */}
                    <button
                        onClick={handlePopupTranslate}
                        className="flex flex-col items-center justify-center gap-0.5 px-4 py-2.5 text-xs hover:bg-blue-600/60 transition-colors cursor-pointer group"
                        title="DeepLで翻訳"
                    >
                        <span className="text-base leading-none">🔤</span>
                        <span className="text-gray-300 group-hover:text-white text-[10px]">翻訳</span>
                    </button>

                    <div className="w-px bg-gray-700" />

                    {/* 🖍️ ハイライトボタン（現在の選択色を表示） */}
                    <button
                        onClick={handlePopupHighlight}
                        className="flex flex-col items-center justify-center gap-0.5 px-4 py-2.5 text-xs hover:bg-yellow-500/20 transition-colors cursor-pointer group"
                        title="ハイライト追加"
                    >
                        <span
                            className="text-base leading-none w-5 h-5 rounded-full border-2 border-gray-500 inline-block"
                            style={{ backgroundColor: HIGHLIGHT_BG[selectedColor] }}
                        />
                        <span className="text-gray-300 group-hover:text-white text-[10px]">ハイライト</span>
                    </button>

                    <div className="w-px bg-gray-700" />

                    {/* 📝 メモボタン */}
                    <button
                        onClick={handlePopupNote}
                        className="flex flex-col items-center justify-center gap-0.5 px-4 py-2.5 text-xs hover:bg-green-600/30 transition-colors cursor-pointer group"
                        title="メモを追加"
                    >
                        <span className="text-base leading-none">📝</span>
                        <span className="text-gray-300 group-hover:text-white text-[10px]">メモ</span>
                    </button>

                    {/* ✕ 閉じる */}
                    <div className="w-px bg-gray-700" />
                    <button
                        onClick={() => { window.getSelection()?.removeAllRanges(); setPopup(null) }}
                        className="flex items-center justify-center px-2 text-gray-600 hover:text-gray-300 transition-colors cursor-pointer"
                    >
                        ✕
                    </button>
                </div>
            )}
        </>
    )
}
