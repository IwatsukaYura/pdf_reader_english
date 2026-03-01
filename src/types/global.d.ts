interface Settings {
    deeplApiKey: string
    notionToken: string
    notionDatabaseId: string
    translateTo: string
    sidePanelWidth: number
    autoSave: boolean
    notionAutoSync: boolean
}

interface VocabEntry {
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

export { }
