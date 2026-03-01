import { useState, useCallback } from 'react'
import { TranslationResult, TranslationHistoryItem } from '../types/annotation'
import { nanoid } from '../utils/nanoid'
import { translationService, dictionaryService } from '../services/electronServices'

const MAX_HISTORY = 5
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

        const translateRes = await translationService.translate(trimmed)

        if (translateRes.error) {
            setError(translateRes.error)
            setIsLoading(false)
            return
        }

        const translationResult: TranslationResult = {
            text: translateRes.text ?? ''
        }

        // 単語の場合は辞書APIで品詞・例文・発音記号を補完
        if (isSingleWord(trimmed)) {
            const dictInfo = await dictionaryService.lookup(trimmed)
            Object.assign(translationResult, { word: trimmed, ...dictInfo })
        }

        setResult(translationResult)

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
