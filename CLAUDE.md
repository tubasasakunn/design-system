# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 目的

オーナー個人の開発で使うためのデザインシステム。**いろいろなアイコンとカラーテーマを「自分の好み」で選び、選んだものを一元管理する**ことが目的。
ここで管理した資産を **Web(Vite ベースのフロントエンド)** と **Swift(iOS/macOS)** の両方のプロジェクトから利用する。

中心となる思想は **single source of truth + マルチプラットフォーム生成**:

- 人が編集するのは `sources/` のプラットフォーム非依存な原本（生 SVG と JSON トークン）だけ。
- `sources/` から `build/` のスクリプトで各プラットフォーム向けの `dist/` を生成する。
- Web も Swift も同じ原本から派生するため、アイコン名・カラートークン名が両者で一致する。

**「1 つの正解」に収束させない。** カラーテーマは複数持ち、アイコンも複数スタイル（丸み系 `rounded` / カクカク系 `sharp` …）を併存させて管理する。
何を採用し何を採用しないか、どれを既定にするかという**審美眼（デザイン思想）は [`DESIGN.md`](./DESIGN.md) に定義**する。`CLAUDE.md` は *仕組み*、`DESIGN.md` は *好みの基準*。

## コマンド

```bash
npm run build          # sources/ -> dist/web + dist/swift + dist/preview を再生成
npm run build:web      # Web 向けのみ
npm run build:swift    # Swift 向けのみ
npm run build:preview  # Pages 用カタログ(dist/preview/index.html)のみ
```

ビルドは Node 標準モジュールのみ（依存パッケージなし、`npm install` 不要）。`node build/build-web.mjs` のように直接も実行できる。

## ディレクトリ構成

```
sources/                 ← 唯一の正。編集するのはここだけ
  icons/<style>/<category>/<name>.svg   生 SVG。第1階層=style(丸み/カクカク…)、第2階層=category
  themes/<theme>/light.json
  themes/<theme>/dark.json        テーマ毎フォルダ。外観(appearance)別ファイル
build/                   ← 変換スクリプト(依存ゼロの .mjs)
  lib.mjs                  共通ユーティリティ(flatten / parseHex / loaders / findDefaultTheme)
  build-web.mjs           Web 向け生成
  build-swift.mjs         Swift 向け生成
  build-preview.mjs       Pages 用カタログ生成
dist/                    ← 生成物。手で編集しない。.gitignore 対象（コミットしない）
  web/      themes.css, themes.ts, icons/<style>/<category>/, icons.ts
  swift/    Colors/<Theme>.xcassets, Icons.xcassets(style で名前空間化), DesignSystem.swift
  preview/  index.html（自己完結カタログ）
DESIGN.md                ← デザイン思想・審美眼（何を好みとするか）
.github/workflows/pages.yml  ← main への push で build → GitHub Pages へ公開
```

## データモデル（原本のルール）

### アイコン (`sources/icons/`)

- **2 階層**で置く: `sources/icons/<style>/<category>/<name>.svg`。第1階層 = **style**、第2階層 = **category**、ファイル名 = アイコン名。
- **style** はアイコンの描き方の系統。複数併存させる（例: 丸み系 `rounded`、カクカク系 `sharp`、将来 `soft-fill` / `hand` など）。**既定スタイルは慣例として `rounded`**（`build/lib.mjs` の `defaultIconStyle`。無ければ先頭スタイル）。
- `name` は **同じ style 内で一意**（`kebab-case`）。**別 style では同名 SVG を持てる**（同じ意味のアイコンを丸み系/カクカク系で両方持つ、が前提）。`<style>/<category>/<name>` の三つ組で全体一意。
- **着色できるよう `stroke="currentColor"`（塗りなら `fill="currentColor"`）を使う。** 固定色を埋め込まない。
- 既定サイズは `viewBox="0 0 24 24"` の 24x24。`rounded` は `stroke-width="2"`・`stroke-linecap/linejoin="round"`、`sharp` は `linecap="butt"`・`linejoin="miter"`（各スタイルの規約は `DESIGN.md` 参照）。
- 既存セット（Lucide 等）から採用する場合も、その SVG ファイルを該当 style/category にコピーして取り込む（パッケージ依存にしない）。原本は常にローカルの SVG。

### カラーテーマ (`sources/themes/`)

