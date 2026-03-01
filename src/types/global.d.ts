/**
 * Electron contextBridge で公開される window.electronAPI の型宣言
 *
 * 各型の Single Source of Truth:
 *  - VocabEntry → src/types/vocab.ts
 *  - Settings   → src/types/settings.ts
 */

import type { VocabEntry } from './vocab'
import type { Settings } from './settings'

declare global {
    interface Window {
        electronAPI: {
            openFile: () => Promise<string | null>
            saveAnnotation: (pdfPath: string, data: object) => Promise<string>
            loadAnnotation: (pdfPath: string) => Promise<object | null>
            translate: (text: string) => Promise<{ text?: string; error?: string }>
            getSettings: () => Promise<Settings>
            setSettings: (settings: Settings) => Promise<void>
            getPdfUrl: (pdfPath: string) => Promise<string>
            getFilePath: (file: File) => string
            // 単語帳
            vocabGetAll: () => Promise<VocabEntry[]>
            vocabAdd: (entry: VocabEntry) => Promise<boolean>
            vocabRemove: (id: string) => Promise<void>
            vocabExportCsv: () => Promise<string>
        }
    }
}

export type { Settings, VocabEntry }
