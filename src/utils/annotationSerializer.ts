import { AnnotationFile } from '../types/annotation'

/**
 * アノテーションデータをJSON文字列にシリアライズ
 */
export function serializeAnnotations(data: AnnotationFile): string {
    return JSON.stringify(data, null, 2)
}

/**
 * JSON文字列をアノテーションデータにデシリアライズ
 */
export function deserializeAnnotations(json: string): AnnotationFile {
    const parsed = JSON.parse(json)
    if (!parsed.version || !parsed.pdfPath) {
        throw new Error('Invalid annotation file format')
    }
    return parsed as AnnotationFile
}

/**
 * 新しい空のアノテーションファイルを作成
 */
export function createEmptyAnnotationFile(pdfPath: string): AnnotationFile {
    return {
        version: '1.0',
        pdfPath,
        highlights: [],
        notes: []
    }
}
