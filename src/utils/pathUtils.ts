/** パス文字列からファイル名部分のみ取得 */
export function basename(filePath: string): string {
    return filePath.replace(/\\/g, '/').split('/').pop() ?? filePath
}
