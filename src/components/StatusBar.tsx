import { usePdfStore } from '../stores/pdfStore'
import { useAnnotationStore } from '../stores/annotationStore'

export function StatusBar() {
    const { currentPage, numPages, pdfPath } = usePdfStore()
    const { highlights, isDirty } = useAnnotationStore()

    if (!pdfPath) return null

    return (
        <div className="flex items-center gap-4 px-3 h-6 bg-gray-800 border-t border-gray-700 text-xs text-gray-400 shrink-0 select-none">
            <span>ページ {currentPage} / {numPages}</span>
            <span className="text-gray-600">|</span>
            <span>ハイライト数: {highlights.length}</span>
            <span className="text-gray-600">|</span>
            <span className={isDirty ? 'text-orange-400' : 'text-green-400'}>
                {isDirty ? '● 未保存' : '保存済み'}
            </span>
        </div>
    )
}
