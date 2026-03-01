/**
 * 単語帳エントリの型定義（Single Source of Truth）
 *
 * この型は以下の全レイヤーで共有されます:
 *  - electron/preload.ts  (contextBridgeのAPI型)
 *  - src/types/global.d.ts (Window.electronAPI の型宣言)
 *  - src/stores/vocabularyStore.ts (Zustand store)
 *  - src/components/SidePanel/VocabularyPanel.tsx (UIコンポーネント)
 */
export interface VocabEntry {
    id: string
    word: string
    meaning: string
    partOfSpeech?: string
    example?: string
    phonetic?: string
    sourcePdf: string
    sourcePdfName: string
    page: number
    savedAt: string
}
