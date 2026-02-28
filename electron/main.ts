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

// ローカルファイルをセキュアに配信するカスタムプロトコル
// file://はCORSでブロックされるため local-pdf:// を使う
function registerLocalPdfProtocol(): void {
    protocol.handle('local-pdf', async (request) => {
        try {
            const url = new URL(request.url)
            // local-pdf:///Users/xxx/book.pdf のようなURLからパスを取得
            const filePath = normalize(decodeURIComponent(url.pathname))
            return net.fetch(pathToFileURL(filePath).toString())
        } catch (err) {
            return new Response(`File not found`, { status: 404 })
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
        // hiddenInset だとwebkit-app-regionが必要で複雑になるため default を使用
        // macOSネイティブタイトルバーで確実にウィンドウ移動可能にする
        titleBarStyle: 'default',
        webPreferences: {
            // ★ 修正: ビルド出力は preload.js (index.jsではない)
            preload: join(__dirname, '../preload/preload.js'),
            sandbox: false,
            contextIsolation: true,
            nodeIntegration: false
        }
    })

    mainWindow.on('ready-to-show', () => {
        mainWindow.show()
    })

    mainWindow.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url)
        return { action: 'deny' }
    })

    const isDev = !app.isPackaged
    if (isDev && process.env['ELECTRON_RENDERER_URL']) {
        mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
        // 開発時はDevToolsを別ウィンドウで開く
        mainWindow.webContents.openDevTools({ mode: 'detach' })
    } else {
        mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
    }
}

app.whenReady().then(() => {
    registerLocalPdfProtocol()
    registerIpcHandlers()
    createWindow()

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

function registerIpcHandlers(): void {
    // ファイルを開くダイアログ
    ipcMain.handle('dialog:openFile', async () => {
        const result = await dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
        })
        if (result.canceled) return null
        return result.filePaths[0]
    })

    // アノテーション保存
    ipcMain.handle('annotation:save', async (_, pdfPath: string, data: object) => {
        const annotPath = pdfPath.replace(/\.pdf$/i, '.annot.json')
        await fs.writeFile(annotPath, JSON.stringify(data, null, 2), 'utf-8')
        return annotPath
    })

    // アノテーション読み込み
    ipcMain.handle('annotation:load', async (_, pdfPath: string) => {
        const annotPath = pdfPath.replace(/\.pdf$/i, '.annot.json')
        try {
            const content = await fs.readFile(annotPath, 'utf-8')
            return JSON.parse(content)
        } catch {
            return null
        }
    })

    // DeepL 翻訳（APIキーはMainプロセスで管理）
    ipcMain.handle('translate:deepl', async (_, text: string) => {
        const settings = store.get('settings') as Settings
        if (!settings.deeplApiKey) {
            return { error: 'DeepL APIキーが未設定です（設定画面から登録してください）' }
        }
        try {
            const response = await axios.post(
                'https://api-free.deepl.com/v2/translate',
                new URLSearchParams({ text, target_lang: settings.translateTo }),
                { headers: { Authorization: `DeepL-Auth-Key ${settings.deeplApiKey}` } }
            )
            return { text: response.data.translations[0].text }
        } catch (err: unknown) {
            const error = err as { message?: string }
            return { error: error.message ?? 'Translation failed' }
        }
    })

    // 設定の取得・保存
    ipcMain.handle('settings:get', () => store.get('settings'))
    ipcMain.handle('settings:set', (_, settings: Settings) => {
        store.set('settings', settings)
    })

    // PDFファイルのURLを返す（カスタムプロトコル経由で読み込む）
    ipcMain.handle('pdf:getUrl', (_, pdfPath: string) => {
        // local-pdf:///path/to/file.pdf 形式で返す
        const encoded = encodeURIComponent(pdfPath).replace(/%2F/g, '/')
        return `local-pdf://${encoded}`
    })
}
