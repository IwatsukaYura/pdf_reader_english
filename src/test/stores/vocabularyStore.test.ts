import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useVocabularyStore } from '../../stores/vocabularyStore'
import type { VocabEntry } from '../../types/vocab'

// ✅ vi.stubGlobal(window) の代わりに electronServices モジュールをモック
// → window全体を汚染しない、型安全、インターフェース契約を守ることを強制
vi.mock('../../services/electronServices', () => ({
    vocabularyRepository: {
        getAll: vi.fn(),
        add: vi.fn(),
        remove: vi.fn(),
        exportCsv: vi.fn(),
    },
}))

// モック関数への型付き参照
import { vocabularyRepository } from '../../services/electronServices'
const mockGetAll = vi.mocked(vocabularyRepository.getAll)
const mockAdd = vi.mocked(vocabularyRepository.add)
const mockRemove = vi.mocked(vocabularyRepository.remove)

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
    it('初回loadでリポジトリから単語リストを取得できる', async () => {
        mockGetAll.mockResolvedValue([makeEntry()])

        await useVocabularyStore.getState().load()

        expect(mockGetAll).toHaveBeenCalledTimes(1)
        expect(useVocabularyStore.getState().entries).toHaveLength(1)
        expect(useVocabularyStore.getState().isLoaded).toBe(true)
    })

    it('loadは2回目以降はリポジトリを呼び出さない', async () => {
        mockGetAll.mockResolvedValue([])
        await useVocabularyStore.getState().load()
        await useVocabularyStore.getState().load()

        expect(mockGetAll).toHaveBeenCalledTimes(1)
    })

    it('リポジトリエラー時もisLoadedがtrueになり、entriesは空のまま', async () => {
        mockGetAll.mockRejectedValue(new Error('IPC error'))

        await useVocabularyStore.getState().load()

        expect(useVocabularyStore.getState().isLoaded).toBe(true)
        expect(useVocabularyStore.getState().entries).toHaveLength(0)
    })
})

describe('vocabularyStore — add', () => {
    it('新規単語を追加できる', async () => {
        mockAdd.mockResolvedValue(true)

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
        mockAdd.mockResolvedValue(true)

        await useVocabularyStore.getState().add({
            word: 'test',
            meaning: 'テスト',
            sourcePdf: '/path/to/book.pdf',
            sourcePdfName: 'book.pdf',
            page: 1
        })

        const entry = useVocabularyStore.getState().entries[0]
        expect(entry.id).toMatch(/^v_/)
        expect(new Date(entry.savedAt).toString()).not.toBe('Invalid Date')
    })

    it('リポジトリが重複と判断した場合はentriesに追加されない', async () => {
        mockAdd.mockResolvedValue(false)

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

    it('新規追加された単語はリストの先頭に挿入される', async () => {
        mockAdd.mockResolvedValue(true)
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

    it('addはリポジトリに正しい構造のエントリを渡す', async () => {
        mockAdd.mockResolvedValue(true)

        await useVocabularyStore.getState().add({
            word: 'precise',
            meaning: '正確な',
            sourcePdf: '/path/book.pdf',
            sourcePdfName: 'book.pdf',
            page: 10
        })

        const calledWith = mockAdd.mock.calls[0][0]
        expect(calledWith.word).toBe('precise')
        expect(calledWith.id).toBeTruthy()
        expect(calledWith.savedAt).toBeTruthy()
    })
})

describe('vocabularyStore — remove', () => {
    it('IDを指定して単語を削除できる', async () => {
        mockRemove.mockResolvedValue(undefined)
        useVocabularyStore.setState({ entries: [makeEntry({ id: 'v_abc' })] })

        await useVocabularyStore.getState().remove('v_abc')

        expect(useVocabularyStore.getState().entries).toHaveLength(0)
        expect(mockRemove).toHaveBeenCalledWith('v_abc')
    })

    it('存在しないIDでremoveしても他のentriesに影響しない', async () => {
        mockRemove.mockResolvedValue(undefined)
        useVocabularyStore.setState({ entries: [makeEntry({ id: 'v_keep' })] })

        await useVocabularyStore.getState().remove('v_nonexistent')

        expect(useVocabularyStore.getState().entries).toHaveLength(1)
    })
})
