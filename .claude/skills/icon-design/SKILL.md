---
name: icon-design
description: アイコン作成の理論（グリッド/幾何・キーライン・光学補正、ストローク/cap/join・角丸・スタイル軸 line/fill/weight、メタファーと認知、SVG 正規化/最適化/マルチPF配布、アクセシビリティ）に基づいてアイコンを設計・追加・評価・検証します。新しいアイコンを作りたい、SVG を描きたい/直したい、rounded/sharp スタイルを足したい、線の太さ・角丸・終端を決めたい、アイコンが揃って見えない・潰れる・ぼやけるのを直したい、命名やカテゴリを決めたい、既存アイコンがハウススタイルに合うか判定したい場合に使用してください。
---

# アイコンの設計・追加・評価・検証

## 概要

このスキルは、アイコン制作の理論を**このデザインシステムの運用**（`sources/icons/<style>/<category>/<name>.svg` → `build/` → `dist/web` + `dist/swift`）に接続する。理論の本体は `references/` に網羅し、SKILL.md は「何をどの順で判断・実行するか」を示す。

判断は2つの基準を重ねる:
1. **理論（普遍）** — グリッド/幾何、ストローク/スタイル軸、意味論/一貫性/アクセシビリティ、SVG 制作/配布（`references/`）。
2. **審美眼（このオーナーの好み）** — `DESIGN.md` のハウススタイル。**理論を満たしても DESIGN.md を外れるアイコンは採用しない**（地は `rounded`、`sharp` 等は意図したアクセント）。

> 仕組みは `CLAUDE.md`、好みは `DESIGN.md`、**アイコンの理論と手順がこのスキル**。カラーは姉妹スキル `color-theme`。

## まず通すゲート（描く前に）

新しいアイコンを足す前に次を確認する（詳細は [references/semantics-accessibility.md](references/semantics-accessibility.md)）。

- **単一概念か** — 1アイコン=1意味。焦点が複数なら分割する。
- **メタファーは伝わるか** — resemblance（実物の描写）を優先。抽象記号は慣習化済み（虫眼鏡=検索/歯車=設定/ハンバーガー=メニュー）のみ。**ほぼ全アイコンは曖昧** → 消費側はラベル併記が既定（このスキルは形を整えるが解釈は保証しない）。
- **文化依存を避けたか** — 手のジェスチャ、「チェック=正解」前提、色単独の意味に依存しない。
- **ハウススタイルを通るか**（`DESIGN.md §2`） — やさしい線・ミニマル・角は丸い（`rounded` が地）。

**描かない/足さない**: 既存アイコンで足りる、意味が曖昧で標準化もされていない、ハウススタイルを外れる（高彩度ベタ・無秩序なスタイル混在）。量より質。

## ワークフロー

ユーザーの要求に応じて該当ステップへ。

### A. 新規アイコンを1個作る

1. **style とカテゴリを決める** — 地は `rounded`。テクニカル/テック寄りの意図があるときだけ `sharp`。category は意味で（`navigation`/`media`/`status`…）。配置 = `sources/icons/<style>/<category>/<name>.svg`。
2. **命名** — **描画対象ベースの kebab-case**（`floppy-disk` であって `save` ではない）。用途語は将来の alias/tag メタ層へ。名前は**同じ style 内で一意**（別 style の同名は意図的に可）。
3. **テンプレートから描く** — `templates/rounded.svg` または `templates/sharp.svg` をコピー。グリッド/幾何は [references/geometry-grid.md](references/geometry-grid.md):
   - `viewBox="0 0 24 24"`、グリフは**ライブエリア ~20×20**（最低1px 余白）に収める。
   - 支配的な形を**キーライン**に合わせる（円=直径20 / 正方形=18 / 縦長16×20 / 横長20×16）。**円は正方形より大きく**＝オーバーシュート込み。
   - 座標・アンカー・弧の中心を**整数グリッド**へ。斜めは原則 45°。
4. **線とスタイルを規約通りに**（[references/stroke-style.md](references/stroke-style.md)・`DESIGN.md §4.2/4.3`）:
   - `stroke="currentColor"` / `fill="none"`、`stroke-width="2"`、**固定色を埋めない**。
   - rounded → `round/round` ＋角丸 2px（8px未満は 1px）。sharp → `butt/miter`（**鋭角の bevel フォールバックに注意**）。
   - 2px は偶数幅 → 中心線を整数座標に置きピクセル境界を対称に跨がせる（ぼけ回避）。
5. **光学補正**（[references/geometry-grid.md](references/geometry-grid.md) §5）— **重心で視覚的に中央寄せ**し、**ブラーテスト**（`circle`/`square` と並べてぼかし、自分だけ濃く見えないか）で重さを確認。
6. **SVG 衛生**（[references/svg-production.md](references/svg-production.md)）— `width`/`height` 属性なし・`viewBox` は残す、装飾id/メタデータなし、穴あきは `fill-rule="evenodd"`、aria は原本に焼き込まない。
7. **チェックリストを通す** — `templates/checklist.md` の A–G 全項目。
8. **ビルド確認** — `npm run build`（Web `icons.ts` と Swift `DSIcon.<Style>` の両生成物が壊れないか）→ `npm run build:preview` で cream light/dark 両方で視認。

