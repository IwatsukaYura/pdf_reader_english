# 📖 EnglishReader

> **英語の本を、最速で自分のものにする。**  
> Mac 専用の英語学習特化型 PDF リーダー。

![App Screenshot](docs/screenshot.png)

---

## ✨ これは「ただの PDF リーダー」じゃない

英語の本を読むとき、こんな経験はありませんか？

- 知らない単語が出るたびに辞書アプリに切り替える
- ハイライトしたのに、後から何のためにマークしたかわからない
- 気になった単語をメモしても、どこに書いたか忘れる
- 単語帳への転記が面倒すぎて、結局続かない

**EnglishReader** はそのフリクションをすべてゼロにします。  
選んで、読んで、覚える。それだけ。

---

## 🚀 主な機能

### 🔤 テキストを選ぶだけで即時翻訳

単語を選択した瞬間、サイドパネルに日本語訳が表示されます。  
アプリを切り替える必要はありません。画面を離れる必要もありません。

- **DeepL API** による高精度な翻訳（文章・フレーズ両対応）
- **Free Dictionary API** で品詞・例文を自動取得
- 翻訳履歴を直近 5 件保持し、見返しやすい

```
━━━━━━━━━━━━━━━━━━━━
🔤 eloquent
━━━━━━━━━━━━━━━━━━━━
【訳】 雄弁な、表現力豊かな
【品詞】 形容詞 (adjective)
【例文】 She gave an eloquent speech.
         彼女は雄弁なスピーチをした。
━━━━━━━━━━━━━━━━━━━━
[📚 単語帳に保存]
```

---

### 📚 単語帳 → Notion に自動同期

「保存」ボタンを1回押すだけで、以下の情報が **すべて自動収集**されてローカル単語帳に登録されます。

| 項目 | 内容 |
|------|------|
| 単語 / フレーズ | 選択したテキスト |
| 意味 | DeepL による翻訳 |
| 品詞 | 辞書 API から自動取得 |
| 例文 | 辞書 API または前後の文章から自動抽出 |
| 出典 | PDF ファイル名 |
| ページ番号 | 読んでいたページ |

さらに、**Notion データベースへのワンクリック同期**も搭載。  
Notion を単語帳として活用し、フラッシュカードや復習ページとして管理できます。

---

### 🖊️ ハイライト & 余白メモ

- **4色のハイライト**（黄 / 緑 / ピンク / 水色）で重要度を色分け
- PDF の左右余白をクリックするだけで **マークダウン対応メモ** を追加
- テキストを選択 → 右クリック → 「メモを追加」で、特定の箇所にリンクしたメモも作成可能
- アノテーションは `Cmd+S` で JSON 形式保存。PDF と同じフォルダに保存されるので管理が楽

---

### ⌨️ キーボードファースト設計

| ショートカット | 動作 |
|---|---|
| `Cmd+O` | PDF を開く |
| `Cmd+S` | アノテーションを保存 |
| `Cmd++` / `Cmd+-` | ズームイン / アウト |
| `←` / `→` | 前ページ / 次ページ |
| `Cmd+G` | ページ番号入力にジャンプ |
| `Cmd+F` | PDF 内テキスト検索 |
| `Esc` | 選択解除 / モーダルを閉じる |

---

## 🛠️ 技術スタック

| レイヤー | 技術 |
|----------|------|
| デスクトップ | **Electron 29** |
| フロントエンド | **React 18 + TypeScript** |
| PDF レンダリング | **PDF.js (react-pdf)** |
| スタイリング | **Tailwind CSS** |
| 状態管理 | **Zustand** |
| ビルドツール | **electron-vite** |
| 翻訳 | **DeepL API** |
| 辞書 | **Free Dictionary API** |
| 外部連携 | **Notion API** |
| データ保存 | **ローカル JSON** |

---

## 📦 セットアップ

### 前提条件

- macOS 12 以降
- Node.js 18 以降
- DeepL API キー（[無料プランで 500 万文字/月](https://www.deepl.com/ja/pro-api)）
- （任意）Notion Integration Token & Database ID

### インストール

```bash
# リポジトリをクローン
git clone https://github.com/your-username/pdf_reader.git
cd pdf_reader

# 依存関係をインストール
npm install

# 開発モードで起動
npm run dev
```

### 初期設定

アプリを起動後、右上の ⚙️ 設定ボタンから以下を設定してください。

```
DeepL API キー:            sk-xxxxxxxxxxxxxxxx
Notion Integration Token:  secret_xxxxxxxxxxxx
Notion Database ID:        xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

---

## 📁 データの保存場所

| データ | 保存場所 |
|--------|---------|
| ハイライト・メモ | `<PDFと同じフォルダ>/<filename>.annot.json` |
| 単語帳 | `~/Library/Application Support/EnglishReader/vocabulary.json` |
| アプリ設定 | `~/Library/Application Support/EnglishReader/settings.json` |

アノテーションデータの例:

```json
{
  "version": "1.0",
  "pdfPath": "/Users/you/Books/atomic_habits.pdf",
  "highlights": [
    {
      "id": "h1",
      "page": 42,
      "text": "eloquent",
      "color": "yellow",
      "createdAt": "2026-02-28T10:00:00Z"
    }
  ],
  "notes": [
    {
      "id": "n1",
      "page": 42,
      "anchorText": "eloquent",
      "content": "## メモ\n重要な単語。次章にも登場する。",
      "position": "right-margin",
      "createdAt": "2026-02-28T10:01:00Z"
    }
  ]
}
```

---

## 🤝 コントリビューション

Issue や Pull Request は大歓迎です。  
機能リクエスト・バグ報告は [Issues](https://github.com/your-username/pdf_reader/issues) へどうぞ。

---

## 📄 ライセンス

MIT License

---

<div align="center">

**英語の本を、もっと深く、もっと速く。**

Made with ❤️ for English learners

</div>
