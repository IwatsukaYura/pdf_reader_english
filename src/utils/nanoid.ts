/**
 * ブラウザ/Electronレンダラー向けの簡易 nanoid 実装
 * crypto.getRandomValues を使うためセキュリティ的に十分なランダム性を持つ
 */
export function nanoid(size = 9): string {
    const bytes = crypto.getRandomValues(new Uint8Array(size))
    return Array.from(bytes, (b) => b.toString(36).padStart(2, '0')).join('').slice(0, size)
}