### B. 既存アイコンが「揃って見えない/潰れる/ぼやける」を直す

症状から原因へ（詳細は各 references）:

| 症状 | 主因 | 対処 |
|---|---|---|
| 1個だけ大きい/小さく見える | キーライン未適用・オーバーシュート不足 | 円/三角を枠より少しはみ出させ、重心で中央寄せ。ブラーテスト |
| 1個だけ重い/軽い | 視覚的重さの不均衡 | ストローク2px統一、内部密度を調整（[stroke-style.md](references/stroke-style.md) §1,6） |
| 小サイズでぼやける | 半ピクセル | 偶数幅は整数座標／奇数幅は+0.5。中心ボーダー禁止（[geometry-grid.md](references/geometry-grid.md) §4） |
| sharp の角が勝手に平切り | miter-limit 超過の bevel | 角度を寝かせる or `stroke-miterlimit` 明示（[stroke-style.md](references/stroke-style.md) §2） |
| 色が変わらない/テーマ追従しない | 固定色・`fill=none` 漏れ | `currentColor` 化、線アイコンは `fill="none"`（[svg-production.md](references/svg-production.md) §1） |
| 穴が塗り潰れる | fill-rule/SVGO mergePaths | `evenodd`、mergePaths を無効化（[svg-production.md](references/svg-production.md) §2,3） |

### C. 新しい style を足す（例 `soft-fill` / `hand`）

構造に関わる変更。`sources/icons/<style>/` を足せばビルドは自動で拾うが:
1. **既定は変えない** — 地は `rounded`。新 style は「意図したアクセント」（`DESIGN.md §4.4`）。
2. **描画規約を定義** — cap/join・角丸・塗り方・optical weight をどう揃えるか（fill 系は line 版と重さを揃える＝[stroke-style.md](references/stroke-style.md) §6）。
3. **可変フォント的多軸（weight/fill/duotone）は build 時バリアントに閉じ込める** — CLAUDE.md の「依存ゼロ・生 SVG」と整合（[stroke-style.md](references/stroke-style.md) §7）。
4. **ADR に記録** — 命名・既定スタイル方針を変えるなら `/adr` で起票。

### D. 既存アイコン/セットを評価する

`references/` の軸でレビューする: メタファー（resemblance か・曖昧でないか）／一貫性（visual weight・level of detail・perspective・テキスト整列）／幾何（キーライン・整数グリッド）／アクセシビリティ（意味あるアイコンは背景に3:1、対話は24px(AA)/44px(AAA) のヒット領域）／ハウススタイル適合。指摘は `templates/checklist.md` の項目に対応づける。

## クイックリファレンス

| やりたいこと | 規約値（本repo = Lucide 準拠） |
|:---|:---|
| キャンバス | `viewBox="0 0 24 24"`、ライブ ~20×20、最低1px 余白 |
| ストローク | `currentColor`・`fill="none"`・`stroke-width="2"`・偶数幅は整数座標 |
| rounded | `linecap=round linejoin=round`、角丸 2px（<8px は1px） |
| sharp | `linecap=butt linejoin=miter`、鋭角の bevel に注意 |
| キーライン | 円20 / 正方形18 / 縦長16×20 / 横長20×16（円>正方形） |
| 中央寄せ | 重心で視覚的に（bbox 中心でない）・ブラーテスト |
| 命名 | 描画対象ベース kebab-case、style 内で一意 |
| 角度 | 原則45°（他を使うなら自前規約→ADR） |

## 詳細ドキュメント

- [references/geometry-grid.md](references/geometry-grid.md) — グリッド・ライブエリア・キーライン・ピクセルフィッティング・光学補正・角度
- [references/stroke-style.md](references/stroke-style.md) — ストローク幅・cap/join・角丸/同心角・センターストローク vs アウトライン・スタイル軸（line/fill/duotone/weight/optical size）
- [references/semantics-accessibility.md](references/semantics-accessibility.md) — メタファー/認知・一貫性軸・ファミリー設計（状態/バッジ/RTL）・アクセシビリティ（WCAG）
- [references/svg-production.md](references/svg-production.md) — SVG 正規化・パス最適化・SVGO・小サイズ最適化・マルチPF配布・配布形態
- `templates/rounded.svg` / `templates/sharp.svg` — そのままコピーして描き始める出発点
- `templates/checklist.md` — 採用前に通す A–G チェックリスト

## 終了条件

- [ ] 「描くべきか」のゲート（単一概念・伝わるメタファー・ハウススタイル適合）を通した（不要なら足さないと明言した）
- [ ] 配置・命名規約に従っている（`<style>/<category>/<name>.svg`、描画対象ベース kebab-case、style 内一意）
- [ ] グリッド/線/光学（viewBox 0 0 24 24・currentColor・stroke 2px・キーライン・重心中央寄せ）を満たす
- [ ] SVG 衛生（width/height なし・viewBox 保持・固定色なし・穴あきは evenodd）を満たす
- [ ] `templates/checklist.md` の A–G を通した
- [ ] `npm run build` が通り、Web/Swift 両生成物が壊れていない／`npm run build:preview` で視認した
