/**
 * アプリケーション設定の型定義（Single Source of Truth）
 *
 * - electron/preload.ts の Settings と同一構造を維持すること
 * - src/types/global.d.ts の Window.electronAPI でも参照される
 */
export interface Settings {
    deeplApiKey: string
    notionToken: string
    notionDatabaseId: string
    translateTo: string
    sidePanelWidth: number
    autoSave: boolean
    notionAutoSync: boolean
}
