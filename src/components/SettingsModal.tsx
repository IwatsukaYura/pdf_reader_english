import { useState, useEffect } from 'react'

interface Settings {
    deeplApiKey: string
    translateTo: string
    notionToken: string
    notionDatabaseId: string
    sidePanelWidth: number
    autoSave: boolean
    notionAutoSync: boolean
}

interface SettingsModalProps {
    onClose: () => void
}

export function SettingsModal({ onClose }: SettingsModalProps) {
    const [settings, setSettings] = useState<Settings | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [testResult, setTestResult] = useState<string | null>(null)
    const [isTesting, setIsTesting] = useState(false)

    useEffect(() => {
        window.electronAPI.getSettings().then(setSettings)
    }, [])

    const handleSave = async () => {
        if (!settings) return
        setIsSaving(true)
        await window.electronAPI.setSettings(settings)
        setIsSaving(false)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
    }

    const handleTestDeepL = async () => {
        if (!settings?.deeplApiKey) return
        setIsTesting(true)
        setTestResult(null)
        // 一時的にAPIキーを保存してからテスト
        await window.electronAPI.setSettings(settings)
        const result = await window.electronAPI.translate('Hello')
        if (result.text) {
            setTestResult(`✅ 接続成功: "Hello" → "${result.text}"`)
        } else {
            setTestResult(`❌ 接続失敗: ${result.error}`)
        }
        setIsTesting(false)
    }

    if (!settings) {
        return (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                <div className="bg-gray-800 rounded-xl p-6 text-gray-400 text-sm">読み込み中...</div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
            <div
                className="bg-gray-800 rounded-xl shadow-2xl w-[520px] max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* ヘッダー */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
                    <h2 className="text-base font-semibold text-white">⚙️ 設定</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white text-xl leading-none cursor-pointer"
                    >
                        ✕
                    </button>
                </div>

                <div className="px-6 py-5 space-y-6">
                    {/* DeepL API */}
                    <section>
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                            🔤 DeepL 翻訳 API
                        </h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs text-gray-300 mb-1">
                                    APIキー
                                    <a
                                        href="https://www.deepl.com/ja/pro-api"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="ml-2 text-blue-400 hover:underline"
                                    >
                                        (発行はこちら)
                                    </a>
                                </label>
                                <input
                                    type="password"
                                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx:fx"
                                    value={settings.deeplApiKey}
                                    onChange={(e) => setSettings({ ...settings, deeplApiKey: e.target.value })}
                                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-400"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    無料プランは末尾が <code className="text-gray-300">:fx</code> になります
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs text-gray-300 mb-1">翻訳先言語</label>
                                <select
                                    value={settings.translateTo}
                                    onChange={(e) => setSettings({ ...settings, translateTo: e.target.value })}
                                    className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-400"
                                >
                                    <option value="JA">日本語</option>
                                    <option value="ZH">中国語</option>
                                    <option value="KO">韓国語</option>
                                    <option value="FR">フランス語</option>
                                    <option value="DE">ドイツ語</option>
                                </select>
                            </div>

                            {/* 接続テスト */}
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleTestDeepL}
                                    disabled={!settings.deeplApiKey || isTesting}
                                    className="px-3 py-1.5 text-xs bg-gray-600 hover:bg-gray-500 disabled:opacity-40 disabled:cursor-not-allowed rounded cursor-pointer transition-colors"
                                >
                                    {isTesting ? '確認中...' : '接続テスト'}
                                </button>
                                {testResult && (
                                    <span className={`text-xs ${testResult.startsWith('✅') ? 'text-green-400' : 'text-red-400'}`}>
                                        {testResult}
                                    </span>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Notion（Phase 3用プレースホルダー） */}
                    <section>
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                            📝 Notion 連携（Phase 3）
                        </h3>
                        <div className="space-y-3 opacity-60">
                            <div>
                                <label className="block text-xs text-gray-300 mb-1">Integration Token</label>
                                <input
                                    type="password"
                                    placeholder="secret_xxxxxxxxxxxx"
                                    value={settings.notionToken}
                                    onChange={(e) => setSettings({ ...settings, notionToken: e.target.value })}
                                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-400"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-300 mb-1">Database ID</label>
                                <input
                                    type="text"
                                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                                    value={settings.notionDatabaseId}
                                    onChange={(e) => setSettings({ ...settings, notionDatabaseId: e.target.value })}
                                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-400"
                                />
                            </div>
                        </div>
                    </section>
                </div>

                {/* フッター */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-700">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-gray-400 hover:text-white cursor-pointer transition-colors"
                    >
                        キャンセル
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded cursor-pointer transition-colors"
                    >
                        {isSaving ? '保存中...' : saved ? '✓ 保存しました' : '保存'}
                    </button>
                </div>
            </div>
        </div>
    )
}
