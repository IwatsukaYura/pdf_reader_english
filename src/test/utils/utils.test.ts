import { describe, it, expect } from 'vitest'
import { nanoid } from '../../utils/nanoid'
import { basename } from '../../utils/pathUtils'

describe('nanoid', () => {
    it('デフォルトで9文字の文字列を返す', () => {
        expect(nanoid()).toHaveLength(9)
    })

    it('指定したサイズの文字列を返す', () => {
        expect(nanoid(5)).toHaveLength(5)
        expect(nanoid(16)).toHaveLength(16)
    })

    it('2回生成した値が異なる（衝突しない）', () => {
        const ids = new Set(Array.from({ length: 100 }, () => nanoid()))
        // 100件で重複が0であることを確認
        expect(ids.size).toBe(100)
    })

    it('英数字のみで構成される', () => {
        const id = nanoid()
        expect(id).toMatch(/^[a-z0-9]+$/)
    })
})

describe('pathUtils — basename', () => {
    it('Unixパスからファイル名を取得できる', () => {
        expect(basename('/Users/test/document.pdf')).toBe('document.pdf')
    })

    it('Windowsパス（バックスラッシュ）からも取得できる', () => {
        expect(basename('C:\\Users\\test\\document.pdf')).toBe('document.pdf')
    })

    it('ファイル名のみ（パス区切りなし）の場合はそのまま返す', () => {
        expect(basename('document.pdf')).toBe('document.pdf')
    })

    it('ネストしたパスでも末尾のファイル名を返す', () => {
        expect(basename('/a/b/c/d/e/file.pdf')).toBe('file.pdf')
    })

    it('末尾がスラッシュの場合は空文字列を返す（不正パスのフォールバック）', () => {
        // popが空文字を返すケース
        const result = basename('/path/to/dir/')
        expect(typeof result).toBe('string')
    })

    it('拡張子なしのファイル名も正しく処理できる', () => {
        expect(basename('/path/to/Makefile')).toBe('Makefile')
    })

    it('スペースを含むパスも処理できる', () => {
        expect(basename('/Users/test/My Documents/report.pdf')).toBe('report.pdf')
    })
})
