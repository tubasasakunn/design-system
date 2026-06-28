# カラートークンのアーキテクチャと運用 リファレンス

> color-theme スキルの参考資料。主要DSの実装に基づく。このリポジトリの既存体系との対応は §7。

## 1. トークンの階層構造（Tiers）

成熟したDSはカラートークンを **3層**に分ける（呼び名はDSにより異なるが責務は共通）。

| 層 | 別名 | 例 | 責務 | 参照先 |
|---|---|---|---|---|
| **Primitive** | Global/Reference/Base | `blue-500`, `#3B82F6` | 色そのもの。文脈を持たない生の値（パレット） | なし |
| **Semantic** | Alias/System/Decision | `color.bg.primary`, `color.accent.default` | 「どこで・なぜ使うか」の**意図** | Primitiveを指す |
| **Component** | — | `button.bg`, `input.placeholder` | 部品固有の決定 | Semantic（時にPrimitive） |

**なぜ3層か**: 関心の分離（色を持つ／使い道／部品の例外）。**テーマ切替の唯一のレバーがSemantic層**——ライト/ダーク・マルチブランドの差は「SemanticがどのPrimitiveを指すか」を差し替えるだけ。変更が局所化し、消費側コードに `blue` が漏れない。

**ライト/ダークでの参照切替がコア**:
```
# light:  color.bg.primary → white      / color.fg.primary → gray-900
# dark :  color.bg.primary → gray-950   / color.fg.primary → gray-50
```
コンポーネントは常に `color.bg.primary` を読むだけで明暗を知らない。この間接参照が「単純反転」を超えた繊細なダーク調整（§5）を可能にする。

> Component層は乱用するとトークンが爆発する。Semanticを厚く、Componentは本当に部品固有の決定だけに絞る。

---

## 2. トーナルパレット / カラーランプ

1色相を**明度段階**に展開した梯子。Primitive層の中核。

**段の数え方**:
- **数値ステップ式（Tailwind/Material系）**: `50,100,…,900,950`。**50が最明・950が最暗**。Tailwind v4は**11段**。Material内部は **0〜100のトーン**(0黒,100白)。
- **用途固定12段式（Radix）**: `1〜12`。各ステップに固定役割（§3）。

**何段必要か**: UI実用は概ね **10〜13段**（背景・ホバー・ボーダー・ソリッド・テキストの役割をカバーする解像度）。

**知覚均等な刻み（現代手法）**: 素朴なHSLの lightness 等間隔は知覚的に不均等。現代は **OKLCH**（L=知覚明度）で組む。
- **Lを等間隔に刻む**と均等な明るさの段に見える＝ランプが滑らか。
- 色相をまたいでも段の明るさが揃い、**異なる色相のランプ間でステップ番号を揃えられる**（red-500とblue-500が同程度の明度）。
- 広色域(P3)を活かせる。

**Tailwind v4 の OKLCH 移行**: デフォルトパレットを rgb→oklch に刷新（クラス名は不変、内部値がOKLCH）。狙いはP3でのより鮮やかな発色と補間・コントラスト改善。

---

## 3. 主要DSのカラーアプローチ比較

### Material Design 3（HCT × トーナルパレット × Color Roles）
- **HCT色空間**(Hue/Chroma/Tone, Tone 0–100)。
- **キーカラー→トーナルパレット**: primary/secondary/tertiary/neutral/neutral-variant の5キーから 0〜100 のトーンを生成。
- **Color Roles（約26）**: `primary`+`on-primary`+`primary-container`+`on-primary-container` という「色＋その上に乗る on- 色」ペア構造。
- **Tone-based surfaces**: 背景段階(`surface-container-lowest…highest`)をトーンで表現し、**陰影でなく明度差でエレベーション**。
- **Dynamic Color**: 壁紙1色から全パレット自動生成。
- **数値保証**: トーン差 **40→比≥3.0**、**50→≥4.5**。思想は「色はアルゴリズムで導出」。

### Radix Colors（12ステップ × ステップ固定の用途）
| Steps | 用途 |
|---|---|
| **1–2** | 背景（1:アプリ, 2:subtleなコンポーネント） |
| **3–5** | コンポーネント背景（3:通常, 4:hover, 5:pressed/selected） |
| **6–8** | ボーダー（6:subtle, 7:UI境界, 8:hover/フォーカス） |
| **9–10** | ソリッド色（9:主役ソリッド＝最も彩度高い「ブランド色」, 10:hover） |
| **11–12** | テキスト（11:low-contrast, 12:high-contrast） |
- **APCA保証**: step2背景上で step11が **Lc 60**、step12が **Lc 90**。
- light/dark/alpha(透過)/P3 を同名スケールで提供。思想は「役割をステップ番号に焼き込む」。

### IBM Carbon / Adobe Spectrum（グローバル→エイリアス × レイヤリング）
- Carbon: グローバルパレット→テーマ別役割変数。**4テーマ**(white/g10/g90/g100)。**レイヤリング**(base/layer-01/02/03)で入れ子の深さに応じ背景が一段ずつ明暗。「明度でエレベーション」。
- Spectrum: グローバル(生値)→alias(用途)→component の3層を明示。「デザイン決定をデータ化したのがトークン」。

### Tailwind / shadcn/ui（CSS変数 × セマンティック × OKLCH）
- shadcn: Tailwindの上にセマンティックCSS変数(約27)。`--background/--foreground/--primary/--primary-foreground/--muted/--destructive/--border/--ring…`。
- **foreground ペア規約**: `X` と `X-foreground` を必ず対に（Materialの `on-` と同思想）。
- ダーク: `:root` と `.dark` で**同じ変数名を上書き**。値はOKLCH。コンポーネントはセマンティック変数だけ参照。

---

