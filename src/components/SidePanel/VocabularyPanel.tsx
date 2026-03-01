import { useEffect, useState, useMemo } from 'react'
import { useVocabularyStore } from '../../stores/vocabularyStore'
import { usePdfStore } from '../../stores/pdfStore'

export function VocabularyPanel() {
    const { entries, load, remove } = useVocabularyStore()
    const { goToPage } = usePdfStore()
    const [searchQuery, setSearchQuery] = useState('')
    const [filterMode, setFilterMode] = useState<'all' | 'current'>('all')
    const { pdfPath } = usePdfStore()

    // 初回マウント時に単語帳をロード
    useEffect(() => { load() }, [load])

    // 検索 + フィルタ
    const filtered = useMemo(() => {
        let result = entries
        if (filterMode === 'current' && pdfPath) {
            result = result.filter((e) => e.sourcePdf === pdfPath)
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase()
            result = result.filter(
                (e) =>
                    e.word.toLowerCase().includes(q) ||
                    e.meaning.toLowerCase().includes(q) ||
                    (e.example ?? '').toLowerCase().includes(q)
            )
        }
        return result
    }, [entries, searchQuery, filterMode, pdfPath])

    const handleExportCsv = async () => {
        const csv = await window.electronAPI.vocabExportCsv()
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `vocabulary_${new Date().toISOString().slice(0, 10)}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    return (
        <div className="flex flex-col h-full">
            {/* ヘッダー */}
            <div className="px-3 pt-3 pb-2 space-y-2 shrink-0 border-b border-gray-700">
                {/* 検索バー */}
                <input
                    type="text"
                    placeholder="🔍 単語・意味を検索..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-400"
                />

                {/* フィルタ + エクスポート */}
                <div className="flex items-center justify-between">
                    <div className="flex rounded overflow-hidden border border-gray-600 text-xs">
                        <button
                            onClick={() => setFilterMode('all')}
                            className={`px-2.5 py-1 cursor-pointer transition-colors ${filterMode === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                                }`}
                        >
                            全て ({entries.length})
                        </button>
                        <button
                            onClick={() => setFilterMode('current')}
                            disabled={!pdfPath}
                            className={`px-2.5 py-1 cursor-pointer transition-colors disabled:opacity-40 ${filterMode === 'current' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                                }`}
                        >
                            このPDF
                        </button>
                    </div>
                    {entries.length > 0 && (
                        <button
                            onClick={handleExportCsv}
                            className="text-xs text-gray-400 hover:text-gray-200 cursor-pointer transition-colors px-1"
                            title="CSV形式でエクスポート"
                        >
                            ↓ CSV
                        </button>
                    )}
                </div>
            </div>

            {/* 単語一覧 */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {filtered.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-500">
                        {entries.length === 0 ? (
                            <>
                                <div className="text-3xl opacity-30">📚</div>
                                <p className="text-xs">単語帳はまだ空です</p>
                                <p className="text-xs text-gray-600 text-center">
                                    翻訳後に「📚 単語帳に保存」を押すと<br />ここに追加されます
                                </p>
                            </>
                        ) : (
                            <>
                                <div className="text-2xl opacity-30">🔍</div>
                                <p className="text-xs">「{searchQuery}」に一致する単語がありません</p>
                            </>
                        )}
                    </div>
                )}

                {filtered.map((entry) => (
                    <div
                        key={entry.id}
                        className="bg-gray-900/60 border border-gray-700 hover:border-gray-600 rounded-lg p-3 transition-colors"
                    >
                        {/* 単語 + 削除ボタン */}
                        <div className="flex items-start justify-between gap-1 mb-1">
                            <div>
                                <span className="text-sm font-bold text-white">{entry.word}</span>
                                {entry.phonetic && (
                                    <span className="text-xs text-gray-500 ml-2">{entry.phonetic}</span>
                                )}
                            </div>
                            <button
                                onClick={() => remove(entry.id)}
                                className="text-gray-600 hover:text-red-400 text-xs cursor-pointer transition-colors shrink-0 pt-0.5"
                                title="削除"
                            >
                                🗑️
                            </button>
                        </div>

                        {/* 品詞 */}
                        {entry.partOfSpeech && (
                            <span className="inline-block text-[10px] text-blue-300 bg-blue-500/20 px-1.5 py-0.5 rounded mb-1.5">
                                {entry.partOfSpeech}
                            </span>
                        )}

                        {/* 意味 */}
                        <p className="text-xs text-gray-200 leading-relaxed">{entry.meaning}</p>

                        {/* 例文 */}
                        {entry.example && (
                            <p className="text-xs text-gray-500 italic mt-1.5 leading-relaxed border-l-2 border-gray-600 pl-2">
                                {entry.example}
                            </p>
                        )}

                        {/* 出典 */}
                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-700/60">
                            <span className="text-[10px] text-gray-600 truncate flex-1" title={entry.sourcePdf}>
                                📄 {entry.sourcePdfName}
                            </span>
                            <button
                                onClick={() => goToPage(entry.page)}
                                className="text-[10px] text-blue-400/70 hover:text-blue-300 cursor-pointer shrink-0 transition-colors"
                                title={`p.${entry.page}へジャンプ`}
                            >
                                p.{entry.page}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
