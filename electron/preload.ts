import { contextBridge, ipcRenderer, webUtils } from 'electron'

export interface Settings {
    deeplApiKey: string
    notionToken: string
    notionDatabaseId: string
    translateTo: string
    sidePanelWidth: number
    autoSave: boolean
    notionAutoSync: boolean
}

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

const electronAPI = {
    openFile: (): Promise<string | null> => ipcRenderer.invoke('dialog:openFile'),
    saveAnnotation: (pdfPath: string, data: object): Promise<string> =>
        ipcRenderer.invoke('annotation:save', pdfPath, data),
    loadAnnotation: (pdfPath: string): Promise<object | null> =>
        ipcRenderer.invoke('annotation:load', pdfPath),
    translate: (text: string): Promise<{ text?: string; error?: string }> =>
        ipcRenderer.invoke('translate:deepl', text),
    getSettings: (): Promise<Settings> => ipcRenderer.invoke('settings:get'),
    setSettings: (settings: Settings): Promise<void> =>
        ipcRenderer.invoke('settings:set', settings),
    getPdfUrl: (pdfPath: string): Promise<string> => ipcRenderer.invoke('pdf:getUrl', pdfPath),
    getFilePath: (file: File): string => webUtils.getPathForFile(file),

    // 単語帳
    vocabGetAll: (): Promise<VocabEntry[]> => ipcRenderer.invoke('vocab:getAll'),
    vocabAdd: (entry: VocabEntry): Promise<boolean> => ipcRenderer.invoke('vocab:add', entry),
    vocabRemove: (id: string): Promise<void> => ipcRenderer.invoke('vocab:remove', id),
    vocabExportCsv: (): Promise<string> => ipcRenderer.invoke('vocab:exportCsv')
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
