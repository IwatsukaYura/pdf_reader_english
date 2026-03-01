import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTranslation } from '../../hooks/useTranslation'

// translationService と dictionaryService をモック
vi.mock('../../services/electronServices', () => ({
    translationService: {
        translate: vi.fn(),
    },
    dictionaryService: {
        lookup: vi.fn(),
    },
}))

import { translationService, dictionaryService } from '../../services/electronServices'
const mockTranslate = vi.mocked(translationService.translate)
const mockLookup = vi.mocked(dictionaryService.lookup)

beforeEach(() => {
    vi.clearAllMocks()
})

describe('useTranslation — translate（基本動作）', () => {
    it('翻訳結果がresultにセットされる', async () => {
        mockTranslate.mockResolvedValue({ text: '雄弁な' })
        mockLookup.mockResolvedValue({ partOfSpeech: 'adjective', phonetic: '/ˈeləkwənt/', example: 'An eloquent speaker.' })

        const { result } = renderHook(() => useTranslation())

        await act(async () => {
            await result.current.translate('eloquent')
        })

        expect(result.current.result?.text).toBe('雄弁な')
        expect(result.current.error).toBeNull()
        expect(result.current.isLoading).toBe(false)
    })

    it('1単語の場合はdictionaryService.lookupも呼ばれる', async () => {
        mockTranslate.mockResolvedValue({ text: '雄弁な' })
        mockLookup.mockResolvedValue({ partOfSpeech: 'adjective' })

        const { result } = renderHook(() => useTranslation())

        await act(async () => {
            await result.current.translate('eloquent')
        })

        expect(mockLookup).toHaveBeenCalledWith('eloquent')
        expect(result.current.result?.partOfSpeech).toBe('adjective')
    })

    it('複数単語のフレーズはlookupを呼ばない', async () => {
        mockTranslate.mockResolvedValue({ text: '彼は雄弁に語った' })

        const { result } = renderHook(() => useTranslation())

        await act(async () => {
            await result.current.translate('He spoke eloquently')
        })

        expect(mockLookup).not.toHaveBeenCalled()
    })

    it('翻訳履歴に追加される', async () => {
        mockTranslate.mockResolvedValue({ text: '雄弁な' })
        mockLookup.mockResolvedValue({})

        const { result } = renderHook(() => useTranslation())

        await act(async () => {
            await result.current.translate('eloquent')
        })

        expect(result.current.history).toHaveLength(1)
        expect(result.current.history[0].originalText).toBe('eloquent')
    })

    it('履歴は最大5件に制限される', async () => {
        mockTranslate.mockResolvedValue({ text: '訳文' })
        mockLookup.mockResolvedValue({})

        const { result } = renderHook(() => useTranslation())

        await act(async () => {
            for (const word of ['a', 'bb', 'ccc', 'dddd', 'eeeee', 'ffffff']) {
                await result.current.translate(word)
            }
        })

        expect(result.current.history).toHaveLength(5)
        // 最新のものが先頭
        expect(result.current.history[0].originalText).toBe('ffffff')
    })
})

describe('useTranslation — エラーハンドリング', () => {
    it('DeepL APIエラー時はerrorがセットされresultはnullのまま', async () => {
        mockTranslate.mockResolvedValue({ error: 'DeepL APIキーが未設定です' })

        const { result } = renderHook(() => useTranslation())

        await act(async () => {
            await result.current.translate('hello')
        })

        expect(result.current.error).toBe('DeepL APIキーが未設定です')
        expect(result.current.result).toBeNull()
        expect(result.current.isLoading).toBe(false)
    })

    it('1文字以下のテキストは翻訳リクエストを送らない', async () => {
        const { result } = renderHook(() => useTranslation())

        await act(async () => {
            await result.current.translate('a')
        })

        expect(mockTranslate).not.toHaveBeenCalled()
    })

    it('空文字は翻訳リクエストを送らない', async () => {
        const { result } = renderHook(() => useTranslation())

        await act(async () => {
            await result.current.translate('')
        })

        expect(mockTranslate).not.toHaveBeenCalled()
    })

    it('辞書APIが失敗してもDeepLの翻訳結果は表示される', async () => {
        mockTranslate.mockResolvedValue({ text: '雄弁な' })
        mockLookup.mockResolvedValue({}) // lookupが空を返す

        const { result } = renderHook(() => useTranslation())

        await act(async () => {
            await result.current.translate('eloquent')
        })

        expect(result.current.result?.text).toBe('雄弁な')
        expect(result.current.error).toBeNull()
    })
})
