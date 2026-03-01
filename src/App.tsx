import { useCallback, useEffect, useState } from 'react'
import { Toolbar } from './components/Toolbar'
import { PdfViewer } from './components/PdfViewer'
import { SidePanel } from './components/SidePanel'
import { StatusBar } from './components/StatusBar'
import { SettingsModal } from './components/SettingsModal'
import { useTranslation } from './hooks/useTranslation'
import { useAnnotations } from './hooks/useAnnotations'
import { usePdfStore } from './stores/pdfStore'
import { HighlightColor } from './types/annotation'

/** デフォルトのサイドパネル幅（px）。将来はSettingsのsidePanelWidthを使用 */
const DEFAULT_SIDE_PANEL_WIDTH = 320

export default function App() {
    const [selectedColor, setSelectedColor] = useState<HighlightColor>('yellow')
    const [selectedText, setSelectedText] = useState('')
    const [isDragOver, setIsDragOver] = useState(false)
    const [showSettings, setShowSettings] = useState(false)
    const [pendingNote, setPendingNote] = useState<{ text: string; page: number } | null>(null)

    const { setPdfPath } = usePdfStore()
    const { loadAnnotations, saveAnnotations } = useAnnotations()
    const { result, history, isLoading, error, translate } = useTranslation()

    const openPdf = useCallback(
        async (path: string) => {
            if (!path) return
            setPdfPath(path)
            await loadAnnotations(path)
        },
        [setPdfPath, loadAnnotations]
    )

    useEffect(() => {
        const handler = (e: Event) => {
            openPdf((e as CustomEvent<{ path: string }>).detail.path)
        }
        window.addEventListener('pdf:open', handler)
        return () => window.removeEventListener('pdf:open', handler)
    }, [openPdf])

    useEffect(() => {
        const onDragOver = (e: DragEvent) => { e.preventDefault(); setIsDragOver(true) }
        const onDragLeave = () => setIsDragOver(false)
        const onDrop = async (e: DragEvent) => {
            e.preventDefault(); setIsDragOver(false)
            const file = e.dataTransfer?.files[0]
            if (!file) return
            if (!file.type.includes('pdf') && !file.name.endsWith('.pdf')) return
            try {
                const p = window.electronAPI.getFilePath(file); if (p) openPdf(p)
            } catch {
                const f = file as File & { path?: string }; if (f.path) openPdf(f.path)
            }
        }
        window.addEventListener('dragover', onDragOver)
        window.addEventListener('dragleave', onDragLeave)
        window.addEventListener('drop', onDrop)
        return () => {
            window.removeEventListener('dragover', onDragOver)
            window.removeEventListener('dragleave', onDragLeave)
            window.removeEventListener('drop', onDrop)
        }
    }, [openPdf])

    // 🔤 翻訳ボタンが押された時だけ呼ばれる（API節約）
    const handleTranslateRequest = useCallback(
        (text: string) => {
            setSelectedText(text)
            translate(text)
        },
        [translate]
    )

    const handleAddNoteRequest = useCallback((text: string, page: number) => {
        setPendingNote({ text, page })
    }, [])

    return (
        <div
            className={`flex flex-col h-screen bg-gray-900 text-gray-100 overflow-hidden ${isDragOver ? 'ring-2 ring-inset ring-blue-400' : ''
                }`}
        >
            <Toolbar
                selectedColor={selectedColor}
                onColorChange={setSelectedColor}
                onSave={saveAnnotations}
                onOpenSettings={() => setShowSettings(true)}
            />

            <div className="flex flex-1 overflow-hidden">
                <div className="flex-1 overflow-hidden">
                    <PdfViewer
                        selectedColor={selectedColor}
                        onTranslateRequest={handleTranslateRequest}
                        onAddNoteRequest={handleAddNoteRequest}
                    />
                </div>

                <SidePanel
                    translationResult={result}
                    translationHistory={history}
                    isTranslating={isLoading}
                    translationError={error}
                    selectedText={selectedText}
                    width={DEFAULT_SIDE_PANEL_WIDTH}
                    pendingNote={pendingNote}
                    onPendingNoteHandled={() => setPendingNote(null)}
                />
            </div>

            <StatusBar />
            {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
        </div>
    )
}
