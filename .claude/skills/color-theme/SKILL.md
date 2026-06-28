---
name: color-theme
description: カラーテーマの理論（色空間 OKLCH/HCT、配色調和、コントラスト/アクセシビリティ WCAG・APCA、トークン設計）に基づいてテーマを設計・評価・追加・検証します。新しいカラーテーマを作りたい、配色を決めたい、アクセント/セマンティック/グレーを導きたい、ライトからダークを作りたい、トークンを足したい、コントラストや色覚多様性を確認したい、既存テーマがハウススタイルに合うか判定したい場合に使用してください。
---

# カラーテーマの設計・評価・検証

## 概要

このスキルは、色彩理論を**このデザインシステムの運用**（`sources/themes/<theme>/{light,dark}.json` → `build/` → `dist/`）に接続する。理論の本体は `references/` に網羅し、SKILL.md は「何をどの順で判断・実行するか」を示す。

判断は2つの基準を重ねる:
1. **理論（普遍）** — 知覚均等な色空間、配色調和、コントラスト/アクセシビリティ、トークン設計（`references/`）。
2. **審美眼（このオーナーの好み）** — `DESIGN.md` のハウススタイル。**理論を満たしても DESIGN.md を外れる色は採用しない**。

> 仕組みは `CLAUDE.md`、好みは `DESIGN.md`、**色の理論と手順がこのスキル**。

## まず通すゲート（色を決める前に）

新しい色・テーマを足す前に、`DESIGN.md §2 ハウススタイル`と次の理論ゲートを通す:

- **やさしい明度** — 純白/純黒を主役にしない（`references/accessibility.md §6.1`）。
- **低〜中彩度をデフォルト** — 鮮やかさは status / 一点CTA に限定（`DESIGN.md §2`、`harmony-palette.md §8`）。
- **可読性は別管理** — 淡い色の上には濃色インク。本文 `fg×bg` は 4.5:1 以上（`accessibility.md §1`）。
- **色だけに依存しない** — status は必ずアイコン/ラベル併用（`accessibility.md §5`）。
- **キー契約を壊さない** — 全テーマ・全外観で同一トークンキー集合（`token-architecture.md §6`）。

通らないもの（高彩度ベタ塗り基調・強罫線・純黒沈み込み・最大コントラスト黒文字）は「好みでない」として採用しない。

## ワークフロー

ユーザーの要求に応じて該当ステップへ。**色を決める設計は OKLCH で考え、JSON には hex を焼いて書く**（`color-spaces.md §5`）。

### A. 新しいテーマを作る

1. **性格を一言で決める**（例「クールなニュートラル白」）。`DESIGN.md §3.6` のラインナップ表に位置づける。
2. **アクセント色相を1つ選ぶ**（ブランドの相棒色）。oklch.com で L/C/H を決める。`DESIGN.md` 既定の相棒はティール。
3. **中立(グレー)を導く** — 純無彩色でなく、ベースの色温度に合わせ僅かに色相を足す（warm/cool gray、`harmony-palette.md §7.3`）。bg(明)→fg(暗) を OKLCH の L 等差で。
4. **セマンティック値を埋める** — テンプレ `templates/theme-light.template.json` を `sources/themes/<theme>/light.json` にコピー。全キー（`bg/fg/accent/border/status`）を埋める。`:root` 既定にするなら `"$default": true`。
5. **status を調和させる** — 意味色相(緑/黄橙/赤)に、アクセントのトーン/色相を僅かに寄せる（`harmony-palette.md §7.2`）。status は鮮やか可（`DESIGN.md §3.1`）。
6. **ダークを別最適化** — `dark.template.json` をコピーし §E の原則で作る。**単純反転しない**。
7. **検証** — `node .claude/skills/color-theme/scripts/check-contrast.mjs sources/themes/<theme>`。
8. **生成確認** — `npm run build` で Web/Swift/preview が壊れないか確認。preview でライト/ダーク両方を目視。

### B. 既存テーマ・配色を評価する

1. **ハウススタイル適合** — 上記ゲート＋`DESIGN.md §2/§7` に照らす。
2. **コントラスト** — `check-contrast.mjs` を実行。本文4.5:1、非テキストUI/境界3:1（`accessibility.md §1`）。FAIL は調整。
3. **色覚多様性** — 赤×緑など意味の区別が色のみになっていないか（`accessibility.md §4–5`）。
4. **調和** — アクセント/status/中立が同じ「家系」に見えるか（`harmony-palette.md §7`）。浮く色があれば彩度/明度をトーンに揃える。
5. **ダーク** — ライトの流用でなく別最適化されているか（彩度↓・アクセント明るめ・純黒回避）。

### C. トークンを追加・変更する

1. **用途名で命名**（色名を漏らさない）。`bg/fg/border/accent/status` の語彙に従う（`token-architecture.md §4`）。
2. **全テーマ・全外観に同時追加**（キー欠落は破壊的、`token-architecture.md §6`）。
3. **on-color ペアを忘れない** — 塗り面トークンを足したら、その上に乗る文字色トークンも。
4. 命名規約・既定の変更や Primitive 層の導入は**破壊的変更**。`accent.strong` 追加など構造に関わる判断は **ADR（`/adr`）に記録**（`DESIGN.md §3.4`, `token-architecture.md §7`）。
5. `check-contrast.mjs` → `npm run build`。

