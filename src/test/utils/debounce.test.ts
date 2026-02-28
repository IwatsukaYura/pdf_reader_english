import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { debounce } from '../../utils/debounce'

describe('debounce', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('指定した時間が経過した後に関数が呼ばれる', () => {
        const fn = vi.fn()
        const debounced = debounce(fn, 200)

        debounced('arg1')
        expect(fn).not.toHaveBeenCalled()

        vi.advanceTimersByTime(200)
        expect(fn).toHaveBeenCalledWith('arg1')
        expect(fn).toHaveBeenCalledTimes(1)
    })

    it('連続して呼ばれた場合、最後の呼び出しのみ実行される', () => {
        const fn = vi.fn()
        const debounced = debounce(fn, 200)

        debounced('first')
        debounced('second')
        debounced('third')

        vi.advanceTimersByTime(200)
        expect(fn).toHaveBeenCalledTimes(1)
        expect(fn).toHaveBeenCalledWith('third')
    })

    it('タイマーが完了する前に再度呼ばれるとリセットされる', () => {
        const fn = vi.fn()
        const debounced = debounce(fn, 200)

        debounced('arg1')
        vi.advanceTimersByTime(100) // 100ms経過（まだ発火しない）
        debounced('arg2')
        vi.advanceTimersByTime(100) // さらに100ms（合計200ms経過だがリセットされている）
        expect(fn).not.toHaveBeenCalled()

        vi.advanceTimersByTime(100) // さらに100ms（arg2から200ms経過）
        expect(fn).toHaveBeenCalledWith('arg2')
    })
})
