import { describe, it, expect, beforeEach } from 'vitest'
import { useAnnotationStore } from '../../stores/annotationStore'

// Zustand storeは各テスト前にリセット
beforeEach(() => {
    useAnnotationStore.setState({
        pdfPath: null,
        highlights: [],
        notes: [],
        isDirty: false
    })
})

describe('annotationStore — highlight操作', () => {
    it('ハイライトを追加できる', () => {
        const { addHighlight } = useAnnotationStore.getState()
        addHighlight({ page: 1, text: 'hello', color: 'yellow', rects: [] })

        const { highlights } = useAnnotationStore.getState()
        expect(highlights).toHaveLength(1)
        expect(highlights[0].text).toBe('hello')
        expect(highlights[0].color).toBe('yellow')
    })

    it('追加時にid・createdAtが自動付与される', () => {
        const { addHighlight } = useAnnotationStore.getState()
        addHighlight({ page: 1, text: 'world', color: 'green', rects: [] })

        const { highlights } = useAnnotationStore.getState()
        expect(highlights[0].id).toMatch(/^h_/)
        expect(highlights[0].createdAt).toBeTruthy()
        expect(new Date(highlights[0].createdAt).toString()).not.toBe('Invalid Date')
    })

    it('ハイライトを削除できる', () => {
        const { addHighlight, removeHighlight } = useAnnotationStore.getState()
        addHighlight({ page: 1, text: 'remove me', color: 'pink', rects: [] })

        const id = useAnnotationStore.getState().highlights[0].id
        removeHighlight(id)

        expect(useAnnotationStore.getState().highlights).toHaveLength(0)
    })

    it('存在しないIDを削除しても他のハイライトに影響しない', () => {
        const { addHighlight, removeHighlight } = useAnnotationStore.getState()
        addHighlight({ page: 1, text: 'keep me', color: 'cyan', rects: [] })

        removeHighlight('non-existent-id')

        expect(useAnnotationStore.getState().highlights).toHaveLength(1)
    })

    it('ハイライトの色を変更できる', () => {
        const { addHighlight, changeHighlightColor } = useAnnotationStore.getState()
        addHighlight({ page: 1, text: 'colorful', color: 'yellow', rects: [] })

        const id = useAnnotationStore.getState().highlights[0].id
        changeHighlightColor(id, 'green')

        expect(useAnnotationStore.getState().highlights[0].color).toBe('green')
    })

    it('ハイライト追加でisDirtyがtrueになる', () => {
        expect(useAnnotationStore.getState().isDirty).toBe(false)
        useAnnotationStore.getState().addHighlight({ page: 1, text: 'x', color: 'yellow', rects: [] })
        expect(useAnnotationStore.getState().isDirty).toBe(true)
    })

    it('markClean後はisDirtyがfalseになる', () => {
        useAnnotationStore.getState().addHighlight({ page: 1, text: 'x', color: 'yellow', rects: [] })
        useAnnotationStore.getState().markClean()
        expect(useAnnotationStore.getState().isDirty).toBe(false)
    })

    it('複数ハイライトの内、対象のみ色変更される', () => {
        const { addHighlight, changeHighlightColor } = useAnnotationStore.getState()
        addHighlight({ page: 1, text: 'A', color: 'yellow', rects: [] })
        addHighlight({ page: 1, text: 'B', color: 'yellow', rects: [] })

        const idA = useAnnotationStore.getState().highlights.find(h => h.text === 'A')!.id
        changeHighlightColor(idA, 'pink')

        const highlights = useAnnotationStore.getState().highlights
        expect(highlights.find(h => h.text === 'A')!.color).toBe('pink')
        expect(highlights.find(h => h.text === 'B')!.color).toBe('yellow')
    })
})

describe('annotationStore — note操作', () => {
    it('メモを追加できる', () => {
        useAnnotationStore.getState().addNote({ page: 5, content: 'テストメモ' })

        const { notes } = useAnnotationStore.getState()
        expect(notes).toHaveLength(1)
        expect(notes[0].content).toBe('テストメモ')
        expect(notes[0].page).toBe(5)
    })

    it('メモ追加時にid・createdAt・updatedAtが自動付与される', () => {
        useAnnotationStore.getState().addNote({ page: 1, content: 'check fields' })

        const note = useAnnotationStore.getState().notes[0]
        expect(note.id).toMatch(/^n_/)
        expect(note.createdAt).toBeTruthy()
        expect(note.updatedAt).toBeTruthy()
    })

    it('メモを更新できる', () => {
        useAnnotationStore.getState().addNote({ page: 1, content: '初期内容' })
        const id = useAnnotationStore.getState().notes[0].id

        useAnnotationStore.getState().updateNote(id, '更新された内容')

        expect(useAnnotationStore.getState().notes[0].content).toBe('更新された内容')
    })

    it('メモを削除できる', () => {
        useAnnotationStore.getState().addNote({ page: 1, content: '削除対象' })
        const id = useAnnotationStore.getState().notes[0].id

        useAnnotationStore.getState().removeNote(id)

        expect(useAnnotationStore.getState().notes).toHaveLength(0)
    })

    it('anchorTextを持つメモを追加できる', () => {
        useAnnotationStore.getState().addNote({ page: 3, content: 'メモ内容', anchorText: 'テキスト' })

        expect(useAnnotationStore.getState().notes[0].anchorText).toBe('テキスト')
    })
})

describe('annotationStore — AnnotationFile生成', () => {
    it('pdfPathが未設定の場合はnullを返す', () => {
        expect(useAnnotationStore.getState().getAnnotationFile()).toBeNull()
    })

    it('pdfPathが設定済みの場合はAnnotationFileを返す', () => {
        useAnnotationStore.setState({ pdfPath: '/path/to/test.pdf' })
        useAnnotationStore.getState().addHighlight({ page: 1, text: 'hi', color: 'yellow', rects: [] })

        const file = useAnnotationStore.getState().getAnnotationFile()
        expect(file).not.toBeNull()
        expect(file!.pdfPath).toBe('/path/to/test.pdf')
        expect(file!.highlights).toHaveLength(1)
        expect(file!.version).toBe('1.0')
    })
})
