import { useState, useCallback, useRef } from 'react'
import { TranslationResult, TranslationHistoryItem } from '../types/annotation'
import { debounce } from '../utils/debounce'
import axios from 'axios'

const DICTIONARY_API = 'https://api.dictionaryapi.dev/api/v2/entries/en'
const MAX_HISTORY = 5

async function fetchDictionaryInfo(word: string): Promise<Partial<TranslationResult>> {
    try {
        const res = await axios.get(`${DICTIONARY_API}/${encodeURIComponent(word.trim())}`)
        const entry = res.data?.[0]
        if (!entry) return {}
        const meaning = entry.meanings?.[0]
        const def = meaning?.definitions?.[0]
        return {
            partOfSpeech: meaning?.partOfSpeech ?? '',
            example: def?.example ?? '',
            phonetic: entry.phonetic ?? ''
        }
    } catch {
        return {}
    }
}

const nanoid = () => Math.random().toString(36).slice(2, 11)
const isSingleWord = (text: string) => text.trim().split(/\s+/).length === 1

export function useTranslation() {
    const [result, setResult] = useState<TranslationResult | null>(null)
    const [history, setHistory] = useState<TranslationHistoryItem[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const translateText = useCallback(async (text: string) => {
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

    // 200msデバウンス
    const debouncedTranslate = useRef(debounce(translateText, 200)).current

    return { result, history, isLoading, error, debouncedTranslate }
}
