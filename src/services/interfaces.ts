import type { VocabEntry } from '../types/vocab'
import type { TranslationResult } from '../types/annotation'

/**
 * 単語帳の永続化レイヤーの契約
 * 本番実装: ElectronVocabularyRepository (window.electronAPI 経由)
 * テスト実装: vi.mock でモック
 */
export interface IVocabularyRepository {
    getAll(): Promise<VocabEntry[]>
    add(entry: VocabEntry): Promise<boolean>
    remove(id: string): Promise<void>
    exportCsv(): Promise<string>
}

/**
 * アノテーション（ハイライト・メモ）の永続化レイヤーの契約
 * 本番実装: ElectronAnnotationRepository (window.electronAPI 経由)
 */
export interface IAnnotationRepository {
    save(pdfPath: string, data: object): Promise<string>
    load(pdfPath: string): Promise<object | null>
}

/**
 * DeepL翻訳サービスの契約
 * 本番実装: ElectronTranslationService (IPC経由でmainプロセスのaxiosを呼ぶ)
 */
export interface ITranslationService {
    translate(text: string): Promise<{ text?: string; error?: string }>
}

/**
 * 英英辞書APIの契約
 * 本番実装: FetchDictionaryService (fetch で dictionaryapi.dev を呼ぶ)
 */
export interface IDictionaryService {
    lookup(word: string): Promise<Partial<TranslationResult>>
}