### D. カラーランプ／多色パレットを作る

1. **OKLCH で生成** — H固定、L を知覚等差で刻む、C は明部/暗部で軽く調整（`color-spaces.md §1.5/§2`, `token-architecture.md §2`）。HSL の L 等間隔は破綻する。
2. 段数は用途次第で 10〜13 段が目安（Radix=12 は役割固定、Tailwind=11）。
3. **多色パレット（DESIGN.md §3.4 の彩りパレット）**は「賑やかだが騒がしくない」原則で: トーン（彩度・明度）を固定し**色相だけ等間隔に散らす**、中立を土台に（`harmony-palette.md §8`）。各色は淡い面色＋濃いインクのペアで。

### E. ライトからダークを導出する

`references/token-architecture.md §5` / `accessibility.md §6` の原則:
1. 純黒(#000)を避ける（`#121212`〜`#1a1a1a`）。2. 彩度を落とす。3. エレベーションは影でなく明度（重なるほど明るく）。4. アクセントは明るめに。5. コントラストを測り直す。6. 大面積に高彩度を敷かない。

## クイックリファレンス

**色空間の使い分け**（`color-spaces.md`）

| 目的 | 使うもの |
|---|---|
| テーマ設計・ランプ生成の思考 | **OKLCH**（知覚均等・P3対応） |
| JSON に書く最終値 | **hex**（このリポジトリの消費契約。OKLCHで決めてhexに焼く） |
| コントラスト保証つき自動生成 | HCT（Material系。Tone差40→3:1, 50→4.5:1） |
| 使わない | HSL/HSV（パレット生成）・CMYK（Web） |

**調和スキーム**（`harmony-palette.md §1`）: モノクロ=UI土台に最適 / アナロガス=穏やか / 補色=対比強(アクセント運用) / スプリット補色=破綻しにくい実用型 / トライアド=ポップ / テトラード=最難。**全スキーム共通: 支配色1つ＋他は従属（60-30-10）**。

**コントラスト閾値（WCAG 2.2、`accessibility.md §1`）**

| 対象 | レベル | 閾値 |
|---|---|---|
| 通常テキスト | AA | 4.5:1 |
| 大きいテキスト(≥24px/≥18.66px bold) | AA | 3:1 |
| 非テキスト(UI/境界/フォーカス/情報アイコン) | AA | 3:1 |
| 通常/大 | AAA | 7:1 / 4.5:1 |

## ツール

```bash
# テーマのコントラスト検証（依存ゼロ）
node .claude/skills/color-theme/scripts/check-contrast.mjs sources/themes/<theme>
node .claude/skills/color-theme/scripts/check-contrast.mjs   # 全テーマ
```
外部ツール: [oklch.com](https://oklch.com)（OKLCH設計＋hex出力）、WebAIM/CCA（コントラスト）、Chrome DevTools の vision deficiency エミュレーション（CVD）。

## 詳細ドキュメント

- [references/color-spaces.md](references/color-spaces.md) — RGB/HSL/CMYK/Lab/LCH/**OKLCH**/HCT、知覚均等性、色域(P3)、どれを使うか
- [references/harmony-palette.md](references/harmony-palette.md) — 調和スキーム、三属性/トーン、tint/shade/tone、60-30-10、色温度・面積効果、心理、アクセントからの導出、賑やか×静か
- [references/accessibility.md](references/accessibility.md) — WCAG 2.x 計算式と閾値、式の弱点、APCA/WCAG3、色覚多様性、色のみ非依存、ダーク/ライト両立
- [references/token-architecture.md](references/token-architecture.md) — 3層トークン、ランプ、Material3/Radix/Carbon/Tailwind比較、命名、ダーク導出、マルチテーマ契約、このリポジトリとの対応
- `templates/` — `theme-light.template.json` / `theme-dark.template.json`（全キー網羅）
- `scripts/check-contrast.mjs` — テーマJSONの WCAG コントラスト検証

## 終了条件

- [ ] ハウススタイル＋理論ゲートを通した（外れる色は不採用と明言）
- [ ] 設計は OKLCH で考え、JSON には hex を書いた
- [ ] 全テーマ・全外観で**トークンキー集合が一致**（追加時は全箇所に同時追加）
- [ ] 本文 `fg×bg` 4.5:1・非テキスト 3:1 を満たす（`check-contrast.mjs` がFAILなし）
- [ ] status を色のみで意味づけしていない（アイコン/ラベル併用の前提を確認）
- [ ] ダークは単純反転でなく別最適化（純黒回避・彩度↓・アクセント明るめ）
- [ ] 構造に関わる変更（命名/既定/Primitive層/`accent.strong`等）は ADR に記録した
- [ ] `npm run build` で Web/Swift/preview が壊れないことを確認した
