/**
 * サービスインターフェースの本番実装（Electron環境用）
 *
 * 各サービスは window.electronAPI (contextBridge) を内部的に使用する。
 * テスト時はこのモジュールを vi.mock() で差し替えることで
 * window.electronAPI に触れることなくロジックをテストできる。
 */

import type {
    IVocabularyRepository,
    IAnnotationRepository,
    ITranslationService,
    IDictionaryService,
} from './interfaces'
import type { VocabEntry } from '../types/vocab'
import type { TranslationResult } from '../types/annotation'

const DICTIONARY_API = 'https://api.dictionaryapi.dev/api/v2/entries/en'

// ─────────────────────────────────────────────
// VocabularyRepository
// ─────────────────────────────────────────────

export const vocabularyRepository: IVocabularyRepository = {
    getAll: (): Promise<VocabEntry[]> =>
        window.electronAPI.vocabGetAll(),

    add: (entry: VocabEntry): Promise<boolean> =>
        window.electronAPI.vocabAdd(entry),

    remove: (id: string): Promise<void> =>
        window.electronAPI.vocabRemove(id),

    exportCsv: (): Promise<string> =>
        window.electronAPI.vocabExportCsv(),
}

// ─────────────────────────────────────────────
// AnnotationRepository
// ─────────────────────────────────────────────

export const annotationRepository: IAnnotationRepository = {
    save: (pdfPath: string, data: object): Promise<string> =>
        window.electronAPI.saveAnnotation(pdfPath, data),

    load: (pdfPath: string): Promise<object | null> =>
        window.electronAPI.loadAnnotation(pdfPath),
}

// ─────────────────────────────────────────────
// TranslationService
// ─────────────────────────────────────────────

export const translationService: ITranslationService = {
    translate: (text: string): Promise<{ text?: string; error?: string }> =>
        window.electronAPI.translate(text),
}

// ─────────────────────────────────────────────
// DictionaryService
// ─────────────────────────────────────────────

export const dictionaryService: IDictionaryService = {
    lookup: async (word: string): Promise<Partial<TranslationResult>> => {
        try {
            const res = await fetch(`${DICTIONARY_API}/${encodeURIComponent(word.trim())}`)
            if (!res.ok) return {}
            const data = await res.json() as Record<string, unknown>[]
            const entry = data?.[0]
            if (!entry) return {}
            const meanings = entry.meanings as Record<string, unknown>[] | undefined
            const meaning = meanings?.[0]
            const definitions = meaning?.definitions as Record<string, unknown>[] | undefined
            const def = definitions?.[0]
            return {
                partOfSpeech: (meaning?.partOfSpeech as string) ?? '',
                example: (def?.example as string) ?? '',
                phonetic: (entry.phonetic as string) ?? '',
            }
        } catch {
            return {}
        }
    },
}