## 4. セマンティックトークンの命名規則

**大原則: 色名を漏らさず「用途」で名付ける**。✗`color-blue` → ✓`color.accent.default`。
名前 = 「どこに(slot) + 役割(role) + 状態/強度(modifier)」。

| プレフィックス | 意味 | 例 |
|---|---|---|
| `bg` | 面の塗り | `bg.primary`, `bg.elevated`, `bg.inverse` |
| `fg` (text/on) | 文字・アイコン | `fg.primary`, `fg.muted`, `fg.on-accent` |
| `border` | 境界・区切り | `border.default`, `border.focus` |
| `accent` (brand) | ブランド・主役ソリッド | `accent.default`, `accent.hover` |
| `status` | 状態色 | `status.success/warning/error/info` |

**状態(interaction state)の扱い** — 2流派:
1. **状態をmodifierで段階保持**（Radix的・推奨）: `.default/.hover/.active/.disabled`。
2. **強度(emphasis)で持つ**: `subtle/muted/default/strong/bold`。
- **disabled** は不透明度ハックでなく**専用トークン**(`fg.disabled`等)を用意（重なり時に破綻するため）。
- **on-color(前景ペア)** を必ず定義（背景色を変えたとき文字色が自動追従）。

---

## 5. ライトからダークを導出する実務原則

**単純反転がダメな理由**: 彩度そのままだと暗所で眩しく濁る／コントラストが破綻／影で示していたエレベーションが消える／ブランド色が沈む。

**ダーク設計の原則**:
1. **純黒(#000)を避ける** → `#121212`〜`#1a1a1a` 系（Materialダーク基準面は #121212）。
2. **彩度を落とす(desaturate)**、明度を調整。鮮やかな原色は使わない。
3. **エレベーションを「影」でなく「明度」で**: 重なるほど面を**明るく**（手前ほど明るい）。
4. **コントラストを再検証**（ライト値を流用せず測り直す。本文4.5:1 / 大文字・UI 3:1）。
5. **アクセントはダークで明るめ**に（暗背景に対し十分なコントラスト）。
6. **大面積の彩度に注意**（広い面に高彩度を敷かない、アクセントは点で）。

Semantic層がこれを可能にする: ダーク調整は「`bg.elevated` がダークでは別Primitiveを指す」を外観別に手調整するだけ。コンポーネントは無改修。

---

## 6. マルチテーマを単一契約で共存させる

**中核ルール: 全テーマで「キー集合」を完全一致させる**。
- すべてのテーマ × すべての外観(light/dark)が、**まったく同じSemanticキー集合**を持つ。値だけが異なる。**キーは契約、値は実装**。
- **欠けると即破綻**: Webで変数未定義、Swiftでcolorset不足。新トークンは**全テーマ・全外観へ同時追加**。
- テーマ追加は「同じキー集合に別の値を埋める」作業に還元され、構造は不変。

**設計則**: Primitive=ブランドの素材／Semantic=共通の用途契約(全テーマ一致)／Component=例外の最小限。違いは「SemanticがどのPrimitiveを指すか」だけに閉じ込め、消費側は用途名のみ参照する。

---

## 7. このリポジトリの体系との対応

このプロジェクトの既存トークン体系はベストプラクティスに合致している:

| ベストプラクティス | このリポジトリでの実現 |
|---|---|
| Semantic層を用途名で | `color.bg.* / fg.* / accent.* / border.* / status.*`（CLAUDE.md） |
| 全テーマ・全外観でキー一致 | 規約として明記済み（欠けるとWeb/Swiftが壊れる） |
| light/darkを別最適化 | `sources/themes/<theme>/{light,dark}.json` 分離 |
| 既定テーマの明示 | `light.json` の `"$default": true`（`findDefaultTheme`） |
| 切替の仕掛け | Web=`data-theme`/`data-appearance` 属性、Swift=colorsetがOS外観に追従 |
| status は鮮やか可 | DESIGN.md §3.1 でステータスのみ高彩度を許容 |

**この体系での注意点**:
- **Primitive層は現状なし**（Semantic に直接 hex を書く）。個人用途では十分だが、ランプ/多色パレットを増やすなら「彩りパレット」を別レイヤーで持つ案（DESIGN.md §3.4・次アクション4）が該当。Primitive導入は構造変更なので **ADR化**を検討。
- **`accent.fg`（アクセント面の上の文字）が on-color ペアの実装**。淡い `accent.default` の上の小さな文字/線アイコンはコントラスト不足になりやすく、DESIGN.md §3.4 が `accent.strong`（on-light のテキスト/アイコン用の濃いティール）の追加を検討事項に挙げている。
- 新トークン追加時は **全テーマ・全外観に同時追加**し、`scripts/check-contrast.mjs` でコントラストを検証してから `npm run build`。

---

## Sources
- [Tailwind CSS v4.0（OKLCH移行）](https://tailwindcss.com/blog/tailwindcss-v4) ／ [Colors](https://tailwindcss.com/docs/colors)
- [Radix Colors — Understanding the scale](https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale)
- [Material Design 3 — How the color system works](https://m3.material.io/styles/color/system/how-the-system-works) ／ [Color roles](https://m3.material.io/styles/color/roles)
- [IBM Carbon — Color usage](https://carbondesignsystem.com/elements/color/usage/) ／ [Themes](https://carbondesignsystem.com/elements/themes/overview/)
- [Adobe Spectrum — Design tokens](https://spectrum.adobe.com/page/design-tokens/)
- [shadcn/ui — Theming](https://ui.shadcn.com/docs/theming)
- [When "semantic tokens" are no longer semantic — Nate Baldwin](https://www.designsystemscollective.com/when-semantic-tokens-are-no-longer-semantic-d65ef16fadd7)
