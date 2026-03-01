import { describe, it, expect } from 'vitest'
import {
    serializeAnnotations,
    deserializeAnnotations,
    createEmptyAnnotationFile
} from '../../utils/annotationSerializer'
import { AnnotationFile } from '../../types/annotation'

describe('annotationSerializer', () => {
    const sampleAnnotation: AnnotationFile = {
        version: '1.0',
        pdfPath: '/Users/test/book.pdf',
        highlights: [
            {
                id: 'h1',
                page: 42,
                text: 'eloquent',
                color: 'yellow',
                rects: [],
                createdAt: '2026-02-28T10:00:00Z'
            }
        ],
        notes: [
            {
                id: 'n1',
                page: 42,
                anchorText: 'eloquent',
                content: '## メモ\n重要な単語',
                createdAt: '2026-02-28T10:01:00Z',
                updatedAt: '2026-02-28T10:01:00Z'
            }
        ]
    }

    it('アノテーションを正しくシリアライズできる', () => {
        const json = serializeAnnotations(sampleAnnotation)
        const parsed = JSON.parse(json)
        expect(parsed.version).toBe('1.0')
        expect(parsed.highlights).toHaveLength(1)
        expect(parsed.notes).toHaveLength(1)
    })

    it('JSONからアノテーションを正しくデシリアライズできる', () => {
        const json = serializeAnnotations(sampleAnnotation)
        const result = deserializeAnnotations(json)
        expect(result.pdfPath).toBe('/Users/test/book.pdf')
        expect(result.highlights[0].text).toBe('eloquent')
        expect(result.notes[0].content).toContain('重要な単語')
    })

    it('不正なJSONを渡すとエラーをスローする', () => {
        expect(() => deserializeAnnotations('{"invalid": true}')).toThrow(
            'Invalid annotation file format'
        )
    })

    it('空のアノテーションファイルを作成できる', () => {
        const empty = createEmptyAnnotationFile('/path/to/book.pdf')
        expect(empty.version).toBe('1.0')
        expect(empty.highlights).toHaveLength(0)
        expect(empty.notes).toHaveLength(0)
    })

    it('シリアライズ → デシリアライズで元のデータと一致する', () => {
        const json = serializeAnnotations(sampleAnnotation)
        const result = deserializeAnnotations(json)
        expect(result).toEqual(sampleAnnotation)
    })
})
