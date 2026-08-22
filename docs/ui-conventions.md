<!-- omabo docs -->
> **設置パス**: `omabo-frontend/docs/ui-conventions.md`
> **リポジトリ**: omabo-frontend — フロントエンド（Next.js / 管理画面 + 予約 LP）
> **内容**: コンポーネント規約、状態管理、i18n、日時の扱い
> リポジトリ構成の全体像は `omabo-platform/README.md` を参照。

# UI 規約

---

## 1. ディレクトリ構成

```
src/
├── app/
│   ├── (admin)/              # 管理画面。認証必須、日本語
│   │   ├── layout.tsx
│   │   ├── reservations/
│   │   ├── inventory/
│   │   └── settings/
│   └── (booking)/            # 予約 LP。未認証、英語
│       ├── layout.tsx
│       ├── page.tsx
│       └── r/[token]/        # 予約確認・変更・キャンセル
├── components/
│   ├── ui/                   # プリミティブ（Button, Input 等）。両者で共有
│   ├── admin/                # 管理画面専用
│   └── booking/              # LP 専用
├── lib/
│   ├── api.ts                # API クライアント
│   ├── datetime.ts           # タイムゾーン処理
│   └── errors.ts             # エラーコード → 表示文言
└── generated/
    └── api-types.ts          # 自動生成。編集しない
```

**`components/ui/` 以外を admin と booking で共有しない。**
認証・言語・デザイン・性能特性が異なるため、共有すると条件分岐だらけになる。

---

## 2. 日時の扱い

**すべての日時は店舗のタイムゾーンで表示する。**

```ts
// ✕ ブラウザのローカルタイムゾーン
new Date(reservation.starts_at).toLocaleString()

// ○ 店舗タイムゾーンで整形
formatInTimeZone(reservation.starts_at, restaurant.timezone, 'yyyy/MM/dd HH:mm')
```

海外からの予約でブラウザのタイムゾーンが異なると、日付が 1 日ずれる。

### `business_date` は暦日ではない

深夜跨ぎの店舗では、26:00 開始のスロットは前日の営業日に属する。
**`business_date` を `new Date()` に通してタイムゾーン変換しないこと。**
文字列（`YYYY-MM-DD`）として扱う。

---

## 3. 状態管理

- **サーバー状態はデータフェッチライブラリに任せる**（TanStack Query 等）。
  グローバルステートに API レスポンスを溜めない
- クライアント状態（フォーム入力、UI の開閉）は `useState` / フォームライブラリ
- **在庫・予約はキャッシュ時間を短くする。** 古い空き情報を表示すると
  「予約できると表示されたが取れない」が起きる

### 予約フローの状態

LP の予約フロー（日付 → 時間 → プラン → 人数 → 情報入力 → 決済）は
**ステップ間で選択内容を保持**する必要がある。

- URL に反映する（戻るボタンで前のステップに戻れる）
- 入力済みの顧客情報はブラウザのメモリに保持
- **localStorage に個人情報を保存しない**

---

## 4. エラー表示

```ts
// omabo-platform/docs/api-conventions.md の共通形式
{ error: { code: "INVENTORY_CONFLICT", message: "...", details: {...} } }
```

- `error.message` は表示可能な文言として backend が返す。そのまま表示してよい
- ただし**アクションが必要なエラーは独自の UI を用意する**

| code | UI |
|---|---|
| `INVENTORY_CONFLICT` | 該当ステップに戻し、選択肢を無効化 |
| `TOKEN_EXPIRED` | 店舗連絡先を表示 |
| `CONCURRENT_MODIFICATION` | 「他のユーザーが更新しました」＋再取得ボタン |
| `RATE_LIMITED` | 残り秒数を表示 |
| `INTERNAL_ERROR` | エラー ID のみ表示。詳細は出さない |

**エラー発生時に入力内容を破棄しない。**

---

## 5. i18n

| 領域 | 言語 |
|---|---|
| 管理画面 | 日本語 |
| 予約 LP | 英語（Phase 0〜1） |
| メール | `guest_language` に従う（backend 側） |

**LP の文字列をハードコードしない。**
Phase 2 で中国語対応が入るため、基盤は最初から通す。

管理画面は日本語固定でよいが、文言をコンポーネント内に散らさず
定数にまとめておくと後の調整が楽。

---

## 6. アクセシビリティと入力

- LP は海外からのアクセスが前提。**入力欄に日本語 IME 前提の制約を置かない**
  （氏名のカナ必須など）
- 電話番号は国際形式を受け付ける
- 人数選択はプランの `min_party_size` 〜 `max_party_size` の範囲で制限する

---

## 7. パフォーマンス

- LP は未認証で高トラフィックになり得る。**LCP 2.5 秒以内、CLS 0.1 未満**を目標
- 管理画面のカレンダーは**表示範囲のみ取得**。
  月ビューで全予約を一括ロードしない
- 画像は Next.js の Image 最適化を通す

---

## 8. コンポーネント規約

- **サーバーコンポーネントを既定とする。** 対話が必要な部分のみ `'use client'`
- プロップスの型は生成された API 型から導出する（重複定義しない）
- 1 ファイル 1 コンポーネントを原則とする
