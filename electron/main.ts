import { app, shell, BrowserWindow, ipcMain, dialog, protocol, net } from 'electron'
import { join, normalize } from 'path'
import Store from 'electron-store'
import fs from 'fs/promises'
import axios from 'axios'
import { pathToFileURL } from 'url'

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

// アプリ設定ストア
const store = new Store<{ settings: Settings }>({
    defaults: {
        settings: {
            deeplApiKey: '',
            notionToken: '',
            notionDatabaseId: '',
            translateTo: 'JA',
            sidePanelWidth: 320,
            autoSave: false,
            notionAutoSync: false
        }
    }
})

// 単語帳ストア（全PDFで共通のグローバルデータ）
const vocabStore = new Store<{ vocabulary: VocabEntry[] }>({
    name: 'vocabulary',
    defaults: { vocabulary: [] }
})

// ローカルPDFをセキュアに配信するカスタムプロトコル
function registerLocalPdfProtocol(): void {
    protocol.handle('local-pdf', async (request) => {
        try {
            const url = new URL(request.url)
            const filePath = normalize(decodeURIComponent(url.pathname))
            return net.fetch(pathToFileURL(filePath).toString())
        } catch {
            return new Response('File not found', { status: 404 })
        }
    })
}

function createWindow(): void {
    const mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 900,
        minHeight: 600,
        show: false,
        autoHideMenuBar: false,
        titleBarStyle: 'default',
        webPreferences: {
            preload: join(__dirname, '../preload/preload.js'),
            sandbox: false,
            contextIsolation: true,
            nodeIntegration: false
        }
    })

    mainWindow.on('ready-to-show', () => mainWindow.show())

    mainWindow.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url)
        return { action: 'deny' }
    })

    const isDev = !app.isPackaged
    if (isDev && process.env['ELECTRON_RENDERER_URL']) {
        mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
        mainWindow.webContents.openDevTools({ mode: 'detach' })
    } else {
        mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
    }
}

app.whenReady().then(() => {
    registerLocalPdfProtocol()
    registerIpcHandlers()
    createWindow()
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})

function registerIpcHandlers(): void {
    // ファイルを開くダイアログ
    ipcMain.handle('dialog:openFile', async () => {
        const result = await dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
        })
        return result.canceled ? null : result.filePaths[0]
    })

    // アノテーション保存・読み込み
    ipcMain.handle('annotation:save', async (_, pdfPath: string, data: object) => {
        const annotPath = pdfPath.replace(/\.pdf$/i, '.annot.json')
        await fs.writeFile(annotPath, JSON.stringify(data, null, 2), 'utf-8')
        return annotPath
    })
    ipcMain.handle('annotation:load', async (_, pdfPath: string) => {
        const annotPath = pdfPath.replace(/\.pdf$/i, '.annot.json')
        try { return JSON.parse(await fs.readFile(annotPath, 'utf-8')) }
        catch { return null }
    })

    // DeepL 翻訳
    ipcMain.handle('translate:deepl', async (_, text: string) => {
        const settings = store.get('settings') as Settings
        if (!settings.deeplApiKey) {
            return { error: 'DeepL APIキーが未設定です（⚙️設定から登録してください）' }
        }
        try {
            const response = await axios.post(
                'https://api-free.deepl.com/v2/translate',
                new URLSearchParams({ text, target_lang: settings.translateTo }),
                { headers: { Authorization: `DeepL-Auth-Key ${settings.deeplApiKey}` } }
            )
            return { text: response.data.translations[0].text }
        } catch (err: unknown) {
            const e = err as { message?: string }
            return { error: e.message ?? 'Translation failed' }
        }
    })

    // 設定
    ipcMain.handle('settings:get', () => store.get('settings'))
    ipcMain.handle('settings:set', (_, settings: Settings) => store.set('settings', settings))

    // PDF URL（カスタムプロトコル）
    ipcMain.handle('pdf:getUrl', (_, pdfPath: string) => {
        const encoded = encodeURIComponent(pdfPath).replace(/%2F/g, '/')
        return `local-pdf://${encoded}`
    })

    // ===== 単語帳 IPC =====
    ipcMain.handle('vocab:getAll', () => vocabStore.get('vocabulary'))

    ipcMain.handle('vocab:add', (_, entry: VocabEntry) => {
        const current = vocabStore.get('vocabulary') as VocabEntry[]
        // 同じ単語・同じPDFの重複チェック
        const exists = current.some(
            (e) => e.word.toLowerCase() === entry.word.toLowerCase() && e.sourcePdf === entry.sourcePdf
        )
        if (!exists) {
            vocabStore.set('vocabulary', [entry, ...current])
        }
        return !exists  // true=新規追加, false=重複
    })

    ipcMain.handle('vocab:remove', (_, id: string) => {
        const current = vocabStore.get('vocabulary') as VocabEntry[]
        vocabStore.set('vocabulary', current.filter((e) => e.id !== id))
    })

    ipcMain.handle('vocab:exportCsv', () => {
        const entries = vocabStore.get('vocabulary') as VocabEntry[]
        const header = 'word,meaning,partOfSpeech,phonetic,example,sourcePdf,page,savedAt'
        const rows = entries.map((e) =>
            [e.word, e.meaning, e.partOfSpeech ?? '', e.phonetic ?? '',
            e.example ? e.example.replace(/,/g, '、') : '', e.sourcePdfName, e.page, e.savedAt
            ].map((v) => `"${v}"`).join(',')
        )
        return [header, ...rows].join('\n')
    })
}
