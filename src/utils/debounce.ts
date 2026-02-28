/**
 * デバウンス関数 - 指定された時間内に再度呼ばれた場合、前回のタイマーをリセット
 * テキスト選択 → API呼び出し時の過剰リクエストを防止するために使用
 */
export function debounce<T extends (...args: Parameters<T>) => void>(
    fn: T,
    delay: number
): (...args: Parameters<T>) => void {
    let timer: ReturnType<typeof setTimeout>
    return (...args: Parameters<T>) => {
        clearTimeout(timer)
        timer = setTimeout(() => fn(...args), delay)
    }
}
