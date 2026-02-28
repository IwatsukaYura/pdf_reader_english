import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Note } from '../../types/annotation'
import { useAnnotationStore } from '../../stores/annotationStore'
import { usePdfStore } from '../../stores/pdfStore'

interface NotesPanelProps {
    /** App から「このテキスト・ページでメモを追加」リクエストが来たとき */
    pendingNote?: { text: string; page: number } | null
    onPendingNoteHandled: () => void
}

export function NotesPanel({ pendingNote, onPendingNoteHandled }: NotesPanelProps) {
    const { notes, addNote, updateNote, removeNote } = useAnnotationStore()
    const { currentPage, goToPage } = usePdfStore()

    const [editingId, setEditingId] = useState<string | null>(null)
    const [editContent, setEditContent] = useState('')
    const [showNewForm, setShowNewForm] = useState(false)
    const [newContent, setNewContent] = useState('')
    const [newAnchor, setNewAnchor] = useState('')

    // pendingNote（右クリック「メモを追加」から）が届いたらフォームを開く
    if (pendingNote && !showNewForm) {
        setNewAnchor(pendingNote.text)
        setNewContent('')
        setShowNewForm(true)
        onPendingNoteHandled()
    }

    const handleAddNote = () => {
        if (!newContent.trim()) return
        addNote({ page: currentPage, anchorText: newAnchor.trim() || undefined, content: newContent.trim() })
        setNewContent('')
        setNewAnchor('')
        setShowNewForm(false)
    }

    const handleStartEdit = (note: Note) => {
        setEditingId(note.id)
        setEditContent(note.content)
    }

    const handleSaveEdit = () => {
        if (editingId) {
            updateNote(editingId, editContent)
            setEditingId(null)
        }
    }

    // ページ順でソート
    const sortedNotes = [...notes].sort((a, b) => a.page - b.page || a.createdAt.localeCompare(b.createdAt))

    return (
        <div className="flex flex-col h-full">
            {/* ヘッダー */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700">
                <span className="text-xs text-gray-400">{notes.length}件のメモ</span>
                <button
                    onClick={() => { setShowNewForm(true); setNewAnchor(''); setNewContent('') }}
                    className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-500 rounded cursor-pointer transition-colors"
                >
                    ＋ 新しいメモ
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {/* 新規作成フォーム */}
                {showNewForm && (
                    <div className="bg-gray-700 rounded-lg p-3 space-y-2 border border-blue-500/40">
                        <div className="text-xs font-semibold text-blue-300">📝 新しいメモ（p. {currentPage}）</div>
                        {newAnchor ? (
                            <div className="text-xs text-gray-400 bg-gray-800 rounded px-2 py-1 italic">
                                「{newAnchor.slice(0, 60)}{newAnchor.length > 60 ? '…' : ''}」
                            </div>
                        ) : (
                            <input
                                type="text"
                                placeholder="参照テキスト（任意）"
                                value={newAnchor}
                                onChange={(e) => setNewAnchor(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-400"
                            />
                        )}
                        <textarea
                            autoFocus
                            placeholder="メモを入力（Markdownが使えます）&#10;&#10;例: **重要** `コード` - リスト"
                            value={newContent}
                            onChange={(e) => setNewContent(e.target.value)}
                            rows={5}
                            className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-400 resize-none font-mono"
                        />
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => { setShowNewForm(false); setNewAnchor('') }}
                                className="text-xs px-2 py-1 text-gray-400 hover:text-white cursor-pointer"
                            >
                                キャンセル
                            </button>
                            <button
                                onClick={handleAddNote}
                                disabled={!newContent.trim()}
                                className="text-xs px-3 py-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed rounded cursor-pointer transition-colors"
                            >
                                保存
                            </button>
                        </div>
                    </div>
                )}

                {/* メモ一覧 */}
                {sortedNotes.length === 0 && !showNewForm && (
                    <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-500">
                        <div className="text-3xl opacity-30">📝</div>
                        <p className="text-xs">メモはまだありません</p>
                        <p className="text-xs text-gray-600">PDF上でテキストを右クリック →「メモを追加」</p>
                    </div>
                )}

                {sortedNotes.map((note) => (
                    <div
                        key={note.id}
                        className="bg-gray-750 border border-gray-700 hover:border-gray-600 rounded-lg overflow-hidden transition-colors"
                        style={{ backgroundColor: '#1f2937' }}
                    >
                        {/* メモヘッダー */}
                        <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-700">
                            <button
                                onClick={() => goToPage(note.page)}
                                className="text-xs text-blue-400 hover:text-blue-300 cursor-pointer tabular-nums"
                                title={`p.${note.page}へ移動`}
                            >
                                p. {note.page}
                            </button>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => handleStartEdit(note)}
                                    className="text-xs text-gray-500 hover:text-gray-300 px-1.5 py-0.5 rounded cursor-pointer"
                                    title="編集"
                                >
                                    ✏️
                                </button>
                                <button
                                    onClick={() => removeNote(note.id)}
                                    className="text-xs text-gray-500 hover:text-red-400 px-1.5 py-0.5 rounded cursor-pointer"
                                    title="削除"
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>

                        <div className="px-3 py-2">
                            {/* アンカーテキスト */}
                            {note.anchorText && (
                                <div className="text-xs text-yellow-300/70 italic mb-1.5 bg-yellow-400/10 rounded px-2 py-0.5 border-l-2 border-yellow-400/40">
                                    「{note.anchorText.slice(0, 50)}{note.anchorText.length > 50 ? '…' : ''}」
                                </div>
                            )}

                            {/* メモ本文：編集中か表示か */}
                            {editingId === note.id ? (
                                <div className="space-y-2">
                                    <textarea
                                        autoFocus
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        rows={6}
                                        className="w-full bg-gray-800 border border-blue-500 rounded px-2 py-1.5 text-xs text-white focus:outline-none resize-none font-mono"
                                    />
                                    <div className="flex gap-2 justify-end">
                                        <button
                                            onClick={() => setEditingId(null)}
                                            className="text-xs text-gray-400 hover:text-white cursor-pointer"
                                        >
                                            キャンセル
                                        </button>
                                        <button
                                            onClick={handleSaveEdit}
                                            className="text-xs px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded cursor-pointer"
                                        >
                                            保存
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="prose prose-invert prose-xs max-w-none text-xs text-gray-200 leading-relaxed">
                                    <ReactMarkdown>{note.content}</ReactMarkdown>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
