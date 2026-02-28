export interface Highlight {
    id: string
    page: number
    text: string
    color: HighlightColor
    rects: DOMRect[]
    createdAt: string
}

export type HighlightColor = 'yellow' | 'green' | 'pink' | 'cyan'

export interface Note {
    id: string
    page: number
    anchorText?: string
    content: string
    position: 'left-margin' | 'right-margin' | 'inline'
    createdAt: string
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
