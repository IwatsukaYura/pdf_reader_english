import { useState, useCallback } from 'react'
import { TranslationResult, TranslationHistoryItem } from '../types/annotation'
import { nanoid } from '../utils/nanoid'

const DICTIONARY_API = 'https://api.dictionaryapi.dev/api/v2/entries/en'
const MAX_HISTORY = 5

/**
 * 1単語の場合のみ辞書APIで品詞・例文・発音記号を補完する
 * 翻訳バックエンドへの依存なしに追加情報を取得（fetch を直接使用）
 */
async function fetchDictionaryInfo(word: string): Promise<Partial<TranslationResult>> {
    try {
        const res = await fetch(`${DICTIONARY_API}/${encodeURIComponent(word.trim())}`)
        if (!res.ok) return {}
        const data = await res.json() as unknown[]
        const entry = (data as Record<string, unknown>[])?.[0]
        if (!entry) return {}
        const meanings = entry.meanings as Record<string, unknown>[] | undefined
        const meaning = meanings?.[0]
        const definitions = meaning?.definitions as Record<string, unknown>[] | undefined
        const def = definitions?.[0]
        return {
            partOfSpeech: (meaning?.partOfSpeech as string) ?? '',
            example: (def?.example as string) ?? '',
            phonetic: (entry.phonetic as string) ?? ''
        }
    } catch {
        return {}
    }
}

const isSingleWord = (text: string) => text.trim().split(/\s+/).length === 1

export function useTranslation() {
    const [result, setResult] = useState<TranslationResult | null>(null)
    const [history, setHistory] = useState<TranslationHistoryItem[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const translate = useCallback(async (text: string) => {
        const trimmed = text.trim()
        if (!trimmed || trimmed.length < 2) return

        setIsLoading(true)
        setError(null)

        // DeepL翻訳（IPC経由）
        const translateRes = await window.electronAPI.translate(trimmed)

        if (translateRes.error) {
            setError(translateRes.error)
            setIsLoading(false)
            return
        }

        const translationResult: TranslationResult = {
            text: translateRes.text ?? ''
        }

        // 単語の場合は辞書APIで追加情報取得
        if (isSingleWord(trimmed)) {
            const dictInfo = await fetchDictionaryInfo(trimmed)
            Object.assign(translationResult, { word: trimmed, ...dictInfo })
        }

        setResult(translationResult)

        // 履歴に追加（最大5件）
        const historyItem: TranslationHistoryItem = {
            id: nanoid(),
            originalText: trimmed,
            result: translationResult,
            timestamp: new Date().toISOString()
        }
        setHistory((prev) => [historyItem, ...prev].slice(0, MAX_HISTORY))
        setIsLoading(false)
    }, [])

    return { result, history, isLoading, error, translate }
}
