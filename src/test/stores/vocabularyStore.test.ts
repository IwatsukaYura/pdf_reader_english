import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useVocabularyStore } from '../../stores/vocabularyStore'
import type { VocabEntry } from '../../types/vocab'

// window.electronAPI のモック
const mockVocabAdd = vi.fn()
const mockVocabRemove = vi.fn()
const mockVocabGetAll = vi.fn()

vi.stubGlobal('window', {
    electronAPI: {
        vocabGetAll: mockVocabGetAll,
        vocabAdd: mockVocabAdd,
        vocabRemove: mockVocabRemove
    }
})

const makeEntry = (overrides: Partial<VocabEntry> = {}): VocabEntry => ({
    id: 'v_test1',
    word: 'eloquent',
    meaning: '雄弁な',
    sourcePdf: '/path/to/book.pdf',
    sourcePdfName: 'book.pdf',
    page: 42,
    savedAt: '2026-03-01T00:00:00Z',
    ...overrides
})

beforeEach(() => {
    useVocabularyStore.setState({ entries: [], isLoaded: false })
    vi.clearAllMocks()
})

describe('vocabularyStore — load', () => {
    it('初回loadでelectronAPIから単語リストを取得できる', async () => {
        const entries = [makeEntry()]
        mockVocabGetAll.mockResolvedValue(entries)

        await useVocabularyStore.getState().load()

        expect(useVocabularyStore.getState().entries).toHaveLength(1)
        expect(useVocabularyStore.getState().isLoaded).toBe(true)
    })

    it('loadは2回目以降はAPIを呼び出さない', async () => {
        mockVocabGetAll.mockResolvedValue([])
        await useVocabularyStore.getState().load()
        await useVocabularyStore.getState().load()

        expect(mockVocabGetAll).toHaveBeenCalledTimes(1)
    })

    it('APIエラー時もisLoadedがtrueになる', async () => {
        mockVocabGetAll.mockRejectedValue(new Error('IPC error'))

        await useVocabularyStore.getState().load()

        expect(useVocabularyStore.getState().isLoaded).toBe(true)
        expect(useVocabularyStore.getState().entries).toHaveLength(0)
    })
})

describe('vocabularyStore — add', () => {
    it('新規単語を追加できる', async () => {
        mockVocabAdd.mockResolvedValue(true)

        const isNew = await useVocabularyStore.getState().add({
            word: 'eloquent',
            meaning: '雄弁な',
            sourcePdf: '/path/to/book.pdf',
            sourcePdfName: 'book.pdf',
            page: 42
        })

        expect(isNew).toBe(true)
        expect(useVocabularyStore.getState().entries).toHaveLength(1)
        expect(useVocabularyStore.getState().entries[0].word).toBe('eloquent')
    })

    it('追加時にid・savedAtが自動生成される', async () => {
        mockVocabAdd.mockResolvedValue(true)

        await useVocabularyStore.getState().add({
            word: 'test',
            meaning: 'テスト',
            sourcePdf: '/path/to/book.pdf',
            sourcePdfName: 'book.pdf',
            page: 1
        })

        const entry = useVocabularyStore.getState().entries[0]
        expect(entry.id).toMatch(/^v_/)
        expect(entry.savedAt).toBeTruthy()
        expect(new Date(entry.savedAt).toString()).not.toBe('Invalid Date')
    })

    it('重複単語（サーバー側が重複と判断）の場合はentriesに追加されない', async () => {
        mockVocabAdd.mockResolvedValue(false) // 重複

        const isNew = await useVocabularyStore.getState().add({
            word: 'duplicate',
            meaning: '重複',
            sourcePdf: '/path/to/book.pdf',
            sourcePdfName: 'book.pdf',
            page: 1
        })

        expect(isNew).toBe(false)
        expect(useVocabularyStore.getState().entries).toHaveLength(0)
    })

    it('新規追加された単語はリストの先頭に追加される', async () => {
        mockVocabAdd.mockResolvedValue(true)
        useVocabularyStore.setState({ entries: [makeEntry({ word: 'existing' })] })

        await useVocabularyStore.getState().add({
            word: 'new-word',
            meaning: '新しい単語',
            sourcePdf: '/path/to/book.pdf',
            sourcePdfName: 'book.pdf',
            page: 1
        })

        expect(useVocabularyStore.getState().entries[0].word).toBe('new-word')
    })
})

describe('vocabularyStore — remove', () => {
    it('IDを指定して単語を削除できる', async () => {
        mockVocabRemove.mockResolvedValue(undefined)
        useVocabularyStore.setState({ entries: [makeEntry({ id: 'v_abc' })] })

        await useVocabularyStore.getState().remove('v_abc')

        expect(useVocabularyStore.getState().entries).toHaveLength(0)
        expect(mockVocabRemove).toHaveBeenCalledWith('v_abc')
    })

    it('存在しないIDでremoveしても他のentriesに影響しない', async () => {
        mockVocabRemove.mockResolvedValue(undefined)
        useVocabularyStore.setState({ entries: [makeEntry({ id: 'v_keep' })] })

        await useVocabularyStore.getState().remove('v_nonexistent')

        expect(useVocabularyStore.getState().entries).toHaveLength(1)
    })
})
