export interface HighlightRect {
    x: number
    y: number
    width: number
    height: number
}

export interface Highlight {
    id: string
    page: number
    text: string
    color: HighlightColor
    /** 選択範囲の座標（scale=1 基準で正規化済み） */
    rects: HighlightRect[]
    createdAt: string
}

export type HighlightColor = 'yellow' | 'green' | 'pink' | 'cyan'

export const HIGHLIGHT_COLOR_MAP: Record<HighlightColor, string> = {
    yellow: '#FFF176',
    green: '#B9F6CA',
    pink: '#FCE4EC',
    cyan: '#E0F7FA'
}

export interface Note {
    id: string
    page: number
    anchorText?: string
    content: string
    createdAt: string
    updatedAt: string
}

export interface AnnotationFile {
    version: string
    pdfPath: string
    highlights: Highlight[]
    notes: Note[]
}

export interface VocabularyEntry {
    id: string
    word: string
    meaning: string
    partOfSpeech: string
    example: string
    exampleTranslation?: string
    sourcePdf: string
    page: number
    savedAt: string
    notionPageUrl?: string
    syncedToNotion: boolean
}

export interface TranslationResult {
    text: string
    word?: string
    partOfSpeech?: string
    example?: string
    phonetic?: string
}

export interface TranslationHistoryItem {
    id: string
    originalText: string
    result: TranslationResult
    timestamp: string
}
