# design-system

アイコンセットと複数のカラーテーマを、自分の好みで選び・管理するための個人用デザインシステム。
1 つの source of truth（`sources/`）を保ち、Web(Vite) と Swift(iOS/macOS) 向けに `dist/` を生成する。

## 使い方

```bash
npm run build        # sources/ -> dist/web + dist/swift を再生成
npm run build:web    # Web 向けのみ
npm run build:swift  # Swift 向けのみ
```

- 追加・編集するのは `sources/` だけ。`dist/` は生成物（手で触らない）。
- アイコン: `sources/icons/<category>/<name>.svg`（`stroke="currentColor"` の 24x24 を基本）。
- カラーテーマ: `sources/themes/<theme>/light.json` と `dark.json`。

## カタログ (GitHub Pages)

`npm run build` で `dist/preview/index.html`（テーマ/アイコンを見比べる静的カタログ）が生成される。
`main` への push で GitHub Actions が自動デプロイする（初回のみ Settings → Pages → Source = "GitHub Actions" が必要）。

詳細な構成・ルール・運用方針は [CLAUDE.md](./CLAUDE.md) を参照。
