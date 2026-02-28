import React from 'react'
import { usePdfStore } from '../stores/pdfStore'
import { useAnnotationStore } from '../stores/annotationStore'
import { HighlightColor } from '../types/annotation'

const HIGHLIGHT_COLORS: { color: HighlightColor; label: string; bg: string }[] = [
    { color: 'yellow', label: '黄', bg: '#FFF176' },
    { color: 'green', label: '緑', bg: '#B9F6CA' },
    { color: 'pink', label: 'ピンク', bg: '#FCE4EC' },
    { color: 'cyan', label: '水色', bg: '#E0F7FA' }
]

interface ToolbarProps {
    selectedColor: HighlightColor
    onColorChange: (color: HighlightColor) => void
    onSave: () => Promise<void>
    onOpenSettings: () => void
}

export function Toolbar({ selectedColor, onColorChange, onSave, onOpenSettings }: ToolbarProps) {
    const { pdfPath, currentPage, numPages, scale, zoomIn, zoomOut, resetZoom, fitWidth, goToPage } =
        usePdfStore()
    const { isDirty } = useAnnotationStore()
    const [pageInput, setPageInput] = React.useState(String(currentPage))

    React.useEffect(() => {
        setPageInput(String(currentPage))
    }, [currentPage])

    const handleOpenFile = async () => {
        try {
            const path = await window.electronAPI.openFile()
            if (path) {
                window.dispatchEvent(new CustomEvent('pdf:open', { detail: { path } }))
            }
        } catch (err) {
            console.error('ファイルを開くに失敗:', err)
        }
    }

    const handlePageSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            const val = parseInt(pageInput, 10)
            if (!isNaN(val)) goToPage(val)
        }
    }

    return (
        <div className="flex items-center gap-2 px-3 h-10 bg-gray-800 border-b border-gray-700 select-none shrink-0">
            {/* ファイルを開く */}
            <button
                id="btn-open-file"
                onClick={handleOpenFile}
                className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded transition-colors cursor-pointer"
            >
                ファイルを開く
            </button>

            {pdfPath && (
                <>
                    <div className="w-px h-5 bg-gray-600 mx-1" />

                    {/* ページナビゲーション */}
                    <span className="text-xs text-gray-400">ページ:</span>
                    <input
                        id="input-page-number"
                        type="number"
                        min={1}
                        max={numPages}
                        value={pageInput}
                        onChange={(e) => setPageInput(e.target.value)}
                        onKeyDown={handlePageSubmit}
                        className="w-14 text-xs text-center bg-gray-700 border border-gray-600 rounded px-1 py-0.5 cursor-text"
                    />
                    <span className="text-xs text-gray-400">/ {numPages}</span>

                    <div className="w-px h-5 bg-gray-600 mx-1" />

                    {/* ズーム */}
                    <button id="btn-zoom-out" onClick={zoomOut}
                        className="w-7 h-7 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded text-sm cursor-pointer transition-colors">
                        −
                    </button>
                    <span className="text-xs text-gray-300 w-12 text-center tabular-nums">
                        {Math.round(scale * 100)}%
                    </span>
                    <button id="btn-zoom-in" onClick={zoomIn}
                        className="w-7 h-7 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded text-sm cursor-pointer transition-colors">
                        ＋
                    </button>
                    <button id="btn-fit-width" onClick={fitWidth}
                        className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded cursor-pointer transition-colors">
                        幅合わせ
                    </button>
                    <button id="btn-zoom-reset" onClick={resetZoom}
                        className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded cursor-pointer transition-colors">
                        100%
                    </button>

                    <div className="w-px h-5 bg-gray-600 mx-1" />

                    {/* ハイライトカラー選択 */}
                    <span className="text-xs text-gray-400">ハイライト:</span>
                    <div className="flex gap-1">
                        {HIGHLIGHT_COLORS.map(({ color, label, bg }) => (
                            <button
                                key={color}
                                id={`btn-highlight-${color}`}
                                title={label}
                                onClick={() => onColorChange(color)}
                                className="w-5 h-5 rounded-full cursor-pointer transition-all"
                                style={{
                                    backgroundColor: bg,
                                    outline: selectedColor === color ? '2px solid #60a5fa' : '2px solid transparent',
                                    outlineOffset: 1,
                                    opacity: selectedColor === color ? 1 : 0.55
                                }}
                            />
                        ))}
                    </div>
                </>
            )}

            <div className="flex-1" />

            {pdfPath && (
                <button
                    id="btn-save"
                    onClick={onSave}
                    className={`px-3 py-1 text-xs rounded cursor-pointer transition-colors ${isDirty
                        ? 'bg-orange-500 hover:bg-orange-400 text-white'
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                        }`}
                    title="Cmd+S"
                >
                    {isDirty ? '● 保存' : '✓ 保存済み'}
                </button>
            )}

            {/* 設定ボタン */}
            <button
                id="btn-settings"
                onClick={onOpenSettings}
                className="w-7 h-7 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded text-sm cursor-pointer transition-colors"
                title="設定"
            >
                ⚙️
            </button>
        </div>
    )
}
