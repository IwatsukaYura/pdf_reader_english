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

export default function App() {
    const [selectedColor, setSelectedColor] = useState<HighlightColor>('yellow')
    const [selectedText, setSelectedText] = useState('')
    const [isDragOver, setIsDragOver] = useState(false)
    const [showSettings, setShowSettings] = useState(false)

    const { setPdfPath } = usePdfStore()
    const { loadAnnotations, saveAnnotations } = useAnnotations()
    const { result, history, isLoading, error, debouncedTranslate } = useTranslation()

    // PDFを開く処理
    const openPdf = useCallback(
        async (path: string) => {
            if (!path) return
            setPdfPath(path)
            await loadAnnotations(path)
        },
        [setPdfPath, loadAnnotations]
    )

    // Toolbarボタンからのカスタムイベント
    useEffect(() => {
        const handler = (e: Event) => {
            const path = (e as CustomEvent<{ path: string }>).detail.path
            openPdf(path)
        }
        window.addEventListener('pdf:open', handler)
        return () => window.removeEventListener('pdf:open', handler)
    }, [openPdf])

    // ドラッグ&ドロップでPDFを開く
    useEffect(() => {
        const handleDragOver = (e: DragEvent) => {
            e.preventDefault()
            if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
            setIsDragOver(true)
        }
        const handleDragLeave = () => setIsDragOver(false)

        const handleDrop = async (e: DragEvent) => {
            e.preventDefault()
            setIsDragOver(false)

            const file = e.dataTransfer?.files[0]
            if (!file) return

            // ファイル拡張子でPDFを判定（MIMEタイプは環境によって異なる場合がある）
            const isPdf =
                file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
            if (!isPdf) return

            // Electron 26+ webUtils.getPathForFile でセキュアにパスを取得
            try {
                const filePath = window.electronAPI.getFilePath(file)
                if (filePath) {
                    openPdf(filePath)
                }
            } catch {
                // フォールバック: Electron独自のfile.path（古い方式）
                const electronFile = file as File & { path?: string }
                if (electronFile.path) {
                    openPdf(electronFile.path)
                }
            }
        }

        window.addEventListener('dragover', handleDragOver)
        window.addEventListener('dragleave', handleDragLeave)
        window.addEventListener('drop', handleDrop)
        return () => {
            window.removeEventListener('dragover', handleDragOver)
            window.removeEventListener('dragleave', handleDragLeave)
            window.removeEventListener('drop', handleDrop)
        }
    }, [openPdf])

    // テキスト選択 → 翻訳
    const handleTextSelected = useCallback(
        (text: string) => {
            setSelectedText(text)
            debouncedTranslate(text)
        },
        [debouncedTranslate]
    )

    return (
        <div className={`flex flex-col h-screen bg-gray-900 text-gray-100 overflow-hidden transition-all ${isDragOver ? 'ring-2 ring-inset ring-blue-400' : ''}`}>
            {/* ツールバー */}
            <Toolbar
                selectedColor={selectedColor}
                onColorChange={setSelectedColor}
                onSave={saveAnnotations}
                onOpenSettings={() => setShowSettings(true)}
            />

            {/* メインエリア（PDF + サイドパネル） */}
            <div className="flex flex-1 overflow-hidden">
                <div className="flex-1 overflow-hidden">
                    <PdfViewer
                        selectedColor={selectedColor}
                        onTextSelected={handleTextSelected}
                    />
                </div>

                <SidePanel
                    translationResult={result}
                    translationHistory={history}
                    isTranslating={isLoading}
                    translationError={error}
                    selectedText={selectedText}
                    width={320}
                />
            </div>

            {/* ステータスバー */}
            <StatusBar />

            {/* 設定モーダル */}
            {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
        </div>
    )
}
