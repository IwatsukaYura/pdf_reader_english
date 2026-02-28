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

const electronAPI = {
    // ファイルを開くダイアログ
    openFile: (): Promise<string | null> => ipcRenderer.invoke('dialog:openFile'),

    // アノテーション保存・読み込み
    saveAnnotation: (pdfPath: string, data: object): Promise<string> =>
        ipcRenderer.invoke('annotation:save', pdfPath, data),
    loadAnnotation: (pdfPath: string): Promise<object | null> =>
        ipcRenderer.invoke('annotation:load', pdfPath),

    // DeepL翻訳
    translate: (text: string): Promise<{ text?: string; error?: string }> =>
        ipcRenderer.invoke('translate:deepl', text),

    // 設定
    getSettings: (): Promise<Settings> => ipcRenderer.invoke('settings:get'),
    setSettings: (settings: Settings): Promise<void> =>
        ipcRenderer.invoke('settings:set', settings),

    // PDFをカスタムプロトコルURLとして取得
    getPdfUrl: (pdfPath: string): Promise<string> =>
        ipcRenderer.invoke('pdf:getUrl', pdfPath),

    // ドラッグされたファイルのパスを取得（Electron 26+ webUtils）
    getFilePath: (file: File): string => webUtils.getPathForFile(file)
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