- **テーマ毎に 1 フォルダ**（例 `cream/`, `ocean/`）。フォルダ名がテーマ名。**テーマは複数持つ**前提。
- フォルダ内に外観別の JSON（`light.json` / `dark.json`）。同一テーマの light と dark は **同じトークンキー集合**を持たせる（Swift の colorset で light/dark を 1 つに統合するため）。
- JSON はネストしたセマンティックトークン。`$` で始まるキー（`$appearance` 等）はメタ情報でビルド時に無視される。
- 値は hex（`#rgb` / `#rrggbb` / `#rrggbbaa`）。
- トークンは**用途ベースのセマンティック名**で揃える。現行の階層: `color.bg.*`, `color.fg.*`, `color.accent.*`, `color.border.*`, `color.status.*`。
  - 新トークンを足すときは **全テーマ・全外観に同じキーを追加する**（欠けると Web で変数未定義、Swift で colorset 不足になる）。
- **`:root` 既定値にするテーマは、その `light.json`（または任意の外観 JSON）に `"$default": true` を入れて指定する**（`build/lib.mjs` の `findDefaultTheme`）。特定テーマ名のハードコードはしない。`$default` を持つテーマが無ければ、どのテーマも `:root` を持たない（全テーマが属性スコープのみ）。

## 生成物の使い方（消費側）

### Web (Vite)

- `dist/web/themes.css` を import。テーマ切替は `<html data-theme="cream" data-appearance="dark">` のように属性で行う。`var(--color-bg-primary)` 等で参照。
- `dist/web/icons/<style>/<category>/<name>.svg` を import（`vite-plugin-svgr` でコンポーネント化など、消費側プロジェクトの方針に従う）。
- `dist/web/themes.ts`（`ThemeName`）/ `dist/web/icons.ts` で型補完。`icons.ts` は `{ rounded: [...], sharp: [...] }` 形の `icons`、`IconStyle` / `IconName` 型、`defaultIconStyle` を export する。

### Swift

- `dist/swift/Colors/<Theme>.xcassets` と `Icons.xcassets`、`DesignSystem.swift` を Swift Package / アプリのターゲットに追加。
- アイコン: **スタイルごとにネストした enum**。`DSIcon.Rounded.arrowLeft.image` / `DSIcon.Sharp.arrowLeft.image`（テンプレート描画なので `.foregroundStyle(...)` で着色可）。asset 名は `Icons.xcassets` の名前空間で `<style>/<name>`。
- 色: 各 `.xcassets` の colorset は light/dark を内包し OS の外観に自動追従。`Color("color-bg-primary", bundle: .module)`。
- `DSIcon.<Style>` / `DSTheme` enum で名前を型安全に扱う（`Image(bundle: .module)` 前提なので Swift Package での配布を想定）。

### カタログ / GitHub Pages

- `dist/preview/index.html` は自己完結の静的カタログ（依存ゼロ）。テーマ/外観を切り替えて全カラートークンの色見本と全アイコンを一覧し、「好み」を選ぶための画面。`sources/` を反映するので原本を変えたら `npm run build:preview` で更新。
- 公開は `.github/workflows/pages.yml` が担当。`main` への push で `npm run build` を実行し `dist/preview` を Pages へデプロイする。`dist/` はコミットしない（CI が毎回生成）。
- 初回のみ GitHub 側で **Settings → Pages → Source = "GitHub Actions"** に設定する必要がある。

## 作業ルール（Claude 向け）

- **`dist/` を直接編集しない。** 出力を変えたいときは `sources/` か `build/*.mjs` を直し、`npm run build` で再生成する。生成ファイルには `AUTO-GENERATED` ヘッダがある。
- アイコン/テーマを追加・変更したら **必ず `npm run build` を実行**し、Web と Swift の両方の生成物が壊れていないか確認する。
- トークン名やアイコン名は Web/Swift 共通。変換規則: `color.bg.primary` → CSS `--color-bg-primary` / Swift asset `color-bg-primary` / Swift enum はバッククォートで予約語を回避。命名変更は両プラットフォームに波及する破壊的変更として扱う。
- ビルドの依存ゼロ方針を保つ。将来 SVGO や Style Dictionary を導入する場合は `build/` 内に閉じ込め、`sources/` のスキーマと `dist/` の消費契約（CSS 変数名・xcassets 名）は維持する。
- アイコンを「好みで選ぶ」用途のため、採用候補を増やすときは `<style>/<category>` フォルダ単位で整理する。`name` の重複は **同じ style 内では避ける**（別 style での同名は意図的に可）。
- **新しい style の追加**（例: `hand` 系）は構造に関わる変更。`sources/icons/<style>/` を足せばビルドは自動で拾うが、命名規約・既定スタイルの方針は `DESIGN.md` に従い、必要なら ADR（`/adr`）に記録する。
