import { useState, useEffect } from 'react'
import { TranslationPanel } from './TranslationPanel'
import { NotesPanel } from './NotesPanel'
import { TranslationResult, TranslationHistoryItem } from '../../types/annotation'

type Tab = 'translation' | 'vocabulary' | 'notes'

interface SidePanelProps {
    translationResult: TranslationResult | null
    translationHistory: TranslationHistoryItem[]
    isTranslating: boolean
    translationError: string | null
    selectedText: string
    width: number
    /** 外部からタブ切り替えをリクエスト */
    requestTab?: Tab | null
    onTabRequested?: () => void
    /** 右クリック「メモを追加」からのリクエスト */
    pendingNote?: { text: string; page: number } | null
    onPendingNoteHandled?: () => void
}

export function SidePanel({
    translationResult,
    translationHistory,
    isTranslating,
    translationError,
    selectedText,
    width,
    requestTab,
    onTabRequested,
    pendingNote,
    onPendingNoteHandled
}: SidePanelProps) {
    const [activeTab, setActiveTab] = useState<Tab>('translation')

    // 外部からのタブ切り替えリクエスト
    useEffect(() => {
        if (requestTab) {
            setActiveTab(requestTab)
            onTabRequested?.()
        }
    }, [requestTab, onTabRequested])

    // メモ追加リクエストが来たらNotesタブに切り替え
    useEffect(() => {
        if (pendingNote) setActiveTab('notes')
    }, [pendingNote])

    const tabs: { id: Tab; label: string }[] = [
        { id: 'translation', label: '🔤 翻訳' },
        { id: 'vocabulary', label: '📚 単語帳' },
        { id: 'notes', label: '📝 メモ' }
    ]

    return (
        <div className="flex flex-col bg-gray-800 border-l border-gray-700 shrink-0" style={{ width }}>
            {/* タブヘッダー */}
            <div className="flex border-b border-gray-700 shrink-0">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        id={`tab-${tab.id}`}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 py-2 text-xs transition-colors cursor-pointer ${activeTab === tab.id
                                ? 'text-white border-b-2 border-blue-400'
                                : 'text-gray-400 hover:text-gray-200'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* タブコンテンツ */}
            <div className="flex-1 overflow-hidden">
                {activeTab === 'translation' && (
                    <TranslationPanel
                        result={translationResult}
                        history={translationHistory}
                        isLoading={isTranslating}
                        error={translationError}
                        selectedText={selectedText}
                    />
                )}
                {activeTab === 'vocabulary' && (
                    <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-500">
                        <div className="text-3xl opacity-30">📚</div>
                        <p className="text-xs">単語帳機能（Phase 3）</p>
                    </div>
                )}
                {activeTab === 'notes' && (
                    <NotesPanel
                        pendingNote={pendingNote}
                        onPendingNoteHandled={onPendingNoteHandled ?? (() => { })}
                    />
                )}
            </div>
        </div>
    )
}
