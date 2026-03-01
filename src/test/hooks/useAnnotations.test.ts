import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAnnotations } from '../../hooks/useAnnotations'
import { useAnnotationStore } from '../../stores/annotationStore'

// annotationRepositoryをモック — window.electronAPIに触れない
vi.mock('../../services/electronServices', () => ({
    annotationRepository: {
        save: vi.fn(),
        load: vi.fn(),
    },
}))

import { annotationRepository } from '../../services/electronServices'
const mockSave = vi.mocked(annotationRepository.save)
const mockLoad = vi.mocked(annotationRepository.load)

const SAMPLE_PDF = '/path/to/book.pdf'

const SAMPLE_ANNOTATION_DATA = {
    version: '1.0',
    pdfPath: SAMPLE_PDF,
    highlights: [{ id: 'h1', page: 1, text: 'hello', color: 'yellow', rects: [], createdAt: '' }],
    notes: []
}

beforeEach(() => {
    useAnnotationStore.setState({ pdfPath: null, highlights: [], notes: [], isDirty: false })
    vi.clearAllMocks()
})

describe('useAnnotations — loadAnnotations', () => {
    it('pdfPathをstoreにセットし、リポジトリからデータを読み込む', async () => {
        mockLoad.mockResolvedValue(SAMPLE_ANNOTATION_DATA)

        const { result } = renderHook(() => useAnnotations())

        await act(async () => {
            await result.current.loadAnnotations(SAMPLE_PDF)
        })

        expect(mockLoad).toHaveBeenCalledWith(SAMPLE_PDF)
        expect(useAnnotationStore.getState().highlights).toHaveLength(1)
    })

    it('保存済みデータがない場合（nullを返す）もエラーにならない', async () => {
        mockLoad.mockResolvedValue(null)

        const { result } = renderHook(() => useAnnotations())

        await act(async () => {
            await result.current.loadAnnotations(SAMPLE_PDF)
        })

        expect(useAnnotationStore.getState().highlights).toHaveLength(0)
    })
})

describe('useAnnotations — saveAnnotations', () => {
    it('pdfPathとデータが揃っている場合にリポジトリのsaveを呼ぶ', async () => {
        mockLoad.mockResolvedValue(null)
        mockSave.mockResolvedValue('/path/to/book.annot.json')

        useAnnotationStore.setState({
            pdfPath: SAMPLE_PDF,
            highlights: [],
            notes: [],
            isDirty: true,
        })

        const { result } = renderHook(() => useAnnotations())

        await act(async () => {
            await result.current.saveAnnotations()
        })

        expect(mockSave).toHaveBeenCalledWith(SAMPLE_PDF, expect.objectContaining({
            version: '1.0',
            pdfPath: SAMPLE_PDF,
        }))
    })

    it('保存後はisDirtyがfalseになる', async () => {
        mockSave.mockResolvedValue('/path/to/book.annot.json')
        useAnnotationStore.setState({ pdfPath: SAMPLE_PDF, highlights: [], notes: [], isDirty: true })

        const { result } = renderHook(() => useAnnotations())

        await act(async () => {
            await result.current.saveAnnotations()
        })

        expect(useAnnotationStore.getState().isDirty).toBe(false)
    })

    it('pdfPathがnullの場合はsaveを呼ばない', async () => {
        useAnnotationStore.setState({ pdfPath: null, highlights: [], notes: [], isDirty: false })

        const { result } = renderHook(() => useAnnotations())

        await act(async () => {
            await result.current.saveAnnotations()
        })

        expect(mockSave).not.toHaveBeenCalled()
    })
})
