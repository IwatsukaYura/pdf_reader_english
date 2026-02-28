import { TranslationResult, TranslationHistoryItem } from '../../types/annotation'

interface TranslationPanelProps {
    result: TranslationResult | null
    history: TranslationHistoryItem[]
    isLoading: boolean
    error: string | null
    selectedText: string
    onSaveToVocabulary?: (text: string, result: TranslationResult) => void
}

export function TranslationPanel({
    result,
    history,
    isLoading,
    error,
    selectedText,
    onSaveToVocabulary
}: TranslationPanelProps) {
    return (
        <div className="flex flex-col h-full">
            {/* 翻訳結果メインエリア */}
            <div className="flex-1 overflow-y-auto p-3">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    🔤 翻訳
                </div>

                {isLoading && (
                    <div className="flex items-center gap-2 text-sm text-gray-400 animate-pulse">
                        <span className="inline-block w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                        翻訳中...
                    </div>
                )}

                {error && (
                    <div className="text-xs text-red-400 bg-red-400/10 rounded p-2">{error}</div>
                )}

                {!isLoading && !error && result && (
                    <div className="space-y-3">
                        {/* 単語名 */}
                        {result.word && (
                            <div className="border-b border-gray-700 pb-2">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-base font-bold text-white">{result.word}</span>
                                    {result.phonetic && (
                                        <span className="text-xs text-gray-400">{result.phonetic}</span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 訳 */}
                        <div>
                            <span className="text-xs text-gray-500">【訳】</span>
                            <p className="text-sm text-white mt-0.5">{result.text}</p>
                        </div>

                        {/* 品詞 */}
                        {result.partOfSpeech && (
                            <div>
                                <span className="text-xs text-gray-500">【品詞】</span>
                                <span className="text-sm text-blue-300 ml-1">{result.partOfSpeech}</span>
                            </div>
                        )}

                        {/* 例文 */}
                        {result.example && (
                            <div>
                                <span className="text-xs text-gray-500">【例文】</span>
                                <p className="text-sm text-gray-300 mt-0.5 italic">{result.example}</p>
                            </div>
                        )}

                        {/* 単語帳に保存ボタン */}
                        {onSaveToVocabulary && selectedText && (
                            <button
                                id="btn-save-vocabulary"
                                onClick={() => onSaveToVocabulary(selectedText, result)}
                                className="w-full mt-2 px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 rounded transition-colors"
                            >
                                📚 単語帳に保存
                            </button>
                        )}
                    </div>
                )}

                {!isLoading && !error && !result && (
                    <p className="text-xs text-gray-500">
                        テキストを選択すると翻訳が表示されます
                    </p>
                )}
            </div>

            {/* 翻訳履歴 */}
            {history.length > 0 && (
                <div className="border-t border-gray-700 p-3">
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        履歴
                    </div>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                        {history.map((item) => (
                            <div
                                key={item.id}
                                className="text-xs text-gray-400 truncate hover:text-gray-200 cursor-default"
                                title={`${item.originalText} → ${item.result.text}`}
                            >
                                <span className="text-gray-300">{item.originalText}</span>
                                <span className="text-gray-600 mx-1">→</span>
                                {item.result.text}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
