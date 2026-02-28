import { useState } from 'react'
import { TranslationPanel } from './TranslationPanel'
import { TranslationResult, TranslationHistoryItem } from '../../types/annotation'

type Tab = 'translation' | 'vocabulary' | 'notes'

interface SidePanelProps {
    translationResult: TranslationResult | null
    translationHistory: TranslationHistoryItem[]
    isTranslating: boolean
    translationError: string | null
    selectedText: string
    width: number
}

export function SidePanel({
    translationResult,
    translationHistory,
    isTranslating,
    translationError,
    selectedText,
    width
}: SidePanelProps) {
    const [activeTab, setActiveTab] = useState<Tab>('translation')

    const tabs: { id: Tab; label: string }[] = [
        { id: 'translation', label: '🔤 翻訳' },
        { id: 'vocabulary', label: '📚 単語帳' },
        { id: 'notes', label: '📝 メモ' }
    ]

    return (
        <div
            className="flex flex-col bg-gray-800 border-l border-gray-700 shrink-0"
            style={{ width }}
        >
            {/* タブヘッダー */}
            <div className="flex border-b border-gray-700 shrink-0">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        id={`tab-${tab.id}`}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 py-2 text-xs transition-colors ${activeTab === tab.id
                                ? 'text-white border-b-2 border-blue-400 bg-gray-750'
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
                    <div className="p-3 text-xs text-gray-500">
                        単語帳機能はPhase 2で実装予定です
                    </div>
                )}
                {activeTab === 'notes' && (
                    <div className="p-3 text-xs text-gray-500">
                        メモ機能はPhase 2で実装予定です
                    </div>
                )}
            </div>
        </div>
    )
}
